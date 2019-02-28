"use strict";
var Zip = require('../zip');
var fb2 = require("../fb2");

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover,'base64'));
    fb2(book,fb=>{
        ebk.writeFile(`${book.meta.author} - ${book.meta.title}.fb2`,fb);
        fn(ebk.generate());
    });
}