var Zip = require('../JSZip');
var json = require("../json");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.author + ' - ' + book.meta.title + '.json';
    ebk.file("cover.jpg", book.meta.cover, {base64: true});
    json(book,function (text){
        ebk.file(filename,text);
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
};