"use strict";
const fs = require("fs");
const Path = require("path");
const URL = require("url");
const querystring = require("querystring");
const EventEmitter = require("events");
const child_process = require("child_process");
const readline = require("readline");
const Random = require("./lib/JSrandom");
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
        this.label = Random.uuid(8,16);
        this.book = new Book();
        this.bookdir = null;
        this.chdir(dir);
        this.init();
        this.plugins();
    }

    chdir(dir){
        dir = dir || './';
        this.dir = Path.resolve(dir);
        fs.mkdirsSync(this.dir);
        process.chdir(this.dir);
        this.config.file('setting.json');
        this.config.change(this.init.bind(this));
        return this;
    }

    init(){
        this.initDatabase();
        this.initLog();
        this.initFunctions();
        return this;
    }

    initDatabase(){
        this.database.file(Path.join(this.dir,'metadatas.sqlite'));
        this.database.sync(this.config.get('database.sync'));
    }

    initLog(){
        var appLog = this.getConfig('app.log');
        if(typeof appLog === 'string'){
            this.log = new Log(appLog);
        }else{
            appLog = !!appLog;
            if(appLog == false) {
                this.log = this.noop;
            }else{
                this.log = console.log.bind(console);
            }
        }

        if(this.getConfig('app.debug')){
            this.debug = function(msg){
                this.log(`[${this.label}]:${msg}`);
            }
        }else{
            this.debug = this.noop;
        }
    }

    initFunctions(){
        //newBookCmd
        this.newBookCmd = this.CMD('getBookMeta > updateBookMeta > createBook > checkBookCover > saveBook > getBookIndexs > getChapters > sendToDataBase > generateEbook > end');

        //updateBookCmd
        this.updateBookCmd = this.CMD('loadBook > checkBookCover > getBookIndexs > getChapters > sendToDataBase > generateEbook > end');

        //refreshBookCmd
        this.refreshBookCmd = this.CMD('loadBook > updateBookMeta > checkBookCover > saveBook > sendToDataBase > generateEbook > end');

        //autoUpdateCmd
        this.autoUpdateCmd = this.CMD('loadBook > updateBookMeta > checkBookCover > saveBook > getBookIndexs > getChapters > sendToDataBase > generateEbook > end');

        //eBookCmd
        this.eBookCmd = this.CMD('loadBook > generateEbook > end');

        return this;
    }

    install(plugin){
        require(plugin.func).call(this);
        return this;
    }

    getConfig(k){
        return this.config.get(k);
    }

    plugins(){
        this.getConfig('plugins').filter(plugin=>{
            return plugin.activated === true;
        }).forEach(this.install.bind(this));
        return this;
    }

    spawn(){
        var setting = this.config.valueOf();
        function Fork(){
            EventEmitter.call(this);
            this.config = new Hash();
            this.config.set(setting);
            this.book = new Book();
            this.bookdir = null;
            this.label = Random.uuid(8,16);
            this.initFunctions();
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
        if (len === 0){
            rl.close();
            return fn.apply(null,args);
        }
        function listen(){
            rl.question(docs[ref],function(input){
                args.push(input);
                ref += 1;
                if(ref === len){
                    rl.close();
                    return fn.apply(null,args);
                }else{
                    return listen();
                }
            });
        }
        listen();
        return this;
    }

    end(){
        var fn = arguments[0];
        if (undefined == fn){
            this.debug('end...');
            this.emit('end');
        }
        if (typeof fn === 'function'){
            this.once('end',fn);
        }
        return this;
    }

    error(msg){
        //this.emit('error',new Error(msg));
        this.debug(new Error(msg));
        return this.end();
    }

    next(fn){
        if (typeof fn !== 'function'){
            return this.end.bind(this);
        }
        return fn;
    }

    request(url,options){
        if ( typeof url === 'object' ) {
            options = url;
            url = undefined;
        }
        options = options || {};
        options.url = url || options.url || options.href || options.src;
        options.method = options.method || options.type || 'GET';
        options.timeout = this.config.get('request.timeout') || 15000;
        options.reconnect = this.config.get('request.reconnect') || 3;
        options.proxy = this.config.get('request.proxy');
        options.proxyAuth = this.config.get('request.proxyAuth');
        options.success = options.success || this.noop;
        options.error = options.error || this.noop;

        if (options.method === 'GET'){
            var data = this.cache.get(options.url);
            if (data) return options.success(data);
        }

        var req = new request.Request(options.url, options.method);
        options.timeout && req.timeout(options.timeout);
        options.reconnect && req.reconnect(options.reconnect);
        options.proxy && req.proxy(options.proxy);
        options.proxyAuth && req.proxyAuth(options.proxyAuth);
        options.dataType && req.accept(options.dataType);
        options.data && options.method === 'POST' && req.send(options.data);
        options.contentType && req.type(options.contentType);
        options.headers && req.setHeader(options.headers);

        var connectTimes = 0;
        var maxConnectTimes = options.reconnect;

        req.end((err,res,data)=>{
            connectTimes += 1;
            if (res && /^20.$/.test(res.statusCode) && data){
                if (options.method === 'GET'){
                    this.cache.set(options.url,data);
                }
                return options.success(data);
            }
            if (err){
                this.debug(err)
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
            if (!protoFun) return this.error(`no Function named ${name}`);
            var argsLength = protoFun.length;
            var define = [];
            if (argsLength){
                define = Random.sample('abcdefghijklmnopqrstuvwxyz',argsLength);
            }
            define.push(`this.${name}(${define.join(',')})`);
            return Function.apply(null,define).bind(this);
        };
        return line.split(' > ').map(compile);
    }

    CMD(line,funArr,args){
        var func = Thread.series(this.pipeLine(line).concat(funArr||[]));
        if (!args) return func;
        return func.call(this,args);
    }

    searchInSite(title,site,fn){
        fn = this.next(fn);
        if(!site || !site.url) return fn();
        var links = [];
        var push = link=>links.push(link);
        var url = site.url
            .replace('%title%',util.encodeURI(title,site.charset))
            .replace('%time%',+new Date())
            .replace('%random%',Math.random());
        var query = (site.query || '')
            .replace('%title%',util.encodeURI(title,site.charset))
            .replace('%time%',+new Date())
            .replace('%random%',Math.random());
        var method = (site.method || 'GET').toUpperCase();
        var data = site.data && site.data.replace('%title%',title);
        var success = data=>{
            if(site.parse){
                var parser = new Function('json','try{return (' + site.parse + ')}catch(e){return []}');
                parser(data).forEach(push);
            }else {
                var $ = Parser(data,url);
                var selector = site.selector || ':header a,img a';
                $(selector).filter((i,v)=>~$(v).text().indexOf(title)).each((i,v)=>links.push([
                    $.location($(v).attr('href')),
                    $(v).text().trim()
                ]));
            }
            if(site.engine){
                return Thread().queue(links).use((link,next)=>{
                    this.request({
                        url:link[0]+'&wd=',
                        headers:{referer:link[0]+'&wd='},
                        success:data=>{
                            var $ = this.Parser(data,link);
                            var content = $('meta[http-equiv="refresh"]').attr('content');
                            if (!content) return next();
                            link[0] = content.replace(/0;URL='(.*)'/,"$1");
                            console.log(link)
                            return next();
                        },
                        error:next
                    })
                }).setThread(10).end(()=>fn(links.filter(link=>~link[0].indexOf(site.name)))).start()
            }
            return fn(links);
        };
        var options = {
            url:url+'?'+query,
            method:method,
            data:data && util.encode(data,site.charset),
            dataType:site.dataType,
            headers:site.headers,
            success:success,
            error:()=>fn(links),
        };
        if(site.parse){
            options.headers = {
                'X-Requested-With':'XMLHttpRequest'
            };
        }
        if(site.headers){
            for(var name in site.headers){
                if('string' == typeof site.headers[name]){
                    site.headers[name] = site.headers[name].replace('%title%',util.encodeURI(title,site.charset)).replace('%time%',+new Date()).replace('%random%',Math.random());
                }
            }
        }
        this.request(options);
        return this;
    }

    fuzzysearchBook(title,fn){
        fn = this.next(fn);
        var links = [];
        var push = link=>links.push(link);
        var endSearch = ()=>fn(links);
        var search = (site,next)=>{
            this.searchInSite(title,site,list=>{
                list.forEach(push);
                return next();
            });
        };
        new Thread()
        .use(search)
        .queue(Searcher)
        .setThread(3)
        .end(endSearch)
        .log(this.debug.bind(this))
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
            this.book.loadIndexSync(this.bookdir);
            return fn();
        }
        this.book.loadIndex(this.bookdir,fn);
        return this;
    }

    checkBookIndex(fn){
        fn = this.next(fn);
        if (!this.book.location()) return this;
        if (!this.config.get('book.localization')) return fn();
        if (!this.config.get('book.check')) return fn();
        if (this.config.get('book.sync')){
            this.book.checkIndexSync();
            return fn();
        }
        this.book.checkIndex(fn);
        return this;
    }

    getParsedData(data,url){
        var site = Sites.search(url);
        //console.log(site)
        var $ = Parser(data,url,site.charset);
        var cookies = querystring.parse(request.cookies.getCookie(url),'; ');
        $.getCookie = name=>(cookies[name]||'');
        $.encode = util.encode;
        $.decode = util.decode;
        $.replace = util.replace;
        var filter = util.object.filter;
        var map = util.object.map;
        var rule = filter(site.selector,(k,v)=>v.match($) && (v.footer($) || /<\/html>/i.test($.raw)));
        var apply = (k,v)=>(util.is.isFunction(v) ? v($) : map(v,apply));
        var replace = (data,rule)=>map(data,(k,v)=>{
            if(!rule[k]) return v;
            if(util.is.isObject(v)){
                if(util.is.isObject(rule[k])) return replace(v,rule[k]);
                return v;
            }
            return util.replace(v,rule[k]);
        });
        return replace(map(rule,apply),site.replacer);
    }

    getBookMeta(url,fn){
        fn = this.next(fn);
        var links = util.checkUrlValid(url);
        if (!links) return this.error('Invalid url...'+links);
        this.debug('getBookMeta');
        var link = links[0];
        var times = util.parseInteger(this.config.get('app.retry.meta'),3);
        var indexUrl = null;
        var setMeta = infos=>{
            this.book.setMeta(infos);
            this.book.setMeta('source',links.length > 1 ? links : indexUrl);
            this.book.setMeta('origin',link);
            return fn();
        };
        var requestInfo = options=>{
            var success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                var result = success(data);
                if (!result) return;
                if(result.url && result.success){
                    result.request = result;
                }
                if(result.request && !result.bookInfos) {
                    result.request.headers = result.request.headers || {
                        referer:link.url,
                        'X-Requested-With':'XMLHttpRequest'
                    };
                    return requestInfo(result.request);
                }
                if(!result.request && !result.bookInfos) return setMeta(result);
                return setMeta(result.bookInfos);
            };
            options.error = error=>{
                this.debug(error);
                if (--times <= 0) return this.end();
                setTimeout(()=>this.request(options),1000*5);
            };
            return this.request(options);
        };
        link.success = data=>{
            var parsedData = this.getParsedData(data,link.url);
            var infoPage = parsedData.infoPage;
            var indexPage = parsedData.indexPage;
            if (!infoPage && !indexPage){
                this.error('this url is Not infoPage or request failed');
                return null;
            }
            if (!infoPage){
                this.getBookMeta(indexPage.infoPage,fn);
                return null;
            }
            indexUrl = infoPage.indexPage;
            return infoPage;
        };
        requestInfo(link);
        return this;
    }

    updateBookMeta(fn){
        fn = this.next(fn);
        if (!this.config.get('book.searchmeta')) return fn();
        var title = this.book.getMeta('title');
        var source = this.book.getMeta('source');
        var author = this.book.getMeta('author');
        var uuid = this.book.getMeta('uuid');
        if(this.database.query('uuid='+uuid).length) return fn();
        if(!title) return this.end();
        var except = new RegExp(Searcher.map(x=>x.name.replace(/\./g,'\\.')).join('|'),'gi');
        if(source.match(except)) return fn();
        this.debug('updateBookMeta');
        function like(s1,s2){
            var reFilter = /[:：？\?,；，,\.。!！_—\-]/g;
            s1 = s1.replace(reFilter,'');
            s2 = s2.replace(reFilter,'');
            if (~s1.indexOf(s2)) return true;
            if (~s2.indexOf(s1)) return true;
            return false;
        }
        var search = (site,next)=>{
            this.searchInSite(title,site,list=>{
                new Thread()
                .use((link,nextFn)=>{
                    var app = this.spawn();
                    app.debug(link);
                    app.end(nextFn);
                    app.getBookMeta(link,()=>{
                        var meta = app.book.metaValue();
                        for (var x in meta){
                            if (meta[x] === '') return app.end();
                        }
                        if (!like(meta.title,title)) return app.end();
                        if (!like(meta.author,author)) return app.end();
                        delete meta.source;
                        this.book.setMeta(meta);
                        app.debug('updateMeta');
                        return fn();
                    });
                })
                .end(next)
                .log(this.debug.bind(this))
                .label('searchBookMeta')
                .queue(list.map(link=>link[0]))
                .start();
            });
        };
        new Thread()
        .use(search)
        .queue(Searcher)
        .end(fn)
        .log(this.debug.bind(this))
        .label('searchBook')
        .start();
        return this;
    }

    getBookCover(fn){
        fn = this.next(fn);
        var coverSrc = this.book.getMeta('cover');
        if (!/^http/i.test(coverSrc)) return fn();
        this.debug('getBookCover');
        var times = parseInt(this.config.get('app.retry.cover'));
        times = isNaN(times) ? 3 : times;
        var link = util.formatLink(coverSrc);
        link.contentType = 'image';
        link.success = data=>{
            this.book.setMeta('cover',data);
            fs.writeFile(Path.join(this.bookdir,'cover.jpg'),data,fn);
        };
        link.error = ()=>{
            if (--times <= 0) return fn();
            this.request(link);
        };
        this.request(link);
        return this;
    }

    checkBookCover(fn){
        this.debug('checkBookCover');
        fn = this.next(fn);
        if (!this.bookdir) return this.end();
        var coverSrc = this.book.getMeta('cover');
        var coverDir = Path.join(this.bookdir,'cover.jpg');
        fs.exists(coverDir,exist=>{
            if (exist){
                fs.readFile(coverDir,(err,data)=>{
                    this.book.setMeta('cover',data);
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
            if (!this.config.get('book.changesource')) return fn();
            this.debug('changesource');
            if (this.config.get('book.override')){
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
        this.book.setMeta('date',+new Date);
        this.book.localization(this.bookdir,fn);
        return this;
    }

    getBookIndex(link,fn){
        fn = this.next(fn);
        var link = util.checkUrlValid(link);
        var times = util.parseInteger(this.config.get('app.retry.index'),3);
        var setIndex = bookIndex=>{
            if(Array.isArray(bookIndex)){
                fn(bookIndex);
            }else {
                fn([]);
            }
        };
        var requestIndex = options=>{
            var success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                var result = success(data);
                if(!result) return setIndex();
                if(result.url && result.success){
                    result.request = result;
                }
                if(result.request && !result.bookIndexs) {
                    result.request.headers = result.request.headers || {
                        referer:link.url,
                        'X-Requested-With':'XMLHttpRequest'
                    };
                    return requestIndex(result.request);
                }
                if(!result.request && !result.bookIndexs) return setIndex(result);
                return setIndex(result.bookIndexs);
            };
            options.error = error=>{
                this.debug(error);
                if (--times <= 0) return setIndex();
                setTimeout(()=>this.request(options),1000*5);
            };
            return this.request(options);
        };
        if (!link) return setIndex();
        link.success = data=>this.getParsedData(data,link.url).indexPage;
        requestIndex(link);
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
                return {url:link};
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
        .log(this.debug.bind(this))
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
        var titleUnique = this.config.get('book.unique.title');
        var idUnique = this.config.get('book.unique.id');
        //过滤重复的链接
        indexs = indexs.map(util.formatLink);
        indexs = indexs.filter(index=>index.url && !~index.url.indexOf('#') && !~index.url.indexOf('javascript:'));
        indexs.forEach(index=>{
            if (index.url in SelfSources) return;
            SelfSources[index.url] = true;
            newIndexs.push(index);
        });
        //创建ID
        newIndexs.forEach((item,index)=>item.id = classes.Id(item.id || index).val());
        //过滤已下载的链接
        indexs = newIndexs.filter(index=>!Sources[index.url]);
        if (idUnique){
            indexs = indexs.filter(index=>!Ids[index.id]);
        }
        if (titleUnique){
            indexs = indexs.filter(index=>!Titles[index.text]);
        }
        //过滤Id重复或者标题重复的链接
        newIndexs = [];
        indexs.forEach(index=>{
            if (index.id in SelfIds && idUnique) return;
            if (index.text in SelfTitles && titleUnique) return;
            SelfIds[index.id] = true;
            SelfTitles[index.text] = true;
            newIndexs.push(index);
        });
        return newIndexs;
    }

    getChapterContent(link,fn){
        fn = this.next(fn);
        this.debug('getChapterContent');
        var times = util.parseInteger(this.config.get('app.retry.chapter'),3);
        var link = util.checkUrlValid(link);
        if (!link) return fn(null);
        var setContent = chapter=>{
            if(!chapter) return fn(null);
            if(Buffer.isBuffer(chapter)){
                chapter = decoder.decode(chapter,'gbk');
            }
            if(typeof chapter == 'string'){
                chapter = {content:chapter};
            }
            chapter.deep = link.deep || 0;
            chapter.id = chapter.id || link.id;
            chapter.source = chapter.source || link.url;
            chapter.title = chapter.title || link.text;
            chapter.content = chapter.content || '';
            return fn(chapter);
        };
        var requestContent = options=>{
            //console.log(options)
            var success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                var result = success(data);
                if (!result) return setContent();
                if(result.url && result.success){
                    result.request = result;
                }
                if(result.request && !result.chapterInfos) {
                    result.request.headers = result.request.headers || {
                        referer:link.url,
                        'X-Requested-With':'XMLHttpRequest'
                    };
                    return requestContent(result.request);
                }
                if(!result.request && !result.chapterInfos) return setContent(result);
                return setContent(result.chapterInfos);
            };
            options.error = error=>{
                this.debug(error);
                if (--times <= 0) return fn();
                setTimeout(()=>this.request(options),1000*5);
            };
            return this.request(options);
        };
        link.success = data=>this.getParsedData(data,link.url).contentPage;
        requestContent(link);
        return this;
    }

    mergeChapterContent(chapter,fn){
        fn = this.next(fn);
        if (!chapter) return fn(null);
        var links;
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
                    chapter.content += '\n';
                }
                chapter.content += nextChapter.content;
                return next(chapter);
            }
        ];
        if (chapter.nextPages){
            links = chapter.nextPages.map(util.formatLink).filter(link=>link.url !== chapter.source);
            links.forEach(link=>link.id=chapter.id);
            links = this.filterBookIndex(links);
            if (!links.length) return fn(chapter);
            this.debug('mergeChapters');
            new Thread()
            .use((link,next)=>Thread.series(mergeContentCMD.concat([next]))(link))
            .end(()=>fn(chapter))
            .queue(links)
            .log(this.debug.bind(this))
            .label('mergeChapters')
            .start();
            return this;
        }
        if (chapter.nextPage){
            links = [chapter.nextPage].map(util.formatLink).filter(link=>link.url !== chapter.source);
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
        if (!this.config.get('book.imageLocalization')) return fn(chapter);
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
        var imgExts = new RegExp('^('+(this.config.get('book.imageExts')||(['','.jpg','.png','.gif','.png','.tif','.webp','.bmp','.tga','.ppm','.pgm','.jpeg','.pbm','.pcx','.jpm','.jng','.ico'])).join('|')+')$','i');
        var isImgFile = ext=>imgExts.test(ext);
        var getImgFile = (img,then)=>{
            var times = parseInt(this.config.get('app.retry.image'));
            times = isNaN(times) ? 3 : times;
            img.success = data=>{
                fs.writeFile(img.file,data,then);
                repImg(img);
                isEmpty = false;
            };
            img.error = ()=>{
                if (--times <= 0){
                    chapter = null;
                    $imgs.eq(img.index).replaceWith('<img src="'+img.url+'" />');
                    return then();
                }
                this.request(img);
            };
            this.request(img);
        };
        var final = ()=>{
            isEmpty && fs.rmdirsSync(imgFolder);
            if (!chapter) return fn(null);
            chapter.content = $.html();
            return fn(chapter);
        };
        imgs.forEach(img=>img.path = URL.parse(img.url).pathname);
        imgs = imgs.filter(img=>img.path);
        imgs.forEach(img=>img.ext = Path.extname(img.path));
        imgs = imgs.filter(img=>isImgFile(img.ext));
        imgs.forEach((img,index)=>{
            img.ext = img.ext || '.jpeg';
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
            .log(this.debug.bind(this))
            .start();
        });
        return this;
    }

    getDeepChapter(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        if (!this.config.get('book.deepdownload')) return fn(chapter);
        var maxDepth = this.config.get('book.maxDepth') || 1;
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
        this.debug(links);
        this.debug('getDeepChapter');
        new Thread()
        .use(this.getChapter.bind(this))
        .end(()=>fn(chapter))
        .queue(links)
        .log(this.debug.bind(this))
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
        .log(this.debug.bind(this))
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
            if (msg.msg === "success"){
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
        work.on("exit",()=>{
            work = null;
            return fn();
        });
        work.on("err",this.log);
        return this;
    }

    sendToDataBase(fn){
        fn = this.next(fn);
        var meta = this.book.metaValue();
        if (!meta.title || !meta.author) return fn();
        if (!this.book.changed && this.database.query('uuid='+meta.uuid).length) return fn();
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
        process.nextTick(this.newBookCmd.bind(this,url));
        return this;
    }

    updateBook(dir){
        process.nextTick(this.updateBookCmd.bind(this,dir));
        return this;
    }

    refreshBook(dir){
        process.nextTick(this.refreshBookCmd.bind(this,dir));
        return this;
    }

    autoUpdateBook(dir){
        process.nextTick(this.autoUpdateCmd.bind(this,dir));
        return this;
    }

    deleteBook(uuid){
        process.nextTick(()=>{
            this.database.remove(uuid);
            fs.rmdirsSync(uuid);
            this.end();
        });
        return this;
    }

    ebook(dir){
        var activated = this.config.get('ebook.activated');
        this.config.set('ebook.activated',true);
        this.end(()=>this.config.set('ebook.activated',activated));
        process.nextTick(this.eBookCmd.bind(this,dir));
        return this;
    }

    ebooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().ebook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.debug.bind(this))
        .label('convertEbooks')
        .interval(1000)
        .setThread(thread || this.config.get('thread.update'))
        .start();
        return this;
    }

    newBooks(urls,thread){
        new Thread()
        .use((url,next)=>this.spawn().newBook(url).end(next))
        .end(this.next())
        .queue(urls)
        .log(this.debug.bind(this))
        .label('newBooks')
        .interval(3000)
        .setThread(thread || this.config.get('thread.new'))
        .start();
        return this;
    }

    updateBooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().updateBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.debug.bind(this))
        .label('updateBooks')
        .interval(1000)
        .setThread(thread || this.config.get('thread.update'))
        .start();
        return this;
    }

    refreshBooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().refreshBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.debug.bind(this))
        .label('refreshBooks')
        .interval(1000)
        .setThread(thread || this.config.get('thread.refresh'))
        .start();
        return this;
    }

    deleteBooks(dirs){
        new Thread()
        .use((dir,next)=>this.spawn().deleteBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.debug.bind(this))
        .label('deleteBooks')
        .start();
        return this;
    }

    autoUpdateBooks(dirs,thread){
        new Thread()
        .use((dir,next)=>this.spawn().autoUpdateBook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.debug.bind(this))
        .label('refreshBooks')
        .interval(1000)
        .setThread(thread || this.config.get('thread.update'))
        .start();
        return this;
    }

    updateAllBooks(){
        this.updateBooks(this.database.attr('uuid'));
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
};

