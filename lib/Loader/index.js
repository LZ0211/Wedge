var fs = require("fs");
var path = require("path");
var Book = require("../Book");
var Thread = require("../Thread");

var Loader = {
    thread:5,
    sync:false,
    check:{
        add:true,
        remove:true,
    }
};

function jsonFile(file,final){
    fs.readFile(file,function (error,data){
        if (error) return final(error,null);
        try{
            var string = data.toString();
            return final(null,JSON.parse(string));
        }catch (error){
            return final(error,null);
        }
    });
}

function jsonFileSync(file,final){
    try{
        var data = fs.readFileSync(file);
        var string = data.toString();
        final(null,JSON.parse(string));
    }catch (error){
        final(error,null);
    }
}

function bookIndex(location,final){
    var book = new Book();
    var file;
    if (/index.book$/.test(location)){
        file = location;
        location = path.dirname(file);
    }else {
        file = path.join(location,"index.book");
    }

    jsonFile(file,function (error,json){
        //if (error) return final(error,book);
        book = new Book(json);
        if (!Loader.check) return final(error,book);
        if (!Loader.check.add && !Loader.check.remove) return final(error,book);
        fs.readdir(location,function (err,files){
            if (err) files = [];
            files = files.filter(function (file){
                return path.extname(file) === ".json";
            });
            var hash = book.list.hash("file");
            var outOfhash = files.filter(function (file){
                var isInhash = hash[file];
                delete hash[file];
                return !isInhash;
            });
            var notExist = Object.keys(hash);
            if (Loader.check.remove && notExist.length){
                book.list.remove(notExist.map(function (file){
                    return hash[file][1];
                }));
            }
            if (Loader.check.add && outOfhash.length){
                Thread((file,next)=>{
                    var dir = path.join(location,file);
                    jsonFile(dir,(error,json)=>{
                        if (error) return next();
                        json.file = file;
                        json.size = json.content.length;
                        json.source = json.source || json.from;
                        book.list.push(json);
                        return next();
                    });
                },()=>final(error,book))(outOfhash,Loader.thread);
            }else {
                final(error,book);
            }
        });
    });
}

function bookContent(location,final){
    var book = new Book();
    book.list.config({"title":{"type":"path"},"id":{"type":"id"},"source":{"type":"url"},"date":{"type":"time"},"file":{"type":"path"},"size":{"type":"integer"},"content":{"type":"text"}});
    var file;
    if (/index.book$/.test(location)){
        file = location;
        location = path.dirname(file);
    }else {
        file = path.join(location,"index.book");
    }

    jsonFile(file,function (error,json){
        if (error) return final(error,book);
        book.meta.set(json.meta);
        fs.readdir(location,function (error,files){
            if (error) files = [];
            files = files.filter(function (file){
                return path.extname(file) === ".json";
            });
            Thread((file,next)=>{
                var dir = path.join(location,file);
                jsonFile(dir,(error,json)=>{
                    if (error) return next();
                    json.file = file;
                    json.size = json.content.length;
                    json.source = json.source || json.from;
                    book.list.push(json);
                    return next();
                });
            },()=>final(null,book))(files,Loader.thread);
        });
    });
}

function bookIndexSync(location,final){
    var book = new Book();
    var file;
    if (/index.book$/.test(location)){
        file = location;
        location = path.dirname(file);
    }else {
        file = path.join(location,"index.book");
    }

    jsonFileSync(file,function (error,json){
        //if (error) return final(error,book);
        book = new Book(json);
        if (!Loader.check) return final(error,book);
        if (!Loader.check.add && !Loader.check.remove) return final(error,book);
        var files = [];
        try{
            var files = fs.readdirSync(location);
        }catch (e){}
        files = files.filter(function (file){
            return path.extname(file) === ".json";
        });
        var hash = book.list.hash("file");
        var outOfhash = files.filter(function (file){
            var isInhash = hash[file];
            delete hash[file];
            return !isInhash;
        });
        var notExist = Object.keys(hash);
        if (Loader.check.remove && notExist.length){
            book.list.remove(notExist.map(function (file){
                return hash[file][1];
            }));
        }
        if (Loader.check.add && outOfhash.length){
            Thread((file,next)=>{
                var dir = path.join(location,file);
                jsonFileSync(dir,function (err,json){
                    if (err) return next();
                    json.file = file;
                    json.size = json.content.length;
                    json.source = json.source || json.from;
                    book.list.push(json);
                    return next();
                });
            },()=>final(error,book),Loader.thread)(outOfhash);
        }else {
            final(error,book);
        }
    });
}

Loader.jsonFile = jsonFile;
Loader.bookIndex = bookIndex;
Loader.bookContent = bookContent;

Loader.config = function (options){
    this.thread = options.thread;
    this.check = options.check;
    this.sync = options.sync;
    if (this.sync){
        Loader.jsonFile = jsonFileSync;
        Loader.bookIndex = bookIndexSync;
    }else {
        Loader.jsonFile = jsonFile;
        Loader.bookIndex = bookIndex;
    }
    return Loader;
}

module.exports = Loader;

/*Loader.bookIndex("E:\\MyBooks\\books\\漫漫步归\\女配修仙记",function (err,book){
    console.log(book.list.valueOf())
})*/