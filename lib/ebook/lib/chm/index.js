var fs = require("fs"),
    path = require("path"),
    dot = require('../dot'),
    json = require('../json'),
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

var makedirsSync = function (dir){
    if (fs.existsSync(dir)){
        return
    }
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || makedirsSync(dirname);
    fs.mkdirSync(dir);
};

var cleardirsSync = function (root){
    if (!fs.existsSync(root)){
        return
    }
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            cleardirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
}

module.exports = function (book){
    var book = book.use(json);
    var cmd = path.join(__dirname,"hhc.exe");
    var temp = path.join(__dirname,"temp");
    makedirsSync(temp);
    book.list.forEach(function (chapter){
        fs.writeFileSync(path.join(temp,chapter.id + ".html"),template.chapter(chapter));
    });
    fs.writeFileSync(path.join(temp,"index.html"),template.index(book));
    makedirsSync(path.join(temp,"css"));
    fs.writeFileSync(path.join(temp,"css/style.css"),template.css);
    makedirsSync(path.join(temp,"images"));
    fs.writeFileSync(path.join(temp,"images/cover.jpg"),book.meta.cover,"base64");
    fs.writeFileSync(path.join(temp,"book.hhk"),iconv.encode(template.hhk(book),'gbk'));
    fs.writeFileSync(path.join(temp,"book.hhc"),iconv.encode(template.hhc(book),'gbk'));
    fs.writeFileSync(path.join(temp,"book.hhp"),iconv.encode(template.hhp(book),'gbk'));
    child_process.spawnSync(cmd, [path.join(temp,"book.hhp")]);
    return fs.readFileSync(path.join(temp,"temp.chm"));
};
