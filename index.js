"use strict"
const fs = require("fs");
const Path = require("path");
const URL = require("url");
const querystring = require("querystring");
const EventEmitter = require('events');
const child_process = require('child_process');
const readline = require('readline');
const Random = require('./lib/JSrandom');
const Log = require("./lib/Log");
const Hash = require("./lib/Hash");
const DataBase = require("./lib/DataBase");
const request = require("./lib/request");
const util = require("./lib/util");
const Thread = require("./lib/Thread");
const Cache = require("./lib/Cache");
const setting = require("./setting");
const Searcher = require("./searcher");
const decoder = require("./lib/decoder");
const Sites = require("./lib/Sites");
const Parser = require("./lib/Parser");
const Book = require("./lib/Book");
const classes = require("./lib/classes");

class Wedge extends EventEmitter{
    constructor(dir){
        super();
        this.config = new Hash(setting);
        this.chdir(dir);
        this.init();
        this.plugins();
    }

    chdir(dir){
        dir = dir || "./";
        this.dir = Path.resolve(dir);
        fs.mkdirsSync(this.dir);
        process.chdir(this.dir);
        this.config.file("setting.json");
        this.database.close();
        this.database.file(Path.join(this.dir,"metadatas.json"));
        this.database.unique(this.config.get("database.primary"));
        return this;
    }

    init(){
        this.label = Random.uuid(10,16);
        this.book = new Book();
        this.bookdir = null;
        this.Log();
        return this;
    }

    plugins(){
        var install = plugin=>require(plugin.func).call(this);
        this.config.get("plugins").filter(plugin=>plugin.activated).forEach(install);
        return this;
    }

    Log(){
        if (this.log) return this.log;
        var appLog = this.config.get('app.log');
        if(appLog == false) {
            this.log = this.noop;
            return;
        }
        if(appLog === true){
            this.log = console.log;
            return;
        }
        this.log = new Log(String(appLog));
    }

    spawn(){
        var setting = this.config.valueOf();
        function Fork(){
            EventEmitter.call(this);
            this.config = new Hash();
            this.config.set(setting);
            this.book = new Book();
            this.bookdir = null;
            this.label = Random.uuid(10,16);
        }
        Fork.prototype=this;
        return new Fork();
    }

    prompt(docs,fn){
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        var args = [];
        var len = Math.max(docs.length,fn.length);
        var ref = 0;
        if (len == 0)return fn.apply(this,args);
        var listener=()=>{
            rl.question(docs[ref],input=>{
                args.push(input);
                ref += 1;
                if(ref === len){
                    rl.close();
                    return fn.apply(this,args);
                }else{
                    return listener();
                }
            });
        }
        listener();
        return this;
    }

    end(){
        var fn = arguments[0];
        if (undefined == fn){
            this.log("end...");
            this.emit("end");
        }
        if (typeof fn === "function"){
            this.once("end",fn);
        }
        return this;
    }

    error(msg){
        //this.emit('error',new Error(msg));
        this.log(new Error(msg));
        return this.end();
    }

    next(fn){
        if (typeof fn !== "function"){
            return ()=>this.end();
        }
        return fn;
    }

    debug(){
        this.config.get('app.debug') && this.log.apply(this,arguments);
        return this;
    }

    request(url,options){
        if ( typeof url == "object" ) {
            options = url;
            url = undefined;
        }
        options = options || {};
        options.url = url || options.url || options.href || options.src;
        options.method = options.method || options.type || "GET";
        options.timeout = this.config.get('request.timeout') || 15000;
        options.reconnect = this.config.get('request.reconnect') || 3;
        options.proxy = this.config.get('request.proxy');
        options.proxyAuth = this.config.get('request.proxyAuth');
        options.success = options.success || this.noop,
        options.error = options.error || this.noop;

        if (options.method == "GET"){
            var data = this.cache.get(options.url);
            if (data) return options.success(data);
        }

        var req = new request.Request(options.url, options.method);
        options.timeout && req.timeout(options.timeout);
        options.reconnect && req.reconnect(options.reconnect);
        options.proxy && req.proxy(options.proxy);
        options.proxyAuth && req.proxyAuth(options.proxyAuth);
        options.dataType && req.accept(options.dataType);
        options.data && options.method === "POST" && req.send(options.data);
        options.contentType && req.type(options.contentType);
        options.headers && req.setHeader(options.headers);

        var connectTimes = 0;
        var maxConnectTimes = options.reconnect;

        req.end((err,res,data)=>{
            connectTimes += 1;
            if (res && /^20.$/.test(res.statusCode) && data){
                if (options.method == "GET"){
                    this.cache.set(options.url,data);
                }
                return options.success(data);
            }
            if (err){
                if (connectTimes < maxConnectTimes) return req.end();
                return options.error(err.code);
            }
            return options.error(res.statusCode);
        });
    }

