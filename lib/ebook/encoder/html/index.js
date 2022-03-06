"use strict";
const compile = require('../compile');
const encodeBook = require('../encodeBook');
const fs = require("fs");
const path = require("path");

var convert = {
    css:{
        style: compile(__dirname+'/css/style.css')
    },
    coverpage: compile(__dirname+'/coverpage.html'),
    chapter: compile(__dirname+'/chapter.html'),
};

function Files(){
}
Files.prototype.append = function (file,content){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self[floder] = self[floder] || new Files();
        self = self[floder];
    }
    self[arr.shift()] = content;
    return this;
};
Files.prototype.get = function (file){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self = self[floder];
        if (!self) return;
    }
    return self[arr.shift()];
};
Files.prototype.list = function(){
    return Object.keys(this);
};

module.exports = function (book,fn){
    var files = new Files;
    encodeBook(book);
    files.append("images/cover.jpg",book.meta.cover);
    files.append("css/style.css",convert.css.style());
    files.append("coverpage.html",convert.coverpage(book));
    book.list.forEach(chapter=>{
        chapter.content = chapter.content.replace(/\[url\s*=?\s*([^\[\]]*)\]([^\[\]]+)\[\/url\]/gi,($,$1,$2)=>{
            return `<a href="${decodeURI($1).replace(/&amp;/g,"&")}">${decodeURI($2)}</a>`;
        });
        chapter.content = chapter.content.replace(/\[img\]([^\[\]]+)\[\/img\]/gi,($,$1)=>{
            return `<img src="${decodeURI($1).replace(/&amp;/g,"&")}" />`;
        });
        files.append(`${chapter.id}.html`,convert.chapter(chapter));
        if(chapter.images){
            chapter.images.forEach(image=>{
                files.append(`${chapter.id}/${path.basename(image)}`,fs.readFileSync(image));
            });
        }
    });
    fn(files);
};
