"use strict"
const fs = require("fs");
const Path = require("path");
const URL = require("url");
const querystring = require("querystring");
const EventEmitter = require('events');
const child_process = require('child_process');
const readline = require('readline');
const Random = require('./lib/jsrandom');
const Log = require("./lib/Log");
const Hash = require("./lib/Hash");
const DataBase = require("./lib/database");
const request = require("./lib/request");
const utils = require("./lib/utils");
const Thread = require("./lib/thread");
const Cache = require("./lib/Cache");
const setting = require("./setting");
const Searcher = require("./searcher");
const Engine = require("./lib/Engine");
const loader = require("./lib/loader");
const decoder = require("./lib/parser/decoder");
const Parser = require("./lib/parser");
const Sites = require("./lib/Sites");
const Attributes = require("./lib/attributes");
const Chapter = require('./lib/book/chapter');
const MetaData = require("./lib/book/metadata");
const objectUtils = require('./lib/utils/object');

class Wedge extends EventEmitter{
    constructor(dir){
        super();
        this.config = new Hash(setting);
        this.chdir(dir);
        this.init();
        this.plugins = {};
        this.config
            .get("plugins")
            .filter(plugin=>plugin.activated)
            .forEach(plugin=>this.install(plugin));
    }

    init(){
        this.label = Random.uuid(10,16);
        this.config.get('thread.log') && this.Thread.LOG.on();
        this.newBooks = Thread((url,next)=>this.spawn().newBook(url).end(next),()=>this.end(),this.config.get("thread.new"));
        this.updateBooks = Thread((url,next)=>this.spawn().updateBook(url).end(next),()=>this.end(),this.config.get("thread.update"));
        return this;
    }

    chdir(dir){
        utils.mkdirsSync(dir);
        process.chdir(dir);
        this.dir = Path.resolve(dir);
        this.config.file("setting.json");
        this.database.close();
        this.database.file(Path.join(this.dir,"metadatas.json"));
        this.database.unique(this.config.get("database.primary"));
        return this;
    }

    spawn(dir){
        dir = dir || this.dir;
        dir = Path.resolve(this.dir,dir);
        var self = this;
        function Fork(){
            this.config = new Hash(setting);
            this.dir = dir;
            this.config.set(self.config.valueOf());
            this.init();
            this.config
                .get("plugins")
                .filter(plugin=>plugin.activated)
                .forEach(plugin=>this.install(plugin));
        }
        Fork.prototype=Wedge.prototype;
        return new Fork();
    }

    install(plugin){
        try{
            this.plugins[plugin.name] = require(plugin.func).bind(this);
        }catch (e){}
        return this;
    }

    range(template,start,end){
        return Array(end-start+1).fill(start).map((x,y)=>x+y).map(x=>template.replace(/\*/g,x));
    }

    terminal(docs,fn){
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

    series(fns){
        utils.async.thread().series(fns);
        return this;
    }

    parallel(array,fn,final,threadNumber){
        var threadLog = this.config.get('thread.log');
        var fn = fn || this.noop;
        var final = final || this.noop;
        var threadNumber = threadNumber || 3;
        var running = 0;
        var sumLength = array.length;
        array = array.concat();
        var execute = (fn)=>{
            var element = array.shift();
            if (element){
                running += 1;
                fn(element,()=>{
                    running -= 1;
                    threadLog && this.log(sumLength - array.length - running + " of " + sumLength);
                    process.nextTick(()=>execute(fn));
                });
            }else {
                if (running == 0) return final();
            }
        }
        for (var index=0;index<threadNumber;index++){
            execute(fn);
        }
        return this;
    }

    //绑定或触发end事件
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
        this.log(msg);
        return this.end();
    }

    next(){
        var args = [].slice.call(arguments);
        var fn = args.shift();
        if (typeof fn !== "function"){
            fn = this.noop;
        }
        setImmediate(()=>fn.apply(this,args));
        return this;
    }

    initLog(){
        var appLog = this.config.get('app.log');
        if(appLog == false) {
            this.log = Wedge.prototype.log = function(){
                return this;
            };
        };
        if(appLog === true){
            this.log = Wedge.prototype.log = function(){
                var args = [].slice.call(arguments);
                args.unshift(this.label);
                console.log.apply(console,args);
                return this;
            }
        }
        if('string' === typeof appLog){
            this.log = Wedge.prototype.log = new Log(appLog);
        }
    }

