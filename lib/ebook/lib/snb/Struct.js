function Int2Array(int){
    int = parseInt(int);
    if (int > 2147483647 || int < -2147483648){
        throw Error("input number is above intager limmit");
    }
    var buffer = [0,0,0,0];
    if (int > 0){
        buffer[0] = Math.floor(int/16777216);
        int -= buffer[0] * 16777216;
        buffer[1] = Math.floor(int/65536);
        int -= buffer[1] * 65536;
        buffer[2] = Math.floor(int/256);
        int -= buffer[2] * 256;
        buffer[3] = Math.floor(int/1);
        this.buffer = new Buffer(buffer);
        this.length = 4;
    }else if (int == -2147483648){
        buffer=[128,0,0,0]
    }
    else if (int < 0){
        buffer = Int2Array(int*-1);
        buffer[0]=255-buffer[0];
        buffer[1]=255-buffer[1];
        buffer[2]=255-buffer[2];
        buffer[3]=256-buffer[3];
    }else {
        buffer = [0,0,0,0];
    }
    return buffer
}
function isBase64(str,index){
    index = index || 0;
    var l=str.length;
    if (str[l-1] !== "="){
        if (l%4 === 0){
            if (index >=0 && index <= 2){
                return [].every.call(str,function (v){
                    return v.match(/[0-9A-Za-z\/+]/)
                })
            }else {
                return false
            }
        }else {
            return false;
        }
    }else {
        index += 1;
        return isBase64(str.substring(0,l-1),index)
    }
}
var fs = require("fs");
var Struct = function(buffer){
    return this.init.apply(this,arguments);
};
Struct.prototype.init = function (buffer){
    if (typeof buffer === "undefined"){
        buffer = new Buffer([]);
    }
    if (buffer instanceof Struct){
        return buffer
    }
    if (typeof buffer === "number"){
        buffer = Int2Array(buffer);
    }
    if (buffer instanceof Buffer){
        this.buffer = buffer;
    }else {
        this.buffer = new Buffer(buffer);
    }
    this.site = 0;
    this.length = this.buffer.length;
}
Struct.prototype.seek = function (value){
    if (value >=0){
        this.site = Math.min(this.length,value);
    }else {
        this.site = Math.max(0,this.length + value);
    }
};
Struct.prototype.read = function (value){
    var start = this.site;
    if (value){
        this.seek(start + value);
        return new Struct(this.buffer.slice(start,this.site));
    }else {
        this.seek(this.length);
        return new Struct(this.buffer.slice(start));
    }
};
Struct.prototype.slice = function (from,to){
    return this.buffer.slice(from,to);
};
Struct.prototype.concat = function (array){
    var struct = new Struct(array);
    return new Struct(Buffer.concat([this.buffer,struct.buffer]))
};
Struct.prototype.append = function (array){
    var struct = new Struct(array);
    this.stream && this.write(struct);
    this.buffer = Buffer.concat([this.buffer,struct.buffer]);
    this.length += struct.length;
    return this
};
Struct.prototype.writeFile = function (filename,callback){
    fs.writeFile(filename,this.buffer,callback);
    return this
};
Struct.prototype.readFile = function (filename){
    this.init(fs.readFileSync(filename));
    return this
};
Struct.prototype.valueOf = function (tag){
    if (!tag){
        return this.buffer;
    }
    switch (tag){
        case "i":
            return this.buffer.readInt32BE();
            break;
        case "s":
            return this.toString();
            break;
    }
};
Struct.prototype.toString = function (tag){
    return this.buffer.toString(tag);
};
Struct.prototype.openStream = function (filename){
    this.stream = fs.createWriteStream(filename);
    this.write(this.buffer);
    return this;
};
Struct.prototype.write = function (buffer){
    this.stream.write(new Struct(buffer).buffer);
    return this;
};
Struct.prototype.end = function (buffer){
    this.stream.end();
    return this;
}

module.exports = Struct