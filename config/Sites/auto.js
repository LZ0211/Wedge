const { link } = require('fs');
const URL = require('url');

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
        "最新章节.*","《","》","全文阅读.*","TXT下载","作者.*","无弹窗","正文","章节目录",
        "【","】","\\[","\\]","全文在线阅读.*","全文在线.*","免费阅读.*","无弹窗广告.*",
        "无广告.*","无弹窗.*","全文","(\\s|-|_).{0,6}(小说|阅读|读书)网?","TXT下载.*"
    ]).trim();
}

function filterAuthor(str){
    return replace(str,[
        "\\t","\\r"," +$","[\\s\\S]*作.*?者(:|：)?","类.*?型(:|：)?.*","类.*?别(:|：)?.*",
        "分.*?类(:|：)?.*","更.*?新(:|：)?.*","全文阅读.*","字.*?数(:|：)?.*",
    ]).trim();
}

function unique(array){
    var hash = {};
    array.forEach(function (str){
        if(str){
            hash[str] = true;
        }
    });
    return Object.keys(hash);
}

function sortByLength(array){
    return array.sort(function (a,b){
        return a.length - b.length;
    });
}

function getTitle($){
    //检索元数据
    var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/book_name|title/i);
    }).map((i,v)=>filterTitle($(v).attr('content'))).toArray();
    if(metas.length) return sortByLength(metas)[0];
    //网页标题
    var title = $('title').text().trim();
    //所有的:header和link
    var headers = $(':header').map((i,v)=>$(v).text().trim()).toArray().map(filterTitle);
    if(headers.length === 0) return filterTitle(title);
    //删除重复项
    headers = unique(headers);
    //网页标题中是否出现相应关键词
    var titles = headers.filter(text=>~title.indexOf(text));
    //如果没有出现
    if(titles.length == 0){
        var logs = {};
        headers.forEach(x=>logs[x]=$.raw.split(x).length - 1);
        headers.sort((x,y)=>logs[y]-logs[x]);
        return headers[0];
    };
    //只有一项则直接返回
    titles = sortByLength(titles);
    if (titles.length == 1) return titles[0];
    //查找是否有对应的链接
    for (var i=0;i<titles.length;i++){
        var selector = 'a:contains('+ titles[i] +')';
        if ($(selector).length) return titles[i];
    }
    return titles[0];
}

function getAuthor($){
     //检索元数据
     var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/author/i);
    }).map((i,v)=>filterAuthor($(v).attr('content'))).toArray();
    if(metas.length) return sortByLength(metas)[0];
    //检索关键词
    var authors = $("*").filter(function (i,v){
        return $(v).text().match(/作.*?者(:|：)?/);
    }).filter(function (i,v){
        return !$(v).children().filter(function (k,v){
            return $(v).text().match(/作.*?者(:|：)?/);
        }).length;
    }).map((i,v)=>{
        var text = $(v).text().trim();
        if(text.length > 4) return text;
        return $(v).parent().text().trim();
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

function getCover($){
    //检索元数据
    var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/image|cover/i);
    }).map((i,v)=>$(v).attr('content')).toArray();
    if(metas.length) return $.location(metas[0]);
    //检索img元素
    var covers = $('img');
    if(covers.length === 0) return;
    if(covers.length === 1){
        cover = covers.eq(0);
        return $.location(cover.attr('src') || cover.attr('data-original'));
    }
    //过滤非本站的图片
    var location = $.location();
    var host = URL.parse(location).hostname;
    var filtred = covers.filter((i,v)=>{
        var src = $(v).attr('src') || $(v).attr('data-original');
        if(!src) return false;
        src = $.location(src);
        if(URL.parse(src).hostname !== host) return false;
        $(v).attr('src',src);
        return true;
    });
    if(filtred.length === 1) return filtred.eq(0).attr('src');
    if (filtred.length == 0){
        filtred = covers;
    }else{
        covers = filtred;
    }
    //查找书名
    var title = getTitle($);
    var filtred = filtred.filter((i,v)=>{
        var self = $(v);
        var deep = 0;
        while(deep < 2){
            var html = $.html(self)
            if(html.match(title)) return true;
            deep += 1;
            self = self.parent();
        }
    });
    if(filtred.length === 1) return filtred.eq(0).attr('src');
    if (filtred.length == 0){
        filtred = covers;
    }else{
        covers = filtred;
    }
    //查找关键词
    var keywords = /cover|fimg|fmimg|book|info|summary|xiaoshuo|intro|fm|fengmian/i;
    var filtred = filtred.filter((i,v)=>{
        var self = $(v);
        var deep = 0;
        while(deep < 2){
            var html = $.html(self)
            if(html.match(keywords)) return true;
            deep += 1;
            self = self.parent();
        }
        return false
    });
    if(filtred.length === 1) return filtred.eq(0).attr('src');
    if (filtred.length == 0){
        filtred = covers;
    }else{
        covers = filtred;
    }
    return filtred.first().attr('src');
}
var groups = {
    '上古先秦':/东周|西周|春秋战国|战国七雄|春秋五霸/g,
    '秦汉三国':/三国|西汉|东汉|汉朝|秦朝|蜀国|魏国|东吴|吴国|汉末|大秦|匈奴|曹魏|秦始皇|刘邦|吕后|项羽|韩信|/g,
    '两晋隋唐':/晚唐|盛唐|大唐|唐朝|前秦|南北朝|南朝|北朝/g,
    '五代十国':/后唐|后汉|北汉|南唐|五代十国/g,
    '两宋元明':/北宋|南宋|大明|宋朝|明朝|元朝|/g,
    '清史民国':/大清|清朝|晚清|/g,
    '架空历史':/架空/g,
    '外国历史':/欧洲/g,
    '东方玄幻':'',
    '异世大陆':'',
    '王朝争霸':'',
    '高武世界':'',
    '现代魔法':'',
    '剑与魔法':'',
    '史诗奇幻':'',
    '黑暗幻想':'',
    '历史神话':'',
    '另类幻想':'',
    '传统武侠':'',
    '武侠幻想':'',
    '国术无双':'',
    '古武未来':'',
    '武侠同人':'',
    '修真文明':'',
    '幻想修仙':'',
    '现代修真':'',
    '神话修真':'',
    '古典仙侠':'',
    '都市生活':'',
    '恩怨情仇':'',
    '异术超能':'',
    '青春校园':'',
    '娱乐明星':'',
    '商战职场':'',
    '电子竞技':'',
    '虚拟网游':'',
    '游戏异界':'',
    '游戏系统':'',
    '游戏主播':''
}
function getClasses($){
    //检索元数据
    var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/category|classes/i);
    }).map((i,v)=>$(v).attr('content')).toArray();
    if(metas.length) return sortByLength(metas)[0];
    return;
    var matched = {}
    for(var key in groups){
        var found = $.raw.match(groups[key]);
        if(found){
            matched[key] = found.length;
        }
    }
    var keys = Object.keys(matched);
    if(!keys.length) return;
    keys.sort((x,y)=>matched[y]-matched[x]);
    return keys[0]
}

