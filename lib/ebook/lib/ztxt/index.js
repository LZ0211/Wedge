var Zip = require('../JSZip');
var json = require("../json");

module.exports = function (book,fn){
    var ebk = new Zip();
    var opt = {createFolders:true};
    var text = "";
    var linesep = "\r\n";
    text += "【书名】：" + book.meta.get("title") + linesep;
    text += "【作者】：" + book.meta.get("author") + linesep;
    text += "【类型】：" + book.meta.get("classes") + linesep;
    text += "【简介】：" + book.meta.get("brief").replace(/[\r\n]+/g,linesep) + linesep;
    text += "【正文】" + linesep;
    book.list.each(function (chapter){
        ebk.file(chapter.get("title")+".txt",chapter.get("title") + linesep + chapter.get("content").split(/[\r\n]+/).join(linesep),opt);
        text += chapter.get("title") + linesep;
    });
    ebk.file("cover.jpg", book.meta.get("cover"), {base64: true,createFolders:true});
    ebk.file('index.txt',text,opt);
    fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
}