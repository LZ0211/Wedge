"use strict";
var Zip = require('../zip');
var txt = require('../txt');
var compile = require('../compile');

var metadata = compile(__dirname+'/template.opf');

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile("cover.jpeg", Buffer.from(book.meta.cover, 'base64'));
    ebk.writeFile("metadata.opf", metadata(book));
    txt(book,text=>{
        ebk.writeFile("index.txt", text);
        fn(ebk.generate());
    });
};