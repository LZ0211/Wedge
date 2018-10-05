"use strict";
const zlib = require("zlib");
const Bin = require("../binary");


module.exports = function (buf,fn){
    var bin = Bin(buf);
    var keys = ['title','author','classes','uuid','source','origin','isend','date','brief','cover'];
    var book = {meta:{},list:[]};
    keys.forEach(key=>{
        var len = bin.readInt32BE();
        book.meta[key] = bin.read(len);
    });
    ['title','author','classes','source','origin','brief'].forEach(key=>{
        book.meta[key] = book.meta[key].toString();
    });
    book.meta.isend =!!book.meta.isend[0];
    book.meta.cover = book.meta.cover.toString('base64');
    book.meta.date = book.meta.date.readDoubleBE();
    book.meta.uuid = book.meta.uuid.toString('hex');
    var array = [],offset=0;
    [8,4,4,4,12].forEach(function (len){
        array.push(book.meta.uuid.substring(offset,offset+len));
        offset += len;
    });
    book.meta.uuid = array.join('-');
    var listLen = bin.readDoubleBE(0);
    var listBuf = Bin(zlib.inflateSync(bin.read(listLen)));
    var length = listBuf.length / 24;
    var titlesLen = bin.readDoubleBE();
    var titlesBuf = Bin(zlib.inflateSync(bin.read(titlesLen)));
    var idsLen = bin.readDoubleBE();
    var idsBuf = Bin(zlib.inflateSync(bin.read(idsLen)));
    var sourcesLen = bin.readDoubleBE();
    var sourcesBuf = Bin(zlib.inflateSync(bin.read(sourcesLen)));
    var contentsLen = bin.readDoubleBE();
    var contentsBuf = Bin(zlib.inflateSync(bin.read(contentsLen)));
    for(var i=0;i<length;i++){
        book.list.push({
            title: titlesBuf.read(listBuf.readInt32BE()).toString(),
            id: idsBuf.read(listBuf.readInt32BE()).toString(),
            source: sourcesBuf.read(listBuf.readInt32BE()).toString(),
            content: contentsBuf.read(listBuf.readInt32BE()).toString(),
            date:listBuf.readDoubleBE()
        });
    }
    return fn(book);
};
