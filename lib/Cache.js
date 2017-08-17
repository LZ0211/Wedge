"use strict";
var zlib = require("zlib");

function Cache(byteLimit){
    var maxSize = byteLimit;
    var hash = {};
    var usedSpace = 0;
    function toBuffer(data){
        var double,boolean,string,compress;
        if (typeof data === 'number'){
            double = new Buffer(8);
            double.writeDoubleBE(data);
            return {
                type:'number',
                length:8,
                data:double,
                date:+new Date()
            };
        }
        if (typeof data === 'boolean'){
            if (data === true){
                boolean = new Buffer([0x01]);
            }else {
                boolean = new Buffer([0x00]);
            }
            return {
                type:'boolean',
                length:1,
                data:boolean,
                date:+new Date()
            };
        }
        if (typeof data === 'string'){
            string = new Buffer(data);
            compress = false;
            if (string.length > 100){
                string = zlib.deflateSync(string);
                compress = true;
            }
            return {
                type:'string',
                length:string.length,
                data:string,
                compress:compress,
                date:+new Date()
            };
        }
        if (typeof data === 'object'){
            if (Buffer.isBuffer(data)){
                compress = false;
                if (data.length > 100){
                    data = zlib.deflateSync(data);
                    compress = true;
                }
                return {
                    type:'buffer',
                    length:data.length,
                    data:data,
                    compress:compress,
                    date:+new Date()
                };
            }
            var object = new Buffer(JSON.stringify(data));
            return {
                type:'object',
                length:object.length,
                data:object,
                date:+new Date()
            };
        }
    }
    function reduction(info){
        if (info.type === 'number'){
            return info.data.readDoubleBE();
        }
        if (info.type === 'boolean'){
            return info.data[0] === 0x01;
        }
        if (info.type === 'string'){
            return info.compress ? zlib.inflateSync(info.data).toString() : info.data.toString();
        }
        if (info.type === 'object'){
            return JSON.parse(info.data.toString());
        }
        if (info.type === 'buffer'){
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
            var now = + new Date();
            var array = Object.keys(hash).map(x=>[x,hash[x]]).sort((x,y)=>x[1].date-y[1].date);
            do{
                del(array.shift()[0]);
            }
            while (usedSpace > maxSize);
            for (var name in hash){
                if (now - hash[name].date > 60000){
                    del(name);
                }
            }
        }
    }

    function get(label){
        if (label in hash){
            var info = hash[label];
            info.date = +new Date();
            return reduction(info);
        }
    }

    function empty(){
        usedSpace = 0;
        hash = {};
    }

    return {
        set:set,
        get:get,
        empty:empty,
        expand:function (limit){
            maxSize += limit;
        },
        debug:function (){
            console.log(hash);
        }
    };
}

module.exports = Cache;