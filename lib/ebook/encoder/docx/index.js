"use strict";
var compile = require('../compile');
var Zip = require('../zip');
var encodeBook = require("../../encodeBook");

var convert = {
    Content_Types: compile(__dirname+'/[Content_Types].xml'),
    _rels:{
        rels: compile(__dirname+'/_rels/.rels'),
    },
    docProps:{
        app: compile(__dirname+'/docProps/app.xml'),
        core: compile(__dirname+'/docProps/core.xml'),
    },
    word:{
        _rels: {
            document: compile(__dirname+'/word/_rels/document.xml.rels')
        },
        fontTable: compile(__dirname+'/word/fontTable.xml'),
        settings: compile(__dirname+'/word/settings.xml'),
        styles: compile(__dirname+'/word/styles.xml'),
        webSettings: compile(__dirname+'/word/webSettings.xml'),
        document: compile(__dirname+'/word/document.xml'),
    }
};

module.exports = function (book,fn){
    var ebk = new Zip();
    encodeBook(book);

    ebk.writeFile('[Content_Types].xml',convert.Content_Types(book),true);

    ebk.writeFile('_rels/.rels',convert._rels.rels(book),true);

    ebk.writeFile('docProps/app.xml',convert.docProps.app(book),true);
    ebk.writeFile('docProps/core.xml',convert.docProps.core(book),true);

    ebk.writeFile('word/_rels/document.xml.rels',convert.word._rels.document(book),true);

    ebk.writeFile('word/fontTable.xml',convert.word.fontTable(book),true);
    ebk.writeFile('word/settings.xml',convert.word.settings(book),true);
    ebk.writeFile('word/styles.xml',convert.word.styles(book),true);
    ebk.writeFile('word/webSettings.xml',convert.word.webSettings(),true);
    ebk.writeFile('word/document.xml',convert.word.document(book),true);
    ebk.writeFile('word/media/cover.jpeg',Buffer.from(book.meta.cover,'base64'),true);
    fn(ebk.generate());
};

