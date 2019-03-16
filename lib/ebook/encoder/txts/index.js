"use strict";
const fs = require('fs');
const path = require('path');

module.exports = function (dir){
    var linesep = "\r\n";
    function noop(){}
    return {
        meta:function(book,next){
            if('function' !== typeof next) next = noop;
            var text = "";
            text += "【书名】：" + book.meta.title + linesep;
            text += "【作者】：" + book.meta.author + linesep;
            text += "【类型】：" + book.meta.classes + linesep;
            text += "【简介】：" + book.meta.brief.replace(/[\r\n]+/g,linesep) + linesep;
            fs.writeFileSync(path.join(dir,'cover.jpg'),book.meta.cover,'base64');
            fs.writeFile(path.join(dir,"书籍信息.txt"), text,next);
        },
        chapter:function(chapter,next){
            if('function' !== typeof next) next = noop;
            var text = "";
            text += chapter.title + linesep;
            text += linesep;
            text += chapter.content.split(/[\r\n]+/).join(linesep);
            fs.writeFile(path.join(dir,`${chapter.id} ${chapter.title}.txt`), text,next);
        }
    }
}