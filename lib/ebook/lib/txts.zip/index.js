var Zip = require('../JSZip');
module.exports = function (book,fn){
    var ebk = new Zip();
    var text = "";
    var linesep = "\r\n";
    text += "【书名】：" + book.meta.get("title") + linesep;
    text += "【作者】：" + book.meta.get("author") + linesep;
    text += "【类型】：" + book.meta.get("classes") + linesep;
    text += "【简介】：" + book.meta.get("brief").replace(/[\r\n]+/g,linesep) + linesep;
    ebk.file("书籍信息.txt", text);
    ebk.file("书籍封面.jpg", book.meta.get("cover"), {base64: true});
    book.list.each(function (chapter){
        text = "";
        text += chapter.get("title") + linesep;
        text += linesep;
        text += chapter.get("content").split(/[\r\n]+/).join(linesep);
        ebk.file(chapter.get("id") + " " + chapter.get("title") + ".txt", text);
    });
    fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
};