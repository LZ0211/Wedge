"use strict";
var compile = require('../../compile');
var convert = compile(__dirname+'/template.html');
module.exports = function (book,fn){
    fn(convert(book));
}