    pipeLine(line){
        var compile = name=>{
            name = name.trim();
            var protoFun = this[name];
            if (!protoFun) return this.error('no Function named '+name);
            var argsLength = protoFun.length;
            var define = [];
            if (argsLength){
                var define = Random.sample('abcdefghijklmnopqrstuvwxyz',argsLength);
            }
            define.push('this.'+name+'('+define.join(',')+')');
            return Function.apply(null,define).bind(this);
        }
        return line.split(' > ').map(compile);
    }

    CMD(line,funArr,args){
        var func = Thread.series(this.pipeLine(line).concat(funArr||[]));
        if (!args) return func;
        return func.call(this,args);
    }

    fuzzysearchBook(title,fn){
        fn = this.next(fn);
        var links = [];
        var push = link=>links.push(link);
        var endSearch = ()=>fn(links);
        var search = (site,next)=>{
            if (!site || !site.url) return next();
            var url = site.url.replace('%title%',util.encodeURI(title,site.charset));
            var method = (site.method || "GET").toUpperCase();
            var data = site.data && site.data.replace('%title%',site.charset ? util.encodeURI(title,site.charset) : title);
            var resolve = data=>{
                if(site.parse && typeof data == 'object'){
                    var parser = new Function('json','try{return (' + site.parse + ')}catch(e){return []}');
                    parser(data).forEach(push);
                }else {
                    var $ = Parser(data,url);
                    $(':header a').filter((i,v)=>~$(v).text().indexOf(title))
                    .each((i,v)=>links.push([
                        $.location($(v).attr('href')),
                        $(v).text().trim()
                    ]));
                }
                return next();
            }
            this.request({
                url:url,
                method:method,
                data:data,
                success:resolve,
                error:next
            });
        }
        new Thread()
        .use(search)
        .queue(Searcher)
        .setThread(3)
        .end(endSearch)
        .log(this.log)
        .label('fuzzysearchBook')
        .start();
        return this;
    }

    searchBook(title,fn){
        fn = this.next(fn);
        title = title.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
        var filterFun = links=>fn(links.filter(link=>link[1] == title));
        this.fuzzysearchBook(title,filterFun);
        return this;
    }

    loadBook(dir,fn){
        fn = this.next(fn);
        if (!fs.existsSync(dir)) return this.end();
        this.CMD('loadBookIndex > checkBookIndex',[fn])(dir);
        return this;
    }

    loadBookIndex(dir,fn){
        fn = this.next(fn);
        if ('string' !== typeof dir) return this.end();
        this.bookdir = Path.resolve(dir);
        if (this.config.get('book.sync')){
            this.book.loadIndexSync(dir);
            fn();
            return this;
        }
        this.book.loadIndex(dir,fn);
        return this;
    }

    checkBookIndex(fn){
        fn = this.next(fn);
        if (!this.book.location()) return this;
        if (!this.config.get('book.localization')) return fn();
        if (!this.config.get('book.check')) return fn();
        if (this.config.get('book.sync')){
            this.book.checkIndexSync();
            fn();
            return this;
        }
        this.book.checkIndex(fn);
        return this;
    }

    getParsedData(data,url){
        var site = Sites.search(url);
        var $ = Parser(data,url,site.charset);
        var filter = util.object.filter;
        var map = util.object.map;
        var rule = filter(site.selector,(k,v)=>v.match($) && v.footer($));
        var apply = (k,v)=>(util.is.isFunction(v) ? v($) : map(v,apply));
        var replace = (data,rule)=>map(data,(k,v)=>{
            if(!rule[k]) return v;
            if(util.is.isObject(v)){
                if(util.is.isObject(rule[k])) return replace(v,rule[k]);
                return v;
            }
            return util.replace(v,rule[k])
        });
        return replace(map(rule,apply),site.replacer);
    }

