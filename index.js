"use strict";
const fs = require("fs");
const Path = require("path");
const URL = require("url");
const os = require("os");
const querystring = require("querystring");
const EventEmitter = require("events");
const child_process = require("child_process");
const readline = require("readline");
const decoder = require("iconv-lite");
const Random = require("./lib/JSrandom");
const Log = require("./lib/Log");
const Hash = require("./lib/Hash");
const DataBase = require("./lib/DataBase");
const request = require("./lib/request");
const util = require("./lib/util");
const Thread = require("./lib/Thread");
const Cache = require("./lib/Cache");
const Parser = require("./lib/Parser");
const Book = require("./lib/Book");
const classes = require("./lib/classes");
const ebook = require('./lib/ebook/encoder');
const setting = require("./config/setting");
const Searcher = require("./config/searcher");
const Sites = require("./config/Sites");
const threadLimit = require('./config/threadLimit');
const outClude = require("./config/outclude");
const images = require("./config/images");

class Wedge extends EventEmitter{
    constructor(dir){
        super();
        this.config = new Hash(setting);
        this.label = Random.uuid(8,16);
        this.book = Book();
        this.bookdir = null;
        this.maxThreads = os.cpus().length * 2;
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
        this.images = new Hash(images,0);
        this.images.file('images.json');
        return this;
    }

    init(){
        this.initDatabase();
        this.initLog();
        this.initFunctions();
        return this;
    }

    initDatabase(){
        this.database.file(Path.join(this.dir,'metadatas.db'));
        this.database.sync(this.getConfig('database.sync'));
    }

    initLog(){
        let appLog = this.getConfig('app.log');
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
            this.debug = (...msg)=>this.log(`[${this.label}]:${msg.join(' ')}`);
        }else{
            this.debug = this.noop;
        }

