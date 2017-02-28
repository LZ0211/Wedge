var path = require('path'),
    fs = require('fs'),
    dot = require("../dot"),
    jsonAsync = require("../json/async"),
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

/*function compareFileStream(file1, file2){
    if (file1.fileName >= file2.fileName){
        return 1
    }else {
        return -1
    }
}
var zlib = require("zlib"),
    utils = require("../utils"),
    child_process = require('child_process'),
    Struct = require('./Struct');
SnbFile.prototype.output = function(callback){
    var self = this;
    this.files.sort(compareFileStream);
    this.outputFile = new Struct();
    this.plainStream = new Struct();
    this.binStream = new Struct();
    this.writeHeader();
    this.writeVfat();
    var binBlockOffset = this.outputFile.length,
        plainBlockOffset = binBlockOffset + this.binStream.length,
        binBlockNumber = parseInt((this.binStream.length + 32768 - 1) / 32768),
        tailBlock = new Struct(),
        tailRec = new Struct();
    console.log("创建文件尾部信息...")
    this.files.forEach(function (file){
        var t = 0;
        if (file.isBinary()){
            t = 0;
        }else {
            t = binBlockNumber;
        }
        file.blockIndex = parseInt(file.contentOffset / 32768) + t;
        file.contentOffset = file.contentOffset % 32768;
        tailRec.append(file.blockIndex);
        tailRec.append(file.contentOffset);
    });
    for (var i=0;i<binBlockNumber;i++ ){
        tailBlock.append(binBlockOffset + i*32768);
    }
    console.log("写入二进制数据块...")
    this.outputFile.append(this.binStream);
    console.log("分割并压缩文本数据块...");
    var offset = 0;
    var cmd = path.join(__dirname,'bzip2.exe');
    var buffers = [];
    while (this.plainStream.site<this.plainStream.length){
        buffers.push(this.plainStream.read(32768).buffer);
    }
    utils.async.thread().parallel(buffers.map(function (buffer,index,array){
        return function (next){
            var child = child_process.spawn(cmd,['-zc']);
            child.stdout.once("data",function (data){
                array[index] = data;
                console.log(data)
                next();
            });
            child.stdin.write(buffer);
            child.stdin.end();
        }
    }),()=>{
        buffers.forEach((compressed)=>{
            this.outputFile.append(compressed);
            tailBlock.append(plainBlockOffset + offset);
            offset += compressed.length;
        });
        tailBlock.append(tailRec);
        var compressedTail = new Struct(zlib.deflateSync(tailBlock.buffer));
        compressedTail
            .append(compressedTail.length)
            .append(this.outputFile.length)
            .append(this.MAGIC);
        console.log("写入文件尾部信息...")
        this.outputFile.append(compressedTail);
        callback(this.outputFile.buffer);
    });
}*/

module.exports = function (book,callback){
    var subFile = new SnbFile;
    book.use(jsonAsync,function (book){
        subFile.appendBinary("snbc/images/cover.jpg",new Buffer(book.meta.cover,'base64'));
        subFile.appendPlain("snbc/intro.snbc",template.intro(book));
        book.list.forEach(function (chapter){
            subFile.appendPlain(template.snbcFile(chapter),template.snbc(chapter));
        });
        subFile.appendPlain("snbf/book.snbf",template.meta(book));
        subFile.appendPlain("snbf/toc.snbf",template.toc(book.list));
        callback(subFile.output());
    });
}

//console.log(dots.toc())