    getBookMeta(url,fn){
        fn = this.next(fn);
        if(typeof url == 'string'){
            if (!url || !url.match('http')) return this.error("Invalid URL ...");
            var links = url.split('|').filter(x=>x).map(link=>{
                try{return JSON.parse(link)}catch (e){return link}
            }).map(util.formatLink);
        }else if(Array.isArray(url)){
            var links = url.map(util.formatLink);
        }else{
            return this.error("Invalid URL ...");
        }
        this.debug('getBookMeta');
        var link = links[0];
        var times = parseInt(this.config.get('app.retry.meta'));
        times = isNaN(times) ? 3 : times;
        link.success = data=>{
            var parsedData = this.getParsedData(data,link.url);
            var infoPage = parsedData.infoPage;
            var indexPage = parsedData.indexPage;
            var redirectPage = parsedData.redirectPage;
            if (!infoPage){
                if (!indexPage){
                    if (!redirectPage){
                        this.debug(data.toString());
                        return this.error("this url is Not infoPage or request failed");
                    }
                    this.debug('redirect...');
                    url = redirectPage.infoPage || redirectPage.indexPage;
                    return this.getBookMeta(url,fn);
                }else {
                    this.debug('switch to infoPage...');
                    url = indexPage.infoPage;
                    return this.getBookMeta(url,fn);
                }
            }else {
                this.book.setMeta(infoPage.bookInfos);
                this.book.setMeta('source',links.length > 1 ? links : infoPage.indexPage);
                this.book.setMeta('origin',link);
                return fn();
            }
        };
        link.error = ()=>{
            if (--times <= 0) return this.end();
            this.request(link);
        }
        this.request(link);
        return this;
    }

    updateBookMeta(fn){
        fn = this.next(fn);
        if (!this.config.get('book.searchmeta')) return fn();
        var title = this.book.getMeta("title");
        var source = this.book.getMeta("source");
        var author = this.book.getMeta("author");
        var uuid = this.book.getMeta('uuid');
        if(this.database.query('uuid='+uuid).length) return fn();
        if(!title) return this.end();
        var except = new RegExp(Searcher.map(x=>x.name.replace(/\./g,'\\.')).join('|'),'gi');
        if(source.match(except)) return fn();
        this.debug('searchBookMeta');
        function like(s1,s2){
            var reFilter = /[:：？\?,；，,\.。!！_—\-]/g;
            s1 = s1.replace(reFilter,'');
            s2 = s2.replace(reFilter,'');
            if (~s1.indexOf(s2)) return true;
            if (~s2.indexOf(s1)) return true;
            return false;
        }
        this.searchBook(title,links=>{
            new Thread()
            .use((link,nextFn)=>{
                var app = this.spawn();
                app.getBookMeta(link,()=>{
                    var meta = app.book.metaValue();
                    for (var x in meta){
                        if (meta[x] === '') return nextFn();
                    }
                    if (!like(meta.title,title)) return nextFn();
                    if (!like(meta.author,author)) return nextFn();
                    this.log(meta.source)
                    delete meta.source;
                    this.book.setMeta(meta);
                    return fn();
                }).end(nextFn);
            })
            .end(fn)
            .log(this.log)
            .label('fuzzysearchBook')
            .queue(links.map(link=>link[0]))
            .start();
        });
        return this;
    }

    getBookCover(fn){
        fn = this.next(fn);
        var coverSrc = this.book.getMeta("cover");
        if (!/^http/i.test(coverSrc)) return fn();
        this.debug('getBookCover');
        var times = parseInt(this.config.get('app.retry.cover'));
        times = isNaN(times) ? 3 : times;
        var link = util.formatLink(coverSrc);
        link.contentType = 'image';
        link.success = data=>{
            this.book.setMeta("cover",data);
            fs.writeFile(Path.join(this.bookdir,"cover.jpg"),data,fn);
        }
        link.error = ()=>{
            if (--times <= 0) return fn();
            this.request(link);
        }
        this.request(link);
        return this;
    }

