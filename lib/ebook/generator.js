"use strict";
var fs = require("fs");
var path = require("path");
var Book = require('../Book');
var Ebk = require('./index');


module.exports = function (msg){
    var directory = msg.directory;
    var formation = msg.formation;
    var bookdir = msg.bookdir;
    var book = new Book(bookdir);
    book.loadChapterContent(function (){
        book.sortBy('id');
        var bookData = book.valueOf();
        if (!bookData.meta.title) return process.exit();
        var filename = bookData.meta.author + " - " + bookData.meta.title + "." + formation;
        var filedir = path.join(directory,filename);
        var generator = Ebk[formation];
        generator(bookData,function (data){
            fs.writeFile(filedir,data,function (err){
                if (err){
                    process.send({msg:"fail"});
                }else {
                    process.send({msg:"success"});
                }
                process.exit();
            });
        });
    });
};

/*module.exports({
    directory:'E:\\MyBooks\\Library\\ebook',
    formation:'epub',
    bookdir:'E:\\MyBooks\\Library\\books\\fd987fa3-9a1a-fe00-1498-3e5514b121c7'
});*/
process.on("message",module.exports);