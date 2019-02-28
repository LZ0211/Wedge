var UINT_CACHE = {};
function fromBits(lowBits, highBits){
    return new Long(lowBits, highBits);
}
function fromInt(value) {
    var obj, cachedObj, cache;
    value >>>= 0;
    if (cache = (0 <= value && value < 256)) {
        cachedObj = UINT_CACHE[value];
        if (cachedObj)
            return cachedObj;
    }
    obj = fromBits(value, (value | 0) < 0 ? -1 : 0);
    if (cache)
        UINT_CACHE[value] = obj;
    return obj;
}
class Long{
    constructor(low, high){
        this.low = low | 0;
        this.high = high | 0;
    }
    toInt() {
        return this.low >>> 0;
    }
    add(addend) {
        addend = fromInt(addend);
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
    
        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;
    
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32);
    }
    multiply(multiplier) {
        multiplier = fromInt(multiplier);
    
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
    
        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;
    
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32);
    }
    and(other) {
        other = fromInt(other);
        return fromBits(this.low & other.low, this.high & other.high);
    }
    shiftRight(numBits) {
        return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits);
    }
}

function Byte(number){
    var buf = Buffer.alloc(4);
    buf.writeInt32LE(number);
    return buf.readUInt8();
}
class EBK3Crypt{
    constructor(key){
        this.holdrand = fromInt(key,1);
    }

    setKey(key){
        this.holdrand = fromInt(key,1);
    }

    pbk_data_n(){
        this.holdrand = this.holdrand.multiply(214013).add(2531011);
        return this.holdrand.shiftRight(16).and(32767).toInt()
    }

    encodeByte(b){
        var b2 = Byte(b & 224);
        var b3 = Byte(b & 28);
        var b4 = Byte(b & 3);
        var b5 = Byte(this.pbk_data_n());
        b = Byte(b4 << 6 | b3 << 1 | b2 >> 5);
        b = Byte(~b);
        return Byte(b ^ b5);
    }

    decodeByte(b){
        var b2 = Byte(this.pbk_data_n());
        b ^= b2;
        b = Byte(~b);
        var b3 = Byte(b & 192);
        var b4 = Byte(b & 56);
        var b5 = Byte(b & 7);
        return Byte(b5 << 5 | b4 >> 1 | b3 >> 6);
    }

    encodeUInt32(value){
        var buf = Buffer.alloc(4);
        buf.writeUInt32LE(value);
        for (var i = 0; i < 4; i++)
        {
            buf[i] = this.encodeByte(buf[i]);
        }
        return buf.readUInt32LE();
    }

    decodeUInt32(value){
        var buf = Buffer.alloc(4);
        buf.writeUInt32LE(value);
        for (var i = 0; i < 4; i++)
        {
            buf[i] = this.decodeByte(buf[i]);
        }
        return buf.readUInt32LE();
    }

    encodeUInt16(value){
        var buf = Buffer.alloc(2);
        buf.writeUInt16LE(value);
        for (var i = 0; i < 2; i++)
        {
            buf[i] = this.encodeByte(buf[i]);
        }
        return buf.readUInt16LE();
    }

    decodeUInt16(value){
        var buf = Buffer.alloc(2);
        buf.writeUInt16LE(value);
        for (var i = 0; i < 2; i++)
        {
            buf[i] = this.decodeByte(buf[i]);
        }
        return buf.readUInt16LE();
    }

    encodeData(data, offset, len){
        offset = offset || 0;
        len = len || data.length;
        for (var i = offset; i < offset + len; i++)
        {
            data[i] = this.encodeByte(data[i]);
        }
        return data;
    }

    decodeData(data, offset, len){
        offset = offset || 0;
        len = len || data.length;
        for (var i = offset; i < offset + len; i++)
        {
            data[i] = this.decodeByte(data[i]);
        }
        return data;
    }
}

module.exports = EBK3Crypt;