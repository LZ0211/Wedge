var Zip = require('../JSZip');
var html = require("../html");

module.exports = function (book,fn){
    var ebk = new Zip();
    var opt = {createFolders:true};
    html(book,function (files){
        ebk.file('css/style.css',files.get('css/style.css'),opt);
        ebk.file("images/cover.jpg", files.get('images/cover.jpg'), {base64: true,createFolders:true});
        ebk.file('coverpage.html',files.get('coverpage.html'),opt);
        book.list.each(function (chapter){
            var file = chapter.get("id") + '.html';
            ebk.file(file,files.get(file),opt);
        });
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
}