        if(this.getConfig('app.info')){
            this.info = (...msg)=>this.log(`[${this.label}]:${msg.join(' ')}`);
        }else{
            this.info = this.noop;
        }
    }

    initFunctions(){
        //newBookCmd
        this.newBookCmd = this.CMD('getBookMeta > getBookCover > updateBookMeta > createBook > checkBookCover > getBookIndexs > getChapters > saveBook > sendToDataBase > generateEbook > end');

        //updateBookCmd
        this.updateBookCmd = this.CMD('loadBook > checkBookCover > getBookIndexs > getChapters > saveBook > sendToDataBase > generateEbook > end');

        //redownload
        this.reDownloadCmd = this.CMD('loadBook > updateBookMeta > getBookCover > checkBookCover > emptyBookIndex > getBookIndexs > getChapters > saveBook > sendToDataBase > generateEbook > end');

        //refreshBookCmd
        this.refreshBookCmd = this.CMD('loadBook > updateBookMeta > getBookCover > checkBookCover > saveBook > sendToDataBase > generateEbook > end');

        //autoUpdateCmd
        this.autoUpdateCmd = this.CMD('loadBook > updateBookMeta > getBookCover > checkBookCover > getBookIndexs > getChapters > saveBook > sendToDataBase > generateEbook > end');

        //eBookCmd
        this.eBookCmd = this.CMD('loadBook > checkBookCover > saveBook > generateEbook > end');

        //importBookRecordCmd
        this.importBookRecordCmd = this.CMD('loadBook > sendToDataBase > end');

        //testRuleCmd
        this.testRuleCmd = this.CMD('getBookMeta > logBookInfo > updateBookMeta > logBookInfo > getBookIndexs > intercept > getChapterContent > mergeChapterContent > log > end');

        //filterChapter
        this.filterBookContentCmd = this.CMD('loadBook > filterBookChapter > end');

        return this;
    }

    install(plugin){
        require(plugin.func).call(this);
        return this;
    }

    getConfig(k,v){
        let val = this.config.get(k);
        if(val === undefined && v !== undefined){
            this.config.set(k,v);
            return v
        }
        return val;
    }

    plugins(){
        Object.values(this.getConfig('plugins',{}))
        .filter(plugin=>plugin.activated)
        .forEach(plugin=>{
            try{
                this.install(plugin);
            }catch(e){
                console.log(e)
                //plugin.activated = false;
            }
        });
        return this;
    }

    spawn(){
        let setting = this.config.valueOf();
        function Fork(){
            EventEmitter.call(this);
            this.config = new Hash();
            this.config.set(setting);
            this.book = Book();
            this.bookdir = null;
            this.label = Random.uuid(8,16);
            this.initFunctions();
            this.initLog();
        }
        Fork.prototype=this;
        return new Fork();
    }

    prompt(docs,fn){
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let args = [];
        let len = Math.max(docs.length,fn.length);
        let ref = 0;
        let listen = ()=>{
            rl.question(docs[ref],input=>{
                args.push(input.trim());
                ref += 1;
                if(ref === len){
                    rl.close();
                    return fn(...args);
                }else{
                    return listen();
                }
            });
        }
        if (len === 0){
            rl.close();
            return fn(...args);
        }
        listen();
        return this;
    }

    end(fn){
        if (typeof fn === 'function'){
            this.once('end',fn);
        }else{
            this.info('end...');
            this.emit('end');
            this.book = Book();
            this.bookdir = null;
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

    intercept(infos,fn){
        console.log(infos);
        fn(Random.select(infos));
    }

    logBookInfo(fn){
        fn = this.next(fn);
        console.log(this.book.meta);
        console.log(this.book.list);
        return fn();
    }

    request(url,options){
        if ( typeof url === 'object' ) {
            options = url;
            url = undefined;
        }
        options = options || {};
        options.url = url || options.url || options.href || options.src;
        options.method = options.method || options.type || 'GET';
        options.timeout = util.parseInteger(this.getConfig('request.timeout',500), 15000);
        options.reconnect = util.parseInteger(this.getConfig('request.reconnect',3), 3);
        options.proxy = this.getConfig('request.proxy');
        options.proxyAuth = this.getConfig('request.proxyAuth');
        options.cookie = options.cookie || this.getConfig('request.cookie');
        options.headers = options.headers || this.getConfig('request.headers');
        //this.debug(JSON.stringify(options,null,2));
        options.success = options.success || this.noop;
        options.error = options.error || this.noop;

        let pac = this.getConfig('request.proxyAutoConfig');
        let proxyMatched = false;
        if('string' === typeof pac){
            proxyMatched = (new RegExp(pac,'gi')).test(options.url);
        }else if('function' === typeof pac){
            proxyMatched = pac(options.url);
        }else{
            proxyMatched = false;
        }

        if (options.method === 'GET'){
            let data = this.cache.get(options.url);
            if (data) return options.success(data);
        }

        let req = new request.Request(options.url, options.method);
        options.timeout && req.timeout(options.timeout);
        options.proxy && proxyMatched && req.proxy(options.proxy);
        Array.isArray(options.proxyAuth) && req.proxyAuth(...options.proxyAuth);
        options.dataType && req.accept(options.dataType);
        options.data && options.method === 'POST' && req.send(options.data);
        options.contentType && req.type(options.contentType);
        options.headers && req.setHeader(options.headers);
        options.cookie && req.cookie(options.cookie);

        let connectTimes = 0;
        let maxConnectTimes = options.reconnect;

        req.end((err,res,data)=>{
            connectTimes += 1;
            if (!err && res && /^20.$/.test(res.statusCode) && data){
                if (options.method === 'GET'){
                    this.cache.set(options.url,data);
                }
                return options.success(data);
            }
            if (err){
                if(err.code === 'Z_DATA_ERROR'){
                    req.setHeader('Accept-Encoding','');
                    return req.end();
                }
                if (connectTimes < maxConnectTimes) return req.end();
                let autoProxy = this.getConfig('app.autoProxy');
                let autoProxyAuth = this.getConfig('app.autoProxyAuth');
                if(autoProxy && options.proxy && !proxyMatched){
                    proxyMatched = true;
                    req.proxy(autoProxy);
                    Array.isArray(autoProxyAuth) && req.proxyAuth(...autoProxyAuth);
                    return req.end();
                }else{
                    this.debug(this.bookdir,err.code,options.url);
                    return options.error(err.code);
                }
            }
            this.debug(this.bookdir,res.statusCode,options.url);
            return options.error(res.statusCode);
        });
    }

    pipeLine(line){
        let compile = name=>{
            name = name.trim();
            let protoFun = this[name];
            if (!protoFun) return this.error(`no Function named ${name}`);
            let argsLength = protoFun.length;
            if(argsLength == 0) return protoFun.bind(this);
            let define = [];
            if (argsLength){
                define = Random.sample('_abcdefghijklmnopqrstuvwxyz',argsLength);
            }
            define.push(`this.${name}(${define.join(',')})`);
            return Function(...define).bind(this);
        };
        return line.split(' > ').map(compile);
    }

    CMD(line,funArr,args){
        let func = Thread.series(this.pipeLine(line).concat(funArr||[]));
        if (!args) return func;
        return func.call(this,args);
    }

    searchInSite(title,site,fn){
        fn = this.next(fn);
        if(!site || !site.url) return fn();
        //this.debug(site.url)
        let links = [];
        let push = link=>links.push(link);
        let url = site.url
            .replace('%title%',util.encodeURI(title,site.charset))
            .replace('%time%',+new Date())
            .replace('%random%',Math.random());
        let query = (site.query || '')
            .replace('%title%',util.encodeURI(title,site.charset))
            .replace('%time%',+new Date())
            .replace('%random%',Math.random());
        let method = (site.method || 'GET').toUpperCase();
        let data = site.data && site.data.replace('%title%',title);
        let filterFn = link=>~link[0].indexOf(site.name);
        let success = data=>{
            if(site.parse){
                let parser = new Function('data','url','Parser','try{return (' + site.parse + ')}catch(e){return []}');
                parser(data,url,Parser).forEach(push);
            }else {
                let $ = Parser(data,url);
                let selector = site.selector || ':header a,img a';
                $(selector).filter((i,v)=>~$(v).text().indexOf(title)).each((i,v)=>links.push([
                    $.location($(v).attr('href')),
                    util.replace($(v).text(),site.replace).trim()
                ]));
            }
            if(site.engine){
                let _links = [];
                return Thread().queue(links).use((link,next)=>{
                    this.request({
                        url:link[0]+'&wd=',
                        headers:{referer:link[0]+'&wd='},
                        success:data=>{
                            let found = data.toString().match(new RegExp(`(${site.filter})`));
                            if(!found) return next();
                            link[0] = found[1];
                            _links.push(link);
                            return next();
                        },
                        error:next
                    });
                })
                .setThread(10)
                .end(()=>fn(_links))
                .start();
            }
            return fn(links.filter(filterFn));
        };
        let options = {
            url:url+(query ? '?':'')+query,
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
            for(let name in site.headers){
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
        let links = [];
        let push = link=>links.push(link);
        let endSearch = ()=>fn(links);
        let search = (site,next)=>{
            this.searchInSite(title,site,list=>{
                list.forEach(push);
                return next();
            });
        };
        Thread()
        .use(search)
        .queue(Searcher)
        .setThread(5)
        .end(endSearch)
        .log(this.info.bind(this))
        .label('fuzzysearchBook')
        .start();
        return this;
    }

    searchBook(title,fn){
        fn = this.next(fn);
        title = title.replace(/[:：？\?,；，,.。!！_—\-]/g,'');
        let filterFun = links=>fn(links.filter(link=>link[1] == title));
        this.fuzzysearchBook(title,filterFun);
        return this;
    }

    importBook(book,fn){
        fn = this.next(fn);
        let app = this.spawn();
        let uuid = book.meta.uuid;
        app.bookdir = Path.resolve(uuid);
        fs.mkdirsSync(app.bookdir);
        app.loadBook(app.bookdir,()=>{
            let old = app.book.meta;
            if(old.uuid == uuid && !this.getConfig('book.changesource')) return fn();
            this.info('importBook');
            app.book.emptyList();
            app.book.setMeta(book.meta);
            fs.writeFileSync(Path.join(app.bookdir,'cover.jpg'),Buffer.from(book.meta.cover,'base64'));
            Thread()
            .use((chapter,next)=>{
                app.book.pushList(chapter);
                fs.writeFile(Path.join(app.bookdir,chapter.id+'.json'),JSON.stringify(chapter),next);
            }).queue(book.list).threads(20).label('importBook')
            .end(()=>{
                app.book.localizationSync(app.bookdir);
                app.sendToDataBase(fn);
            }).start();
        });
        return this;
    }

    importWBK(filename,fn){
        fn = this.next(fn);
        try{
            this.info('importing WBK');
            let buf = fs.readFileSync(filename);
            ebook.unwbk(buf,book=>this.importBook(book,fn));
        }catch(e){
            return fn();
        }
    }

    aliasBook(fn){
        fn = this.next(fn);
        let aliasList = this.getConfig('book.alias');
        if(!aliasList) return fn();
        let source = this.book.getMeta('source');
        for(let site in aliasList){
            let newsite = aliasList[site];
            if(source.indexOf(site) >= 0){
                source = source.replace(site,newsite);
                this.book.setMeta('source',source);
            }
        }
        return fn();
    }

    filterBookChapter(fn){
        fn = this.next(fn);
        this.book.filterChapterContent(fn);
        return this;
    }

    loadBook(dir,fn){
        this.info('loadBook');
        this.bookdir = Path.resolve(dir);
        if(!fs.existsSync(this.bookdir)){
            let record = this.database.query(`uuid=${dir}`)[0];
            if(record && record.source){
                return this.newBook(record.source);
            }
            return this.end();
        }
        this.book.location(dir,()=>this.syncBookIndex(()=>this.aliasBook(fn)));
        return this;
    }

    syncBookIndex(fn){
        fn = this.next(fn);
        if (!this.getConfig('book.localization') || !this.getConfig('book.sync')) return fn();
        this.info('syncBookIndex');
        this.book.syncIndex(fn);
        return this;
    }

    emptyBookIndex(fn){
        fn = this.next(fn);
        this.book.emptyList();
        return fn();
    }

    getParsedData(data,url){
        let site = Sites.search(url);
        //this.debug(`use site rule of [${site.host}]`);
        let $ = Parser(data,url,site.charset);
        let cookies = querystring.parse(request.cookies.getCookie(url),'; ');
        $.getCookie = name=>(cookies[name]||'');
        let filter = util.object.filter;
        let map = util.object.map;
        let rule = filter(site.selector,(k,v)=>v.match($) && (v.footer($) || /<\/html>/i.test($.raw)));
        let apply = (k,v)=>(util.is.isFunction(v) ? v($) : map(v,apply));
        let replace = (data,rule)=>map(data,(k,v)=>{
            if(!rule[k]) return v;
            if(util.is.isObject(v)){
                if(util.is.isObject(rule[k])) return replace(v,rule[k]);
                return v;
            }
            return util.replace(v,rule[k]);
        });
        return replace(map(rule,apply),site.replacer || {});
    }

    getBookMeta(url,fn){
        fn = this.next(fn);
        let links = util.validURL(url);
        if (!links.length) return this.error('Invalid url...'+url);
        this.info('getBookMeta');
        let link = links[0];
        let times = util.parseInteger(this.getConfig('app.retry.meta',3),3);
        let indexUrl = null;
        let setMeta = infos=>{
            //this.debug(JSON.stringify(infos,null,2));
            this.book.setMeta(infos);
            this.book.setMeta('source',links.length > 1 ? links : indexUrl);
            this.book.setMeta('origin',link);
            return fn();
        };
        let requestInfo = options=>{
            let success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                let result = success(data);
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
                //this.debug(error);
                if (--times <= 0) return this.end();
                setTimeout(()=>this.request(options),1000*5);
            };
            return this.request(options);
        };
        link.success = data=>{
            let parsedData = this.getParsedData(data,link.url);
            //console.log(parsedData)
            let infoPage = parsedData.infoPage;
            let indexPage = parsedData.indexPage;
            if (infoPage){
                indexUrl = infoPage.indexPage;
                return infoPage;  
            }
            if (indexPage && indexPage.infoPage && indexPage.infoPage !== link.url){
                this.getBookMeta(indexPage.infoPage,fn);
                return null;
            }else{
                //this.debug(JSON.stringify(parsedData,null,2));
                this.error('this url is Not infoPage or request failed');
                return null;
            }
        };
        //this.debug(JSON.stringify(link,null,2));
        requestInfo(link);
        return this;
    }

    asyncGetBookMeta(url){
        return new Promise((resolve,reject)=>{
            let links = util.validURL(url);
            if (!links.length) throw new Error('Invalid url...'+url);
            this.info('getBookMeta');
            let link = links[0];
            let times = util.parseInteger(this.getConfig('app.retry.meta',3),3);
            let indexUrl = null;
            let setMeta = infos=>{
                this.book.setMeta(infos);
                this.book.setMeta('source',links.length > 1 ? links : indexUrl);
                this.book.setMeta('origin',link);
                return resolve();
            }
            let requestInfo = options=>{
                options.success = data=>{
                    let parsedData = this.getParsedData(data,link.url);
                    //console.log(parsedData)
                    let infoPage = parsedData.infoPage;
                    let indexPage = parsedData.indexPage;
                    if (infoPage){
                        indexUrl = infoPage.indexPage;
                        if(infoPage.url && infoPage.success){
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
                        return infoPage;
                    }
                    if (indexPage && indexPage.infoPage && indexPage.infoPage !== link.url){
                        return this.asyncGetBookMeta(indexPage.infoPage)
                    }else{
                        throw Error('this url is Not infoPage or request failed')
                    }
                }
                options.error = error=>{
                    //this.debug(error);
                    if (--times <= 0) throw Error('Request failed');
                    setTimeout(()=>this.request(options),1000*5);
                }
                return this.request(options);
            }
            requestInfo(link)
        })
    }

    updateBookMeta(fn){
        fn = this.next(fn);
        if (!this.getConfig('book.searchmeta')) return fn();
        let title = this.book.getMeta('title');
        let origin = this.book.getMeta('origin');
        let author = this.book.getMeta('author');
        if(!title) return this.end();
        this.info('updateBookMeta');
        let similar = (s1,s2)=>{
            let reFilter = /[:：？\?,；，,.。!！_—\-]/g;
            s1 = s1.replace(reFilter,'');
            s2 = s2.replace(reFilter,'');
            if (~s1.indexOf(s2)) return true;
            if (~s2.indexOf(s1)) return true;
            return false;
        }
        if(outClude.some(site=>~origin.indexOf(site))){
            //app.end(fn)
            let app = this.spawn();
            app.info(origin);
            app.getBookMeta(origin,()=>{
                let meta = app.book.meta;
                delete meta.source;
                for(let x in meta) {
                    if (meta[x] == "") return fn();
                }
                this.book.setMeta(meta);
                return fn();
            });
            return this;
        }
        let search = (site,next)=>{
            this.searchInSite(title,site,list=>{
                Thread()
                .use((link,nextFn)=>{
                    let app = this.spawn();
                    app.info(link);
                    app.getBookMeta(link,()=>{
                        let meta = app.book.meta;
                        for (let x in meta){
                            if (meta[x] === '') return nextFn();
                        }
                        if (!similar(meta.title,title)) return nextFn();
                        if (!similar(meta.author,author)) return nextFn();
                        delete meta.source;
                        this.book.setMeta(meta);
                        this.info('updateMeta');
                        return fn();
                    });
                })
                .end(next)
                .log(this.info.bind(this))
                .label('searchBookMeta')
                .queue(list.filter(link=>(Array.isArray(link) && link[1] && ~link[1].indexOf(title))).map(link=>link[0]))
                .start();
            });
        };
        Thread()
        .use(search)
        .queue(Searcher)
        .end(fn)
        .log(this.info.bind(this))
        .label('searchBook')
        .start();
        return this;
    }

    getBookCover(fn){
        fn = this.next(fn);
        let coverSrc = this.book.getMeta('cover');
        let coverDir = Path.join(Path.resolve(this.book.getMeta('uuid')),'cover.jpg');
        if (!/^http/i.test(coverSrc)) return fn();
        this.info('getBookCover');
        let times = util.parseInteger(this.getConfig('app.retry.cover'),3);
        let link = util.formatLink(coverSrc);
        link.contentType = 'image';
        link.success = data=>{
            this.book.setMeta('cover',data);
            this.cache.set(coverDir,data);
            fs.writeFile(coverDir,data,fn);
        };
        link.error = ()=>{
            if (--times <= 0){
                let data = this.cache.get(coverDir);
                if(!data) return fn();
                this.book.setMeta('cover',data);
                fs.writeFile(coverDir,data,fn);
            }else{
                this.request(link);
            }
        };
        this.request(link);
        return this;
    }

    checkBookCover(fn){
        fn = this.next(fn);
        if (!this.bookdir) return this.end();
        this.info('checkBookCover');
        let coverSrc = this.book.getMeta('cover');
        let coverDir = Path.join(this.bookdir,'cover.jpg');
        fs.readFile(coverDir,(err,data)=>{
            if(err){
                if(!coverSrc) return fn();
                if (/^http/i.test(coverSrc)) return this.getBookCover(fn);
                fs.writeFile(coverDir,Buffer.from(coverSrc,'base64'),fn);
            }else{
                let imgBuf = data.toString('base64');
                if (coverSrc.substr(0,100) !== imgBuf.substr(0,100)){
                  this.book.setMeta('cover',data);
                }
                return fn();
            }
        });
    }

    createBook(fn){
        fn = this.next(fn);
        let thisMeta = this.book.meta;
        if(this.getConfig('database.check')){
            let record = this.database.query(`uuid=${thisMeta.uuid}`)[0];
            if(record && record.source === thisMeta.source) return this.end();
        }
        this.info('createBook');
        this.bookdir = Path.resolve(thisMeta.uuid);
        fs.mkdirsSync(this.bookdir);
        this.loadBook(this.bookdir,()=>{
            let newURL = this.book.getMeta('source');
            if (thisMeta.source == newURL){
                this.book.setMeta(thisMeta);
                return fn();
            }
            if (!this.getConfig('book.changesource')) return fn();
            this.info('changesource');
            if (this.getConfig('book.override')){
                this.info('override');
                this.book.emptyList();
            }
            this.book.setMeta(thisMeta);
            return fn();
        });
        return this;
    }

    saveBook(fn){
        fn = this.next(fn);
        if (!this.bookdir) return this.end();
        if(!this.book.changed) return fn();
        this.info('saveBook');
        this.book.setMeta('date',+new Date);
        this.book.localizationSync(this.bookdir);
        fn();
        return this;
    }

    getBookIndex(link,fn){
        fn = this.next(fn);
        link = util.formatLink(link);
        this.info('getBookIndex');
        //this.debug(link.url)
        //console.log(link)
        let times = util.parseInteger(this.getConfig('app.retry.index'),3);
        let setIndex = bookIndex=>{
            if(Array.isArray(bookIndex)){
                fn(bookIndex);
            }else {
                fn([]);
            }
        };
        let requestIndex = options=>{
            let success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                let result = success(data);
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
                if(result.nextPage){
                    let nextPage = result.nextPage;
                    if(nextPage && typeof nextPage === 'string' && nextPage !== link.url){
                        nextPage = URL.resolve(link.url,nextPage);
                        return this.getBookIndex(nextPage,indexs=>{
                            let bookIndexs = Array.isArray(result.bookIndexs) ? result.bookIndexs : [];
                            setIndex(bookIndexs.concat(indexs));
                        });
                    }
                    if(nextPage && typeof nextPage === 'object' && nextPage.url && nextPage.url !== link.url){
                        nextPage.url = URL.resolve(link.url,nextPage.url);
                        return this.getBookIndex(nextPage,indexs=>{
                            let bookIndexs = Array.isArray(result.bookIndexs) ? result.bookIndexs : [];
                            setIndex(bookIndexs.concat(indexs));
                        });
                    }
                }
                return setIndex(result.bookIndexs);
            };
            options.error = error=>{
                //this.debug(error);
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
        this.info('getBookIndexs');
        let source = this.book.getMeta('source'),
            links = util.validURL(source),
            indexs = [],
            push = item=>indexs.push(item);
        if(links.length === 0) return this.end();
        if(links.length === 1) return this.getBookIndex(links[0],items=>fn(this.filterBookIndex(items)));
        let app = this.spawn();
        app.end(()=>{
            let _links = util.validURL(app.book.getMeta('source'));
            if(_links.length > links.length){
                links = _links;
            }
            Thread()
            .use((link,next)=>this.getBookIndex(link,items=>{
                items.forEach(push);
                return next();
            }))
            .end(()=>fn(this.filterBookIndex(indexs)))
            .queue(links)
            .log(this.info.bind(this))
            .label('getBookIndexs')
            .setThread(this.getConfig('thread.index'))
            .start();
        });
        app.getBookMeta(links[0]);
        return this;
    }

    filterBookIndex(indexs){
        if (!Array.isArray(indexs)) return [];
        this.info('filterBookIndex');
        let uuid = this.book.getMeta('uuid'),
            Ids = this.cache.get(uuid+'_Ids') || this.book.hashBy('id') || {},
            Sources = this.cache.get(uuid+'_Sources') || this.book.hashBy('source') || {},
            Titles = this.cache.get(uuid+'_Titles') || this.book.hashBy('title') || {},
            newIndexs = [],
            thisUrl = {},
            idUnique = this.getConfig('book.unique.id'),
            titleUnique = this.getConfig('book.unique.title'),
            sourceUnique = this.getConfig('book.unique.source');
        //格式化下载链接
        indexs = indexs.map(util.formatLink);
        //过滤无效链接
        indexs = indexs.filter(index=>{
            let url = index.url;
            if (!url) return false;//过滤空链接
            if (url.indexOf('javascript:') == 0) return false;//过滤脚本
            if (url.indexOf('#') == 0) return false;//过滤锚点
            if (url in thisUrl) return false;//过滤重复链接
            thisUrl[url] = 1;
            return true;
        });
        //创建ID
        indexs.forEach((item,index)=>item.id = classes.Id(item.id || index).val());
        //过滤已下载的链接
        indexs.forEach(index=>{
            if (index.id && idUnique && index.id in Ids) return;
            if (index.url && sourceUnique && index.url in Sources) return;
            if (index.text && titleUnique && index.text in Titles) return;
            Sources[index.url] = true;
            Ids[index.id] = true;
            Titles[index.text] = true;
            newIndexs.push(index);
        });
        this.cache.set(uuid+'_Ids',Ids,true);
        this.cache.set(uuid+'_Sources',Sources,true);
        this.cache.set(uuid+'_Titles',Titles,true);
        if(!this.cache.get(uuid)){
            this.cache.set(uuid,true,true);
            this.end(()=>{//清理缓存
                this.cache.set(uuid+'_Ids',false);
                this.cache.set(uuid+'_Sources',false);
                this.cache.set(uuid+'_Titles',false);
                this.cache.set(uuid,false);
            });
        }
        return newIndexs;
    }

    getChapterContent(link,fn){
        fn = this.next(fn);
        if(!link) return fn(null);
        this.info('getChapterContent');
        let times = util.parseInteger(this.getConfig('app.retry.chapter',3),3);
        link = util.formatLink(link);
        if (!link) return fn(null);
        let setContent = chapter=>{
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
        if(!this.getConfig('book.localization') && !this.getConfig('book.imagelocalization')){
            setContent({title:link.text,source:link.url,id:link.id,content:''});
            return this;
        }
        let requestContent = options=>{
            //console.log(options)
            let success = (options.success || (data=>data)).bind(options);
            options.success = data=>{
                let result = success(data);
                //console.log(result)
                if (!result) return setContent();
                if (typeof result == 'string') return setContent(result);
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
                //this.debug(error);
                if (--times <= 0) return fn(null);
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
        let links;
        let mergeContent = (link,next)=>{
            this.getChapterContent(link,
                _chapter=>this.mergeChapterContent(_chapter,nextChapter=>{
                    if(!nextChapter) return fn(null);
                    if (chapter.content && chapter.content == nextChapter.content) return fn(chapter);
                    if (chapter && chapter.content && nextChapter.content){
                        chapter.content += '\n';
                    }
                    chapter.content += nextChapter.content;
                    return next(chapter);
                })
            )
        }
        if (chapter.nextPages){
            links = chapter.nextPages.map(util.formatLink).filter(link=>link.url !== chapter.source);
            links.forEach((link,idx)=>link.id=chapter.id+'_'+idx);
            links = this.filterBookIndex(links);
            if (!links.length) return fn(chapter);
            this.info('mergeChapters');
            Thread()
            .use(mergeContent)
            .end(()=>fn(chapter))
            .queue(links)
            .log(this.info.bind(this))
            .label('mergeChapters')
            .start();
            return this;
        }
        if (chapter.nextPage){
            links = [chapter.nextPage].map(util.formatLink).filter(link=>link.url !== chapter.source);
            links.forEach((link,idx)=>link.id=chapter.id+'_'+idx);
            links = this.filterBookIndex(links);
            if (!links.length) return fn(chapter);
            this.info('mergeChapter');
            mergeContent(links[0],fn);
            return this;
        }
        return fn(chapter);
    }

    getChapterImages(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        let localization = this.getConfig('book.localization');
        let imageLocalization = this.getConfig('book.imageLocalization');
        if(!localization && !imageLocalization) return fn(chapter);
        let content = chapter.content,
            $ = Parser(content,chapter.source),
            $imgs = $('img'),
            imgs = $imgs.map((i,v)=>({url:$.location($(v).attr('src')),index:i,headers:{referer:$.location()}})).toArray();
        if (!imgs.length) return fn(chapter);
        if (!imageLocalization){
            $imgs.each((i,v)=>{
                let src = $(v).attr('src');
                if(!src){
                    $(v).replaceWith('');
                }else{
                    $(v).replaceWith('[img]'+encodeURI($.location(src))+'[/img]')
                }
            });
            chapter.content = $('body').html();
            return fn(chapter);
        }
        this.info('getChapterImages');
        let ChapterId = classes.Id(chapter.id).val(),
            imgFolder = Path.join(this.bookdir,ChapterId),
            isEmpty = true,
            successAll = true,
            hash = {},
            imageExts = this.getConfig('book.imageExts') || ['.jpg','.png','.gif','.png','.tif','.webp','.bmp','.tga','.jpeg','.ppm','.pgm','.pbm','.pcx','.jpm','.jng','.ico'],
            imgExts = new RegExp(`^(${imageExts.join('|')})$`,'i'),
            minImgSize = util.parseInteger(this.getConfig('book.imageMinSize'),0),
            isImgFile = ext=>imgExts.test(ext),
            hasImgFile = img=>hash[img.name],
            getImgFile = (img,then)=>{
                let times = util.parseInteger(this.getConfig('app.retry.image'),3);
                img.success = data=>{
                    if(minImgSize > data.length || !util.is.isImage(data)) return then();
                    fs.writeFile(img.file,data,then);
                    localization && $imgs.eq(img.index).replaceWith('[img]'+img.src+'[/img]');
                    isEmpty = false;
                };
                img.error = ()=>{
                    if (--times > 0) return this.request(img);
                    localization && $imgs.eq(img.index).replaceWith('[img]'+encodeURI(img.url)+'[/img]');
                    successAll = false;
                    return then();
                    
                };
                this.request(img);
            },
            final = ()=>{
                isEmpty && fs.rmdirsSync(imgFolder);
                if (!successAll && !this.getConfig('app.retry.image')) return fn(null);
                if (!localization) return fn(chapter);
                chapter.content = $('body').html();
                return fn(chapter);
            };

        fs.mkdirsSync(imgFolder);
        try{
            fs.readdirSync(imgFolder).forEach(file=>hash[file]=true);
        }catch(e){/*pass*/}

        let flag = this.getConfig('book.filterimage');

        imgs = imgs.filter((img,idx)=>{
            img.path = URL.parse(img.url).pathname;
            if(!img.path) return false;
            img.ext = Path.extname(img.path);
            if(!isImgFile(img.ext) && flag) return false;
            img.ext = img.ext || '.jpeg';
            img.id = classes.Id(idx).val();
            img.name = img.id + img.ext;
            img.src = ChapterId + '/' + img.name;
            img.file = Path.join(imgFolder,img.name);
            if(hasImgFile(img)){
                localization && $imgs.eq(img.index).replaceWith('[img]'+img.src+'[/img]');
                isEmpty = false;
                return false;
            }
            return true;
        });
        Thread()
        .use(getImgFile)
        .end(final)
        .setThread(this.getConfig('thread.image'))
        .queue(imgs)
        .label('getChapterImages')
        .log(this.info.bind(this))
        .start();
        return this;
    }

    identifyChapterImages(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        if (!chapter.identify) return fn(chapter)
        let imageLocalization = this.getConfig('book.imageLocalization');
        if (imageLocalization) return fn(chapter);
        let content = chapter.content,
            $ = Parser(content,chapter.source),
            $imgs = $('img'),
            imgs = $imgs.map((i,v)=>({url:$.location($(v).attr('src')),index:i})).toArray();
        if (!imgs.length) return fn(chapter);
        let getImgData = (img,next)=>{
            let txt = this.images.get(img.url)
            if (txt){
                $imgs.eq(img.index).replaceWith(txt)
                return next()
            }
            request.get(img.url).then(data=>{
                let base64 = data.toString('base64')
                let txt = this.images.get(base64)
                if(txt){
                    this.images.set(img.url,txt)
                    $imgs.eq(img.index).replaceWith(txt)
                }else{
                    this.images.set(base64,'')
                }
            }).then(next)
        }
        let final = ()=>{
            chapter.content = $('body').html();
            return fn(chapter);
        }
        Thread()
        .use(getImgData)
        .end(final)
        .setThread(this.getConfig('thread.image'))
        .queue(imgs)
        .label('dentifyChapterImages')
        .log(this.info.bind(this))
        .start();
        return this;
    }

    getDeepChapter(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        let $ = Parser(chapter.content,chapter.source);
        if (!this.getConfig('book.deepdownload')){
            $('a').each((i,v)=>{
                let href = $(v).attr('href');
                if (!href || href.indexOf('javascript:') == 0 || href.indexOf('#') == 0){
                    $(v).replaceWith($(v).text())
                }else{
                    $(v).replaceWith('[url='+encodeURI($.location(href))+']'+encodeURI($(v).text())+'[/url]');
                }
            });
            chapter.content = $('body').html();
            return fn(chapter);
        }
        let maxDepth = this.getConfig('book.maxDepth') || Infinity;
        let deepnow = chapter.deep;
        if (deepnow >= maxDepth) return fn(chapter);
        deepnow += 1;
        let links = $('a').map((i,v)=>({
            url:$.location($(v).attr('href')),
            text:$(v).text().trim(),
            deep:deepnow,
            id:chapter.id+'_'+i
        })).toArray();
        links = this.filterBookIndex(links);
        if (links.length){
            this.info(links);
            this.info('getDeepChapter');
            this.chapterThread.queue(links);
        }
        return fn(chapter);
    }

    getNextChapter(chapter,fn){
        fn = this.next(fn);
        if (!chapter)return fn(null);
        if (!this.getConfig('book.nextChapter')) return fn(chapter);
        let nextChapter = chapter.nextChapter;
        if (!nextChapter) return fn(chapter);
        nextChapter.id = classes.Id(nextChapter.id || nextChapter.href || nextChapter.url);
        let nextChapters = this.filterBookIndex([nextChapter]);
        if(nextChapters.length){
            this.chapterThread.queue(nextChapters);
        }
        return fn(chapter);
    }

    saveChapter(chapter,fn){
        fn = this.next(fn);
        if(this.bookdir == null) return fn(null);
        let localization = this.getConfig('book.localization');
        if (!chapter) return fn(null);
        if (!chapter.content && localization) return fn(chapter);
        this.info('saveChapter');
        chapter.date = Date.now();
        this.book.pushList(chapter);
        if (!localization) return fn(chapter);
        this.book.pushChapter(chapter,fn);
        return this;
    }

    getChapter(link,fn){
        fn = this.next(fn);
        this.info('getChapter');
        this.getChapterContent(link,
            x=>this.mergeChapterContent(x,
                x=>this.getNextChapter(x,
                    x=>this.identifyChapterImages(x,
                        x=>this.getChapterImages(x,
                            x=>this.getDeepChapter(x,
                                x=>this.saveChapter(x,fn)
                            )
                        )
                    )
                )
            )
        );
        return this;
    }

    getChapters(links,fn){
        fn = this.next(fn);
        if(links.length === 0) return fn();
        this.info('getChapters');
        let source = this.book.getMeta('source');
        let threads = threadLimit[URL.parse(source).hostname];
        this.chapterThread = Thread()
        .use(this.getChapter.bind(this))
        .end(fn)
        .queue(links)
        .log(this.info.bind(this))
        .interval(this.getConfig('thread.interval'))
        .setThread(threads || this.getConfig('thread.execute'))
        .label('getChapters')
        .start();
        return this;
    }

    generateEbook(fn){
        fn = this.next(fn);
        if (0 === this.getConfig("ebook.activated")) return fn();
        if (!this.book.changed && this.getConfig("ebook.activated") <= 0) return fn();
        this.info('generateEbook');
        let work = child_process.fork(Path.join(__dirname,"lib/ebook/generator_process.js"),{cwd:process.cwd()});
        let options = {
            directory:this.getConfig("ebook.directory"),
            formation:this.getConfig("ebook.formation"),
            bookdir:this.bookdir,
            filename: this.getConfig("ebook.filename"),
            filter:this.getConfig("ebook.filter"),
            sort:this.getConfig("ebook.sort"),
        };
        //this.debug(JSON.stringify(options,null,2));
        fs.mkdirsSync(options.directory);
        this.info("generating ebook...");
        let msg = {};
        work.on("message",msg=>{
            if (!msg.code){
                this.info(Path.resolve(msg.filename));
                this.info(`ebook ${msg.filename} generated successful!`);
                if(!this.platform.match('win')) return;
                if (this.getConfig("ebook.opendirectory")) this.openDir(options.directory);
                if (this.getConfig("ebook.openebookfile")) this.openDir(msg.filename);
            }else {
                this.info(`generate ebook of ${this.book.getMeta('uuid')} failed because of error ${msg.code}!`);
            }
        });
        work.on('exit',()=>{
            this.info("Exit ebook generator!");
            fn(msg);
	})
        work.send(options);
        return this;
    }

    convertEbook(file,fn){
        fn = this.next(fn);
        this.info('convertEbook');
        let work = child_process.fork(Path.join(__dirname,"lib/ebook/convertor_process.js"),{cwd:process.cwd()});
        let options = {
            formation:this.getConfig("ebook.formation"),
            filename:Path.resolve(file),
        };
        this.info("converting ebook...");
        work.on("message",msg=>{
            if (!msg.code){
                this.info("ebook converted successful!");
            }else {
                this.info("ebook convertion failed!");
            }
        });
        work.on('exit',()=>fn());
        work.send(options);
        return this;
    }

    sendToDataBase(fn){
        fn = this.next(fn);
        let meta = this.book.meta;
        if (!meta.title || !meta.author) return fn();
        if (!this.book.changed && this.database.query('uuid='+meta.uuid).length) return fn();
        this.info('sendToDataBase');
        delete meta.cover;
        this.info(meta);
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

    reDownloadBook(dir){
        process.nextTick(this.reDownloadCmd.bind(this,dir));
        return this;
    }

    autoUpdateBook(dir){
        process.nextTick(this.autoUpdateCmd.bind(this,dir));
        return this;
    }

    outportBook(dir){
        let app = this.spawn();
        app.config.set('ebook.activated',true);
        app.config.set('ebook.formation','wbk');
        app.end(this.end.bind(this));
        process.nextTick(app.eBookCmd.bind(app,dir));
        return this;
    }

    deleteBook(uuid){
        fs.mkdirsSync('.Trash');
        fs.stat('.Trash/'+uuid,(err,stat)=>{
            if(!err){
                fs.rmdirsSync('.Trash/'+uuid)
            }
            fs.rename(uuid,'.Trash/'+uuid,err=>{
                this.database.remove(uuid);
                this.end();
            });
        });
        return this;
    }

    recoveryBook(uuid){
        if (this.database.query(`uuid=${uuid}`).length) return this.end()
        fs.stat('.Trash/'+uuid+'/index.book',(err,stat)=>{
            if(err) return this.end()
            fs.rename('.Trash/'+uuid,uuid,err=>{
                if(err) return this.end();
                this.importBookRecord(uuid)
            });
        })
        return this;
    }

    removeBookRecord(uuid){
        process.nextTick(()=>{
            this.database.remove(uuid);
            this.end();
        });
        return this;        
    }

    importBookRecord(uuid){
        process.nextTick(this.importBookRecordCmd.bind(this,uuid));
        return this;
    }

    ebook(dir){
        let app = this.spawn();
        app.config.set('ebook.activated',true);
        app.end(this.end.bind(this));
        process.nextTick(app.eBookCmd.bind(app,dir));
        return this;
    }

    filterBook(dir){
        process.nextTick(this.filterBookContentCmd.bind(this,dir));
        return this;
    }

    ebooks(dirs,thread){
        Thread()
        .use((dir,next)=>this.spawn().ebook(dir).end(next))
        .end(this.next())
        .queue(dirs)
        .log(this.info.bind(this))
        .label('convertEbooks')
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    newBooks(urls,thread){
        Thread()
        .use((url,next)=>this.spawn().newBook(url).end(next))
        .end(this.next())
        .queue(urls)
        .log(this.info.bind(this))
        .label('newBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.new') || 1, this.maxThreads))
        .start();
        return this;
    }

    updateBooks(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().updateBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('updateBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    refreshBooks(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().refreshBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('refreshBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.refresh') || 1, this.maxThreads))
        .start();
        return this;
    }

    reDownloadBooks(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().reDownloadBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('reDownloadBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.new') || 1, this.maxThreads))
        .start();
        return this;
    }

    outportBooks(uuids,thread){
         Thread()
        .use((dir,next)=>this.spawn().outportBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('outportBooks')
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    deleteBooks(uuids){
        Thread()
        .use((dir,next)=>this.spawn().deleteBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('deleteBooks')
        .start();
        return this;
    }

    recoveryBooks(uuids){
        Thread()
        .use((dir,next)=>this.spawn().recoveryBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('recoveryBooks')
        .start();
        return this;
    }

    removeBookRecords(uuids){
        Thread()
        .use((dir,next)=>this.spawn().removeBookRecord(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('removeBookRecords')
        .start();
        return this;
    }

    importBookRecords(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().importBookRecord(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('importBookRecords')
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    convertEbooks(uuids,thread){
        Thread()
        .use(this.convertEbook.bind(this))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('convertEbooks')
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    autoUpdateBooks(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().autoUpdateBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('refreshBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
        .start();
        return this;
    }

    filterBooks(uuids,thread){
        Thread()
        .use((dir,next)=>this.spawn().filterBook(dir).end(next))
        .end(this.next())
        .queue(uuids)
        .log(this.info.bind(this))
        .label('filterBooks')
        .interval(5000)
        .setThread(Math.min(thread || this.getConfig('thread.update') || 1, this.maxThreads))
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
    readline:readline,
    Path:Path,
    child_process:child_process,
    url:URL,
    Random:Random,
    classes:classes,
    util:util,
    Log:Log
};

module.exports = Wedge;

