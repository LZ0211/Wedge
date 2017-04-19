const cheerio = require("./cheerio");
const decoder = require("./decoder");
const URL = require("url");

function decode(data,charset){
    if (typeof data == 'string') return data;
    if (Buffer.isBuffer(data)){
        if (charset) return decoder.decode(data,charset);
        var str = data.toString();
        if (str.match(/charset.{1,5}gb(k|2312)/i)){
            return decoder.decode(data,'gbk');
        }
        if (str.match(/charset.{1,5}big5/i)){
            return decoder.decode(data,'big5');
        }
        return str;
    }
    if (typeof data === "object") return data;
    return '';
}
module.exports = function(data,path,charset){
    data = decode(data,charset);
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
    return $;
}