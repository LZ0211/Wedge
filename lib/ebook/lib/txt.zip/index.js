var Zip = require('../JSZip');
var txt = require("../txt");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.get("author") + ' - ' + book.meta.get("title") + '.txt';
    ebk.file("cover.jpg", book.meta.get("cover"), {base64: true});
    txt(book,function (text){
        ebk.file(filename,text);
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
}