function getBrief($){
    //检索元数据
    var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/og:description|intro/i);
    }).map((i,v)=>$(v).attr('content')).toArray();
    if(metas.length){
        var brief = metas[0];
        var title = getTitle($);
        var regexp = new RegExp("^《?"+toReStr(title)+"》?","gi");
        brief = brief.replace(regexp,"")
        return brief
    }
}

function getStatus($){
    //检索元数据
    var metas = $('meta').filter((i,v)=>{
        var name = ''+$(v).attr('property') + $(v).attr('name');
        return name.match(/status|latest_chapter_name/i);
    }).map((i,v)=>$(v).attr('content')).toArray();
    if(metas.length) return metas.join('');
}

function getList($){
    var allLinks = $('a');
    var marks = allLinks.map((i,v)=>{
        var $this = $(v);
        var sign = $this.parents().map((i,v)=>{
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
    marks.forEach(mark=>{
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
    if(maxNum < 40){
        var keys = Object.keys(hash)
        var reg = /list|volume|chapter/i;
        keys.filter(k=>k.match(reg))
        if(keys.length >= 1){
            keys.sort((a,b)=>a.search(reg)-b.search(reg))
            maxMark = keys[0]
        }
    }
    var list = allLinks.filter((i,v)=>$(v).attr('sign') == maxMark).map((i,v)=>{
        var href = $(v).attr('href') || '';
        var array = href.split('/');
        var id = array.pop() || array.pop();
        if(id == undefined){
            id = null;
        }
        else if(id.match(/\d+/)){
            var arr = id.split(/\D+/);
            id = arr.pop();
            while(id == ""){
                id = arr.pop()
            }
        }
        return {
            href:href,
            text:$(v).text().trim(),
            index:id
        }
    }).toArray().filter(x=>x.index).sort((a,b)=>{
        if (/^\d+$/.test(a.index) && /^\d+$/.test(a.index)) return a.index - b.index;
        return a.index > b.index ? 1 : -1;
    });
    var logs = {};
    var links = [];
    list.reverse().forEach(link=>{
        if (link.href in logs) return;
        links.unshift(link);
        logs[link.href] = true;
    });
    logs = {};
    links.forEach((link,index)=>{
        link.index = index;
        link.href = $.location(link.href);
        var arr = link.href.split('/');
        arr.pop() || arr.pop()
        var name = arr.join('/');
        logs[name] = (logs[name] || 0) + 1;
    });
    if(Object.keys(logs).length === 1) return links;
    var pathname = '',count=0;
    for(var k in logs){
        if(logs[k] > count){
            pathname = k;
            count = logs[k];
        }
    }
    if(count / links.length > 0.8){
        links = links.filter(link=>link.href.match(pathname));
    }
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

function getNextPage($){
    var links = $('a');
    var id = $.location().split("/").filter(x=>x).pop().split(".")[0].split('_')[0].split('-')[0]
    links = links.filter((i,v)=>{
        var link = $(v);
        if(link.text().trim() == "下一页"){
            var url = link.attr('href').split("/").filter(x=>x).pop().split(".")[0]
            if(url.indexOf(id) == 0) return true
        }
    });
    if(links.length > 0){
        return $.location($(links[0]).attr('href'))
    }
}

function getNextListPage($){
    var links = $('a');
    var id = $.location().replace(/index[^\/]*$/gi,'').split("/").filter(x=>x).pop()
    links = links.filter((i,v)=>{
        var link = $(v);
        if(link.text().trim() == "下一页"){
            var url = link.attr('href').replace(/index[^\/]*$/gi,'').split("/").filter(x=>x).pop()
            if(url.indexOf(id) == 0) return true
        }
    });
    if(links.length > 0){
        return $.location($(links[0]).attr('href'))
    }
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
                author: getAuthor,
                cover: getCover,
                classes: getClasses,
                isend: getStatus,
                brief: getBrief,
            }
        },
        indexPage: {
            match: returnTrue,
            infoPage: getLocation,
            footer: footer,
            bookIndexs: getList,
            nextPage: getNextListPage
        },
        contentPage: {
            match: returnTrue,
            footer: footer,
            chapterInfos: {
                source: getLocation,
                content: getContent,
                nextPage: getNextPage,
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
                "本站域名.*",
                "http:\\/\\/[\\w\\.\\/]*"
            ]
        }
    }
}