function Binary(buffer,opt){
    var buffer = Buffer.from(buffer,opt);
    var length = buffer.length;
    var object = {
        length:length,
        offset:0,
        rawBuffer:buffer,
        seek:function (value){
            if (value >= 0){
                object.offset = value;
            }else {
                object.offset = length + value;
            }
            return object;
        },
        fill:function (char){
            for (var i=0;i<length ; i++){
                buffer[i] = char;
            }
            return object;
        },
        read:function (bit){
            var offset = object.offset;
            var chunk = buffer.slice(offset,offset+bit);
            object.offset += bit;
            return chunk;
        },
        write:function (string){
            var offset = object.offset;
            var buff = Buffer.from(string);
            var length = buff.length;
            for (var index=0;index<length ;index++ ){
                buffer[offset+index] = buff[index];
            }
            object.offset += length;
            return object;
        },
        concat:function (otherBuffer){
            object.rawBuffer = buffer = Buffer.concat([buffer,otherBuffer]);
            object.length = length = buffer.length;
            return object;
        },
        readDoubleBE:function (){
            return object.read(8).readDoubleBE();
        },
        readDoubleLE:function (){
            return object.read(8).readDoubleLE();
        },
        readFloatBE:function (){
            return object.read(4).readFloatBE();
        },
        readFloatLE:function (){
            return object.read(4).readFloatLE();
        },
        readInt8:function (){
            return object.read(1).readInt8();
        },
        readInt16BE:function (){
            return object.read(2).readInt16BE();
        },
        readInt16LE:function (){
            return object.read(2).readInt16LE();
        },
        readInt32BE:function (){
            return object.read(4).readInt32BE();
        },
        readInt32LE:function (){
            return object.read(4).readInt32LE();
        },
        readUInt8:function (){
            return object.read(1).readUInt8();
        },
        readUInt16BE:function (){
            return object.read(2).readUInt16BE();
        },
        readUInt16LE:function (){
            return object.read(2).readUInt16LE();
        },
        readUInt32BE:function (){
            return object.read(4).readUInt32BE();
        },
        readUInt32LE:function (){
            return object.read(4).readUInt32LE();
        },
        writeDoubleBE:function (number){
            var buff = Buffer.alloc(8);
            buff.writeDoubleBE(number);
            object.write(buff);
            return object;
        },
        writeDoubleLE:function (number){
            var buff = Buffer.alloc(8);
            buff.writeDoubleLE(number);
            object.write(buff);
            return object;
        },
        writeFloatBE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeFloatBE(number);
            object.write(buff);
            return object;
        },
        writeFloatLE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeFloatLE(number);
            object.write(buff);
            return object;
        },
        writeInt8:function (number){
            var buff = Buffer.alloc(1);
            buff.writeInt8(number);
            object.write(buff);
            return object;
        },
        writeInt16BE:function (number){
            var buff = Buffer.alloc(2);
            buff.writeInt16BE(number);
            object.write(buff);
            return object;
        },
        writeInt16LE:function (number){
            var buff = Buffer.alloc(2);
            buff.writeInt16LE(number);
            object.write(buff);
            return object;
        },
        writeInt32BE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeInt32BE(number);
            object.write(buff);
            return object;
        },
        writeInt32LE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeInt32LE(number);
            object.write(buff);
            return object;
        },
        writeUInt8:function (number){
            var buff = Buffer.alloc(1);
            buff.writeUInt8(number);
            object.write(buff);
            return object;
        },
        writeUInt16BE:function (number){
            var buff = Buffer.alloc(2);
            buff.writeUInt16BE(number);
            object.write(buff);
            return object;
        },
        writeUInt16LE:function (number){
            var buff = Buffer.alloc(2);
            buff.writeUInt16LE(number);
            object.write(buff);
            return object;
        },
        writeUInt32BE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeUInt32BE(number);
            object.write(buff);
            return object;
        },
        writeUInt32LE:function (number){
            var buff = Buffer.alloc(4);
            buff.writeUInt32LE(number);
            object.write(buff);
            return object;
        }
    };

    return object;
}

module.exports = Binary;
