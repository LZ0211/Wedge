var toSimple = require("./toSimple");
var mergeLine = require("./mergeLine");
var globalFilter = require("./globalFilter");

function toReStr(str) {
    return str.replace(/[()\[\]{}|+.,^$?\\*]/g, "\\$&");
}

var toString = Object.prototype.toString;
function isRegExp(value){
    return toString.call(value) === "[object RegExp]"
}

function isObject(value){
    return toString.call(value) === "[object Object]"
}

function isFunction(value){
    return toString.call(value) === "[object Function]"
}

function isString(value){
    return toString.call(value) === "[object String]"
}
function replace(value,selector){
    if (isFunction(selector)){
        value = selector(value);
        return value;
    }
    if (isString(selector)){
        try{
            var regexp = new RegExp(selector,"gi");
        }catch (e){
            var regexp = new RegExp(toReStr(selector),"gi");
        }
        return replace(value,regexp);
    }
    if (Array.isArray(selector)){
        selector.forEach(x=>{
            value = replace(value,x);
        });
        return value;
    }
    if (isRegExp(selector)){
        value = value.replace(selector,"");
        return value;
    }
    if (isObject(selector)){
        Object.keys(selector).forEach(function (k){
            try{
                var regexp = new RegExp(k,"gi");
            }catch (e){
                var regexp = new RegExp(toReStr(k),"gi");
            }
            value = value.replace(regexp,selector[k]);
        });
        return value;
    }
    return value;
};
module.exports = require("../Type").String(function (string){
    var str = "";
    while (str !== string){
        str = string;
        string = string.replace(/&amp;/g,"&");
    }
    string = string.replace(/&#(x)?([^&]{1,5});?/g,function($, $1, $2){
        return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
    });
    var table = [
        [/&lt;/g,"<"],
        [/&gt;/g,">"],
        [/<!--.*?-->/g,""],
        [/<div[^<>]*?>/g,"\n"],
        [/<p[^<>]*?>/g,"\n"],
        [/<br[^<>]*?>/g,"\n"],
        [/(<[^<>]*?>)/g,function($,$1){
            if ($1.match(/<a|<img|<\/a/))return $1;
            return "";
        }],
        [/&nbsp;/g," "],
        [/\u3000/g,"  "],
        [/\u0020/g," "],
        [/^\s+/g,""],
        [/\s+$/g,""],
        [/ {4,}/g,"\n"],
        [/[\r\n\t\f\v]+/g,"\n"]
    ];
    table.forEach(function (pair){
        string = string.replace(pair[0],pair[1]);
    });
    string = replace(string,globalFilter.replaceAll)

    string = string.split('').map(char=>toSimple[char] || char).join('');

    string = string.split("\n").map(function (line){
        table.forEach(function (pair){
            line = line.replace(pair[0],pair[1]);
        });
        return line;
    }).join("\n");

    return mergeLine.mergeLines(string);
});