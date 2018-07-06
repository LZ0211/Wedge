"use strict";
var zlib = require('zlib');
var fs = require('fs');
var Bin = require("../binary");
var LZ77= require('./lz77');
var Random = require('../../../JSrandom');
function leftPad(str,padding,length){
    str = '' + str;
    if (str.length >= length){
        return str;
    }
    for (var i=str.length;i<length;i++){
        str = padding + str;
    }
    return str;
}
function formatTime(date,template){
    var time = new Date(date)
    var day = template || "yyyy-MM-dd hh:mm:ss";
    day = day.replace(/(y+)/,function ($,$1){
        return leftPad(time.getFullYear(),0,$1.length)
    });
    day = day.replace(/(M+)/,function ($,$1){
        return leftPad(time.getMonth() + 1,0,$1.length)
    });
    day = day.replace(/(d+)/,function ($,$1){
        return leftPad(time.getDate(),0,$1.length)
    });
    day = day.replace(/(h+)/,function ($,$1){
        return leftPad(time.getHours(),0,$1.length)
    });
    day = day.replace(/(m+)/,function ($,$1){
        return leftPad(time.getMinutes(),0,$1.length)
    });
    day = day.replace(/(s+)/,function ($,$1){
        return leftPad(time.getSeconds(),0,$1.length)
    });
    return day;
}


function createMobiFormat(book){
    var time = book.meta.date/1000;
    return Buffer.concat([
        Buffer.from(book.meta.uuid),//name
        Buffer.alloc(2).fill(0),//attribute
        Buffer.alloc(2).fill(0),//version
        Bin(Buffer.alloc(4)).writeInt32BE(time).rawBuffer,//creation
        Bin(Buffer.alloc(4)).writeInt32BE(time).rawBuffer,//modification
        Bin(Buffer.alloc(4)).writeInt32BE(0).rawBuffer,//backup
        Bin(Buffer.alloc(4)).writeInt32BE(0).rawBuffer,//modificationNumber
        Bin(Buffer.alloc(4)).writeInt32BE(0).rawBuffer,//appInfoID
        Bin(Buffer.alloc(4)).writeInt32BE(0).rawBuffer,//sortInfoID
        Buffer.from('BOOK'),//type
        Buffer.from('MOBI'),//creator
        //uniqueIDseed 00 00 06 D5
        //nextRecordListID 00 00 00 00
        //number of Records 03 6A
    ]);
}

const RECORD_TYPES = {
    1: "drm server id",
    2: "drm commerce id",
    3: "drm ebookbase book id",
    100: "author",
    101: "publisher",
    102: "imprint",
    103: "description",
    104: "isbn",
    105: "subject",
    106: "publishingdate",
    107: "review",
    108: "contributor",
    109: "rights",
    110: "subjectcode",
    111: "type",
    112: "source",
    113: "asin",
    114: "versionnumber",
    115: "sample",
    116: "startreading",
    118: "retail price",
    119: "retail price currency",
    129: "KF8 cover URI",
    131: "Unknown",
    201: "coveroffset",
    202: "thumboffset",
    203: "hasfakecover",
    204: "Creator Software",
    205: "Creator Major Version",
    206: "Creator Minor Version",
    207: "Creator Build Number",
    208: "watermark",
    209: "tamper proof keys",
    300: "fontsignature",
    401: "clippinglimit",
    402: "publisherlimit",
    403: "403",
    404: "ttsflag",
    501: "cdetype",
    502: "lastupdatetime",
    503: "updatedtitle"
};

class MOBI{
    constructor(file){
        this.file = file;
    }

    read(){
        this.stream = Bin(fs.readFileSync(this.file));
    }

    parse(){
        this.parseHeader();
        this.readRecordList();
        this.parseFirstRecord();
        this.parseIndex();
        this.parseImages();
        this.parseMagicRecords();
        this.parseEndofFile();
    }

    readRecord(idx,next){
        var thisRecord = this.recordLists[idx];
        var nextRecord = this.recordLists[next || idx+1];
        this.stream.seek(thisRecord.offset);
        if(nextRecord){
            return this.stream.read(nextRecord.offset-thisRecord.offset)
        }else{
            return this.stream.read()
        }
    }

    parseHeader(){
        this.header = {
            name:this.stream.read(32),
            attributes:this.stream.readInt16BE(),
            version:this.stream.readInt16BE(),
            created:this.stream.readInt32BE(),
            modified:this.stream.readInt32BE(),
            backup:this.stream.readInt32BE(),
            modnum:this.stream.readInt32BE(),
            appInfoId:this.stream.readInt32BE(),
            sortInfoID:this.stream.readInt32BE(),
            type:this.stream.read(4).toString(),
            creator:this.stream.read(4).toString(),
            uniqueIDseed:this.stream.readInt32BE(),
            nextRecordListID:this.stream.readInt32BE(),
            numberOfRecords:this.stream.readInt16BE()
        };
    }

    readRecordList(buffer){
        this.recordLists = [];
        for(var i=0;i<this.header.numberOfRecords;i++){
            this.recordLists.push({
                'offset':this.stream.readInt32BE(),
                'attributes':this.stream.readInt8(),
                'uniqueID':this.stream.read(3),
            });
        }
    }

    parseFirstRecord(){
        //this.stream.read(2);
        this.stream.seek(this.recordLists[0].offset);
        this.parsePalmDOCHeader();
        this.parseMobiHeader();
        this.parseEXTHHeader();
        this.parseEXTHRecord();
        //this.stream.seek(this.recordLists[0].offset + this.mobiHeader.fullNameOffset);
        //this.fullName = this.stream.read(this.mobiHeader.fullNameLength).toString()
    }

