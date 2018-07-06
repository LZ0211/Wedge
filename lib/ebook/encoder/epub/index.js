"use strict";
var Epub = require('../zip');
var html = require("../html");
var compile = require('../compile');

var convert = {
    container: compile(__dirname+'/container.xml')(),
    opf: compile(__dirname+'/template.opf'),
    ncx: compile(__dirname+'/template.ncx'),
};

module.exports = function (book,fn){
    var ebk = new Epub();
    ebk.writeFile('mimetype','application/epub+zip');
    ebk.writeFile('META-INF/container.xml',convert.container,true);
    html(book,function (files){
        ebk.writeFile('OEBPS/content.opf',convert.opf(book),true);
        ebk.writeFile('OEBPS/toc.ncx',convert.ncx(book),true);
        ebk.writeFile('OEBPS/coverpage.html',files.get('coverpage.html'),true);
        ebk.writeFile('OEBPS/css/style.css',files.get('css/style.css'),true);
        ebk.writeFile("OEBPS/images/cover.jpg", Buffer.from(files.get('images/cover.jpg'),'base64'), true);
        book.list.forEach(function (chapter,index){
            var file = chapter.id + '.html';
            ebk.writeFile('OEBPS/' + file,files.get(file),true);
        });
        fn(ebk.generate());
    });
}