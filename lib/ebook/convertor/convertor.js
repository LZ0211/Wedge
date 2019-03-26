"use strict";
const fs = require("fs");
const readline = require("readline");
const encoder = require('../encoder');
const Thread = require('../../Thread');

function replaceExt(filename,ext){
    var arr = filename.split('.');
    arr.pop();
    arr.push(ext);
    filename = arr.join('.');
    return filename;
}

function svaeFile(filename,ext){
    filename = replaceExt(filename,ext);
    return function(data){
        fs.writeFileSync(filename,data);
    }
}

function readFile(filename){
    if(!filename || !fs.existsSync(filename)) return process.exit()
    return fs.readFileSync(filename);
}

function SeriesGen(name){
    return function(book,dir,num){
        let generator = encoder[name](dir);
        Thread()
        .use(generator.chapter)
        .queue(book.list)
        .threads(num)
        .end(()=>generator.meta(book))
        .start()
    }
}

const Convertor = {
    wbk2db:filename=>encoder.unwbk(readFile(filename),data=>encoder.db(data,svaeFile(filename,'db'))),
    wbk2umd:filename=>encoder.unwbk(readFile(filename),data=>encoder.umd(data,svaeFile(filename,'umd'))),
    wbk2fb2:filename=>encoder.unwbk(readFile(filename),data=>encoder.fb2(data,svaeFile(filename,'fb2'))),
    wbk2txt:filename=>encoder.unwbk(readFile(filename),data=>encoder.txt(data,svaeFile(filename,'txt'))),
    wbk2rtf:filename=>encoder.unwbk(readFile(filename),data=>encoder.rtf(data,svaeFile(filename,'rtf'))),
    wbk2json:filename=>encoder.unwbk(readFile(filename),data=>encoder.json(data,svaeFile(filename,'json'))),
    wbk2epub2:filename=>encoder.unwbk(readFile(filename),data=>encoder.epub2(data,svaeFile(filename,'epub'))),
    wbk2epub3:filename=>encoder.unwbk(readFile(filename),data=>encoder.epub3(data,svaeFile(filename,'epub'))),
    wbk2txtz:filename=>encoder.unwbk(readFile(filename),data=>encoder.txtz(data,svaeFile(filename,'txtz'))),
    wbk2docx:filename=>encoder.unwbk(readFile(filename),data=>encoder.docx(data,svaeFile(filename,'docx'))),
    wbk2odt:filename=>encoder.unwbk(readFile(filename),data=>encoder.odt(data,svaeFile(filename,'odt'))),
    wbk2ebk3:filename=>encoder.unwbk(readFile(filename),data=>encoder.ebk3(data,svaeFile(filename,'ebk3'))),
    wbk2htmlz:filename=>encoder.unwbk(readFile(filename),data=>encoder.htmlz(data,svaeFile(filename,'htmlz'))),
    wbk2html:filename=>encoder.unwbk(readFile(filename),data=>encoder.html(data,svaeFile(filename,'html'))),
    'wbk2txts.zip':filename=>encoder.unwbk(readFile(filename),data=>encoder['txts.zip'](data,svaeFile(filename,'txts.zip'))),
    'wbk2html.zip':filename=>encoder.unwbk(readFile(filename),data=>encoder['html.zip'](data,svaeFile(filename,'html.zip'))),
    wbk2chm:filename=>encoder.unwbk(readFile(filename),data=>SeriesGen('chm')(data,replaceExt(filename,'chm'))),
    wbk2txts:filename=>encoder.unwbk(readFile(filename),data=>SeriesGen('txts')(data,replaceExt(filename,'txts'),10)),
    wbk2htmls:filename=>encoder.unwbk(readFile(filename),data=>SeriesGen('htmls')(data,replaceExt(filename,'htmls'))),

    json2db:filename=>encoder.db(JSON.parse(readFile(filename).toString()),svaeFile(filename,'db')),
    json2wbk:filename=>encoder.wbk(JSON.parse(readFile(filename).toString()),svaeFile(filename,'wbk')),
    json2txt:filename=>encoder.txt(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txt')),
    json2umd:filename=>encoder.umd(JSON.parse(readFile(filename).toString()),svaeFile(filename,'umd')),
    json2fb2:filename=>encoder.fb2(JSON.parse(readFile(filename).toString()),svaeFile(filename,'fb2')),
    json2rtf:filename=>encoder.rtf(JSON.parse(readFile(filename).toString()),svaeFile(filename,'rtf')),
    json2epub2:filename=>encoder.epub2(JSON.parse(readFile(filename).toString()),svaeFile(filename,'epub')),
    json2epub3:filename=>encoder.epub3(JSON.parse(readFile(filename).toString()),svaeFile(filename,'epub')),
    json2docx:filename=>encoder.docx(JSON.parse(readFile(filename).toString()),svaeFile(filename,'docx')),
    json2odt:filename=>encoder.odt(JSON.parse(readFile(filename).toString()),svaeFile(filename,'odt')),
    json2txtz:filename=>encoder.txtz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txtz')),
    json2ebk3:filename=>encoder.ebk3(JSON.parse(readFile(filename).toString()),svaeFile(filename,'ebk3')),
    json2htmlz:filename=>encoder.htmlz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'htmlz')),
    json2html:filename=>encoder.html(JSON.parse(readFile(filename).toString()),svaeFile(filename,'html')),
    'json2txts.zip':filename=>encoder['txts.zip'](JSON.parse(readFile(filename).toString()),svaeFile(filename,'txts.zip')),
    'json2html.zip':filename=>encoder['html.zip'](JSON.parse(readFile(filename).toString()),svaeFile(filename,'html.zip')),
    json2chm:filename=>SeriesGen('chm')(JSON.parse(readFile(filename).toString()),replaceExt(filename,'chm')),
    json2txts:filename=>SeriesGen('txts')(JSON.parse(readFile(filename).toString()),replaceExt(filename,'txts'),10),
    json2htmls:filename=>SeriesGen('htmls')(JSON.parse(readFile(filename).toString()),replaceExt(filename,'htmls')),

    db2wbk:filename=>encoder.undb(readFile(filename),data=>encoder.db(data,svaeFile(filename,'wbk'))),
    db2umd:filename=>encoder.undb(readFile(filename),data=>encoder.umd(data,svaeFile(filename,'umd'))),
    db2fb2:filename=>encoder.undb(readFile(filename),data=>encoder.fb2(data,svaeFile(filename,'fb2'))),
    db2txt:filename=>encoder.undb(readFile(filename),data=>encoder.txt(data,svaeFile(filename,'txt'))),
    db2rtf:filename=>encoder.undb(readFile(filename),data=>encoder.rtf(data,svaeFile(filename,'rtf'))),
    db2json:filename=>encoder.undb(readFile(filename),data=>encoder.json(data,svaeFile(filename,'json'))),
    db2epub2:filename=>encoder.undb(readFile(filename),data=>encoder.epub2(data,svaeFile(filename,'epub'))),
    db2epub3:filename=>encoder.undb(readFile(filename),data=>encoder.epub3(data,svaeFile(filename,'epub'))),
    db2txtz:filename=>encoder.undb(readFile(filename),data=>encoder.txtz(data,svaeFile(filename,'txtz'))),
    db2docx:filename=>encoder.undb(readFile(filename),data=>encoder.docx(data,svaeFile(filename,'docx'))),
    db2odt:filename=>encoder.undb(readFile(filename),data=>encoder.odt(data,svaeFile(filename,'odt'))),
    db2ebk3:filename=>encoder.undb(readFile(filename),data=>encoder.ebk3(data,svaeFile(filename,'ebk3'))),
    db2htmlz:filename=>encoder.undb(readFile(filename),data=>encoder.htmlz(data,svaeFile(filename,'htmlz'))),
    db2html:filename=>encoder.undb(readFile(filename),data=>encoder.html(data,svaeFile(filename,'html'))),
    'db2txts.zip':filename=>encoder.undb(readFile(filename),data=>encoder['txts.zip'](data,svaeFile(filename,'txts.zip'))),
    'db2html.zip':filename=>encoder.undb(readFile(filename),data=>encoder['html.zip'](data,svaeFile(filename,'html.zip'))),
    db2chm:filename=>encoder.undb(readFile(filename),data=>SeriesGen('chm')(data,replaceExt(filename,'chm'))),
    db2txts:filename=>encoder.undb(readFile(filename),data=>SeriesGen('txts')(data,replaceExt(filename,'txts'),10)),
    db2htmls:filename=>encoder.undb(readFile(filename),data=>SeriesGen('htmls')(data,replaceExt(filename,'htmls'))),
}
module.exports = Convertor;

var argv = process.argv;
var rl;

if(argv.length > 3){
    argv.slice(3).forEach(Convertor[argv[2]]);
}else{
    rl = rl || readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Please drag file to here:',input=>{
        Convertor[argv[2]](input)
        rl.close()
    });
}
