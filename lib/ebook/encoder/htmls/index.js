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
    let prev;
    let list = [];
    function noop(){}
    function render(chapter,next){
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
    fs.mkdirSync(dir);
    return {
        meta:function(book,next){
            if('function' !== typeof next) next = noop;
            prev && render(prev,noop);
            book.list = list;
            encodeBook(book);
            fs.writeFileSync(path.join(dir,"index.html"),convert.index(book));
            fs.writeFileSync(path.join(dir,"cover.jpg"),book.meta.cover,"base64");
            fs.writeFileSync(path.join(dir,"style.css"),convert.style());
            return next()
        },
        chapter:function(chapter,next){
            if('function' !== typeof next) next = noop;
            let item = Object.assign({},chapter);
            delete item.content;
            list.push(item);
            if(!prev){
                prev = chapter;
                return next();
            }
            chapter.prev = prev.id;
            prev.next = chapter.id;
            render(prev,next);
            prev = chapter;
        }
    }
}
