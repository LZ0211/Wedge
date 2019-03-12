"use strict";
const fs = require("fs")
const path = require("path")
const Book = require('../Book')
const Ebk = require('./index')
const Filter = require('./Filter')

function generate(msg){
    var directory = msg.directory;
    var formation = msg.formation;
    var filename = msg.filename || '{author} - {title}.{format}';
    var bookdir = msg.bookdir;
    var generator = Ebk[formation];
    var book = Book();
    var filter = Filter(msg.filter);
    book.location(bookdir,(err,book)=>{
        if(!generator){
            var bookData = book.valueOf();
            var meta = bookData.meta;
            directory = path.join(directory, meta.author + " - " + meta.title);
            fs.mkdirsSync(directory);
            bookData.list.forEach(chapter=>{
                if(!filter(chapter)) return
                try{
                    var data = fs.readFileSync(path.join(bookdir,chapter.id));
                    var content = JSON.parse(data.toString()).content.replace(/\n/g,'\r\n');
                    fs.writeFileSync(path.join(directory,chapter.id + "_" + chapter.title + ".txt"),content);
                }catch(e){
                    //pass
                }
            });
            process.exit();
        }
        book.loadChapterContent(function (){
            book.sortBy('id');
            var bookData = book.valueOf();
            var meta = bookData.meta;
            var list = bookData.list;
            var file = filename
            .replace(/{title}/gi,meta.title)
            .replace(/{author}/gi,meta.author)
            .replace(/{classes}/gi,meta.classes)
            .replace(/{isend}/gi,meta.isend ? '完结':'连载')
            .replace(/{format}/gi,formation)
            .replace(/\:/g,'：')
            .replace(/\\/g,'＼')
            .replace(/\//g,'／')
            .replace(/\?/g,'？')
            .replace(/\</g,'＜')
            .replace(/\>/g,'＞')
            .replace(/\|/g,'｜')
            .replace(/\*/g,'＊')
            .replace(/\"/g,'＂')
            list.forEach(function(chapter,index){
                chapter.index = index;
                chapter.length = (chapter.content || '').length;
            });
            list = list.filter(filter);
            if (!meta.title) return process.exit();
            var filedir = path.join(directory,file);
            generator({meta:meta,list:list},function (data){
                fs.writeFile(filedir,data,function (err){
                    if (err){
                        process.send({msg:"fail"});
                    }else {
                        process.send({msg:"success"});
                    }
                    process.exit();
                });
            });
        });
    })
};

process.on("message",generate);