    checkBookCover(fn){
        this.debug('checkBookCover');
        fn = this.next(fn);
        if (!this.bookdir) return this.end();
        var coverSrc = this.book.getMeta("cover");
        var coverDir = Path.join(this.bookdir,"cover.jpg");
        fs.exists(coverDir,(exist)=>{
            if (exist){
                fs.readFile(coverDir,(err,data)=>{
                    this.book.setMeta("cover",data);
                    return fn();
                });
            }else {
                if(!coverSrc) return fn();
                if (/^http/i.test(coverSrc)) return this.getBookCover(fn);
                fs.writeFile(coverDir,this.book.Meta.cover.toBuffer(),fn);
            }
        });
        return this;
    }

    createBook(fn){
        fn = this.next(fn);
        var uuid = this.book.getMeta('uuid');
        this.debug('createBook');
        this.bookdir = Path.resolve(uuid);
        fs.mkdirsSync(this.bookdir);
        var thisMeta = this.book.metaValue();
        this.loadBook(this.bookdir,()=>{
            var newURL = this.book.getMeta('source');
            if (thisMeta.source == newURL) return fn();
            if (!this.config.get("book.changesource")) return fn();
            this.debug('changesource');
            if (this.config.get("book.override")){
                this.debug('override');
                this.config.set('book.unique.id',false);
                this.end(()=>this.config.set('book.unique.id',true));
            }
            this.book.setMeta(thisMeta);
            return fn();
        });
        return this;
    }

    saveBook(fn){
        fn = this.next(fn);
        if (!this.bookdir) return this.end();
        this.book.setMeta("date",+new Date);
        this.book.localization(this.bookdir,fn);
        return this;
    }

    getBookIndex(link,fn){
        fn = this.next(fn);
        var times = parseInt(this.config.get('app.retry.index'));
        times = isNaN(times) ? 3 : times;
        link = util.formatLink(link);
        link.success = data=>{
            var parsedData = this.getParsedData(data,link.url);
            if (parsedData.indexPage && parsedData.indexPage.bookIndexs && Array.isArray(parsedData.indexPage.bookIndexs)) return fn(parsedData.indexPage.bookIndexs);
            return fn([]);
        }
        link.error = ()=>{
            if (--times <= 0) return fn([]);
            this.request(link);
        }
        this.request(link);
        return this;
    }

    getBookIndexs(fn){
        fn = this.next(fn);
        this.debug('getBookIndexs');
        var links = this.book.getMeta('source');
        links = links.split('|').filter(x=>x);
        links = links.map(link=>{
            try{
                return JSON.parse(link);
            }catch (e){
                return {url:link}
            }
        });
        var indexs = [];
        var push = item=>indexs.push(item);
        new Thread()
        .use((link,next)=>this.getBookIndex(link,items=>{
            items.forEach(push);
            return next();
        }))
        .end(()=>fn(this.filterBookIndex(indexs)))
        .queue(links)
        .log(this.log)
        .label('getBookIndexs')
        .setThread(this.config.get('thread.index'))
        .start();
        return this;
    }

    filterBookIndex(indexs){
        if (!Array.isArray(indexs)) return [];
        var Ids = this.book.hashBy('id');
        var Sources = this.book.hashBy('source');
        var Titles = this.book.hashBy('title');
        var startNum = Math.max.apply(Math,Object.keys(Ids).map(parseInt).filter(x=>!isNaN(x)).concat([0]));
        var SelfIds = {};
        var SelfSources = {};
        var SelfTitles = {};
        var newIndexs = [];
        indexs = indexs.map(util.formatLink);
        indexs = indexs.filter(index=>index.url && !~index.url.indexOf("#") && !~index.url.indexOf("javascript:"));
        indexs.forEach((item,index)=>item.id = classes.Id(item.id || index).val());
        indexs = indexs.filter(index=>!Sources[index.url]);
        var titleUnique = this.config.get('book.unique.title');
        var idUnique = this.config.get('book.unique.id');
        if (idUnique){
            indexs = indexs.filter(index=>!Ids[index.id]);
        }
        if (titleUnique){
            indexs = indexs.filter(index=>!Titles[index.text]);
        }
        indexs.forEach(index=>{
            if (index.url in SelfSources) return;
            if (index.id in SelfIds && idUnique) return;
            if (index.text in SelfTitles && titleUnique) return;
            SelfIds[index.id] = true;
            SelfSources[index.url] = true;
            SelfTitles[index.text] = true;
            newIndexs.push(index);
        });
        return newIndexs;
    }

