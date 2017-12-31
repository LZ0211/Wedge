"use strict";
var fs = require("fs");
var path = require("path");
var Ebk = require('./index');
var sql = require('../sql');

function Pipe(){
    var fns = [].slice.call(arguments);
    return function(){
        var args = [].slice.call(arguments);
        for(var i=0;i<fns.length;i++){
            args = [fns[i].apply(null,args)]
        }
        return args[0];
    }
}

function svaeFile(filename,ext){
    var arr = filename.split('.');
    arr.pop();
    arr.push(ext);
    filename = arr.join('.');
    return function(data){
        fs.writeFileSync(filename,data);
    }
}

function readFile(filename){
    return fs.readFileSync(filename);
}

function toArray(db){
    db = db && db[0];
    if(!db) return [];
    let keys = db.columns;
    return db.values.map(values=>{
        let record = {};
        values.forEach((value,index)=>{
            record[keys[index]] = values[index];
        });
        return record;
    });
}

function readDB(filename){
    var buffer = readFile(filename);
    var db = new SQL.Database(buffer);
    var book = {meta:{},list:[]};
    book.meta = toArray(db.exec(`SELECT * FROM meta`))[0];
    book.meta.isend = !!book.meta.isend;
    book.list = toArray(db.exec(`SELECT * FROM list`));
    return book;
}

const Convertor = {
    wbk2db:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.db(data,svaeFile(filename,'db'))),
    wbk2umd:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.umd(data,svaeFile(filename,'umd'))),
    wbk2fb2:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.fb2(data,svaeFile(filename,'fb2'))),
    wbk2txt:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.txt(data,svaeFile(filename,'txt'))),
    wbk2rtf:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.rtf(data,svaeFile(filename,'rtf'))),
    wbk2json:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.json(data,svaeFile(filename,'json'))),
    wbk2epub:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.epub(data,svaeFile(filename,'epub'))),
    wbk2txtz:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.txtz(data,svaeFile(filename,'txtz'))),
    wbk2docx:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.docx(data,svaeFile(filename,'docx'))),
    wbk2htmlz:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.htmlz(data,svaeFile(filename,'htmlz'))),
    wbk2html:filename=>Ebk.unwbk(readFile(filename),data=>Ebk['html.zip'](data,svaeFile(filename,'zip'))),
    json2db:filename=>Ebk.db(JSON.parse(readFile(filename).toString()),svaeFile(filename,'db')),
    json2wbk:filename=>Ebk.wbk(JSON.parse(readFile(filename).toString()),svaeFile(filename,'wbk')),
    json2txt:filename=>Ebk.txt(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txt')),
    json2umd:filename=>Ebk.umd(JSON.parse(readFile(filename).toString()),svaeFile(filename,'umd')),
    json2fb2:filename=>Ebk.fb2(JSON.parse(readFile(filename).toString()),svaeFile(filename,'fb2')),
    json2rtf:filename=>Ebk.rtf(JSON.parse(readFile(filename).toString()),svaeFile(filename,'rtf')),
    json2epub:filename=>Ebk.epub(JSON.parse(readFile(filename).toString()),svaeFile(filename,'epub')),
    json2docx:filename=>Ebk.docx(JSON.parse(readFile(filename).toString()),svaeFile(filename,'docx')),
    json2txtz:filename=>Ebk.txtz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txtz')),
    json2htmlz:filename=>Ebk.htmlz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'htmlz')),
    json2html:filename=>Ebk['html.zip'](JSON.parse(readFile(filename).toString()),svaeFile(filename,'htmlz')),
    db2wbk:filename=>Ebk.wbk(readDB(filename),svaeFile(filename,'wbk')),
    db2txt:filename=>Ebk.txt(readDB(filename),svaeFile(filename,'txt')),
    db2umd:filename=>Ebk.umd(readDB(filename),svaeFile(filename,'umd')),
    db2fb2:filename=>Ebk.fb2(readDB(filename),svaeFile(filename,'fb2')),
    db2rtf:filename=>Ebk.rtf(readDB(filename),svaeFile(filename,'rtf')),
    db2epub:filename=>Ebk.epub(readDB(filename),svaeFile(filename,'epub')),
    db2docx:filename=>Ebk.docx(readDB(filename),svaeFile(filename,'docx')),
    db2json:filename=>Ebk.json(readDB(filename),svaeFile(filename,'json')),
    db2txtz:filename=>Ebk.txtz(readDB(filename),svaeFile(filename,'txtz')),
    db2htmlz:filename=>Ebk.htmlz(readDB(filename),svaeFile(filename,'htmlz')),
    db2html:filename=>Ebk['html.zip'](readDB(filename),svaeFile(filename,'html.zip')),
}
module.exports = Convertor;

var argv = process.argv;
if(argv.length > 3){
    argv.slice(3).forEach(Convertor[argv[2]]);
}else{
    process.on("message",options=>{
        try{
            Ebk.unwbk(fs.readFileSync(options.filename),book=>Ebk[options.formation](book,data=>{
                fs.writeFileSync(options.filename.replace('.wbk','.'+options.formation),data);
                process.send({msg:"success"});
                process.exit();
            }))
        }catch(e){
            console.log(e)
            process.send({msg:"fail"});
            process.exit();
        }   
    });
}
