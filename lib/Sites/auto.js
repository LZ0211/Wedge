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

function replace(str,selector){
    if ("string" !== typeof str) return str;
    if (isFunction(selector)) return selector(str);
    if (isRegExp(selector)) return str.replace(selector,"");
    if (isString(selector)){
        try{
            var regexp = new RegExp(selector,"gi");
        }catch (e){
            var regexp = new RegExp(toReStr(selector),"gi");
        }
        return replace(str,regexp);
    }
    if (Array.isArray(selector)){
        selector.forEach(function (x){
            str = replace(str,x);
        });
        return str;
    }
    if (isObject(selector)){
        Object.keys(selector).forEach(function (k){
            try{
                var regexp = new RegExp(k,"gi");
            }catch (e){
                var regexp = new RegExp(toReStr(k),"gi");
            }
            str = str.replace(regexp,selector[k]);
        });
        return str;
    }
    return str;
}

function filterTitle(str){
    return replace(str,[
        "最新章节.*","《","》","全文阅读.*","TXT下载","作者.*","无弹窗","正文","章节目录","【","】","\\[","\\]"
    ]).trim();
}

function filterAuthor(str){
    return replace(str,[
        "\\t","\\r"," +$","[\\s\\S]*作.*?者(:|：)?","类.*?型(:|：)?.*","\\s+.*"
    ]).trim();
}

function unique(array){
    var hash = {};
    array.forEach(function (str){
        hash[str] = true;
    });
    return Object.keys(hash);
}

function sortByLength(array){
    return array.sort(function (a,b){
        return a.length - b.length;
    });
}
function getTitle($){
    var title = $('title').text().trim();
    var titles = $(':header').map(function (i,v){
        return $(v).text().trim();
    }).toArray().map(filterTitle).filter(text=>~title.indexOf(text));
    if (titles.length == 0){
        titles = $('a').map(function (i,v){
            return $(v).text().trim();
        }).toArray().map(filterTitle).filter(text=>~title.indexOf(text));
    }
    titles = unique(titles);
    titles = sortByLength(titles);
    if (titles.length == 1) return titles[0];
    for (var i=0;i<titles.length;i++){
        var selector = 'a:contains('+ titles[i] +')';
        if ($(selector).length) return titles[i];
    }
    return;
}

