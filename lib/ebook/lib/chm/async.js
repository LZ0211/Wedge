var fs = require("fs"),
    path = require("path"),
    dot = require('../dot'),
    utils = require("../utils"),
    jsonAsync = require('../json/async'),
    iconv = require('iconv-lite'),
    child_process = require('child_process');

var template = {
    hhp:"./model/template.hhp",
    hhc:"./model/template.hhc",
    hhk:"./model/template.hhk",
    index :"./model/index.html",
    chapter:"./model/chapter.html"
};
(function (){
    Object.keys(template).forEach(function (name){
        var str = fs.readFileSync(path.join(__dirname,template[name]));
        var fn = dot.template(str);
        template[name] = function (data){
            return fn(data).replace(/&nbsp;/g,"  ").replace(/&para;/g,"\n");
        }
    });
})()

template.css = fs.readFileSync(path.join(__dirname,"./model/style.css"));


module.exports = function (book,callback){
    book.use(jsonAsync,function (book){
        var cmd = path.join(__dirname,"hhc.exe");
        var temp = path.join(__dirname,"temp");
        utils.mkdirsSync(temp);
        book.list.forEach(function (chapter){
            fs.writeFileSync(path.join(temp,chapter.id + ".html"),template.chapter(chapter));
        });
        fs.writeFileSync(path.join(temp,"index.html"),template.index(book));
        utils.mkdirsSync(path.join(temp,"css"));
        fs.writeFileSync(path.join(temp,"css/style.css"),template.css);
        utils.mkdirsSync(path.join(temp,"images"));
        fs.writeFileSync(path.join(temp,"images/cover.jpg"),book.meta.cover,"base64");
        fs.writeFileSync(path.join(temp,"book.hhk"),iconv.encode(template.hhk(book),'gbk'));
        fs.writeFileSync(path.join(temp,"book.hhc"),iconv.encode(template.hhc(book),'gbk'));
        fs.writeFileSync(path.join(temp,"book.hhp"),iconv.encode(template.hhp(book),'gbk'));
        child_process.spawnSync(cmd, [path.join(temp,"book.hhp")]);
        fs.readFile(path.join(temp,"temp.chm"),function(e,data){
            callback(data);
            utils.rmdirs(temp);
        });
    });
};
