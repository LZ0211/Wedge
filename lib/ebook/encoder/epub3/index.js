"use strict";
var Epub = require('../zip');
var html = require("../html");
var compile = require('../compile');

var convert = {
    container: compile(__dirname+'/container.xml')(),
    opf: compile(__dirname+'/template.opf'),
    ncx: compile(__dirname+'/template.ncx'),
    nav: compile(__dirname+'/nav.xhtml'),
};

module.exports = function (book,fn){
    var ebk = new Epub();
    ebk.writeFile('mimetype','application/epub+zip', true);
    ebk.writeFile('META-INF/container.xml',convert.container);
    ebk.writeFile('OEBPS/content.opf',convert.opf(book));
    ebk.writeFile('OEBPS/toc.ncx',convert.ncx(book));
    ebk.writeFile('OEBPS/nav.xhtml',convert.nav(book));
    html(book,files=>{
        ebk.writeFile('OEBPS/coverpage.xhtml',files.get('coverpage.html'));
        ebk.writeFile('OEBPS/css/style.css',files.get('css/style.css'));
        ebk.writeFile("OEBPS/images/cover.jpg", Buffer.from(files.get('images/cover.jpg'),'base64'));
        book.list.forEach(chapter=>ebk.writeFile(`OEBPS/${chapter.id}.xhtml`,files.get(`${chapter.id}.html`)));
        book.list.forEach(chapter=>{
            var images = files.get(`${chapter.id}`);
            if(images){
                images.list().forEach(image=>{
                    ebk.writeFile(`OEBPS/${chapter.id}/${image}`,images.get(image));
                });
            }
        });
        fn(ebk.generate());
    });
}