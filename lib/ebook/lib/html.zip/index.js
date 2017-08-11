var Zip = require('../zip');
var html = require("../html");

module.exports = function (book,fn){
    var ebk = new Zip();
    html(book,function (files){
        ebk.writeFile('css/style.css',files.get('css/style.css'),true);
        ebk.writeFile("images/cover.jpg", Buffer.from(files.get('images/cover.jpg'),'base64'), true);
        ebk.writeFile('coverpage.html',files.get('coverpage.html'),true);
        book.list.forEach(function (chapter){
            var file = chapter.id + '.html';
            ebk.writeFile(file,files.get(file),true);
        });
        fn(ebk.generate());
    });
}