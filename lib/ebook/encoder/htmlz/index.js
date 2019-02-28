"use strict";
var Zip = require('../zip');
var compile = require('../compile');

var convert = {
    css: compile(__dirname+'/style.css')(),
    metadata: compile(__dirname+'/template.opf'),
    html: compile(__dirname+'/template.html'),
};

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile('style.css',convert.css);
    ebk.writeFile('metadata.opf',convert.metadata(book));
    ebk.writeFile('index.html',convert.html(book));
    ebk.writeFile('cover.jpg',Buffer.from(book.meta.cover,'base64'));
    fn(ebk.generate());
}