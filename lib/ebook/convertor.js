"use strict";
var fs = require("fs");
var path = require("path");
var Ebk = require('./index');

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

const Convertor = {
    wbk2json:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.json(data,svaeFile(filename,'json'))),
    wbk2epub:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.epub(data,svaeFile(filename,'epub'))),
    wbk2umd:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.umd(data,svaeFile(filename,'umd'))),
    wbk2fb2:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.fb2(data,svaeFile(filename,'fb2'))),
    wbk2txtz:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.txtz(data,svaeFile(filename,'txtz'))),
    wbk2txt:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.txt(data,svaeFile(filename,'txt'))),
    wbk2docx:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.docx(data,svaeFile(filename,'docx'))),
    wbk2html:filename=>Ebk.unwbk(readFile(filename),data=>Ebk['html.zip'](data,svaeFile(filename,'zip'))),
    wbk2htmlz:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.htmlz(data,svaeFile(filename,'htmlz'))),
    wbk2rtf:filename=>Ebk.unwbk(readFile(filename),data=>Ebk.rtf(data,svaeFile(filename,'rtf'))),
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
