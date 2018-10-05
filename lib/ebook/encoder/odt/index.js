"use strict";
var compile = require('../compile');
var Zip = require('../zip');
var encodeBook = require("../../encodeBook");

var convert = {
    manifest: compile(__dirname+'/manifest.xml')(),
    settings: compile(__dirname+'/settings.xml')(),
    styles: compile(__dirname+'/styles.xml')(),
    meta: compile(__dirname+'/meta.xml'),
    content: compile(__dirname+'/content.xml'),
};


module.exports = function (book,fn){
    var ebk = new Zip();
    encodeBook(book);
    ebk.writeFile('mimetype','application/vnd.oasis.opendocument.text');
    ebk.writeFile('media/cover.jpeg',Buffer.from(book.meta.cover,'base64'),true);
    ebk.writeFile('META-INF/manifest.xml',convert.manifest,true);
    ebk.writeFile('settings.xml',convert.settings,true);
    ebk.writeFile('styles.xml',convert.styles,true);
    ebk.writeFile('meta.xml',convert.meta(book),true);
    ebk.writeFile('content.xml',convert.content(book),true);
    fn(ebk.generate());
};

