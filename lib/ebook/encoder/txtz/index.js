"use strict";
var Zip = require('../zip');
var txt = require('../txt');
var compile = require('../compile');

var metadata = compile(__dirname+'/template.opf');

module.exports = function (book,fn){
    txt(book,function(text){
        var ebk = new Zip();
        ebk.writeFile("cover.jpeg", Buffer.from(book.meta.cover, 'base64'), true);
        ebk.writeFile("metadata.opf", metadata(book), true);
        ebk.writeFile("index.txt", text, true);
        fn(ebk.generate());
    });
};