module.exports = Wedge;

util.encodeURI = function (str,charset){
    if(charset === 'unicode') return str.split('').map(x=>'%u'+x.charCodeAt().toString(16).toUpperCase()).join('');
    if(charset === 'base64') return new Buffer(str).toString('base64');
    if (!charset) return encodeURIComponent(str);
    var buffer = decoder.encode(str,charset);
    var code = '';
    for (var i=0;i<buffer.length;i++){
        code += '%';
        code += buffer[i].toString(16).toUpperCase();
    }
    return code;
};

util.decodeURI = function (str,charset){
    if (!charset) return decodeURIComponent(str);
    if (charset === 'unicode') return str.split('%u').slice(1).map(x=>String.fromCharCode(parseInt(x,16))).join('');
    if (charset === 'base64') return new Buffer(str,'base64').toString();
    var array = str.split('%').slice(1).map(x=>parseInt(x,16));
    return decoder.decode(new Buffer(array),charset);
};

util.encode = function(str,charset){
    if(!charset) return new Buffer(str);
    if(charset === 'unicode') return str.split('').map(x=>'\\u'+x.charCodeAt().toString(16).toUpperCase()).join('');
    if(charset === 'base64') return new Buffer(str).toString('base64');
    if(charset === 'html') return str.split('').map(x=>'&#'+x.charCodeAt().toString() + ';').join('');
    return decoder.encode(str,charset);
};

