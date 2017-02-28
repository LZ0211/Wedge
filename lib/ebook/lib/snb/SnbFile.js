var zlib = require("zlib"),
    fs = require("fs"),
    path = require('path'),
    child_process = require('child_process'),
    bz2 = require("./bzip2"),
    Struct = require('./Struct');

var FileStream = function (){
};
FileStream.prototype.isBinary = function (){
    return this.attr !== 1090519040
};


function compareFileStream(file1, file2){
    if (file1.fileName >= file2.fileName){
        return 1
    }else {
        return -1
    }
}


var SnbFile = function (){
    this.MAGIC = [0x53,0x4E,0x42,0x50,0x30,0x30,0x30,0x42];
    this.REV80 = [0x00,0x00,0x80,0x00];
    this.REVA3 = [0x00,0xA3,0xA3,0xA3];
    this.REVZ1 = [0x00,0x00,0x00,0x00];
    this.REVZ2 = [0x00,0x00,0x00,0x00];
    this.init.apply(this,arguments);
};
SnbFile.prototype.init = function (inputFile){
    this.files = [];
    this.binBlocks = [];
    this.plainBlocks = [];
    if (inputFile){
        this.open(inputFile);
    }
};

SnbFile.prototype.open = function (inputFile){
    this.fileName = inputFile;
    snbFile = new Struct();
    snbFile.readFile(this.fileName);
    this.parse(snbFile);
};

SnbFile.prototype.parse = function (snbFile){
    var vmbr = snbFile.read(44);
    this.magic = vmbr.read(8).toString();
    this.rev80 = vmbr.read(4).valueOf("i");
    this.revA3 = vmbr.read(4).valueOf("i");
    this.revZ1 = vmbr.read(4).valueOf("i");
    this.fileCount = vmbr.read(4).valueOf("i");
    this.vfatSize = vmbr.read(4).valueOf("i");
    this.vfatCompressed = vmbr.read(4).valueOf("i");
    this.binStreamSize = vmbr.read(4).valueOf("i");
    this.plainStreamSizeUncompressed = vmbr.read(4).valueOf("i");
    this.revZ2 = vmbr.read(4).valueOf("i");
    this.vfat = new Struct(zlib.unzipSync(snbFile.read(this.vfatCompressed).buffer));
    this.parseFile(this.vfat, this.fileCount);
    this.binStreamOffset = snbFile.site;
    this.binStream = snbFile.read(this.binStreamSize);
    this.plainStreamOffset = snbFile.site;
    snbFile.seek(-16);
    var tailblock = snbFile.read();
    this.tailSize = tailblock.read(4).valueOf("i");
    this.tailOffset = tailblock.read(4).valueOf("i");
    this.tailMagic = tailblock.read().toString();
    //console.log(snbFile.length-this.tailOffset-16===this.tailSize);
    snbFile.seek(this.plainStreamOffset);
    this.plainStreamCompressed = snbFile.read(this.tailOffset-this.plainStreamOffset);
    this.vTailCompressed = snbFile.read(this.tailSize);
    this.vTailUncompressed = new Struct(zlib.inflateSync(this.vTailCompressed.buffer));
    this.tailSizeUncompressed = this.vTailUncompressed.length;
    this.parseTail(this.vTailUncompressed, this.fileCount);
    this.blocks.push(this.tailOffset);
    snbFile.seek(this.binStreamOffset);
    var i=0;
    for (;snbFile.site<this.plainStreamOffset;i++){
        this.binBlocks.push(snbFile.read(this.blocks[i+1]-this.blocks[i]))
    }
    for (;snbFile.site<this.tailOffset;i++){
        this.plainBlocks.push(snbFile.read(this.blocks[i+1]-this.blocks[i]))
    }
    //console.log(this.plainBlocks)
    var binPos = 0,uncompressedData = uncompressedData = new Struct(),self=this;
    this.plainBlocks.forEach(function (block){
        try{
            var chunk = [];
            bz2.simple(block.buffer,function (f){chunk.push(f)});
            block = new Struct(chunk);
            uncompressedData.append(block);
        }
        catch (e){
            console.log(e);
        }
    });
    //console.log(this.plainStreamSizeUncompressed===uncompressedData.length)
    //console.log(this.binStream.toString() == this.binBlocks[0].append(this.binBlocks[1]).toString())
    this.plainStreamUncompressed = uncompressedData;
    this.files.forEach(function (f,index){
        if (f.attr === 1090519040){
            f.fileBody = self.plainStreamUncompressed.read(f.fileSize);
        }else if (f.attr === 16777216){
            f.fileBody = self.binStream.read(f.fileSize);
        }else {
            console.log(f.attr);
            console.log(f.fileName);
            //throw new Error('Invalid file')
        }
    });
};

SnbFile.prototype.parseFile = function (vfat, fileCount){
    vfat.seek(fileCount * 12);
    var fileNames = vfat.read().toString().split('\x00');
    vfat.seek(0);
    for (var i=0;i<fileCount ;i++ ){
        var f = new FileStream();
        var buffer = vfat.read(12);
        f.attr = buffer.read(4).valueOf("i");
        f.fileNameOffset = buffer.read(4).valueOf("i");
        f.fileSize = buffer.read(4).valueOf("i");
        f.fileName = fileNames[i];
        this.files.push(f);
    }
};

