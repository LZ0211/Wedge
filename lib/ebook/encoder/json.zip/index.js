var Zip = require('../zip');
var json = require("../json");

module.exports = function (book,fn){
    var ebk = new Zip();
    var filename = book.meta.author + ' - ' + book.meta.title + '.json';
    ebk.writeFile("cover.jpg", Buffer.from(book.meta.cover,'base64'), true);
    json(book,function (text){
        ebk.writeFile(filename,text,true);
        fn(ebk.generate());
    });
};