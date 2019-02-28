"use strict";
const zlib = require('zlib');
const EBK3Crypt = require('./EBK3Crypt');
const Bin = require("../binary");

function decode(data){
    data = Bin(data);
    var Book = {
        Header:{},
        Bookinfo:{},
        DYNData:{},
        ChapterList:[],
        BlockInfo:{},
        BlockData:[]
    }
    var keys = [,'MinVersion1','UniqueIdentifier2','BookFileType3','ChapterListOffset4','DYNOffset5','CoverDataOffset6','Creator7','CreateTimer8','BookName9','Unknown10','Subject11','Unknown12','ISBN13','FileSize14','ReviseVersion15','Author16','Publisher17','Unknown18']
    Book.Header.Identifier = data.read(4).toString();
    Book.Header.HeaderKey = data.readUInt32LE();
    Book.Header.HeaderLen = data.readUInt32LE();
    Book.Header.SecretKey = data.readUInt32LE();
    var crypt = new EBK3Crypt(Book.Header.SecretKey);
    var count = crypt.decodeUInt32(data.readUInt32LE());
    for(var i=0;i<count;i++){
        var idx = crypt.decodeUInt32(data.readUInt32LE());
        var len = crypt.decodeUInt32(data.readUInt32LE());
        var key = keys[idx];
        if(~['MinVersion1','BookFileType3','ChapterListOffset4','DYNOffset5','CoverDataOffset6','FileSize14','ReviseVersion15','Unknown18'].indexOf(key)){
            if(len - 8 !== 4) throw Error()
            Book.Bookinfo[key] = crypt.decodeUInt32(data.readUInt32LE());
        }else{
            Book.Bookinfo[key] = crypt.decodeData(data.read(len-8),0,len-8).toString('ucs2');
        }
        //console.log(idx,len,Book.Bookinfo[key])
    }
    //DYNData
    data.readUInt32LE();
    Book.DYNData.UUID = data.readUInt32LE();
    Book.DYNData.ChapterOffset = data.readUInt32LE();
    Book.DYNData.ChapterLen = data.readUInt32LE();
    //ChapterList
    Book.ChapterList.Count = data.readUInt32LE();
    Book.ChapterList.Size = data.readUInt32LE();
    for(var i=0;i<Book.ChapterList.Count;i++){
        var Item = {
            TitleSize:data.readUInt32LE(),
            Index:data.readUInt32LE(),
            Level:data.readUInt16LE(),
            Type:data.readUInt16LE(),
            BlockOffset:data.readUInt32LE(),
            DataOffset:data.readUInt32LE(),
            Length:data.readUInt32LE(),
        }
        crypt.setKey(Book.Header.SecretKey)
        Item.Title = crypt.decodeData(data.read(Item.TitleSize),0,Item.TitleSize).toString('ucs2');
        crypt.setKey(Book.Header.SecretKey)
        Item.BlockOffset = crypt.decodeUInt32(Item.BlockOffset)
        Book.ChapterList.push(Item)
    }
    //BlockInFo
    Book.BlockInfo = {
        HeaderKey : data.readUInt32LE(),
        HeaderLen : data.readUInt32LE(),
        SecretKey : data.readUInt32LE()
    }
    var keys = [,'MinVersion1','MinTip2','CompressType3','CompressBlockSize4','DataType','locale6','Encoding7','ChapterIndex8','ChapterLevel9','ChapterTitle10','FileListOffset11','ChapterContentDecompressLen12','BlockSize13'];
    crypt.setKey(Book.BlockInfo.SecretKey);
    var count = crypt.decodeUInt32(data.readUInt32LE());
    for(var i=0;i<count;i++){
        var idx = crypt.decodeUInt32(data.readUInt32LE());
        var len = crypt.decodeUInt32(data.readUInt32LE());
        var key = keys[idx];
        if(key === 'MinTip2' || key === 'ChapterTitle10'){
            Book.BlockInfo[key] = crypt.decodeData(data.read(len-8)).toString('ucs2'); 
        }else if(key === 'ChapterLevel9'){
            if(len - 8 !== 2) throw Error()
            Book.BlockInfo[key] = crypt.decodeData(data.read(2)).readUInt16LE();
        }else{
            if(len - 8 !== 4) throw Error()
            Book.BlockInfo[key] = crypt.decodeUInt32(data.readUInt32LE());
        }
    }
    //BlockData
    crypt.setKey(Book.BlockInfo.SecretKey);
    var count = crypt.decodeUInt32(data.readUInt32LE());
    //console.log(count)
    crypt.setKey(Book.BlockInfo.SecretKey);
    for(var i=0;i<count;i++){
        if(Book.BlockInfo.DataType == 0) crypt.setKey(Book.BlockInfo.SecretKey);
        Book.BlockData.push(crypt.decodeUInt32(data.readUInt32LE()));
    }
    for(var i=0;i<count;i++){
        crypt.setKey(Book.BlockInfo.SecretKey);
        var temp = data.read(Book.BlockData[i]);
        temp = crypt.decodeData(temp,0,16)
        Book.BlockData[i] = zlib.unzipSync(temp)
    }
    Book.BlockData = Buffer.concat(Book.BlockData);
    var bin = Bin(Book.BlockData)
    Book.ChapterList.forEach(item=>{
        bin.seek(item.DataOffset);
        item.text = bin.read(item.Length).toString('ucs2');
        item.size = item.text.length
    });
    console.log(Book)
    //console.log(data.offset,len)
}