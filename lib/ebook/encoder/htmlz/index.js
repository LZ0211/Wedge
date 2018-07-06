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
    ebk.writeFile('style.css',convert.css,true);
    ebk.writeFile('metadata.opf',convert.metadata(book),true);
    ebk.writeFile('index.html',convert.html(book),true);
    ebk.writeFile('cover.jpg',Buffer.from(book.meta.cover,'base64'),true);
    fn(ebk.generate());
}