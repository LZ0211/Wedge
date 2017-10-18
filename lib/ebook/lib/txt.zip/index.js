var Zip = require('../zip');
var txt = require("../txt");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.author + ' - ' + book.meta.title + '.txt';
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover, 'base64'), true);
    txt(book,function (text){
        ebk.writeFile(filename,text,true);
        fn(ebk.generate());
    });
}