    getChapterContent(link,fn){
        fn = this.next(fn);
        this.debug('getChapterContent');
        var times = parseInt(this.config.get('app.retry.chapter'));
        times = isNaN(times) ? 3 : times;
        link.success = data=>{
            var parsedData = this.getParsedData(data,link.url);
            var chapter = parsedData.contentPage && parsedData.contentPage.chapterInfos;
            if (!chapter) return fn(null);
            chapter.deep = link.deep || 0;
            chapter.id = chapter.id || link.id;
            chapter.source = chapter.source || link.url;
            chapter.title = chapter.title || link.text;
            chapter.content = chapter.content || "";
            return fn(chapter)
        }
        link.error = ()=>{
            if (--times <= 0) return fn([]);
            this.request(link);
        }
        this.request(link);
        return this;
    }

    mergeChapterContent(chapter,fn){
        fn = this.next(fn);
        if (!chapter) return fn(null);
        if (chapter.ajax){
            this.debug('ajax...');
            var options = chapter.ajax;
            var resolve = options.success;
            var times = parseInt(this.config.get('app.retry.chapter'));
            times = isNaN(times) ? 3 : times;
            options.success = data=>{
                data = resolve(data);
                if(typeof data == 'object'){
                    chapter.ajax = data;
                    return this.mergeChapterContent(chapter,fn);
                }
                if (chapter.content){
                    chapter.content += "\n";
                }
                chapter.content += data;
                return fn(chapter);
            }
            options.error = ()=>{
                if (--times <= 0) return fn(null);
                this.request(options);
            };
            options.headers = options.headers || {};
            options.headers["X-Requested-With"] = "XMLHttpRequest";
            return this.request(options);
        }
        var mergeContentCMD = [
            this.getChapterContent.bind(this),
            this.mergeChapterContent.bind(this),
            (nextChapter,next)=>{
                if(!nextChapter) return fn(null);
                if (nextChapter.id !== chapter.id){
                    Thread.series([
                        this.getChapterImages.bind(this),
                        this.saveChapter.bind(this),
                        ()=>next(chapter)
                    ])(nextChapter);
                }
                if (chapter.content && chapter.content == nextChapter.content) return fn(chapter);
                if (chapter && chapter.content && nextChapter.content){
                    chapter.content += "\n";
                }
                chapter.content += nextChapter.content;
                return next(chapter);
            }
        ];
        if (chapter.nextPages){
            var links = chapter.nextPages.map(util.formatLink).filter(link=>link.url !== chapter.source);
            links.forEach(link=>link.id=chapter.id);
            links = this.filterBookIndex(links);
            if (!links.length) return fn(chapter);
            this.debug('mergeChapters');
            new Thread()
            .use((link,next)=>Thread.series(mergeContentCMD.concat([next]))(link))
            .end(()=>fn(chapter))
            .queue(links)
            .log(this.log)
            .label('mergeChapters')
            .start();
            return this;
        }
        if (chapter.nextPage){
            var links = [chapter.nextPage].map(util.formatLink).filter(link=>link.url !== chapter.source);
            links.forEach(link=>link.id=chapter.id);
            links = this.filterBookIndex(links);
            if (!links.length) return fn(chapter);
            this.debug('mergeChapter');
            Thread.series(mergeContentCMD.concat([fn]))(links[0]);
            return this;
        }
        return fn(chapter);
    }

