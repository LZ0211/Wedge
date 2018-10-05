"use strict";
var compile = require('../compile');
var encodeBook = require('../../encodeBook');
var convert = compile(__dirname+'/template.fb2');
module.exports = function (book,fn){
    encodeBook(book);
    fn(convert(book));
};