    parsePalmDOCHeader(){
        this.palmDOCHeader = {
            compression:this.stream.readInt16BE(),
            unused:this.stream.readInt16BE(),
            textLength:this.stream.readInt32BE(),
            recordCount:this.stream.readInt16BE(),
            recordSize:this.stream.readInt16BE(),
            encryptionType:this.stream.readInt16BE(),
            unknown:this.stream.readInt16BE()
        };
    }

    parseMobiHeader(){
        var offset = this.stream.offset;
        this.mobiHeader = {
            identifier:this.stream.read(4).toString(),
            headerLength:this.stream.readInt32BE(),
            mobiType:this.stream.readInt32BE(),
            textEncoding:this.stream.readInt32BE(),
            uniqueID:this.stream.readUInt32BE(),
            fileVersion:this.stream.readInt32BE(),
            reserved:this.stream.read(40),
            nonbookIndex:this.stream.readInt32BE(),
            fullNameOffset:this.stream.readInt32BE(),
            fullNameLength:this.stream.readInt32BE(),
            language:this.stream.readInt32BE(),
            inputLanguage:this.stream.readInt32BE(),
            outputLanguage:this.stream.readInt32BE(),
            formatVersion:this.stream.readInt32BE(),
            imageIndex:this.stream.readInt32BE(),
            huffRecordOffset:this.stream.readInt32BE(),
            huffRecordCount:this.stream.readInt32BE(),
            huffTableOffset:this.stream.readInt32BE(),
            huffTableCount:this.stream.readInt32BE(),
            exthFlags:this.stream.read(4),
            unknown1:this.stream.read(36),
            DRMOffset:this.stream.readInt32BE(),
            DRMCount:this.stream.readInt32BE(),
            DRMSize:this.stream.readInt32BE(),
            DRMFlags:this.stream.read(4),
            unknown2:this.stream.read(8),
            unknown3:this.stream.readInt16BE(),
            lastContentRecord:this.stream.readInt16BE(),
            unknown4:this.stream.readInt32BE(),
            lastFCISRecord:this.stream.readInt32BE(),
            unknown5:this.stream.readInt32BE(),
            lastFLISRecord:this.stream.readInt32BE(),
            unknown6:this.stream.read(4),
            unknown7:this.stream.read(8),
            unknown8:this.stream.read(4),
            compilationDataSectionCount: this.stream.readInt32BE(),
            compilationDataSectionNumber: this.stream.readInt32BE(),
            unknown9:this.stream.read(4),
            extraRecordDataFlags:this.stream.read(4),
            indexRecordOffset:this.stream.readInt32BE()
        };
        this.mobiHeader.tail = this.stream.read(offset + this.mobiHeader.headerLength - this.stream.offset);
    }

    parseEXTHHeader(){
        this.EXTHHeader = {
            identifier:this.stream.read(4).toString(),
            headerLength:this.stream.readInt32BE(),
            recordCount:this.stream.readInt32BE(),
        };
    }

    parseEXTHRecord(){
        this.EXTHRecordLists = [];
        for(var i=0;i<this.EXTHHeader.recordCount;i++){
            var id = this.stream.readInt32BE();
            var length = this.stream.readInt32BE();
            var data = this.stream.read(length-8);
            if(~[106,100,101,103,105,108,112,113,501,503,524,525,535,129].indexOf(id)){
                data = data.toString();
            }else if(~[125,121,542,116,204,205,206,207,201,203,202,131].indexOf(id)){
                data = data.readInt32BE();
            }
            this.EXTHRecordLists.push({
                id:id,
                type:RECORD_TYPES[id],
                data:data
            });
        }
        this.stream.read(4-this.stream.offset % 4);
        this.fullName = this.stream.read(this.mobiHeader.fullNameLength).toString();
    }

    parseIndex(){
        var data = this.readRecord(this.mobiHeader.nonbookIndex);
        var bin = Bin(data);
        this.indexs = {
            identifier: bin.read(4).toString(),
            headerLength:bin.readInt32BE(),
            indexType: bin.readInt32BE(),
            unknown1: bin.read(8),
            indexStart: bin.readInt32BE(),
            indexCount: bin.readInt32BE(),
            indexEncoding: bin.readInt32BE(),
            indexLanguage: bin.readInt32BE(),
            totalIndexCount: bin.readInt32BE(),
            ordtStart: bin.readInt32BE(),
            ligtStart: bin.readInt32BE(),
            lightCount: bin.readInt32BE(),
            ncxCount: bin.readInt32BE(),
        };
        this.indexs.tail = bin.read(this.indexs.headerLength - 56);
        this.tagxs = {
            identifier: bin.read(4).toString(),
            headerLength:bin.readInt32BE(),
            controlByteCount: bin.readInt32BE(),
        }
        var tables = bin.read(this.tagxs.headerLength - 12);
        this.tagxs.tables = [];
        for(var i=0;i<tables.length;i+=4){
            this.tagxs.tables.push(tables.slice(i,i+4));
        }
        this.tagxs.tail = bin.read(16)
    }

    parseImages(){
        this.images = [];
        for(var i=this.mobiHeader.imageIndex;i<=this.mobiHeader.lastContentRecord;i++){
            this.images.push(this.readRecord(i));
        }
    }

    parseMagicRecords(){
        this.FCISRecord = this.readRecord(this.mobiHeader.lastFCISRecord);
        this.FLISRecord = this.readRecord(this.mobiHeader.lastFLISRecord);
    }

    parseEndofFile(){
        this.ending = this.readRecord(this.header.numberOfRecords - 1);
    }
}


var mobi = new MOBI('example.mobi');
mobi.read();
mobi.parse();
console.log(mobi);

console.log(mobi.readRecord(251))
console.log(mobi.readRecord(252))
console.log(mobi.readRecord(253))