    getChapterImages(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        if (!this.config.get("book.imageLocalization")) return fn(chapter);
        var content = chapter.content;
        var $ = Parser(content,chapter.source);
        var $imgs = $('img');
        var imgs = $imgs.map((i,v)=>({url:$.location($(v).attr('src')),index:i})).toArray();
        if (!imgs.length) return fn(chapter);
        this.debug('getChapterImages');
        var repImg = img=>$imgs.eq(img.index).replaceWith('<img src="'+img.src+'" />');
        var ChapterId = classes.Id(chapter.id).val();
        var imgFolder = Path.join(this.bookdir,ChapterId);
        var isEmpty = true;
        var isImgFile = ext=>/^\.(jpg|png|gif|png|tif|webp|bmp|tga|ppm|pgm|jpeg|pbm|pcx|jpm|jng|ico)$/gi.test(ext);
        var getImgFile = (img,then)=>{
            var times = parseInt(this.config.get('app.retry.image'));
            times = isNaN(times) ? 3 : times;
            img.success = data=>{
                fs.writeFile(img.file,data,then);
                repImg(img);
                isEmpty = false;
            }
            img.error = ()=>{
                if (--times <= 0){
                    chapter = null;
                    $imgs.eq(img.index).replaceWith('<img src="'+img.url+'" />');
                    return then();
                }
                this.request(img);
            };
            this.request(img);
        }
        var final = ()=>{
            isEmpty && fs.rmdirsSync(imgFolder);
            if (!chapter) return fn(null);
            chapter.content = $.html();
            return fn(chapter);
        }
        imgs.forEach(img=>img.path = URL.parse(img.url).pathname);
        imgs = imgs.filter(img=>img.path);
        imgs.forEach(img=>img.ext = Path.extname(img.path));
        imgs = imgs.filter(img=>isImgFile(img.ext));
        imgs.forEach((img,index)=>{
            img.id = classes.Id(index).val();
            img.name = img.id + img.ext;
            img.src = ChapterId + '/' + img.name;
            img.file = Path.join(imgFolder,img.name);
        });
        fs.mkdirsSync(imgFolder);
        fs.readdir(imgFolder,(err,files)=>{
            if(err) files = [];
            var hash = {};
            files.forEach(file=>hash[file]=true);
            var hasFiles = imgs.filter(img=>hash[img.name]);
            var noFiles = imgs.filter(img=>!hash[img.name]);
            if (hasFiles.length){
                isEmpty = false;
                hasFiles.forEach(repImg);
            }
            new Thread()
            .use(getImgFile)
            .end(final)
            .setThread(this.config.get('thread.image'))
            .queue(noFiles)
            .label('getChapterImages')
            .log(this.log)
            .start();
        });
        return this;
    }

    getDeepChapter(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        if (!this.config.get("book.deepdownload")) return fn(chapter);
        var maxDepth = this.config.get("book.maxDepth") || 1;
        var deepnow = chapter.deep;
        if (deepnow >= maxDepth) return fn(chapter);
        var $ = Parser(chapter.content,chapter.source);
        var links = $('a').map((i,v)=>({url:$.location($(v).attr('href'))})).toArray();
        links.filter(link=>link.url);
        links = this.filterBookIndex(links);
        deepnow += 1;
        links.forEach(link=>link.deep = deepnow);
        links.forEach((link,index)=>link.id = chapter.id + index);
        if (!links.length) return fn(chapter);
        this.debug(links)
        this.debug('getDeepChapter');
        new Thread()
        .use(this.getChapter.bind(this))
        .end(()=>fn(chapter))
        .queue(links)
        .log(this.log)
        .label('getDeepChapter')
        .start();
        return this;
    }

    saveChapter(chapter,fn){
        fn = this.next(fn);
        if (!chapter) return fn(null);
        if (!chapter.content) return fn(chapter);
        this.debug('saveChapter');
        chapter.date = +new Date;
        this.book.pushList(chapter);
        if (!this.config.get("book.localization")) return fn(chapter);
        this.book.pushChapter(chapter,fn);
        return this;
    }

    getChapter(link,fn){
        fn = this.next(fn);
        this.debug('getChapter');
        Thread.series([
            this.getChapterContent.bind(this),
            this.mergeChapterContent.bind(this),
            this.getDeepChapter.bind(this),
            this.getChapterImages.bind(this),
            this.saveChapter.bind(this),
            fn,
        ])(link);
        return this;
    }

    getChapters(links,fn){
        fn = this.next(fn);
        this.debug('getChapters');
        new Thread()
        .use(this.getChapter.bind(this))
        .end(fn)
        .queue(links)
        .log(this.log)
        .setThread(this.config.get('thread.execute'))
        .label('getChapters')
        .start();
        return this;
    }

