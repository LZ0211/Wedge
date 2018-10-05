"use strict";
const cheerio = require("cheerio");
const decoder = require("iconv-lite");
const URL = require("url");

function isUTF8(bytes){
    for(var i=0;i<bytes.length;i++){
        if(bytes[i] < 128){
            continue;
        }else if(bytes[i] < 224){
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
        }else if(bytes[i] < 240){
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
        }else if(bytes[i] < 248){
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
        }else if(bytes[i] < 252){
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
        }else if(bytes[i] < 254){
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
            i += 1;
            if(bytes[i]<128 || bytes[i]>191) return false;
        }
    }
    return true;
}

function decode(data,charset){
    if (typeof data == 'string') return data;
    if (Buffer.isBuffer(data)){
        if (charset) return decoder.decode(data,charset);
        var str = data.toString();
        if (str.match(/charset.{1,5}gb(k|2312)/i)){
            return decoder.decode(data,'gbk');
        }else if (str.match(/charset.{1,5}big5/i)){
            return decoder.decode(data,'big5');
        }else if(isUTF8(data)){
            return str;
        }
        return decoder.decode(data,'gbk');
    }
    if (typeof data === "object") return data;
    return '';
}
module.exports = function(data,path,charset){
    data = decode(data,charset);
    var raw = data;
    if (typeof data === "object"){
        return data;
    }
    data = data.replace(/&#(x)?([^&]{1,5});?/ig,function($, $1, $2){
        return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
    });
    var $ = cheerio.load(data,{decodeEntities: false});
    $.location = function (href){
        if (arguments.length == 0) return path;
        if (!href) return '';
        return URL.resolve(path,href);
    };
    $.raw = raw;
    $.between = function(start,end){
        return raw.split(start).pop().split(end).shift();
    }
    return $;
};