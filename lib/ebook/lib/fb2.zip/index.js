var Zip = require('../zip');
var fb2 = require("../fb2");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.author + ' - ' + book.meta.title + '.fb2';
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover,'base64'), true);
    fb2(book,function (fb){
        ebk.writeFile(filename,fb,true);
        fn(ebk.generate());
    });
}