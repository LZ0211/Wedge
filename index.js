"use strict"
const fs = require("fs");
const Path = require("path");
const URL = require("url");
const querystring = require("querystring");
const EventEmitter = require('events');
const child_process = require('child_process');
const Random = require('./lib/jsrandom');
const Hash = require("./lib/Hash");
const DataBase = require("./lib/database");
const request = require("./lib/request");
const utils = require("./lib/utils");
const setting = require("./setting");
const Searcher = require("./searcher");
const loader = require("./lib/loader");
const decoder = require("./lib/parser/decoder");
const Parser = require("./lib/parser");
const Attributes = require("./lib/attributes");
const Chapter = require('./lib/book/chapter');
const MetaData = require("./lib/book/metadata");
const objectUtils = require('./lib/utils/object');

class Wedge extends EventEmitter{
    constructor(dir){
        super();
        this.init();
        this.chdir(dir);
        this.config
            .get("plugins")
            .filter(plugin=>plugin.activated)
            .forEach(plugin=>this.install(plugin));
    }

    init(){
        this.plugins = {};
        this.config = new Hash(setting);
        this.label = Random.uuid(10,16);
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
            this.init();
            this.dir = dir;
            this.config = self.config;
            this.config
                .get("plugins")
                .filter(plugin=>plugin.activated)
                .forEach(plugin=>this.install(plugin));
        }
        Fork.prototype=Wedge.prototype;
        return new Fork();
    }

    install(plugin){
        var self = this;
        this.plugins[plugin.name] = require(plugin.func).bind(self);
        return self;
    }

    range(template,start,end){
        return Array(end-start+1).fill(start).map((x,y)=>x+y).map(x=>template.replace(/\*/g,x));
    }

    batch(fun,thread){
        var self = this;
        var thread = thread || this.config.get("thread.batch");
        return (array,next)=>{
            next = next || self.noop;
            self.parallel(array,(item,next)=>fun.call(self.spawn(),item,next),next,thread);
        }
    }

    terminal(doc,fn){
        var args = [];
        var len = Math.max(doc.length,fn.length);
        var ref = 0;
        if (len == 0)return fn.apply(null,args);
        process.stdin.setEncoding("utf8");
        process.stdout.write(doc[ref] || "");
        var listener = data=>{
            if(typeof data === 'string'){
                data = data.trim();
            }
            args.push(data);
            ref += 1;
            if (ref == len){
                process.stdin.removeListener("data",listener);
                fn.apply(null,args);
            }else {
                process.stdout.write(doc[ref]);
            }
        }
        process.stdin.on("data",listener);
    }

    series(fns){
        utils.async.thread().series(fns);
        return this;
    }

    parallel(array,fn,final,threadNumber){
        var threadLog = this.config.get('thread.log');
        var fn = fn || this.noop;
        var final = final || this.noop;
        var threadNumber = threadNumber || this.config.get("thread.execute") || 3;
        var running = 0;
        var sumLength = array.length;
        var execute = (fn)=>{
            var element = array.shift();
            if (element){
                running += 1;
                fn(element,()=>{
                    running -= 1;
                    threadLog && this.log(sumLength - array.length - running + " of " + sumLength);
                    execute(fn);
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
    end(fn){
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
        fn.apply(this,args);
        return this;
    }

    log(){
        if(this.config.get('app.log') == false) return;
        var args = [].slice.call(arguments);
        args.unshift(this.label);
        console.log.apply(console,args);
    }

    cmd(s){
        child_process.exec('cmd /c ' + s);
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
        function final(){
            var hash = {};
            links.forEach(link=>hash[link[0]]=link[1]);
            var array = [];
            for (var x in hash){
                array.push([x,hash[x]]);
            }
            return fn(array);
        }
        function Search(site,next){
            if (!site) return next();
            if (!site.url) return next();
            var url = site.url.replace('%title%',self.encodeURI(title,site.charset));
            var method = (site.method || "get").toUpperCase();
            var data = site.data && site.data.replace('%title%',title);
            function success(data){
                var $ = Parser(data,url).$;
                $('a').filter((i,v)=>$(v).text().indexOf(title) > -1)
                    .each((i,v)=>links.push([$.location($(v).attr('href')),$(v).text().trim()]));
                return next();
            }
            return request.ajax({
                url:url,
                method:method,
                data:data,
                success:success,
                error:next
            });
        }

        this.parallel(Searcher.concat(),Search,final,2);
        return this;
    }

    searchBook(title,fn){
        title = title.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
        return this.fuzzysearchBook(title,function (links){
            fn(links.filter(link=>link[1] === title));
        });
    }

    updateBookCMD(){
        this.series([
            next=>this.saveBook(next),
            next=>this.checkBookCover(next),
            next=>this.getBookIndex(next),
            next=>this.mergeBookIndex(next),
            next=>this.filterBookIndex(next),
            next=>this.getChapters(next),
            next=>this.saveBook(next),
            next=>this.sendToDataBase(next),
            next=>this.generateEbook(next),
            next=>this.end()
        ]);
        return this;
    }

    //新建书籍
    newBookCMD(){
        this.series([
            next=>this.getBookMeta(next),
            next=>this.searchBookMeta(next),
            next=>this.createBook(next),
            next=>this.updateBookMeta(next),
            next=>this.getBookCover(next),
            next=>this.saveBook(next),
            next=>this.getBookIndex(next),
            next=>this.mergeBookIndex(next),
            next=>this.filterBookIndex(next),
            next=>this.getChapters(next),
            next=>this.saveBook(next),
            next=>this.sendToDataBase(next),
            next=>this.generateEbook(next),
            next=>this.end()
        ]);
        return this;
    }

    refreshBook(directory){
        this.loadBook(directory,(error,book)=>{
            if (error) return this.end();
            this.book = book;
            this.bookMeta = book.meta;
            this.series([
                next=>this.searchBookMeta(next),
                next=>this.updateBookMeta(next),
                next=>this.getBookCover(next),
                next=>this.saveBook(next),
                next=>this.sendToDataBase(next),
                next=>this.generateEbook(next),
                next=>this.end()
            ]);
        });
        return this;
    }

    refreshBooks(){
        this.parallel(utils.toArray(arguments),(dir,next)=>{
            this.spawn().refreshBook(dir).end(next);
        },this.end.bind(this));
    }

    updateBook(directory){
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

    updateBooks(){
        return this.parallel(utils.toArray(arguments),(dir,then)=>{
            this.spawn().updateBook(dir).end(then);
        },this.end.bind(this),this.config.get("thread.new"));
    }

    newBook(url){
        this.log(url);
        this.url = url;
        return this.newBookCMD();
    }

    newBooks(){
        return this.parallel(utils.toArray(arguments),(url,then)=>{
            this.spawn().newBook(url).end(then);
        },this.end.bind(this),this.config.get("thread.new"));
    }

    loadBook(dir,fn){
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
        var link = this.formatLink(this.url);
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var parsedData = parser.getParsedData();
            var infoPage = parsedData.infoPage;
            var indexPage = parsedData.indexPage;
            if (!infoPage){
                if (!indexPage){
                    //console.log(parser.$.raw)
                    return this.error("this url is Not infoPage or request failed");
                }else {
                    this.url = indexPage.infoPage;
                    return this.getBookMeta(fn);
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
        },()=>this.getBookMeta(fn));
        return this;
    }
    //创建书籍
    createBook(fn){
        if (!this.bookMeta) return this.error("No bookMeta...");
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
        if (this.database.query('uuid='+uuid) && title && author) return next();
        var except = new RegExp(Searcher.map(x=>x.name.replace(/\./g,'\\.')).join('|'),'gi');
        if(source.match(except)) return next();
        function like(s1,s2){
            s1 = s1.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
            s2 = s2.replace(/[:：？\?,；，,\.。!！_—\-]/g,'');
            if (s1.indexOf(s2)>-1) return true;
            if (s2.indexOf(s1)>-1) return true;
            return false;
        }
        this.searchBook(title,links=>{
            if (links.length == 0) return next();
            this.parallel(links.map(link=>link[0]),(link,nextFn)=>{
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
            },next,1);
        });
        return this;
    }
    //更新书籍信息
    updateBookMeta(fn){
        if (!this.bookMeta) return this.error("No bookMeta...");
        if (!this.book) return this.error("No book...");
        this.book.meta.set(this.bookMeta.valueOf());
        this.book.meta.set("uuid",[this.book.meta.get("author"),this.book.meta.get("title")].join(" - "));
        return this.next(fn);
    }
    //获取书籍封面
    getBookCover(fn){
        var next = this.next.bind(this,fn);
        var coverSrc = this.book.meta.get("cover");
        if (!/^http/i.test(coverSrc)) return next();
        var link = this.formatLink(coverSrc);
        this.getImageData(link,data=>{
            this.book.meta.set("cover",data);
            this.hasNewChapter = true;
            fs.writeFile(Path.join(this.bookdir,"cover.jpg"),data,next);
        },next);
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
        var next = this.next.bind(this,fn);
        if (!this.book) return this.error("No Book...");
        if (!this.bookdir) return this.error("No BookDir...");
        this.book.meta.set("date",+new Date());
        fs.writeFile(Path.join(this.bookdir,"index.book"),this.book.toString(),next);
        return this;
    }
    //获取书籍目录
    getBookIndex(fn){
        var link = this.formatLink(this.url);
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var bookIndex = objectUtils.get(parser.getParsedData(),"indexPage.bookIndexs");
            if (!bookIndex) return this.end();
            this.bookIndex = bookIndex;
            return this.next(fn);
        },()=>this.getBookIndex(fn));;
        return this;
    }
    //合并书籍目录
    mergeBookIndex(fn){
        var next = this.next.bind(this,fn);
        if (!this.otherUrls) return next();
        this.parallel(this.otherUrls,(url,then)=>{
            var link = this.formatLink(url);
            this.getRawData(link,data=>{
                var parser = Parser(data,link.href);
                var bookIndex = objectUtils.get(parser.getParsedData(),"indexPage.bookIndexs");
                if (bookIndex){
                    bookIndex.forEach(link=>this.bookIndex.push(link));
                }
                return this.next(then);
            },()=>this.next(then));
        },next,this.config.get("thread.merge"));
        return this;
    }
    //过滤书籍目录
    filterBookIndex(fn){
        var Id = this.Types.id();
        this.bookIndex.forEach((link,index)=>{
            link.id = Id.val(link.id || index).val();
        });
        var hash = this.book.list.hash("id");
        this.bookIndex = this.bookIndex.filter(link=>!hash[link.id]);
        if (this.bookIndex.length){
            this.hasNewChapter = true;
            return this.next(fn);
        }
        this.saveBook();
        this.sendToDataBase();
        return this.end();
    }
    getChapters(fn){
        this.parallel(this.bookIndex,(ele,next)=>{
            this.series([
                (then)=>this.getChapter(ele,then),
                (chapter,then)=>this.mergeChapter(chapter,then),
                (chapter,then)=>this.getChapterImages(chapter,then),
                (chapter,then)=>this.formatChapter(chapter,then),
                (chapter,then)=>this.saveChapter(chapter,next),
            ]);
        },this.next.bind(this,fn),this.config.get("thread.execute"));
    }
    //获取章节内容
    getChapter(link,fn){
        this.getRawData(link,data=>{
            var parser = Parser(data,link.href);
            var thisChapter = parser.getChapterContent();
            if (!thisChapter) return this.next(fn,null);
            thisChapter.id = thisChapter.id || link.id;
            thisChapter.source = thisChapter.source || link.href;
            thisChapter.title = thisChapter.title || link.text;
            return this.next(fn,thisChapter);
        },()=>this.next(fn,null));
        return this;
    }

    mergeChapter(chapter,fn){
        if (!chapter)return this.next(fn,chapter);
        chapter.content = chapter.content || "";
        if (chapter.ajax){
            this.request.ajax(chapter.ajax).then(data=>{
                if (chapter.content){
                    chapter.content += "\n";
                }
                chapter.content += data;
                return this.next(fn,chapter);
            });
        }else if (chapter.nextPage){
            var link = {href:chapter.nextPage};
            this.getRawData(link,data=>{
                var parser = Parser(data,link.href);
                var thisChapter = parser.getChapterContent();
                if (!thisChapter) return this.next(fn,chapter);
                if (chapter.content){
                    chapter.content += "\n";
                }
                chapter.content += thisChapter.content;
                chapter.nextPage = thisChapter.nextPage;
                return this.mergeChapter(chapter,fn);
            });
        }else {
            return this.next(fn,chapter);
        }
    }

    getChapterImages(chapter,fn){
        if (!chapter)return this.next(fn,chapter);
        var parser = Parser(chapter.content,chapter.source);
        var imgs = parser.getImageLinks();
        if (!imgs.length){
            return this.next(fn,chapter);
        }
        if (!this.config.get("book.imagelocalization")){
            return this.next(fn,chapter);
        }
        parser.convertImageLink();
        var content = parser.$.html();
        var Id = this.Types.id();
        var id = Id.val(chapter.id).val();
        var isEmpty = true;
        var imgFolder = Path.join(this.bookdir,id);
        utils.mkdirsSync(imgFolder);
        imgs.forEach(img=>{
            var extname = Path.extname(URL.parse(img.href).pathname);
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
            imgs = imgs.filter(img=>!hash[img.name]);
            this.parallel(imgs,(img,then)=>{
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
                });
            },()=>{
                isEmpty && utils.rmdirs(imgFolder);
                if (!chapter) return this.next(fn,chapter);
                chapter.content = content;
                return this.next(fn,chapter);
            },this.config.get("thread.image"));
        });
        return this;
    }

    formatChapter(chapter,fn){
        if (!chapter)return this.next(fn,chapter);
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
        if (!chapter)return this.next(fn,chapter);
        if (!this.config.get("book.localization")) return this.next(fn,chapter);
        var list = chapter.valueOf();
        var file = list.id + ".json";
        list.file = file;
        fs.writeFile(Path.join(this.bookdir,file),chapter.toString(),()=>{
            this.book.list.push(list);
            return this.next(fn);
        });
        return this;
    }

    getImageData(link,success,failure){
        var options = {
            url:link.href || link.url || link.src,
            method:link.method,
            dataType:'image',
            timeout:this.config.get("request.timeout"),
            reconnect:this.config.get("request.imagereconnect"),
            success:success || link.success,
            error:failure || link.error
        }
        this.request.ajax(options);
        return this;
    }
    //获取数据
    getRawData(link,success,failure){
        var options = {
            url:link.href || link.url || link.src,
            method:link.method,
            data:link.data,
            timeout:this.config.get("request.timeout"),
            reconnect:this.config.get("request.reconnect"),
            success:success || link.success,
            error:failure || link.error
        }
        this.request.ajax(options);
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
    }

    sendToDataBase(fn){
        if (!this.book) return this.next(fn);
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
}

Wedge.prototype.request = request;
Wedge.prototype.Loader = loader;
Wedge.prototype.Decoder = decoder;
Wedge.prototype.Parser = Parser;
Wedge.prototype.Attributes = Attributes;
Wedge.prototype.Types = Attributes.classes;
Wedge.prototype.noop = function(){};
Wedge.prototype.lib = {
    utils:utils,
    fs:fs,
    querystring:querystring,
    Path:Path,
    child_process:child_process,
    url:URL,
    Random:Random
}
Wedge.prototype.share = new Hash();
Wedge.prototype.database = new DataBase();

module.exports = Wedge;