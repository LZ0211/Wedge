const cheerio = require('./cheerio');
const URL = require('url');
const Sites = require("./Sites");
const Tools = require("./tools");
const globalFilter = require("./globalFilter");
const decoder = require("./decoder");

function each(object,fn){
    for (var k in object){
        fn.call(object,k,object[k],object);
    }
}

function map(object,fn){
    var oo = {};
    for (var k in object){
        oo[k] = fn.call(object,k,object[k],object);
    }
    return oo;
}

function filter(object,fn){
    var oo = {};
    for (var k in object){
        if (fn.call(object,k,object[k],object)){
            oo[k] = object[k];
        }
    }
    return oo;
}

function parse($,rule){
    function apply(k,v){
        if (typeof v == "function"){
            var result = null
            try{
                result = v($);
            }catch (e){
                console.log($.location());
            }
            return result;
        }else {
            return map(v,arguments.callee)
        }
    }

    function isFull(k,v){
        return true;
        //return v.footer;
    }

    function isMatch(k,v){
        //return true;
        return v.match;
    }

    function True(k,v){
        return true;
    }

    var parsed = map(rule,apply)
    //console.log(parsed)

    return filter(filter(parsed,isFull),isMatch);
}

function replace(data,selector){
    if (!selector) return data;
    if (typeof selector !== "object") return data;
    return map(data,function (k,v){
        if (v && typeof v == "object"){
            return replace(v,selector[k])
        }
        return Tools.replacer(v).replace(selector[k]);
    });
}

function Parse(doc,path){
    var site = Sites.search(path);
    if (Buffer.isBuffer(doc)){
        if (!site.charset){
            var temp = doc.toString();
            if (temp.match(/<meta.*?charset.*gbk/i)){
                doc = decoder.decode(doc,'gbk');
            }else if (temp.match(/<meta.*?charset.*gb2312/i)){
                doc = decoder.decode(doc,'gb2312');
            }else if (temp.match(/<meta.*?charset.*big5/i)){
                doc = decoder.decode(doc,'big5');
            }else {
                doc = temp;
            }
        }else {
            doc = decoder.decode(doc,site.charset);
        }
    }
    if (typeof doc === "object"){
        doc = JSON.stringify(doc);
    }
    //全局HTML替换
    //console.log(doc)
    /*doc = doc.replace(/&#(x)?([^&]{1,5});?/g,function($, $1, $2){
        return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
    });*/
    //doc = Tools.replacer(doc).replace(globalFilter.replace);
    //console.log(doc)
    //解析HTML
    var $ = cheerio.load(doc,{decodeEntities: false});
    $.raw = doc;
    //绑定地址
    $.location = function (href){
        if (arguments.length == 0) return path;
        if (!href)return '';
        return URL.resolve(path,href);
    };
    
    var parser = {};
    parser.$ = $;
    parser.globalReplace = function (str){
        return Tools.replacer(str).replace(globalFilter.replace);
    };
    parser.globalReplaceAll = function (str){
        return Tools.replacer(str).replace(globalFilter.replaceAll);
    };
    parser.getHrefLinks = function (){
        return $("a").map(function (i,v){
            var $$ = $(v);
            return {
                href:$.location($$.attr("href")),
                text:$$.text(),
                index:i
            }
        }).toArray();
    };
    parser.getImageLinks = function (){
        return $("img").map(function (i,v){
            var $$ = $(v);
            return {
                href:$.location($$.attr("src")),
                text:$$.text(),
                index:i
            }
        }).toArray();
    };
    parser.getParsedData = function (){
        var data = parse($,site.selector);
        return replace(data,site.replacer);
    };
    parser.select = function (selector){
        return Parse($(selector).html(),path);
    };
    parser.convertImageLink = function (){
        $("img").each(function (i,v){
            $(v).replaceWith("{%img=" + i + "%}");
        });
    };
    parser.convertHrefLink = function (){
        $("a").each(function (i,v){
            $(v).replaceWith("{%link=" + i + "%}");
        });
    };
    parser.convertLink = function (){
        parser.convertHrefLink();
        parser.convertImageLink();
    };
    parser.getChapterContent = function (){
        var chapter = parser.getParsedData().contentPage;
        if (!chapter) return null;
        var chapter = chapter.chapterInfos;
        if (!chapter) return null;
        var content = chapter.content;
        var $ = cheerio.load(content,{decodeEntities: false});
        $.location = function (href){
            if (!href)return path;
            return URL.resolve(path,href);
        };
        var imgs = $("img").map(function (i,v){
            var $$ = $(v);
            return {
                href:$.location($$.attr("src")),
                text:$$.text(),
                index:i
            }
        }).toArray();
        var links = $("a").map(function (i,v){
            var $$ = $(v);
            return {
                href:$.location($$.attr("href")),
                text:$$.text(),
                index:i
            }
        }).toArray();
        $("img").each(function (i,v){
            $(v).replaceWith("{%img=" + i + "%}");
        });
        $("a").each(function (i,v){
            $(v).replaceWith("{%link=" + i + "%}");
        });
        content = $.html();
        content = parser.globalReplace(content);
        content = parser.globalReplaceAll(content);
        imgs.forEach(function (img,i){
            content = content.replace("{%img=" + i + "%}",'<img src="'+img.href+'">');
        });
        links.forEach(function (link,i){
            content = content.replace("{%link=" + i + "%}",'<a href="'+link.href+'">'+link.text+'</a>');
        });
        chapter.content = content;
        return chapter;
    };
    parser.Tools = Tools;
    return parser;
}
module.exports = Parse;
module.exports.Sites = Sites;