function getAuthor($){
    var authors = $("*").filter(function (i,v){
        return $(v).text().match(/作[\u3000,\u00A0,\u0020,\w&#;]*?者/);
    }).filter(function (i,v){
        return !$(v).children().filter(function (k,v){
            return $(v).text().match(/作[\u3000,\u00A0,\u0020,\w&#;]*?者/);
        }).length;
    }).map(function (i,v){
        return $(v).parent().text();
    }).toArray().map(filterAuthor).filter(x=>x);

    authors = unique(authors);
    var title = $('title').text().trim();
    for (var i=0;i<authors.length;i++){
        var author = authors[i];
        if (~title.indexOf(author)) return author;
    }
    var title = getTitle($);
    var strings = $('html').text().split(title);
    for (var j=0;j<strings.length;j++){
        var string = strings[j];
        for (var k=0;k<authors.length;k++){
            var author = authors[k];
            if (string.indexOf(author) < 50){
                return author;
            }
        }
    }
    return authors[0];
}

function getList($){
    var allLinks = $('a');
    var marks = allLinks.map(function (i,v){
        var $this = $(v);
        var sign = $this.parents().map(function (i,v){
            var mark = $(v)[0].name || '';
            var classes = $(v).attr('class');
            var id =  $(v).attr('id');
            if (classes) return mark + '.'+classes;
            if (id) return mark + '#'+id;
            return mark;
        }).toArray().join('-');
        $this.attr('sign',sign);
        return sign;
    }).toArray();
    var hash = {};
    marks.forEach(function (mark){
        if (mark in hash){
            hash[mark] += 1;
        }else {
             hash[mark] = 1;
        }
    });
    var maxNum = 0,maxMark;
    for (var x in hash){
        if (hash[x] > maxNum){
            maxNum = hash[x];
            maxMark = x;
        }
    }
    var list = allLinks.filter(function (i,v){
        return $(v).attr('sign') == maxMark;
    }).map(function (i,v){
        var href = $(v).attr('href') || '';
        var array = href.split('/');
        var id = array.pop() || array.pop();
        return {
            href:href,
            text:$(v).text().trim(),
            index:id.replace(/\..*/,'')
        }
    }).toArray().sort(function (a,b){
        if (/^\d+$/.test(a.index) && /^\d+$/.test(a.index)) return a.index - b.index;
        return a.index > b.index ? 1 : -1;
    });
    var logs = {};
    var links = [];
    list.reverse().forEach(function (link){
        if (link.href in logs) return;
        links.unshift(link);
        logs[link.href] = true;
    });
    links.forEach(function (link,index){
        link.index = index;
        link.href = $.location(link.href);
    });
    return links;
}

function getContent($){
    var dom = $('body');
    if (!dom.length) return '';
    var textLength = dom.text().length;
    var nextdom = dom.children();
    do{
        var lengths = nextdom.map(function (i,v){
            return $(v).text().length;
        }).toArray();
        var index = 0,length=0;
        for (var i=0;i<lengths.length;i++){
            if (lengths[i] > length){
                length = lengths[i];
                index = i;
            }
        }
        var largest = nextdom.eq(index);
        nextdom = largest.children();
        if (length / textLength < 0.5 || nextdom.length == 0){
            var found = largest.parent();
            found.find('script,a').remove();
            return found.html();
        }
        textLength = length;
    }
    while (nextdom.length);
}

function getIndexLink($){
}

function returnTrue($){
    return true;
}

function getLocation($){
    return $.location();
}

function footer($){
    var string = $.html();
    if (!string.match(/<html>/i)) return true;
    if (string.match(/<\/html>/i)) return true
    return false;
}

module.exports = {
    selector:{
        infoPage: {
            match: returnTrue,
            indexPage: getLocation,
            footer: footer,
            bookInfos: {
                title: getTitle,
                author: getAuthor
            }
        },
        indexPage: {
            match: returnTrue,
            infoPage: getLocation,
            footer: footer,
            bookIndexs: getList
        },
        contentPage: {
            match: returnTrue,
            footer: footer,
            chapterInfos: {
                source: getLocation,
                content: getContent
            }
        }
    },
    replacer:{
        contentPage:{
            chapterInfos : [
                "看最快更新",
                "一秒记住[^<>]*?免费阅读！",
                "找本站搜索[^<>]*?笔趣阁[^<>]*",
                "手机用户请浏览[^<>]*",
                "&nbsp;天才壹秒記住[^<>]*?為您提供精彩小說閱讀。",
                 "&nbsp;天才一秒记住[^<>]*?为您提供精彩小说阅读。",
                "[^<>]*最快更新!无广告!",
                "本书最新免费章节请访问。",
                "请使用访问本站。",
                "请记住本站的网址：。",
                "【本小说发自.*",
                "一下[^<>]*?第一时间免费阅读。",
                "手机用户请浏览阅读，更优质的阅读体验。",
                "热门推荐:[^<>]*",
                "看最快更新",
                "爱尚小说网.*?收藏并推荐给你的好友！",
                "2k小说阅读网",
                "\\[记住网址.*?三五中文网\\]",
                "本书.*?首发,请勿转载!",
                "新笔趣阁[ＷｗwW]+.*?[cCｃＣ][oOｏＯ][mMｍＭ]",
                "新笔趣阁",
                "[ＷｗwW]+.*?[cCｃＣ][oOｏＯ][mMｍＭ]",
                "请记住本书首发域.*",
                "注意：章节内容如有错误.*",
                "读精彩原创小说就到.*?免费小说网！网址：",
                "请记住本书首发域名.*",
                "本书最新免费章节请访问。",
                "请使用访问本站。",
                "请记住本站的网址：。",
                "热门小说推荐：",
                "[^<>]*最快更新!无广告!",
                "本书来自.*?网",
                "http:\\/\\/[\\w\\.\\/]*"
            ]
        }
    }
}