SnbFile.prototype.parseTail = function (vtail, fileCount){
    this.binBlockNumber = parseInt((this.binStreamSize + 32768 - 1) / 32768);
    this.plainBlockNumber = parseInt((this.plainStreamSizeUncompressed + 32768 - 1) / 32768);
    this.blockNumber = this.binBlockNumber + this.plainBlockNumber;
    this.blocks= [];
    for (var i=0;i<this.blockNumber;i++ ){
        this.blocks.push(vtail.read(4).valueOf("i"));
    }
    for (var j=0;j<fileCount;j++){
        this.files[j].blockIndex = vtail.read(4).valueOf("i");
        this.files[j].contentOffset = vtail.read(4).valueOf("i");
    }
};

SnbFile.prototype.appendPlain = function(fileName, fileBody){
    var f = new FileStream();
    var data = new Struct(fileBody);
    f.attr = 1090519040;
    f.fileBody = data;
    f.fileSize = data.length;
    f.fileName = fileName.replace(/\\/g, '/');
    this.files.push(f);
};

SnbFile.prototype.appendBinary = function(fileName, fileBody){
    var f = new FileStream();
    var data = new Struct(fileBody);
    f.attr = 16777216;
    f.fileBody = data;
    f.fileSize = data.length;
    f.fileName = fileName.replace(/\\/g, '/');
    this.files.push(f);
};

SnbFile.prototype.append = function(fileName, fileBody){
    if (typeof fileBody === "string"){
        this.appendPlain(fileName, fileBody)
    }else {
        this.appendBinary(fileName, fileBody)
    }
};

SnbFile.prototype.getFileStream = function (fileName){
    for (var i=0;i<this.files.length ;i++ ){
        var file = this.files[i];
        if (file.fileName == fileName){
            return file.fileBody
        }
    }
};

SnbFile.prototype.isValid = function(){
    if (this.magic != new Struct(this.MAGIC).toString()){
        throw new Error("wrong snb magic")
    }else if(this.rev80 != new Struct(this.REV80).valueOf("i")){
        throw new Error("wrong snb rev80")
    }else if(this.revZ1 != new Struct(this.REVZ1).valueOf("i")){
        throw new Error("wrong snb revZ1")
    }else if(this.revZ2 != new Struct(this.REVZ2).valueOf("i")){
        throw new Error("wrong snb revZ2")
    }else if(this.vfatSize != this.vfat.length){
        throw new Error("wrong snb vfat")
    }else if(this.fileCount != this.files.length){
        throw new Error("wrong snb files")
    }else if(this.blockNumber * 4 + this.fileCount * 8 != this.tailSizeUncompressed){
        throw new Error("wrong snb tail")
    }else if(this.plainStreamSizeUncompressed != this.plainStreamUncompressed.length){
        throw new Error("wrong snb plainStream")
    }else if(this.binStreamSize != this.binStream.length){
        throw new Error("wrong snb binStream")
    }else {
        return true
    }
}

SnbFile.prototype.writeHeader = function (){
    this.outputFile
        .append(this.MAGIC)//0-8
        .append(this.REV80)//9-12
        .append(this.REVA3)//13-16
        .append(this.REVZ1)//17-20
        .append(this.files.length)//21-24
}

SnbFile.prototype.writeVfat = function (){
    var vfat = new Struct(),
        fileNameTable = new Struct();
    console.log("计算各文件偏移值...")
    this.files.forEach(function (file){
        file.fileNameOffset = fileNameTable.length;
        fileNameTable.append(file.fileName).append([0x00]);
        file.fileSize = file.fileBody.length;
        vfat.append(file.attr);
        vfat.append(file.fileNameOffset);
        vfat.append(file.fileSize);
        if (file.attr === 1090519040){
            file.contentOffset = this.plainStream.length;
            this.plainStream.append(file.fileBody);
        }else if (file.attr === 16777216){
            file.contentOffset = this.binStream.length;
            this.binStream.append(file.fileBody);
        }else {
            console.log(file.attr);
            console.log(file.fileName);
            throw new Error('Unknown file type');
        }
    }.bind(this));
    console.log("创建各文件索引...")
    vfat.append(fileNameTable);
    console.log("压缩文件索引...")
    var vfatCompressed = new Struct(zlib.deflateSync(vfat.buffer));
    console.log("写入文件索引...")
    this.outputFile
        .append(vfat.length)//25-28
        .append(vfatCompressed.length)//28-32
        .append(this.binStream.length)//33-36
        .append(this.plainStream.length)//36-40
        .append(this.REVZ2)//41-44
        .append(vfatCompressed);//4-44+vfatCompressed.length
}

SnbFile.prototype.output = function(){
    var self = this;
    this.files.sort(compareFileStream);
    this.outputFile = new Struct();
    this.plainStream = new Struct();
    this.binStream = new Struct();
    this.writeHeader();
    this.writeVfat()
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
    while (this.plainStream.site<this.plainStream.length){
        var buffer = this.plainStream.read(32768).buffer;
        var child = child_process.spawnSync(cmd,['-zc'],{input:buffer});
        var compressed = child.stdout;
        this.outputFile.append(compressed);
        tailBlock.append(plainBlockOffset + offset);
        offset += compressed.length;
    }
    tailBlock.append(tailRec);
    var compressedTail = new Struct(zlib.deflateSync(tailBlock.buffer));
    compressedTail
        .append(compressedTail.length)
        .append(self.outputFile.length)
        .append(self.MAGIC);
    console.log("写入文件尾部信息...")
    this.outputFile.append(compressedTail);
    return this.outputFile.buffer
}
module.exports = SnbFile;