util.decode = function(str,charset){
    if(charset) return str.toString();
    if(charset === 'unicode') return str.split('\\u').slice(1).map(x=>String.fromCharCode(parseInt(x,16))).join('');
    if(charset === 'base64') return new Buffer(str,'base64').toString();
    if(charset === 'html') return str.replace(/&#(x)?([^&]{1,5});?/ig,function($, $1, $2){
        return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
    });
    return decoder.decode(str,charset);
};

util.formatLink = function (link){
    if (typeof link === "string"){
        return {url:link};
    }
    link.url = link.href || link.url || link.src || link.source;
    link.method = (link.method || "GET").toUpperCase();
    return link;
};

util.parseInteger = function (str,defaut){
    if(str == Infinity || str == -Infinity) return Infinity;
    var times = parseInt(str);
    if(!isNaN(times)) return times;
    return defaut;
};

util.checkUrlValid = function (url){
    var links;
    if(typeof url === 'string'){
        if (!url || !url.match('http')) return false;
        links = url.split('|')
            .filter(x=>x)
            .map(link=>{
                try{
                    return JSON.parse(link);
                }catch (e){
                    return link;
                }
            })
            .map(util.formatLink)
            .filter(link=>link.url && link.url.indexOf("#")!==0 && !~link.url.indexOf("javascript:"));
        if (links.length) return links;
    }else if(Array.isArray(url)){
        links = url.map(util.formatLink).filter(link=>link.url && link.url.indexOf("#")!==0 && !~link.url.indexOf("javascript:"));
        if (links.length) return links;
    }else if (typeof url == 'object'){
        return util.formatLink(url);
    }
    return false;
};
