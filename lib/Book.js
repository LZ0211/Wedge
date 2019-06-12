"use strict";
const path = require('path');
const fs = require('fs');
const classes = require("./classes");
const Thread = require("./Thread");

const define = {
    meta:[
        ["title","Title"],
        ["author","Author"],
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

const Meta = new classes.Attributes(define.meta);
const List = new classes.Attributes(define.list);
const Chapter = new classes.Attributes(define.chapter);

function noop(){}

function Book(config){
    config = config || {};
    const
        Meta = new classes.Attributes(define.meta),
        List = new classes.Attributes(define.list),
        Chapter = new classes.Attributes(define.chapter);
    let interval = 1000,
        Indexs = [],
        hash = {},
        changed = false,
        locked = false,
        threads = config.threads || 10,
        ext = config.ext || '.json',
        bookIndex = config.index || 'index.book',
        location,timer;
    let object = {
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
            if (locked){
                timer = setTimeout(()=>{
                    clearTimeout(timer);
                    timer = null;
                    return this.localization(dir);
                },interval * 10);
                return this;
            }
            let time = new Date;
            fs.writeFile(path.join(location,bookIndex),this.toString(),err=>{
                locked = false;
                interval = new Date - time;
            });
            locked = true;
            return this;
        },
        localizationSync:function (dir){
            dir = dir || location;
            if (timer){
                clearTimeout(timer);
                timer = null;
            }
            fs.writeFileSync(path.join(dir,bookIndex),this.toString());
            return this;
        },
        loadIndex:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            Indexs = [];
            fs.readFile(path.join(location,bookIndex),(err,data)=>{
                if(err) return fn(err,this);
                try{
                    let str = data.toString();
                    let json = JSON.parse(str);
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
                for(let x in k){
                    this.setMeta(x,k[x]);
                }
                return this;
            }
            let temp = Meta.get(k);
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
            let listItem = List.set(item).valueOf();
            if(!listItem.title && !listItem.source) return this;
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
                let listItem = List.set(item).valueOf();
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
                let kA = itemA[k];
                let kB = itemB[k];
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
            let table = {};
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
            if (!chapter){
                fn();
                return this;
            }
            Chapter.set(chapter);
            fs.writeFile(path.join(location || './',Chapter.get('id') + ext),Chapter.toString(),fn);
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
                let file = path.join(location,item.id + ext);
                fs.readFile(file,(err,data)=>{
                    if (err) return next();
                    try{
                        //Indexs[hash[item.id]] = JSON.parse(data.toString())
                        item.content = JSON.parse(data.toString()).content;
                        return next();
                    }catch (e){
                        return next();
                    }
                });
            }).end(fn).threads(threads).queue(Indexs).start();
        },
        filterChapterContent:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            Thread().use((item,next)=>{
                let file = path.join(location,item.id + ext);
                fs.readFile(file,(err,data)=>{
                    if (err) return next();
                    try{
                        let chapter = JSON.parse(data.toString());
                        Chapter.set(chapter);
                        fs.writeFile(file,Chapter.toString(),next);
                    }catch (e){
                        return next();
                    }
                });
            }).end(fn).queue(Indexs).start();
        },
        syncIndex:function (fn){
            fn = fn || noop;
            if (!location){
                fn();
                return this;
            }
            fs.readdir(location,(err,files)=>{
                if (err) return fn(err,this);
                let size = this.size();
                this.emptyList();
                let regexp = new RegExp(`^\\d+${ext}$`,'i');
                files = files.filter(x=>x.match(regexp));
                Thread().use((file,next)=>{
                    fs.readFile(path.join(location,file),(err,data)=>{
                        try{
                            let chapter = JSON.parse(data.toString());
                            chapter.content && this.pushList(chapter,true);
                        }catch (e){}
                        return next();
                    });
                }).end(()=>{
                    if(size !== this.size()){
                        changed = true;
                        this.localizationSync();
                    }
                    return fn();
                }).queue(files).threads(threads).start();
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

Book.Meta = Meta;
Book.List = List;
Book.Chapter = Chapter;

module.exports = Book;