    generateEbook(fn){
        fn = this.next(fn);
        if (!this.config.get("ebook.activated")) return fn();
        if (!this.book.changed && this.config.get("ebook.activated") !== true) return fn();
        this.debug('generateEbook');
        var work = child_process.fork(Path.join(__dirname,"lib/ebook/generator.js"),{cwd:process.cwd()});
        var options = {
            directory:this.config.get("ebook.directory"),
            formation:this.config.get("ebook.formation"),
            bookdir:this.bookdir
        };
        fs.mkdirsSync(options.directory);
        work.send(options);
        var ebookfile = this.book.getMeta("author") + " - " + this.book.getMeta("title") + "." + this.config.get("ebook.formation");
        this.log("generating ebook >>> " + ebookfile);
        work.on("message",msg=>{
            if (msg.msg == "success"){
                this.log("ebook generated successful...");
                if (this.config.get("ebook.opendirectory") && this.platform.match('win')){
                    this.openDir(options.directory);
                }
                if (this.config.get("ebook.openebookfile") && this.platform.match('win')){
                    this.openDir(Path.join(options.directory,ebookfile));
                }
            }else {
                this.log("ebook generation failed...");
            }
        });
        work.on("exit",fn);
        work.on("err",this.log);
        return this;
    }

    sendToDataBase(fn){
        fn = this.next(fn);
        var meta = this.book.metaValue();
        if (!meta.title || !meta.author) return fn();
        if (!this.book.changed && ~this.database.indexOf(meta.uuid)) return fn();
        this.debug('sendToDataBase');
        delete meta.cover;
        this.log(meta);
        this.database.push(meta);
        return fn();
    }

    openDir(dir){
        dir = Path.resolve(this.dir,dir);
        child_process.exec('start "" "' + dir + '"');
        return this;
    }

    newBook(url){
        this.CMD('getBookMeta > updateBookMeta > createBook > checkBookCover > saveBook > getBookIndexs > getChapters > sendToDataBase > generateEbook > end')(url);
        return this;
    }

    updateBook(dir){
        this.CMD('loadBook > checkBookCover > getBookIndexs > getChapters > sendToDataBase > generateEbook > end')(dir);
        return this;
    }

    refreshBook(dir){
        this.CMD('loadBook > updateBookMeta > checkBookCover > saveBook > getChapters > sendToDataBase > generateEbook > end')(dir);
        return this;
    }

    newBooks(urls,thread){
        new Thread()
        .use((url,next)=>this.spawn().newBook(url).end(next))
        .end(this.next())
        .queue(urls)
        .log(this.log)
        .label('newBooks')
        .setThread(thread || this.config.get('thread.new'))
        .start();
        return this;
    }

    updateBooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().updateBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.log)
        .label('updateBooks')
        .setThread(thread || this.config.get('thread.update'))
        .start();
        return this;
    }

    refreshBooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().refreshBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.log)
        .label('refreshBooks')
        .setThread(thread || this.config.get('thread.refresh'))
        .start();
        return this;
    }
}

Wedge.prototype.platform = process.platform;
Wedge.prototype.Decoder = decoder;
Wedge.prototype.Parser = Parser;
Wedge.prototype.Sites = Sites;
Wedge.prototype.Thread = Thread;
Wedge.prototype.noop = function(){};
Wedge.prototype.share = new Hash();
Wedge.prototype.database = new DataBase();
Wedge.prototype.cache = new Cache(8*1024*1024);
Wedge.prototype.lib = {
    fs:fs,
    request:request,
    querystring:querystring,
    Path:Path,
    child_process:child_process,
    url:URL,
    Random:Random,
    classes:classes,
    util:util,
    Log:Log
}

module.exports = Wedge;

util.encodeURI = function (str,charset){
    if (!charset) return encodeURIComponent(str);
    var buffer = decoder.encode(str,charset);
    var code = '';
    for (var i=0;i<buffer.length;i++){
        code += '%';
        code += buffer[i].toString(16).toUpperCase();
    }
    return code;
}

util.decodeURI = function (str,charset){
    if (!charset) return decodeURIComponent(str);
    var array = str.split('%').slice(1).map(x=>parseInt(x,16));
    return decoder.decode(new Buffer(array),charset);
}

util.formatLink = function (link){
    if (typeof link === "string"){
        return {url:link}
    }
    link.url = link.href || link.url || link.src || link.source;
    link.method = (link.method || "GET").toUpperCase();
    return link;
}
