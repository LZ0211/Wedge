"use strict";
var path = require('path');
var fs = require('fs');
var classes = require("./classes");
var Thread = require("./Thread");

var define = {
    meta:[
        ["title","Title"],
        ["author","Title"],
        ["classes","Text"],
        ["uuid","Uuid"],
        ["source","Link"],
        ["origin","Link"],
        ["isend","IsEnd"],
        ["date","Time"],
        ["brief","Content"],
        ["cover","Image"]
    ],
    list:[
        ["title","Title"],
        ["id","Id"],
        ["source","String"],
        ["date","Time"]
    ],
    chapter:[
        ["title","Title"],
        ["id","Id"],
        ["source","String"],
        ["date","Time"],
        ["content","Content"]
    ]
};

var Meta = new classes.Attributes(define.meta);
var List = new classes.Attributes(define.list);
var Chapter = new classes.Attributes(define.chapter);

function noop(){}

function Book(json){
    var Meta = new classes.Attributes(define.meta);
    var List = new classes.Attributes(define.list);
    var Chapter = new classes.Attributes(define.chapter);
    var location,timer,lock,running=0,exist=false;
    var interval = 1000;
    var Indexs = [];
    var hash = {};
    var changed = false;
    var list = {
        push:function (item){
            var listItem = List.set(item).valueOf();
            if (listItem.id in hash){
                Indexs[hash[listItem.id]] = listItem;
            }else {
                hash[listItem.id] = Indexs.length;
                Indexs.push(listItem);
            }
            return this;
        },
        empty:function (){
            Indexs = [];
            hash = {};
            return this;
        },
        concat:function (items){
            items.forEach(function (item){
                var listItem = List.set(item).valueOf();
                if (listItem.id in hash){
                    Indexs[hash[listItem.id]] = listItem;
                }else {
                    hash[listItem.id] = Indexs.length;
                    Indexs.push(listItem);
                }
            });
            return this;
        },
        sortBy:function (k){
            Indexs.sort(function (itemA,itemB){
                var kA = itemA[k];
                var kB = itemB[k];
                if (kA.match(/^\d+$/) && kB.match(/^\d+$/)){
                    return kA - kB;
                }
                if (kA >= kB) return 1;
                return -1;
            });
            hash = {};
            Indexs.forEach(function (item,index){
                hash[item.id] = index;
            });
        },
        hashBy:function (k){
            var table = {};
            Indexs.forEach(item=>{
                table[item[k]] = item;
            });
            return table;
        }
    };
    var object = {
        localization:function (dir){
            location = dir || location;
            if (!location) return this;
            if (timer) return this;
            if (lock){
                timer = setTimeout(function(){
                    clearTimeout(timer);
                    timer = null;
                    return object.localization(dir);
                },interval * 10);
                return this;
            }
            var time = new Date;
            fs.writeFile(path.join(location,'index.book'),this.toString(),function (){
                lock = false;
                exist = true;
                interval = new Date - time;
            });
            lock = true;
            return this;
        },
        localizationSync:function (dir){
            location = dir || location;
            if (timer){
                clearTimeout(timer);
                timer = null;
            }
            fs.writeFileSync(path.join(location,'index.book'),this.toString());
            exist = true;
            return this;
        },
        location:function (){
            return location;
        },
        exist: function(){
            return exist;
        },
        setMeta:function (k,v){
            if(typeof k == 'object'){
                for(var x in k){
                    this.setMeta(x,k[x]);
                }
                return this;
            }
            var temp = Meta.get(k);
            Meta.set(k,v);
            if(temp !== Meta.get(k)){
                changed = true;
                if(k === 'author' || k === 'title'){
                    Meta.set('uuid',Meta.get('author') + ' - ' + Meta.get('title'));
                }
            }
            return this;
        },
        getMeta:function (k){
            return Meta.get(k);
        },
        metaValue:function (){
            return Meta.valueOf();
        },
        Meta:Meta,
        emptyList:function (){
            Indexs = [];
            hash = {};
            try{
                fs.readdirSync(location).forEach(function(file){
                    if(path.basename(file) === '.json'){
                        try{
                            fs.unlinkSync(path.join(location,file));
                        }catch(e){
                            //do nothing
                        }
                    }
                });
            }catch(e){
                //do nothing
            }
            return this;
        },
        pushList:function (item){
            var listItem = List.set(item).valueOf();
            if (listItem.id in hash){
                Indexs[hash[listItem.id]] = listItem;
                this.localization();
                return this;
            }
            hash[listItem.id] = Indexs.length;
            Indexs.push(listItem);
            this.localization();
            return this;
        },
        concatList:function (items){
            items.forEach(function (item){
                var listItem = List.set(item).valueOf();
                if (listItem.id in hash){
                    Indexs[hash[listItem.id]] = listItem;
                }else {
                    hash[listItem.id] = Indexs.length;
                    Indexs.push(listItem);
                }
            });
            this.localization();
            return this;
        },
        sortBy:function (k){
            Indexs.sort(function (itemA,itemB){
                var kA = itemA[k];
                var kB = itemB[k];
                if (kA.match(/^\d+$/) && kB.match(/^\d+$/)){
                    return kA - kB;
                }
                if (kA >= kB) return 1;
                return -1;
            });
            hash = {};
            Indexs.forEach(function (item,index){
                hash[item.id] = index;
            });
        },
        hashBy:function (k){
            var table = {};
            Indexs.forEach(item=>{
                table[item[k]] = item;
            });
            return table;
        },
        getList:function (index){
            return Indexs[index];
        },
        size:function (){
            return Indexs.length;
        },
        pushChapter:function (chapter,fn){
            fn = fn || noop;
            if (!chapter) return fn();
            changed = true;
            Chapter.set(chapter);
            Chapter.set('date',+new Date);
            chapter = Chapter.toString();
            fs.writeFile(path.join(location,Chapter.get('id')+'.json'),chapter,fn);
            return this;
        },
        loadChapterIndex:function (fn){
            fn = fn || noop;
            changed = false;
            if (!exist) return fn();
            fs.readdir(location,function (err,files){
                if (err) return fn();
                files = files.filter(function (file){
                    return path.extname(file) === ".json";
                });
                new Thread().use(function (file,next){
                    file = path.join(location,file);
                    fs.readFile(file,function (err,data){
                        if (err) return next();
                        try{
                            var str = data.toString();
                            var json = JSON.parse(str);
                            object.pushList(json);
                            return next();
                        }catch (e){
                            return next();
                        }
                    });
                }).end(fn).setThread(6).queue(files).start();
            });
        },
        loadChapterContent:function (fn){
            Thread().use((item,next)=>{
                var file = path.join(location,item.id) + '.json';
                fs.readFile(file,(err,data)=>{
                    if (err) {
                        //console.log(err);
                        return next();
                    }
                    try{
                        var str = data.toString();
                        var json = JSON.parse(str);
                        item.title = json.title;
                        item.content = json.content;
                        return next();
                    }catch (e){
                        //console.log(e,file);
                        var idx = Indexs.indexOf(item);
                        Indexs.splice(idx,1);
                        object.localization();
                        return next();
                    }
                });
            }).end(fn).setThread(3).queue(Indexs).start();
        },
        loadIndex:function (dir,fn){
            location = dir;
            Indexs = [];
            fs.readFile(path.join(location,'index.book'),function (err,data){
                try{
                    var str = data.toString();
                    var json = JSON.parse(str);
                    object.setMeta(json.meta);
                    object.concatList(json.list);
                    changed = false;
                    exist = true;
                    return fn(null,object);
                }catch (err){
                    return fn(err,object);
                }
            });
        },
        loadIndexSync:function (dir){
            location = dir;
            Indexs = [];
            try{
                var data = fs.readFileSync(path.join(location,'index.book'));
                var str = data.toString();
                var json = JSON.parse(str);
                object.setMeta(json.meta);
                object.concatList(json.list,true);
                changed = false;
                exist = true;
            }catch (e){
                //do nothing
            }
            return object;
        },
        checkIndex:function (fn){
            fn = fn || noop;
            if (!exist) return fn();
            fs.readdir(location,function (err,files){
                if (err) return fn();
                var fileList = {};
                files = files.forEach(function (file){
                    if (path.extname(file) === ".json"){
                        fileList[path.basename(file,".json")] = true;
                    }
                });
                var oldList = Indexs;
                object.emptyList();
                oldList.forEach(function (item){
                    var id = item.id;
                    if (fileList[id]){
                        hash[id] = Indexs.length;
                        Indexs.push(item);
                        delete fileList[id];
                    }
                });
                var notInList = Object.keys(fileList).map(x=>path.join(location,x+'.json'));
                new Thread().use(function (file,next){
                    fs.readFile(file,function (err,data){
                        if (err) return next();
                        try{
                            var str = data.toString();
                            var json = JSON.parse(str);
                            object.pushList(json);
                            return next();
                        }catch (e){
                            return next();
                        }
                    });
                }).end(fn).queue(notInList).setThread(6).start();
            });
        },
        checkIndexSync:function (){
            if (!exist) return;
            try{
                var files = fs.readdirSync(location);
                var fileList = {};
                files = files.forEach(function (file){
                    if (path.extname(file) === ".json"){
                        fileList[path.basename(file,".json")] = true;
                    }
                });
                var oldList = Indexs;
                object.emptyList();
                oldList.forEach(function (item){
                    var id = item.id;
                    if (fileList[id]){
                        hash[id] = Indexs.length;
                        Indexs.push(item);
                        delete fileList[id];
                    }
                });
                var notInList = Object.keys(fileList).map(x=>path.join(location,x+'.json'));
                notInList.forEach(function (file){
                    try{
                        var data = fs.readFileSync(file);
                        var str = data.toString();
                        var json = JSON.parse(str);
                        object.pushList(json);
                        return;
                    }catch (e){
                        return;
                    }
                });
            }catch (e){
                return;
            }
        },
        valueOf:function (){
            return {
                meta:Meta.valueOf(),
                list:Indexs
            };
        },
        toString:function (){
            return JSON.stringify(this.valueOf(),null,2);
        }
    };

    Object.defineProperty(object,'changed',{
        set:function (v){
            changed = v;
        },
        get:function (){
            return changed;
        }
    });

    if (typeof json === 'string'){
        object.loadIndexSync(json);
    }
    if (typeof json === 'object'){
        object.setMeta(json.meta);
        object.concatList(json.list,true);
    }
    return object;
}

Book.config = function (k,v){
    if (!v) return define[k];
    define[k] = v;
};

Book.List = List;
Book.Chapter = Chapter;

module.exports = Book;
