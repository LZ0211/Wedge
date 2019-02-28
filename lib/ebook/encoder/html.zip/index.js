"use strict";
var Zip = require('../zip');
var html = require("../html");

module.exports = function (book,fn){
    var ebk = new Zip();
    html(book, files=>{
        ebk.writeFile('css/style.css',files.get('css/style.css'));
        ebk.writeFile("images/cover.jpg", Buffer.from(files.get('images/cover.jpg'),'base64'));
        ebk.writeFile('coverpage.html',files.get('coverpage.html'));
        book.list.forEach(chapter=>ebk.writeFile(`${chapter.id}.html`,files.get(`${chapter.id}.html`)));
        fn(ebk.generate());
    });
}