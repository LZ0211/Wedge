"use strict";
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var Bin = require('./encoder/binary');
var Ebk = require('./index');

function decoder(buf,fn){
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
    book.meta.uuid = [].map.call(book.meta.uuid,byte=>byte.toString(16)).join('');
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
        })
    }
    return fn(book);
}

function Pipe(){
    var fns = [].slice.call(arguments);
    return function(){
        var args = [].slice.call(arguments);
        for(var i=0;i<fns.length;i++){
            args = [fns[i].apply(null,args)]
        }
        return args[0];
    }
}

function svaeFile(filename,ext){
    var arr = filename.split('.');
    arr.pop();
    arr.push(ext);
    filename = arr.join('.');
    return function(data){
        fs.writeFileSync(filename,data);
    }
}

function readFile(filename){
    return fs.readFileSync(filename);
}

const Convertor = {
    wbk2json:filename=>decoder(readFile(filename),data=>Ebk.json(data,svaeFile(filename,'json'))),
    wbk2epub:filename=>decoder(readFile(filename),data=>Ebk.epub(data,svaeFile(filename,'epub'))),
    wbk2umd:filename=>decoder(readFile(filename),data=>Ebk.umd(data,svaeFile(filename,'umd'))),
    wbk2fb2:filename=>decoder(readFile(filename),data=>Ebk.fb2(data,svaeFile(filename,'fb2'))),
    wbk2txtz:filename=>decoder(readFile(filename),data=>Ebk.txtz(data,svaeFile(filename,'txtz'))),
    wbk2txt:filename=>decoder(readFile(filename),data=>Ebk.txt(data,svaeFile(filename,'txt'))),
    wbk2docx:filename=>decoder(readFile(filename),data=>Ebk.docx(data,svaeFile(filename,'docx'))),
    wbk2zip:filename=>decoder(readFile(filename),data=>Ebk.zip(data,svaeFile(filename,'zip'))),
    wbk2htmlz:filename=>decoder(readFile(filename),data=>Ebk.htmlz(data,svaeFile(filename,'htmlz'))),
    wbk2rtf:filename=>decoder(readFile(filename),data=>Ebk.rtf(data,svaeFile(filename,'rtf'))),
}
module.exports = Convertor;
