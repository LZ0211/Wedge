"use strict";
var fs = require("fs");
var path = require("path");
var readline = require("readline");
var Book = require('../Book');
var util = require('../util');
var Ebk = require('./index');

function commander(msg){
    var directory = msg.directory;
    var formation = msg.formation;
    var bookdir = msg.bookdir;
    var book = new Book(bookdir);
    book.loadChapterContent(function (){
        book.sortBy('id');
        var bookData = book.valueOf();
        if (!bookData.meta.title) return process.exit();
        var filename = bookData.meta.author + " - " + bookData.meta.title + "." + formation;
        var filedir = path.join(directory,filename);
        var generator = Ebk[formation];
        generator(bookData,function (data){
            fs.mkdirsSync(directory);
            fs.writeFile(filedir,data,function (err){
                process.exit();
            });
        });
    });
}

var argv = process.argv;
var msg = {};
for (var i=0;i<argv.length;i++){
    if (argv[i] == '-f'){
        msg.formation = argv[i+1];
    }
    if (argv[i] == '-i'){
        msg.bookdir = argv[i+1];
    }
    if (argv[i] == '-o'){
        msg.directory = argv[i+1];
    }
}

var lostArgv = [];
if (!msg.bookdir){
    lostArgv.push('bookdir');
}
if (!msg.formation){
    lostArgv.push('formation');
}
if (!msg.directory){
    lostArgv.push('directory');
}

function terminal(docs,fn){
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var args = [];
    var len = Math.max(docs.length,fn.length);
    var ref = 0;
    if (len == 0)return fn.apply(this,args);
    var listener=()=>{
        rl.question(docs[ref],input=>{
            args.push(input);
            ref += 1;
            if(ref === len){
                rl.close();
                return fn.apply(null,args);
            }else{
                return listener();
            }
        });
    };
    listener();
}

terminal(lostArgv.map(v=>'Please input ebook ' + v + ': '),function (){
    for (var i=0;i<arguments.length ;i++ ){
        msg[lostArgv[i]] = arguments[i];
    }
    commander(msg);
});