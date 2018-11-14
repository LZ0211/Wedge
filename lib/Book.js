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
    var location,timer,lock;
    var interval = 1000;
    var Indexs = [];
    var hash = {};
    var changed = false;
    var object = {
        location:function(dir,fn){
            fn = fn || noop;
            if(!location){
                location = dir;
                this.loadIndex(fn);
            }else{
                fn(null,this);
            }
            return this;
        },
        localization:function (dir){
            dir = dir || location;
            if (!dir) return this;
            if (timer) return this;
            if (lock){
                timer = setTimeout(()=>{
                    clearTimeout(timer);
                    timer = null;
                    return this.localization(dir);
                },interval * 10);
                return this;
            }
            var time = new Date;
            fs.writeFile(path.join(location,'index.book'),this.toString(),err=>{
                lock = false;
                interval = new Date - time;
            });
            lock = true;
            return this;
        },
        localizationSync:function (dir){
            dir = dir || location;
            if (timer){
                clearTimeout(timer);
                timer = null;
            }
            fs.writeFileSync(path.join(dir,'index.book'),this.toString());
            return this;
        },
        loadIndex:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            Indexs = [];
            fs.readFile(path.join(location,'index.book'),(err,data)=>{
                if(err) return fn(err,this);
                try{
                    var str = data.toString();
                    var json = JSON.parse(str);
                    this.setMeta(json.meta);
                    this.concatList(json.list,true);
                    changed = false;
                    return fn(null,this);
                }catch (err){
                    return fn(err,this);
                }
            });
            return this;
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
        emptyList:function (){
            Indexs = [];
            hash = {};
            return this;
        },
        pushList:function (item,noSave){
            var listItem = List.set(item).valueOf();
            if (listItem.id in hash){
                Indexs[hash[listItem.id]] = listItem;
            }else{
                hash[listItem.id] = Indexs.length;
                Indexs.push(listItem);
            }
            noSave || this.localization();
            return this;
        },
        concatList:function (items,noSave){
            items.forEach(function (item){
                var listItem = List.set(item).valueOf();
                if (listItem.id in hash){
                    Indexs[hash[listItem.id]] = listItem;
                }else {
                    hash[listItem.id] = Indexs.length;
                    Indexs.push(listItem);
                }
            });
            noSave || this.localization();
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
            return this;
        },
        hashBy:function (k){
            var table = {};
            Indexs.forEach(item=>{
                table[item[k]] = item;
            });
            return table;
        },
        size:function (){
            return Indexs.length;
        },
        pushChapter:function (chapter,fn){
            fn = fn || noop;
            if (!location || !chapter){
                fn();
                return this;
            }
            Chapter.set(chapter);
            fs.writeFile(path.join(location,Chapter.get('id')),Chapter.toString(),fn);
            changed = true;
            return this;
        },
        loadChapterContent:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            Thread().use((item,next)=>{
                var file = path.join(location,item.id);
                fs.readFile(file,(err,data)=>{
                    if (err) return next();
                    try{
                        Indexs[hash[item.id]] = JSON.parse(data.toString())
                        return next();
                    }catch (e){
                        return next();
                    }
                });
            }).end(fn).threads(6).queue(Indexs).start();
        },
        syncIndex:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            fs.readdir(location,(err,files)=>{
                if (err) return fn(err,this);
                var size = this.size();
                this.emptyList();
                files = files.filter(x=>x.match(/^\d+$/));
                Thread().use((file,next)=>{
                    fs.readFile(path.join(location,file),(err,data)=>{
                        try{
                            this.pushList(JSON.parse(data.toString()),true);
                        }catch (e){}
                        return next();
                    });
                }).end(()=>{
                    if(size !== this.size()){
                        changed = true;
                        this.localizationSync();
                    }
                    return fn();
                }).queue(files).threads(6).start();
            });
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
        set:function (v){},
        get:function (){
            return changed;
        }
    });
    Object.defineProperty(object,'list',{
        set:function (v){},
        get:function (){
            return Indexs;
        }
    });
    Object.defineProperty(object,'meta',{
        set:function (v){},
        get:function (){
            return Meta.valueOf();
        }
    });
    return object;
}

Book.config = function (k,v){
    if (!v) return define[k];
    define[k] = v;
};

Book.List = List;
Book.Chapter = Chapter;

module.exports = Book;
