module.exports = function (book,fn){
    var text = "";
    var linesep = "\r\n";
    text += "【书名】：" + book.meta.get("title") + linesep;
    text += "【作者】：" + book.meta.get("author") + linesep;
    text += "【类型】：" + book.meta.get("classes") + linesep;
    text += "【简介】：" + book.meta.get("brief").replace(/[\r\n]+/g,linesep) + linesep;
    text += "【正文】" + linesep;
    text += linesep;
    book.list.each(function (chapter){
        text += chapter.get("title") + linesep;
        text += linesep;
        text += chapter.get("content").split(/[\r\n]+/).join(linesep);
        text += linesep;
        text += linesep;
    });
    fn(text);
};