    log(){
        this.initLog();
        this.log.apply(this,arguments);
        return this;
    }

    debug(){
        this.config.get('app.debug') && this.log.apply(this,arguments);
        return this;
    }

    encodeURI(str,charset){
        if (!charset) return encodeURIComponent(str);
        var buffer = decoder.encode(str,charset);
        var code = '';
        for (var i=0;i<buffer.length;i++){
            code += '%';
            code += buffer[i].toString(16).toUpperCase();
        }
        return code;
    }

    decodeURI(str,charset){
        if (!charset) return decodeURIComponent(str);
        var array = str.split('%').slice(1).map(x=>parseInt(x,16));
        return decoder.decode(new Buffer(array),charset);
    }

    encodeBase64(str){
        return new Buffer(str).toString('base64');
    }

    decodeBase64(str){
        return new Buffer(str,'base64').toString();
    }

    loadJSON(dir){
        return JSON.parse(fs.readFileSync(dir).toString());
    }

    formatLink(url){
        if (typeof url === "string"){
            return {href:url}
        }
        url.href = url.href || url.url || url.src;
        url.method = (url.method || "GET").toUpperCase();
        return url;
    }

    fuzzysearchBook(title,fn){
        var self = this;
        var links = [];

        Thread((site,next)=>{
            if (!site) return next();
            if (!site.url) return next();
            var url = site.url.replace('%title%',self.encodeURI(title,site.charset));
            var method = (site.method || "get").toUpperCase();
            var data = site.data && site.data.replace('%title%',title);
            function success(data){
                if (site.parse){
                    links = links.concat(new Function('json','try{return (' + site.parse + ')}catch(e){return []}')(data));
                }else {
                    var $ = Parser(data,url).$;
                    $('a').filter((i,v)=>$(v).text().indexOf(title) > -1).each((i,v)=>links.push([$.location($(v).attr('href')),$(v).text().trim()]));
                }
                return next();
            }
            return request.ajax({
                url:url,
                method:method,
                data:data,
                success:success,
                error:next
            });
        },()=>{
            var hash = {};
            links.forEach(link=>hash[link[0]]=link[1]);
            var array = [];
            for (var x in hash){
                array.push([x,hash[x]]);
            }
            return fn(array);
        })(Searcher,3);
        return this;
    }

    searchBook(title,fn){
        title = title.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
        return this.fuzzysearchBook(title,function (links){
            fn(links.filter(link=>link[1] === title));
        });
    }

    CMD(pipeline){
        var self = this;
        return pipeline.split(' > ').map(fnName=>{
            var fn = self[fnName];
            if (!fn.length){
                return next=>{
                    fn.call(self);
                    return next();
                }
            }else {
                return fn.bind(self);
            }
        });
    }

    updateBookCMD(){
        this.series(this.CMD('saveBook > checkBookCover > getBookIndex > mergeBookIndex > filterBookIndex > getChapters > saveBook > sendToDataBase > generateEbook > end'));
        return this;
    }

    //新建书籍
    newBookCMD(){
        this.series(this.CMD('getBookMeta > searchBookMeta > createBook > updateBookMeta > getBookCover > saveBook > getBookIndex > mergeBookIndex > filterBookIndex > getChapters > saveBook > sendToDataBase > generateEbook > end'));
        return this;
    }

    refreshBook(directory){
        this.loadBook(directory,(error,book)=>{
            if (error) return this.end();
            this.book = book;
            this.bookMeta = book.meta;
            this.series(this.CMD('searchBookMeta > updateBookMeta > getBookCover > saveBook > sendToDataBase > generateEbook > end'));
        });
        return this;
    }

    refreshBooks(){
        this.parallel(utils.toArray(arguments),(dir,next)=>{
            this.spawn().refreshBook(dir).end(next);
        });
        return this;
    }

    updateBook(directory){
        this.debug('updateBook');
        this.loadBook(directory,(error,book)=>{
            if (error){//书籍不存在
                if (!this.url){
                    return this.end();
                }else {
                    return this.newBook(this.url);
                }
            }else {//书籍加载成功
                this.book = book;
                this.url = book.meta.get("source");
                return this.updateBookCMD();
            }
        });
        return this;
    }

    newBook(url){
        this.debug('newBook');
        this.log(url);
        this.url = url;
        this.newBookCMD();
        return this;
    }

