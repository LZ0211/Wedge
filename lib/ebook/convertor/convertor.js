"use strict";
const fs = require("fs");
const encoder = require('../encoder');

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
    wbk2db:filename=>encoder.unwbk(readFile(filename),data=>encoder.db(data,svaeFile(filename,'db'))),
    wbk2umd:filename=>encoder.unwbk(readFile(filename),data=>encoder.umd(data,svaeFile(filename,'umd'))),
    wbk2fb2:filename=>encoder.unwbk(readFile(filename),data=>encoder.fb2(data,svaeFile(filename,'fb2'))),
    wbk2txt:filename=>encoder.unwbk(readFile(filename),data=>encoder.txt(data,svaeFile(filename,'txt'))),
    wbk2txts:filename=>encoder.unwbk(readFile(filename),data=>encoder['txts.zip'](data,svaeFile(filename,'txts.zip'))),
    wbk2rtf:filename=>encoder.unwbk(readFile(filename),data=>encoder.rtf(data,svaeFile(filename,'rtf'))),
    wbk2json:filename=>encoder.unwbk(readFile(filename),data=>encoder.json(data,svaeFile(filename,'json'))),
    wbk2epub2:filename=>encoder.unwbk(readFile(filename),data=>encoder.epub2(data,svaeFile(filename,'epub'))),
    wbk2epub3:filename=>encoder.unwbk(readFile(filename),data=>encoder.epub3(data,svaeFile(filename,'epub'))),
    wbk2txtz:filename=>encoder.unwbk(readFile(filename),data=>encoder.txtz(data,svaeFile(filename,'txtz'))),
    wbk2docx:filename=>encoder.unwbk(readFile(filename),data=>encoder.docx(data,svaeFile(filename,'docx'))),
    wbk2odt:filename=>encoder.unwbk(readFile(filename),data=>encoder.odt(data,svaeFile(filename,'odt'))),
    wbk2ebk3:filename=>encoder.unwbk(readFile(filename),data=>encoder.ebk3(data,svaeFile(filename,'ebk3'))),
    wbk2chm:filename=>encoder.unwbk(readFile(filename),data=>encoder.chm(data,svaeFile(filename,'chm'))),
    wbk2htmlz:filename=>encoder.unwbk(readFile(filename),data=>encoder.htmlz(data,svaeFile(filename,'htmlz'))),
    wbk2html:filename=>encoder.unwbk(readFile(filename),data=>encoder['html.zip'](data,svaeFile(filename,'html.zip'))),

    json2db:filename=>encoder.db(JSON.parse(readFile(filename).toString()),svaeFile(filename,'db')),
    json2wbk:filename=>encoder.wbk(JSON.parse(readFile(filename).toString()),svaeFile(filename,'wbk')),
    json2txt:filename=>encoder.txt(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txt')),
    json2txts:filename=>encoder['txts.zip'](JSON.parse(readFile(filename).toString()),svaeFile(filename,'txts.zip')),
    json2umd:filename=>encoder.umd(JSON.parse(readFile(filename).toString()),svaeFile(filename,'umd')),
    json2fb2:filename=>encoder.fb2(JSON.parse(readFile(filename).toString()),svaeFile(filename,'fb2')),
    json2rtf:filename=>encoder.rtf(JSON.parse(readFile(filename).toString()),svaeFile(filename,'rtf')),
    json2epub2:filename=>encoder.epub2(JSON.parse(readFile(filename).toString()),svaeFile(filename,'epub')),
    json2epub3:filename=>encoder.epub3(JSON.parse(readFile(filename).toString()),svaeFile(filename,'epub')),
    json2docx:filename=>encoder.docx(JSON.parse(readFile(filename).toString()),svaeFile(filename,'docx')),
    json2odt:filename=>encoder.odt(JSON.parse(readFile(filename).toString()),svaeFile(filename,'odt')),
    json2txtz:filename=>encoder.txtz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'txtz')),
    json2ebk3:filename=>encoder.ebk3(JSON.parse(readFile(filename).toString()),svaeFile(filename,'ebk3')),
    json2chm:filename=>encoder.chm(JSON.parse(readFile(filename).toString()),svaeFile(filename,'chm')),
    json2htmlz:filename=>encoder.htmlz(JSON.parse(readFile(filename).toString()),svaeFile(filename,'htmlz')),
    json2html:filename=>encoder['html.zip'](JSON.parse(readFile(filename).toString()),svaeFile(filename,'html.zip')),

    db2wbk:filename=>encoder.wbk(readDB(filename),svaeFile(filename,'wbk')),
    db2txt:filename=>encoder.txt(readDB(filename),svaeFile(filename,'txt')),
    db2txts:filename=>encoder['txts.zip'](readDB(filename),svaeFile(filename,'txts.zip')),
    db2umd:filename=>encoder.umd(readDB(filename),svaeFile(filename,'umd')),
    db2fb2:filename=>encoder.fb2(readDB(filename),svaeFile(filename,'fb2')),
    db2rtf:filename=>encoder.rtf(readDB(filename),svaeFile(filename,'rtf')),
    db2epub2:filename=>encoder.epub2(readDB(filename),svaeFile(filename,'epub')),
    db2epub3:filename=>encoder.epub3(readDB(filename),svaeFile(filename,'epub')),
    db2docx:filename=>encoder.docx(readDB(filename),svaeFile(filename,'docx')),
    db2odt:filename=>encoder.odt(readDB(filename),svaeFile(filename,'odt')),
    db2json:filename=>encoder.json(readDB(filename),svaeFile(filename,'json')),
    db2txtz:filename=>encoder.txtz(readDB(filename),svaeFile(filename,'txtz')),
    db2ebk3:filename=>encoder.ebk3(readDB(filename),svaeFile(filename,'ebk3')),
    db2chm:filename=>encoder.chm(readDB(filename),svaeFile(filename,'chm')),
    db2htmlz:filename=>encoder.htmlz(readDB(filename),svaeFile(filename,'htmlz')),
    db2html:filename=>encoder['html.zip'](readDB(filename),svaeFile(filename,'html.zip')),
}
module.exports = Convertor;

var argv = process.argv;
if(argv.length > 3){
    argv.slice(3).forEach(Convertor[argv[2]]);
}
