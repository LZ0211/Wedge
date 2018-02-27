"use strict";
var compile = require('../compile');
var convert = compile(__dirname+'/template.fb2');
module.exports = function (book,fn){
    fn(convert(book));
};