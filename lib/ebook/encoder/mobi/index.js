"use strict";
const child_process = require('child_process');
const path = require("path");
const os = require('os');
const epub = require('../epub2');

module.exports = function(book,fn){
    let exe = null;
    if(os.platform().match('darwin')){
        exe = path.join(__dirname,'./macos/kindlegen');
    }else if(os.platform().match('win')){
        exe = path.join(__dirname,'./win/kindlegen');
    }else{
        throw Error('Kindlegen only support Window and MacOS!');
    }
    
    epub(book,()=>{

    });
}