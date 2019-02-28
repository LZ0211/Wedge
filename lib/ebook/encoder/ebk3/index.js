"use strict";
const zlib = require('zlib');
const EBK3Crypt = require('./EBK3Crypt');
const Bin = require("../binary");
const Random = require('../../../JSrandom');
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

function template(book){
    var SecretKey = Random.randInt(10000, 60000);
    var crypt = new EBK3Crypt(SecretKey);
    var HeaderLen = 302 + 2 * (book.meta.title + book.meta.classes + book.meta.author).length;
    var ChapterLen = 8 + 24 * book.list.length + 2 * book.list.map(x=>x.title.length).reduce((x,y)=>x+y,0);
    //DYNData
    var DYNData = Buffer.concat([
        Bin(Buffer.alloc(4)).writeUInt32LE(16).rawBuffer,//Size
        Buffer.from(book.meta.uuid.split('-').shift(),'hex'),//UUID
        Bin(Buffer.alloc(4)).writeUInt32LE(16+HeaderLen).rawBuffer,//ChapterOffset
        Bin(Buffer.alloc(4)).writeUInt32LE(ChapterLen).rawBuffer,//ChapterLen
    ]);
    //ChapterList
    var ChapterList = [
        Bin(Buffer.alloc(4)).writeInt32LE(book.list.length).rawBuffer,
        Bin(Buffer.alloc(4)).writeInt32LE(24).rawBuffer
    ];
    var block = '',BlockOffset = ChapterLen + HeaderLen + 16;
    crypt.setKey(SecretKey);
    BlockOffset = crypt.encodeUInt32(BlockOffset);
    book.list.forEach((chapter,index)=>{
        crypt.setKey(SecretKey);
        ChapterList = ChapterList.concat([
            Bin(Buffer.alloc(4)).writeUInt32LE(chapter.title.length * 2).rawBuffer,
            Bin(Buffer.alloc(4)).writeUInt32LE(index).rawBuffer,
            Bin(Buffer.alloc(2)).writeUInt16LE(1).rawBuffer,
            Bin(Buffer.alloc(2)).writeUInt16LE(1).rawBuffer,
            Bin(Buffer.alloc(4)).writeUInt32LE(BlockOffset).rawBuffer,
            Bin(Buffer.alloc(4)).writeUInt32LE(block.length * 2).rawBuffer,
            Bin(Buffer.alloc(4)).writeUInt32LE(chapter.content.length * 2).rawBuffer,
            crypt.encodeData(Buffer.from(chapter.title,'ucs2'))
        ]);
        block += chapter.content;
    });
    ChapterList = Buffer.concat(ChapterList);
    //BlockInFo
    crypt.setKey(SecretKey);
    var BlockInfo = Buffer.concat([
        Bin(Buffer.alloc(4)).writeUInt32LE(Random.randInt(10000, 60000)).rawBuffer,//HeaderKey
        Bin(Buffer.alloc(4)).writeUInt32LE(162).rawBuffer,//HeaderLen
        Bin(Buffer.alloc(4)).writeUInt32LE(SecretKey).rawBuffer,//SecretKey
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(13)).rawBuffer,//Count

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(1)).rawBuffer,//MinVersion1
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(2)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(2)).rawBuffer,//MinTip2
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(8)).rawBuffer,//length

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(3)).rawBuffer,//CompressType3
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(0)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(4)).rawBuffer,//CompressBlockSize4
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(65536)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(5)).rawBuffer,//DataType
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(0)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(6)).rawBuffer,//locale6
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(1)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(7)).rawBuffer,//Encoding7
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(2)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(8)).rawBuffer,//ChapterIndex8
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(0)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(9)).rawBuffer,//ChapterLevel9
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(10)).rawBuffer,//length
        Bin(Buffer.alloc(2)).writeUInt16LE(crypt.encodeUInt16(1)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(10)).rawBuffer,//ChapterTitle10
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(8)).rawBuffer,//length

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(11)).rawBuffer,//FileListOffset11
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(0)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//ChapterContentDecompressLen12
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(0)).rawBuffer,//value

        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(13)).rawBuffer,//BlockSize13
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(12)).rawBuffer,//length
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(150)).rawBuffer,//value
    ]);
    //Block
    crypt.setKey(SecretKey);
    var count = Math.ceil(block.length * 2 / 65536);
    var Block = [Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(count)).rawBuffer];
    block = Bin(Buffer.from(block,'ucs2'));
    var arr = [];
    for(var i=0;i<count;i++){
        crypt.setKey(SecretKey);
        var temp = crypt.encodeData(zlib.deflateSync(block.read(65536)),0,16);
        arr.push(temp);
    }
    
    for(var i=0;i<count;i++){
        crypt.setKey(SecretKey);
        Block.push(Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(arr[i].length)).rawBuffer);
    }
    Block = Buffer.concat(Block.concat(arr));
    //Header
    crypt.setKey(SecretKey);
    var Header = [
        //Header
        Buffer.from('EBK3'),
        Bin(Buffer.alloc(4)).writeUInt32LE(Random.randInt(10000, 60000)).rawBuffer,//HeaderKey
        Bin(Buffer.alloc(4)).writeUInt32LE(HeaderLen).rawBuffer,//HeaderLen
        Bin(Buffer.alloc(4)).writeUInt32LE(SecretKey).rawBuffer,//SecretKey
        //BookInfo
        Bin(Buffer.alloc(4)).writeUInt32LE(crypt.encodeUInt32(18)).rawBuffer,//Count
    ];
    var BookInfo = [
        [1,12,1],
        [2,58,formatTime(book.meta.date)+Random.uuid(6,10)],
        [3,12,0],
        [4,12,HeaderLen+16],
        [5,12,HeaderLen],
        [6,12,0],
        [7,12,'裂章'],
        [8,46,formatTime(book.meta.date)],
        [9,8 + book.meta.title.length * 2, book.meta.title],
        [10,12,book.meta.isend ? '完结':'连载'],
        [11,8 + book.meta.classes.length * 2, book.meta.classes],
        [12,8, ''],
        [13,8,''],
        [14,12,HeaderLen+16+ChapterLen+162+Block.length],
        [15,12,1],
        [16, 8 + book.meta.author.length * 2,book.meta.author],
        [17,18,'Wedge'],
        [18,12,0]
    ];
    BookInfo.forEach(item=>{
        var buf = Buffer.alloc(4);
        buf.writeUInt32LE(crypt.encodeUInt32(item[0]));
        Header.push(buf);
        buf = Buffer.alloc(4);
        buf.writeUInt32LE(crypt.encodeUInt32(item[1]));
        Header.push(buf);
        if(typeof item[2] === 'string'){
            buf = crypt.encodeData(Buffer.from(item[2],'ucs2'));
        }else{
            buf = Buffer.alloc(4);
            buf.writeUInt32LE(crypt.encodeUInt32(item[2]));
        }
        Header.push(buf);
    });
    Header = Buffer.concat(Header);
    return Buffer.concat([Header,DYNData,ChapterList,BlockInfo,Block])
    
}

module.exports = function (book,fn){
    fn(template(book));
}