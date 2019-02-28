"use strict";
var Zip = require('../zip');
var txt = require("../txt");

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover, 'base64'));
    txt(book,text=>{
        ebk.writeFile(`${book.meta.author} - ${book.meta.title}.txt`,text);
        fn(ebk.generate());
    });
};
