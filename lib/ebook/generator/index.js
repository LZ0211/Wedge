"use strict";
const fs = require("fs")
const path = require("path")
const Thread = require('../../Thread')
const encoder = require('../encoder')
const parse = require('./parse')
const crypto = require('crypto')

const exts = {
    'epub2':'epub',
    'epub3':'epub',
    'kf8': 'azw3',
    'kf6': 'mobi',
}

function pathRep(str){
    const pair={
        ':':'：',
        '\\':'＼',
        '\/':'／',
        '?':'？',
        '<':'＜',
        '>':'＞',
        '|':'｜',
        '*':'＊',
        '"':'＂'
    }
    return str.replace(/[\:\\\/\?\<\>\|\*\"]/g,($,$1)=>pair[$1])
}

function makedirsSync(dir){
    if (fs.existsSync(dir)) return;
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || makedirsSync(dirname);
    fs.mkdirSync(dir);
}

function sort(list){
    if(list.every(item=>item.id.match(/^\d+$/))){
        list.sort((x,y)=>x.id - y.id);
    }else{
        list.sort((x,y)=>x.id > y.id ? 1 : -1);
    }
}

function execute(msg,callback){
    callback = callback || function(){}
    let bookfile;
    let directory = msg.directory;
    let formation = msg.formation.toLowerCase();
    let filename = msg.filename || '{author} - {title}.{format}';
    let bookdir = msg.bookdir;
    let filter = msg.filter || '';
    let ext = exts[formation] || formation;
    let thread = 1;
    //输入不合法
    if(!bookdir || !directory || !formation) return callback(1);
    //文件不存在的时候
    if(!fs.existsSync(bookdir)) return callback(2);
    let stat = fs.statSync(bookdir);
    if(stat.isDirectory()){
        bookfile = path.join(bookdir,'index.book');
    }else if(stat.isFile(bookdir)){
        bookfile = bookdir;
        bookdir = path.dirname(bookfile);
    }
    fs.readFile(bookfile,(err,data)=>{
        let book,meta,list
        if(err) return callback(4);
        try{
            book = JSON.parse(data.toString());
            meta = book.meta;
            list = book.list;
            if(!typeof meta === 'object' || !Array.isArray(list)) return callback(8);
            //空白书籍就不要浪费时间了
            if(!meta.title || list.length === 0) return callback(16);
        }catch(e){
            return callback(32)
        }
        //过滤器
        let filterFun,hash
        if(!filter){
            filterFun = ()=>true;
        }else{
            filterFun = parse(filter);
            //console.log(filterFun.toString())
            hash = crypto.createHash("sha256").update(filter,'utf8').digest("hex");
            hash = path.join(bookdir,hash);
            if(fs.existsSync(hash)){
                let hashStat = fs.statSync(hash);
                let bookStat = fs.statSync(bookfile);
                //找到缓存
                if(hashStat.ctime > bookStat.ctime){
                    try{
                        list = JSON.parse(fs.readFileSync(hash,'utf8'));
                        filterFun = ()=>true;
                    }catch(e){
                    }
                }
            }
        }
        list.forEach((item,idx)=>item.index=idx);
        
        //不需要判断内容的时候直接预过滤
        if(!filter.match(/content/i)){
            list = list.filter(filterFun);
            if(list.length === 0) return callback(64);
            filterFun = ()=>true;
        }
        //文件名
        filename = filename
        .replace(/{title}/gi,meta.title)
        .replace(/{author}/gi,meta.author)
        .replace(/{classes}/gi,meta.classes)
        .replace(/{uuid}/gi,meta.uuid)
        .replace(/{isend}/gi,meta.isend ? '完结':'连载')
        .replace(/{format}/gi,ext)
        .replace(/{formation}/gi,ext);
        filename = pathRep(filename)//修改不合法的路径字符
        filename = path.join(directory,filename);
        //创建保存路径
        makedirsSync(directory);
        //分部生成文件 或 加载完一次性生成
        book = {meta:meta,list:[]};
        sort(list);
        let finalGenerate,stepGenarator;
        
        if(~['txts','htmls','chm'].indexOf(formation)){
            let generator = encoder[formation](filename);
            finalGenerate = function(){
                generator.meta(book,()=>callback(0,filename));
            }
            stepGenarator = function(chapter,next){
                generator.chapter(chapter,next);
            }
        }else{
            stepGenarator = function(chapter,next){
                book.list.push(chapter);
                return next();
            }
            finalGenerate = function(){
                sort(book.list);
                encoder[formation](book,data=>fs.writeFile(filename,data,()=>callback(0,filename)));
            }
        }
        let stepFun = (item,next)=>{
            let file = path.join(bookdir,item.id + '.json');
            fs.readFile(file,(err,data)=>{
                if (err) return next();
                try{
                    item.content = JSON.parse(data.toString()).content || "";
                    item.length = item.content.length;
                }catch (e){
                    return next();
                }
                if(filterFun(item)){
                    stepGenarator(item,next);
                }else{
                    return next();
                }
            });
        }
        let endFun = ()=>{
            if(hash){
                var bak = book.list.map(item=>({title:item.title,id:item.id,date:item.date,source:item.source}));
                fs.writeFile(hash,JSON.stringify(bak),function(){})
            }
            finalGenerate();
        }
        Thread().use(stepFun).end(endFun).queue(list).threads(thread).start()
    });
}

module.exports = execute

// execute({
//     bookdir:'/Users/wangcong/Desktop/Downloader/library/589e38d5-7dd2-aefa-d3cd-2e8e2f4fbd29',
//     formation:'mobi',
//     directory:'./'
// },console.log)