"use strict";
const Bin = require('../binary');


function compress(buf){
    var data = Buffer.from(buf),
        length = data.length,
        text = Bin([]),
        offset = 0,
        chunk,match,preamble;
    while(offset < length){
        if(offset > 10 && length-offset > 10){
            chunk = '';
            match = -1;
            preamble = data.slice(0,offset);
            for(var i=10;i>=3;i--){
                chunk = data.slice(offset,offset+i);
                match = preamble.indexOf(chunk);
                if(match >= 0 && (offset - match) <= 2047){
                    break;
                }
                match = -1;
            }
            var len = chunk.length;
            if(match >= 0 && len <= 10 && len >= 3){
                var dis = offset - match;
                var buf = Buffer.alloc(2);
                buf.writeUInt16BE(0x8000+((dis<<3)&0x3ff8) + len-3);
                //console.log(text.length)
                text.concat(buf);
                //console.log(offset,text.length-2,buf)
                offset += len;
                continue;
            }
        }
        var code = data[offset];
        offset += 1;
        if(offset+1 < length-1 && code == 0x20){
            var nextCode = data[offset];
            if(nextCode >= 0x40 && nextCode < 0x80){
                text.concat([nextCode ^ 0x80]);
                //console.log(offset,text.length-1,nextCode ^ 0x80,nextCode)
                offset += 1;
                continue;
            }
        }
        if( code == 0 || (code >= 9 && code < 0x80) ){
            text.concat([code]);
            //console.log(offset,text.length-1,code)
        }else{
            var seq = [code];
            for(var i=0;i<7;i++){
                code = data[offset+i];
                if((code >= 0x01 && code <= 0x08)||(code >= 0x80 && code <= 0xff)){
                    seq.push(code);
                }else{
                    break;
                }
            }
            text.concat([seq.length]);
            text.concat(seq);
            offset += seq.length -1;
        }
    }
    return text.rawBuffer;
}

function decompress(str){
    var data = Buffer.from(str),
        length = data.length,
        offset = 0,
        text = Bin([]),
        code,lzData,lzLength,lzOffset;
    while(offset < length){
        code = data[offset];
        offset += 1;
        if(code === 0){
            text.concat([code]);
        }else if(code <= 0x08){
            text.concat(data.slice(offset,offset+code));
            offset += code;
        }else if(code <= 0x7f){
            text.concat([code]);
        }else if(code <= 0xbf){
            offset += 1;
            if(offset > length) return text.rawBuffer;
            lzData = data.slice(offset-2,offset).readInt16BE();
            lzData &= 0x3fff;
            lzLength = (lzData & 0x0007) + 3;
            lzOffset = lzData >> 3;
            if(lzOffset < 1) return text.rawBuffer;
            var textLen = text.length;
            for(var i=0;i<lzLength;i++){
                var pos = textLen - lzOffset;
                if(pos < 0) return text.rawBuffer;
                text.concat(text.rawBuffer.slice(pos,pos+1));
                textLen += 1;
            }
        }else{
            text.concat(' ');
            text.concat([code ^ 0x80])
        }
    }
    return text.rawBuffer;
}

module.exports = {
    decompress:decompress,
    compress:compress
}