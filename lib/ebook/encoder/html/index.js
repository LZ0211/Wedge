"use strict";
var compile = require('../compile');
var encodeBook = require('../encodeBook');

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

module.exports = function (book,fn){
    var files = new Files;
    encodeBook(book);
    files.append("images/cover.jpg",book.meta.cover);
    files.append("css/style.css",convert.css.style());
    files.append("coverpage.html",convert.coverpage(book));
    book.list.forEach(chapter=>{
        chapter.content = chapter.content.replace(/\[(url|img)\s*=?\s*([^\[\]]*)\](http[^\[\]]+)\[\/\1\]/gi,($,$1,$2,$3)=>{
            $1 = $1.toLowerCase();
            $2 = $2.trim();
            $3 = $3.trim();
            if($1==='url' && $2 && $3) return `<a href="${decodeURI($2).replace(/&amp;/g,"&")}">${decodeURI($3)}</a>`;
            if($1==='img' && $3) return `<img src="${decodeURI($3).replace(/&amp;/g,"&")}" />`;
            return ''
        });
        files.append(`${chapter.id}.html`,convert.chapter(chapter));
    });
    fn(files);
};
