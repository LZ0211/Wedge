var Zip = require('../JSZip');
var json = require("../json");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.get("author") + ' - ' + book.meta.get("title") + '.json';
    ebk.file("cover.jpg", book.meta.get("cover"), {base64: true});
    json(book,function (text){
        ebk.file(filename,text);
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
};