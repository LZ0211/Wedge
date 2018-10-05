"use strict";
const zlib = require("zlib");
const Bin = require("../binary");


module.exports = function(book,fn){
    var meta = Buffer.concat([
        Bin(book.meta.title),
        Bin(book.meta.author),
        Bin(book.meta.classes),
        Bin(book.meta.uuid.replace(/-/g,''),'hex'),
        Bin(book.meta.source),
        Bin(book.meta.origin),
        Bin(book.meta.isend ? [0x01]:[0x00]),
        Bin(Buffer.alloc(8)).writeDoubleBE(book.meta.date),
        Bin(book.meta.brief),
        Bin(book.meta.cover,'base64'),
    ].map(bin=>Buffer.concat([Bin(Buffer.alloc(4)).writeInt32BE(bin.length).rawBuffer,bin.rawBuffer])));
    var list = zlib.deflateSync(Buffer.concat(book.list.map(chapter=>{
        return Bin(Buffer.alloc(24))
          .writeInt32BE(Buffer.byteLength(chapter.title,'utf8'))
          .writeInt32BE(Buffer.byteLength(chapter.id,'utf8'))
          .writeInt32BE(Buffer.byteLength(chapter.source,'utf8'))
          .writeInt32BE(Buffer.byteLength(chapter.content,'utf8'))
          .writeDoubleBE(chapter.date)
          .rawBuffer;
    })));
    var titles= zlib.deflateSync(book.list.map(chapter=>chapter.title).join(''));
    var ids = zlib.deflateSync(book.list.map(chapter=>chapter.id).join(''));
    var sources = zlib.deflateSync(book.list.map(chapter=>chapter.source).join(''));
    var contents = zlib.deflateSync(book.list.map(chapter=>chapter.content).join(''));
    var listLen = Bin(Buffer.alloc(8)).writeDoubleBE(list.length).rawBuffer;
    var titlesLen = Bin(Buffer.alloc(8)).writeDoubleBE(titles.length).rawBuffer;
    var idsLen = Bin(Buffer.alloc(8)).writeDoubleBE(ids.length).rawBuffer;
    var sourcesLen = Bin(Buffer.alloc(8)).writeDoubleBE(sources.length).rawBuffer;
    var contentsLen = Bin(Buffer.alloc(8)).writeDoubleBE(contents.length).rawBuffer;
    return fn(Buffer.concat([meta,listLen,list,titlesLen,titles,idsLen,ids,sourcesLen,sources,contentsLen,contents]));
};
