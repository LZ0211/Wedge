const compile = require('../compile');
const encodeBook = require('../encodeBook');
const fs = require("fs");
const path = require("path");

const convert = {
    index: compile(__dirname+'/index.html'),
    chapter: compile(__dirname+'/chapter.html'),
    style: compile(__dirname+'/style.css'),
}

module.exports = function(dir){
    function noop(){}
    return {
        meta:function(book,next){
            if('function' !== typeof next) next = noop;
            fs.writeFileSync(path.join(dir,"cover.jpg"),book.meta.cover,"base64");
            fs.writeFileSync(path.join(dir,"style.css"),convert.style());
            encodeBook(book);
            fs.writeFile(path.join(dir,"index.html"),convert.index(book),next); 
        },
        chapter:function(chapter,next){
            if('function' !== typeof next) next = noop;
            if(!chapter.prev){
                chapter.prev = 'index';
            }
            if(!chapter.next){
                chapter.next = 'index';
            }
            chapter.content = encodeBook.encode(chapter.content);
            chapter.content = chapter.content.replace(/\[url\s*=?\s*([^\[\]]*)\]([^\[\]]+)\[\/url\]/gi,($,$1,$2)=>{
                return `<a href="${decodeURI($1).replace(/&amp;/g,"&")}">${decodeURI($2)}</a><br>`;
            });
            chapter.content = chapter.content.replace(/\[img\]([^\[\]]+)\[\/img\]/gi,($,$1)=>{
                return `<img src="${decodeURI($1).replace(/&amp;/g,"&")}" />`;
            });
            fs.writeFile(path.join(dir,chapter.id + ".html"),convert.chapter(chapter),next);
        }
    }
}