    loadBook(dir,fn){
        this.debug('loadBook');
        if (typeof dir == "function"){
            fn = dir;
            dir = this.bookdir;
        }
        this.bookdir = Path.resolve(dir || this.bookdir);
        this.Loader.config(this.config.get("loader"));
        this.Loader.bookIndex(this.bookdir,fn);
        return this;
    }

    //获取书籍信息
    getBookMeta(fn){
        if (!this.url) return this.error("No URL...");
        this.debug('getBookMeta');
        var link = this.formatLink(this.url);
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var parsedData = parser.getParsedData();
            var infoPage = parsedData.infoPage;
            var indexPage = parsedData.indexPage;
            var redirectPage = parsedData.redirectPage;
            if (!infoPage){
                if (!indexPage){
                    if (!redirectPage){
                        this.debug(parser.$.raw);
                        return this.error("this url is Not infoPage or request failed");
                    }
                    this.url = redirectPage.infoPage || redirectPage.indexPage;
                    return setImmediate(()=>this.getBookMeta(fn));
                }else {
                    this.url = indexPage.infoPage;
                    return setImmediate(()=>this.getBookMeta(fn));
                }
            }else {
                //初始化MetaData
                this.bookMeta = new MetaData(infoPage.bookInfos);
                this.bookMeta.set("uuid",[this.bookMeta.get("author"),this.bookMeta.get("title")].join(" - "));
                //获取目录页
                var url = infoPage.indexPage;
                //多目录页
                if (Array.isArray(url)){
                    this.url = url.shift();
                    this.otherUrls = url;
                }else {
                    this.url = url;
                }
                //非GET模式
                if ("object" == typeof this.url){
                    this.bookMeta.set("source", link.href);
                }else {
                    //默认GET模式
                    this.bookMeta.set("source", this.url);
                }
                return this.next(fn);
            }
        },()=>this.end(),this.config.get('app.retry.meta'));
        return this;
    }
    //创建书籍
    createBook(fn){
        if (!this.bookMeta) return this.error("No bookMeta...");
        this.debug('createBook');
        //书籍目录
        this.bookdir = Path.join(this.dir,this.bookMeta.get("uuid"));
        utils.mkdirsSync(this.bookdir);
        this.loadBook((error,book)=>{
            this.book = book;
            //新书
            if (error) return this.next(fn);
            //已存在
            var source = book.meta.get("source");
            if (source == this.url){
                this.log("update...");
                return this.updateBookCMD();
            }else {//冲突
                if (this.config.get("book.changesource")){//换源
                    this.log("changesource...");
                    if (this.config.get("book.override")){//覆盖旧章节
                        book.list.empty();
                    }
                    return this.next(fn);
                }else {//不换源
                    //console.log(source)
                    this.url = source;
                    this.log("origin...");
                    this.log(this.url);
                    return this.updateBookCMD();
                }
            }
        });
        return this;
    }
    //搜索书籍信息
    searchBookMeta(fn){
        if (this.config.get('book.searchmeta') == false) return fn();
        var bookMeta = this.bookMeta;
        var title = bookMeta.get("title");
        var source = bookMeta.get("source");
        var author = bookMeta.get("author");
        var uuid = bookMeta.get('uuid');
        var next = this.next.bind(this,fn);
        //if (this.database.query('uuid='+uuid) && title && author) return next();
        var except = new RegExp(Searcher.map(x=>x.name.replace(/\./g,'\\.')).join('|'),'gi');
        if(source.match(except)) return next();
        this.debug('searchBookMeta');
        function like(s1,s2){
            s1 = s1.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
            s2 = s2.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
            if (s1.indexOf(s2)>-1) return true;
            if (s2.indexOf(s1)>-1) return true;
            return false;
        }
        this.searchBook(title,links=>{
            Thread((link,nextFn)=>{
                var app = this.spawn();
                app.url = link;
                app.getBookMeta(()=>{
                    var meta = app.bookMeta.valueOf();
                    for (var x in meta){
                        if (meta[x] === '') return nextFn();
                    }
                    if (!like(meta.title,title)) return nextFn();
                    if (!like(meta.author,author)) return nextFn();
                    this.log(meta.source)
                    delete meta.source;
                    bookMeta.set(meta);
                    return next();
                }).end(nextFn);
            },next)(links.map(link=>link[0]))
        });
        return this;
    }
    //更新书籍信息
    updateBookMeta(fn){
        if (!this.bookMeta) return this.error("No bookMeta...");
        if (!this.book) return this.error("No book...");
        this.debug('updateBookMeta');
        this.book.meta.set(this.bookMeta.valueOf());
        this.book.meta.set("uuid",[this.book.meta.get("author"),this.book.meta.get("title")].join(" - "));
        return this.next(fn);
    }
    //获取书籍封面
    getBookCover(fn){
        var next = this.next.bind(this,fn);
        var coverSrc = this.book.meta.get("cover");
        if (!/^http/i.test(coverSrc)) return next();
        this.debug('getBookCover');
        var link = this.formatLink(coverSrc);
        this.getImageData(link,data=>{
            this.book.meta.set("cover",data);
            this.hasNewChapter = true;
            fs.writeFile(Path.join(this.bookdir,"cover.jpg"),data,next);
        },next,this.config.get('app.retry.cover'));
        return this;
    }
    //检查封面图片是否存在
    checkBookCover(fn){
        if (!this.bookdir) return this.error("No BookDir...");
        var coverSrc = this.book.meta.get("cover");
        var coverDir = Path.join(this.bookdir,"cover.jpg");
        var next = this.next.bind(this,fn);
        fs.exists(coverDir,(exist)=>{
            if (exist){
                fs.readFile(coverDir,(err,data)=>{
                    this.book.meta.set("cover",data);
                    return next();
                });
            }else {
                if (/^http/i.test(coverSrc)){
                    return this.getBookCover(fn);
                }else {
                    fs.writeFile(coverDir,this.book.meta.cover.toBuffer(),next);
                }
            }
        });
        return this;
    }
    //保存书籍
    saveBook(fn){
        this.debug('saveBook');
        var next = this.next.bind(this,fn);
        if (!this.book) return this.error("No Book...");
        if (!this.bookdir) return this.error("No BookDir...");
        this.book.meta.set("date",+new Date());
        this.book.localization(this.bookdir,next);
        return this;
    }
    //获取书籍目录
    getBookIndex(fn){
        this.debug('getBookIndex');
        var link = this.formatLink(this.url);
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var bookIndex = objectUtils.get(parser.getParsedData(),"indexPage.bookIndexs");
            if (!bookIndex) return this.end();
            this.bookIndex = bookIndex;
            return this.next(fn);
        },()=>this.end(),this.config.get('app.retry.index'));;
        return this;
    }
    //合并书籍目录
    mergeBookIndex(fn){
        this.debug('mergeBookIndex');
        var next = this.next.bind(this,fn);
        if (!this.otherUrls) return next();
        var mergeIndex = (url,then)=>{
            var link = this.formatLink(url);
            this.getRawData(link,data=>{
                var parser = Parser(data,link.href);
                var bookIndex = objectUtils.get(parser.getParsedData(),"indexPage.bookIndexs");
                if (bookIndex){
                    bookIndex.forEach(link=>this.bookIndex.push(link));
                }
                return this.next(then);
            },()=>this.next(then),this.config.get('app.retry.index'));
        }
        Thread(mergeIndex,next)(this.otherUrls,this.config.get("thread.merge"));
        return this;
    }
    //过滤书籍目录
    filterBookIndex(fn){
        this.debug('filterBookIndex');
        var Id = this.Types.id();
        this.bookIndex.forEach((link,index)=>{
            link.id = Id.val(link.id || index).val();
        });
        var idHash = this.book.list.hash("id");
        var srcHash = this.book.list.hash("source");
        this.bookIndex = this.bookIndex.filter(link=>!idHash[link.id]).filter(link=>!srcHash[link.href]);
        this.next(fn);
        return this;
    }

    chapterCMD(chapter,fn){
        this.series([
            then=>this.mergeChapter(chapter,then),
            (chapter,then)=>this.getDeepChapter(chapter,then),
            (chapter,then)=>this.getChapterImages(chapter,then),
            (chapter,then)=>this.formatChapter(chapter,then),
            (chapter,then)=>this.saveChapter(chapter,then),
            (chapter,then)=>this.saveChapterIndex(chapter,fn)
        ]);
        return this;
    }

    getChapters(fn){
        this.debug('getChapters');
        Thread((link,next)=>{
            this.getChapter(link,chapter=>this.chapterCMD(chapter,next));
        },()=>this.next(fn))(this.bookIndex,this.config.get("thread.execute"));
        return this;
    }
    //获取章节内容
    getChapter(link,fn){
        this.debug('getChapter');
        //this.debug(link);
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var thisChapter = parser.getChapterContent();
            if (!thisChapter) return this.next(fn,null);
            thisChapter.deep = link.deep || 0;
            thisChapter.id = thisChapter.id || link.id;
            thisChapter.source = thisChapter.source || link.href;
            thisChapter.title = thisChapter.title || link.text;
            return this.next(fn,thisChapter);
        },()=>this.next(fn,null),this.config.get('app.retry.chapter'));
        return this;
    }

    mergeChapter(chapter,fn){
        if (!chapter)return this.next(fn,null);
        chapter.content = chapter.content || "";
        if (chapter.ajax){
            this.debug('ajax...');
            this.request.ajax(chapter.ajax).then(data=>{
                if (chapter.content){
                    chapter.content += "\n";
                }
                chapter.content += data;
                return this.next(fn,chapter);
            });
        }else if (chapter.nextPage){
            if (chapter.nextPage == chapter.source) return this.next(fn,chapter);
            var link = {href:chapter.nextPage};
            this.debug('mergeChapter');
            this.getChapter(link,nextChapter=>this.mergeChapter(nextChapter,nextChapter=>{
                if (!nextChapter) return this.next(fn,null);
                if (nextChapter.id && nextChapter.id !== chapter.id){
                    return this.chapterCMD(nextChapter,fn);
                }
                if (chapter.content && chapter.content == nextChapter.content){
                    return  this.next(fn,chapter);
                }
                if (chapter && chapter.content && nextChapter.content){
                    chapter.content += "\n";
                }
                chapter.content += nextChapter.content;
                return this.next(fn,chapter);
            }));
        }else if (chapter.nextPages){
            var sourceHash = this.book.list.hash("source");
            var links = chapter.nextPages.filter(link=>!sourceHash[link.href]);
            if (!links.length) return this.next(fn,chapter);
            this.debug('mergeChapters');
            Thread((link,next)=>{
                this.getChapter(link,nextChapter=>{
                    if (!nextChapter){
                        chapter = null;
                        return next();
                    }
                    if (nextChapter.id && nextChapter.id !== chapter.id){
                        return this.chapterCMD(nextChapter,next);
                    }
                    if (chapter && chapter.content && nextChapter.content){
                        chapter.content += "\n";
                    }
                    chapter.content += nextChapter.content;
                    return next();
                });
            },()=>this.next(fn,chapter))(links);
        }else {
            return this.next(fn,chapter);
        }
    }

    getChapterImages(chapter,fn){
        if (!chapter)return this.next(fn,chapter);
        var parser = Parser(chapter.content,chapter.source);
        var imgs = parser.getImageLinks();
        imgs = imgs.filter(img=>img.href);
        if (!imgs.length){
            return this.next(fn,chapter);
        }
        if (!this.config.get("book.imagelocalization")){
            return this.next(fn,chapter);
        }
        this.debug('getChapterImages');
        parser.convertImageLink();
        var content = parser.$.html();
        var Id = this.Types.id();
        var id = Id.val(chapter.id).val();
        var isEmpty = true;
        var imgFolder = Path.join(this.bookdir,id);
        utils.mkdirsSync(imgFolder);
        imgs.forEach(img=>{
            var extname = Path.extname(URL.parse(img.href).pathname);
            if(!extname.match(/^(.html|.png|.gif|.png|.tif|.webp|.bmp|.tga|.ppm|.pgm|.jpeg|.pbm|.pcx|.jpm|.jng)$/i)){
                extname = '.jpg';
            }
            var basename = Id.val(img.index).val();
            var filename = basename + extname;
            var imgDir = id + '/' + filename;
            var imgFile = Path.join(imgFolder,filename);
            img.file = imgFile;
            img.src = imgDir;
            img.name = filename;
        });
        fs.readdir(imgFolder,(err,files)=>{
            if(err) files = [];
            var hash = {};
            files.forEach(file=>hash[file]=true);
            imgs.filter(img=>hash[img.name]).forEach(img=>{
                isEmpty = false;
                content = content.replace("{%img=" + img.index + "%}",'<img src="'+img.src+'">');
            });
            imgs = imgs.filter(img=>(!hash[img.name] && !img.file.match(/\.html$/i)));
            Thread((img,then)=>{
                this.getImageData(img,data=>{
                    fs.writeFile(img.file,data,()=>{
                        content = content.replace("{%img=" + img.index + "%}",'<img src="'+img.src+'">');
                        isEmpty = false;
                        return this.next(then);
                    });
                },()=>{
                    chapter = null;
                    this.log(img.src,img.href);
                    content = content.replace("{%img=" + img.index + "%}",'<img src="'+img.href+'">');
                    return this.next(then);
                },this.config.get('app.retry.image'));
            },()=>{
                isEmpty && utils.rmdirs(imgFolder);
                if (!chapter) return this.next(fn,null);
                chapter.content = content;
                return this.next(fn,chapter);
            })(imgs,this.config.get("thread.image"));
        });
        return this;
    }

    getDeepChapter(chapter,fn){
        if (!chapter)return this.next(fn,null);
        if (!this.config.get("book.deepdownload")){
            return this.next(fn,chapter);
        }
        var maxdeep = this.config.get("book.maxdeep") || 1;
        var deepnow = chapter.deep;
        if (deepnow >= maxdeep) return this.next(fn,chapter);
        var parser = Parser(chapter.content,chapter.source);
        var links = parser.getHrefLinks();
        deepnow += 1;
        var hash = this.book.list.hash("source");
        links.forEach(link=>link.id = chapter.id + '_' + link.index);
        links.forEach(link=>link.deep = deepnow);
        links = links.filter(link=>link.href).filter(link=>!hash[link.href]);
        if (!links.length) return this.next(fn,chapter);
        this.debug(links)
        this.debug('getDeepChapter');
        Thread((link,next)=>{
            this.getChapter(link,thisChapter=>this.chapterCMD(thisChapter,data=>{
                if (!data) chapter = null;
                return next();
            }));
        },()=>this.next(fn,chapter))(links);
        return this;
    }

    formatChapter(chapter,fn){
        if (!chapter) return this.next(fn,null);
        this.debug('formatChapter');
        var parser = Parser("","");
        chapter = new Chapter(chapter).config(this.config.get("formation.json"));
        var content = chapter.get("content");
        content = parser.Tools.toSimple(content).val();
        content = parser.Tools.mergeLine(content).val();
        chapter.set("content",content);
        chapter.set("size",content.length);
        chapter.set("date",+new Date());
        return this.next(fn,chapter);
    }

    saveChapter(chapter,fn){
        if (!this.config.get("book.localization")) return this.next(fn,chapter);
        if (!chapter)return this.next(fn,null);
        if (!chapter.get('content')) return this.next(fn,chapter);
        this.debug('saveChapter');
        fs.writeFile(Path.join(this.bookdir,chapter.get('id') + ".json"),chapter.toString(),()=>{
            this.hasNewChapter = true;
            this.next(fn,chapter);
        });
        return this;
    }

    saveChapterIndex(chapter,fn){
        if (!chapter)return this.next(fn,null);
        this.debug('saveChapterIndex');
        var list = chapter.valueOf();
        list.file = list.id + ".json";
        this.book.list.push(list);
        this.book.localization(this.bookdir,()=>this.next(fn,chapter));
        return this;
    }

    getImageData(link,success,failure,retryTimes){
        var count = 0;
        var retryTimes = retryTimes || 0;
        var options = {
            url:link.href || link.url || link.src,
            method:link.method,
            dataType:'image',
            timeout:this.config.get("request.timeout"),
            reconnect:this.config.get("request.imagereconnect"),
            proxy:this.config.get('request.proxy'),
            proxyAuth:this.config.get('request.proxyAuth'),
            success:success || link.success,
            error:failure || link.error
        }
        var label = options.url;
        var success = options.success;
        var error = options.error;
        var data = this.cache.get(label);
        if (data){
            this.debug('getCache...');
            success(data);
        }else {
            options.success = data =>{
                this.cache.set(label,data);
                return success(data);
            }
            options.error = err=>{
                count += 1;
                if (count > retryTimes){
                    return error(err)
                }
                this.request.ajax(options);
            }
            this.request.ajax(options);
        }
        return this;
    }
    //获取数据
    getRawData(link,success,failure,retryTimes){
        var count = 0;
        var retryTimes = retryTimes || 0;
        var options = {
            url:link.href || link.url || link.src,
            method:link.method,
            data:link.data,
            timeout:this.config.get("request.timeout"),
            reconnect:this.config.get("request.reconnect"),
            proxy:this.config.get('request.proxy'),
            proxyAuth:this.config.get('request.proxyAuth'),
            success:success || link.success,
            error:failure || link.error
        }
        var label = options.url;
        var success = options.success;
        var error = options.error;
        var data = this.cache.get(label);
        if (data){
            //this.debug(label);
            this.debug('getCache...');
            success(data);
        }else {
            options.success = data =>{
                this.cache.set(label,data);
                return success(data);
            }
            options.error = err=>{
                count += 1;
                if (count >= retryTimes){
                    return error(err)
                }
                this.request.ajax(options);
            }
            this.request.ajax(options);
        }
        return this;
    }

    generateEbook(fn){
        var need = false;
        if (this.config.get("ebook.activated") == "auto" && this.hasNewChapter){
            need = true;
        }
        if (this.config.get("ebook.activated") == true){
            need = true;
        }
        if (!need) return this.next(fn);
        this.debug('generateEbook');
        var work = child_process.fork(Path.join(__dirname,"lib/ebook/generator.js"),{cwd:process.cwd()});
        var options = {
            directory:this.config.get("ebook.directory"),
            formation:this.config.get("ebook.formation"),
            bookdir:this.bookdir
        };
        utils.mkdirsSync(options.directory);
        work.send(options);
        var ebookfile = this.book.meta.get("author") + " - " + this.book.meta.get("title") + "." + this.config.get("ebook.formation");
        this.log("generating ebook >>> " + ebookfile);
        work.on("message",msg=>{
            if (msg.msg == "success"){
                this.log("ebook generated successful...");
                if (this.config.get("ebook.opendirectory")){
                    this.openDir(options.directory);
                }
                if (this.config.get("ebook.openebookfile")){
                    this.openDir(Path.join(options.directory,ebookfile));
                }
            }else {
                this.log("ebook generation failed...");
            }
            this.next(fn);
        });
        return this;
    }

    sendToDataBase(fn){
        if (!this.book) return this.next(fn);
        this.debug('sendToDataBase');
        var meta = this.book.meta.valueOf();
        delete meta.cover;
        this.log(meta);
        this.database.push(meta);
        return this.next(fn);
    }

    openDir(dir){
        dir = Path.resolve(this.dir,dir);
        child_process.exec('start "" "' + dir + '"');
    }

    start(){
        var args = [].slice.call(arguments);
        if (args.length == 0) return this.end();
        if (args.length == 1){
            if (Array.isArray(args[0])){
                var urls = args[0].concat();;
                this.url = urls.shift();
                this.otherUrls = urls;
                return this.newBookCMD();
            }
            if (typeof args[0] == "string"){
                return this.newBook(args[0]);
            }
        }
        if (args.length > 1){
            return this.start(args);
        }
    }

    injectRule(rule){
        var Sitesdir = Path.join(__dirname,'./lib/Sites/plugins');
        var host = rule.host;
        var ruledir = Path.join(Sitesdir,host);
        utils.mkdirsSync(ruledir);
        var main = {
            host:rule.host,
            match:rule.match,
            charset:rule.charset,
            selector:'require("./selector")',
            replacer:'require("./replacer")'
        }
        fs.writeFileSync(ruledir+'/index.js','module.exports = '+JSON.stringify(main,null,4));
        fs.writeFileSync(ruledir+'/selector.json',JSON.stringify(rule.selector,null,4));
        fs.writeFileSync(ruledir+'/replacer.json',JSON.stringify(rule.replacer,null,4));
        return this;
    }
}

Wedge.prototype.request = request;
Wedge.prototype.Loader = loader;
Wedge.prototype.Decoder = decoder;
Wedge.prototype.Parser = Parser;
Wedge.prototype.Sites = Sites;
Wedge.prototype.Attributes = Attributes;
Wedge.prototype.Types = Attributes.classes;
Wedge.prototype.Thread = Thread;
Wedge.prototype.noop = function(){};
Wedge.prototype.share = new Hash();
Wedge.prototype.database = new DataBase();
Wedge.prototype.cache = new Cache(8*1024*1024);
Wedge.prototype.searchEngine = new Engine('360');
Wedge.prototype.lib = {
    utils:utils,
    fs:fs,
    querystring:querystring,
    Path:Path,
    child_process:child_process,
    url:URL,
    Random:Random
}

module.exports = Wedge;