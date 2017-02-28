var Zip = require('../JSZip');
var fb2 = require("../fb2");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.get("author") + ' - ' + book.meta.get("title") + '.fb2';
    ebk.file("cover.jpg", book.meta.get("cover"), {base64: true});
    fb2(book,function (fb){
        ebk.file(filename,fb);
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
}