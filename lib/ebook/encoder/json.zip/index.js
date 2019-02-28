"use strict";
var Zip = require('../zip');
var json = require("../json");

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover,'base64'));
    json(book,text=>{
        ebk.writeFile(`${book.meta.author} - ${book.meta.title}.json`,text);
        fn(ebk.generate());
    });
};