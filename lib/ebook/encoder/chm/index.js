const compile = require('../compile');
const encodeBook = require('../encodeBook');
const iconv = require('iconv-lite');
const child_process = require('child_process');
const fs = require("fs");
const path = require("path");
const os = require('os');
    
const convert = {
    hhp:compile(__dirname+'/template.hhp'),
    hhc:compile(__dirname+'/template.hhc'),
    hhk:compile(__dirname+'/template.hhk'),
    index: compile(__dirname+'/index.html'),
    chapter: compile(__dirname+'/chapter.html'),
    style: compile(__dirname+'/style.css'),
}

function makedirsSync(dir){
    if (fs.existsSync(dir)) return;
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || makedirsSync(dirname);
    fs.mkdirSync(dir);
}

function removedirsSync(root){
    if (!fs.existsSync(root)) return;
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            removedirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
}
function noop(){}
module.exports = function(dir){
    if(!os.platform().match(/^win/)) throw Error('CHM generator only support Window OS!');
    let hhc = path.join(__dirname,"hhc.exe");
    let local = os.tmpdir()
    let temp = path.join(local,'Wedge_'+Math.random().toString(16).slice(2)+'.tmp');
    let list = [];
    let prev;
    makedirsSync(temp);
    function render(chapter,next){
        if(!chapter.prev){
            chapter.prev = 'index';
        }
        if(!chapter.next){
            chapter.next = 'index';
        }
        chapter.content = encodeBook.encode(chapter.content);
        chapter.content = chapter.content.replace(/\[url\s*=?\s*([^\[\]]*)\]([^\[\]]+)\[\/url\]/gi,($,$1,$2)=>{
            return `<a href="${decodeURI($1).replace(/&amp;/g,"&")}">${decodeURI($2)}</a><br>`;
        });
        chapter.content = chapter.content.replace(/\[img\]([^\[\]]+)\[\/img\]/gi,($,$1)=>{
            return `<img src="${decodeURI($1).replace(/&amp;/g,"&")}" />`;
        });
        fs.writeFile(path.join(temp,chapter.id + ".html"),convert.chapter(chapter),next);
    }
    return {
        chapter:function(chapter,next){
            if('function' !== typeof next) next = noop;
            let item = Object.assign({},chapter);
            delete item.content;
            list.push(item);
            if(!prev){
                prev = chapter;
                return next();
            }
            chapter.prev = prev.id;
            prev.next = chapter.id;
            render(prev,next);
            prev = chapter;
        },
        meta:function(book,next){
            if('function' !== typeof next) next = noop;
            prev && render(prev,noop);
            book.list = list;
            encodeBook(book);
            book.filename = dir;
            fs.writeFileSync(path.join(temp,"index.html"),convert.index(book));
            fs.writeFileSync(path.join(temp,"style.css"),convert.style(book));
            fs.writeFileSync(path.join(temp,"cover.jpg"),book.meta.cover,"base64");
            fs.writeFileSync(path.join(temp,"book.hhk"),iconv.encode(convert.hhk(book),'gbk'));
            fs.writeFileSync(path.join(temp,"book.hhc"),iconv.encode(convert.hhc(book),'gbk'));
            fs.writeFileSync(path.join(temp,"book.hhp"),iconv.encode(convert.hhp(book),'gbk'));
            child_process.execFile(hhc, [path.join(temp,"book.hhp")],function(){
                removedirsSync(temp);
                next();
            });
        }
    }
}