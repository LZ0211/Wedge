var zlib = require("zlib");

function Binary(buffer){
    this.offset = 0;
    this.buffer = buffer;
}

Binary.prototype.read = function (offset,len){
    if (!len){
        len = offset;
        offset = this.offset;
    }
    this.offset += len;
    return this.buffer.slice(offset,this.offset);
}

function Decode(buffer){
    var binary = new Binary(buffer);
    var Magic = binary.read(4).toString();
    if (Magic !== "NEBK"){
        throw new Error("FILE FORMATION ERROR");
    }
    var infos = ["title","author","cover","classes","brief","date","uuid"];
    var meta = {};
    infos.forEach(function (info){
        var length = binary.read(4).readInt32BE();
        var data = binary.read(length);
        if (info == "cover"){
            data = data.toString("base64");
        }else {
            data = data.toString();
        }
        meta[info] = data;
    });

    var length = binary.read(4).readInt32BE();
    var data = binary.read(length);
    data = zlib.inflateSync(data);
    var string = data.toString();
    var list = string.split("\n").map(x=>({title:x}));
    list.forEach(function (chapter){
        var len = binary.read(4).readInt32BE();
        var data = binary.read(len);
        var crc = binary.read(4).readInt32BE();
        var check = crc32(data) == crc;
        chapter.content = zlib.inflateSync(data).toString();
    });

    return {
        meta:meta,
        list:list
    }
}