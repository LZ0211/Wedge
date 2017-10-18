var Zip = require('../zip');
module.exports = function (book,fn){
    var ebk = new Zip();
    var text = "";
    var linesep = "\r\n";
    text += "【书名】：" + book.meta.title + linesep;
    text += "【作者】：" + book.meta.author + linesep;
    text += "【类型】：" + book.meta.classes + linesep;
    text += "【简介】：" + book.meta.brief.replace(/[\r\n]+/g,linesep) + linesep;
    ebk.writeFile("书籍信息.txt", text,true);
    ebk.writeFile("书籍封面.jpg", Buffer.from(book.meta.cover,'base64'), true);
    book.list.forEach(function (chapter){
        text = "";
        text += chapter.title + linesep;
        text += linesep;
        text += chapter.content.split(/[\r\n]+/).join(linesep);
        ebk.writeFile(chapter.id + " " + chapter.title + ".txt", text,true);
    });
    fn(ebk.generate());
};