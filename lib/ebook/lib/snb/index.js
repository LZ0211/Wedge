var path = require('path'),
    fs = require('fs'),
    dot = require("../dot"),
    json = require("../json"),
    SnbFile = require("./SnbFile");

var template = {
    "intro":"./model/intro.dot",
    "meta":"./model/meta.dot",
    "snbc":"./model/snbc.dot",
    "toc":"./model/toc.dot"
};

(function(){
    for (var name in template){
        var file = template[name];
        template[name] = fs.readFileSync(path.join(__dirname,file)).toString();
    }
    Object.keys(template).forEach(function (name){
        var temp = dot.template(template[name]);
        template[name] = function (data){
            return temp(data).replace(/&nbsp;/g,"  ").replace(/&para;/g,"\n");
        }
    });
})()

template.snbcFile = dot.template("snbc/chapter_{{=it.id}}.snbc");

module.exports = function (book){
    var book = book.use(json);
    var subFile = new SnbFile;
    subFile.appendBinary("snbc/images/cover.jpg",new Buffer(book.meta.cover,'base64'));
    subFile.appendPlain("snbc/intro.snbc",template.intro(book));
    book.list.forEach(function (chapter){
        subFile.appendPlain(template.snbcFile(chapter),template.snbc(chapter));
    });
    subFile.appendPlain("snbf/book.snbf",template.meta(book));
    subFile.appendPlain("snbf/toc.snbf",template.toc(book.list));
    return subFile.output()
}

//console.log(dots.toc())