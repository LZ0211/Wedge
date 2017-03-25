var fs = require("fs");
var path = require("path");
var Loader = require('../loader');
var Ebk = require('./index');

var formationDef = {
 "title": {
    "type": "path"
  },
  "id": {
    "type": "id"
  },
  "source": {
    "type": "url"
  },
  "date": {
    "type": "time"
  },
  "file": {
    "type": "path"
  },
  "size": {
    "type": "integer"
  },
  "content": {
    "type": "text"
  }
};
module.exports = function (msg){
    var directory = msg.directory;
    var formation = msg.formation;
    var bookdir = msg.bookdir;
    Loader.bookContent(bookdir,(err,book)=>{
        if (err){
            process.send({msg:"err"});
            process.exit();
        }
        var filename = book.meta.get("author") + " - " + book.meta.get("title") + "." + formation;
        var filedir = path.join(directory,filename);
        var generator = Ebk[formation];
        book.list.config(formationDef);
        generator(book,function (data){
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
    formation:'fb2',
    bookdir:'E:\\MyBooks\\Library\\books\\996a33e1-4255-1f31-33ad-7e50ff1d2dc1'
});*/
process.on("message",module.exports);