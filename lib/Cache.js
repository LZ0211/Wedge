var zlib = require("zlib");

function Cache(byteLimit){
    var maxSize = byteLimit;
    var hash = {};
    var usedSpace = 0;
    function toBuffer(data){
        if (typeof data == 'number'){
            var double = new Buffer(8);
            double.writeDoubleBE(data);
            return {
                type:'number',
                length:8,
                data:double,
                date:+new Date
            }
        }
        if (typeof data == 'boolean'){
            var boolean;
            if (data == true){
                boolean = new Buffer([0x01]);
            }else {
                boolean = new Buffer([0x00]);
            }
            return {
                type:'boolean',
                length:1,
                data:boolean,
                date:+new Date
            }
        }
        if (typeof data == 'string'){
            var string = new Buffer(data);
            var compress;
            if (string.length > 100){
                string = zlib.deflateSync(string);
                compress = true;
            }
            return {
                type:'string',
                length:string.length,
                data:string,
                compress:compress,
                date:+new Date
            }
        }
        if (typeof data == 'object'){
            if (Buffer.isBuffer(data)){
                var compress;
                if (data.length > 100){
                    data = zlib.deflateSync(data);
                    compress = true;
                }
                return {
                    type:'buffer',
                    length:data.length,
                    data:data,
                    compress:compress,
                    date:+new Date
                }
            }
            var object = new Buffer(JSON.stringify(data));
            return {
                type:'object',
                length:object.length,
                data:object,
                date:+new Date
            }
        }
    }
    function reduction(info){
        if (info.type == 'number'){
            return info.data.readDoubleBE();
        }
        if (info.type == 'boolean'){
            return info.data[0] == 0x01;
        }
        if (info.type == 'string'){
            return info.compress ? zlib.inflateSync(info.data).toString() : info.data.toString();
        }
        if (info.type == 'object'){
            return JSON.parse(info.data.toString());
        }
        if (info.type == 'buffer'){
            return info.compress ? zlib.inflateSync(info.data) : info.data;
        }
    }
    function del(label){
        if (label in hash){
            usedSpace -= hash[label].length;
            delete hash[label];
        }
    }
    function set(label,data){
        var info = toBuffer(data);
        if (info){
            del(label);
            usedSpace += info.length;
            hash[label] = info;
        }
        if (usedSpace > maxSize){
            var now = + new Date;
            var array = Object.keys(hash).map(x=>[x,hash[x]]).sort((x,y)=>x[1].date-y[1].date);
            do{
                del(array.shift()[0]);
            }
            while (usedSpace > maxSize);
            for (var label in hash){
                if (now - hash[label].date > 60000){
                    del(label);
                }
            }
        }
    }

    function get(label){
        if (label in hash){
            return reduction(hash[label]);
        }
    }

    return {
        set:set,
        get:get,
        expand:function (limit){
            maxSize += limit;
        },
        debug:function (){
            console.log(hash);
        }
    }
}

module.exports = Cache;