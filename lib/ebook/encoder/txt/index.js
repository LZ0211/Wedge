"use strict";
var compile = require('../compile');
var convert = compile(__dirname+'/template.txt');
module.exports = function(book,fn){
    fn(convert(book));
};