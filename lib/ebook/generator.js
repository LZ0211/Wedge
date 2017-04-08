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
                if (filedir,err){
                    process.send({msg:"fail"});
                }else {
                    process.send({msg:"success"});
                }
                process.exit();
            });
        })
    });
}

/*module.exports({
    directory:'E:\\MyBooks\\Library\\ebook',
    formation:'fb2.zip',
    bookdir:'E:\\MyBooks\\Library\\hbooks\\ebc99cb8-a45e-45fe-0378-21a7f13ce0af'
});*/
process.on("message",module.exports);