var fs = require("fs");
var path = require("path");
var Book = require("../Book");
var utils = require("../utils");

var Loader = {
    thread:3,
    sync:false,
    check:{
        add:true,
        remove:true,
    }
};

function jsonFile(file,final){
    fs.readFile(file,function (error,data){
        if (error)return final(error,null);
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
        fs.readdir(location,function (error,files){
            if (error) files = [];
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
                utils.parallel(outOfhash,function (file,next){
                    var dir = path.join(location,file);
                    jsonFile(dir,function (error,json){
                        if (error) return next();
                        json.file = file;
                        json.size = json.content.length;
                        book.list.push(json);
                        return next();
                    });
                },function (){
                    final(error,book);
                },Loader.thread);
            }else {
                final(error,book);
            }
        });
    });
}

function bookContent(location,final){
    var book = new Book();
    var file;
    if (/index.book$/.test(location)){
        file = location;
        location = path.dirname(file);
    }else {
        file = path.join(location,"index.book");
    }

    jsonFile(file,function (error,json){
        if (error) return final(error,book);
        book = new Book(json);
        fs.readdir(location,function (error,files){
            if (error) files = [];
            files = files.filter(function (file){
                return path.extname(file) === ".json";
            });
            book.list.empty();
            utils.parallel(files,function (file,next){
                var dir = path.join(location,file);
                jsonFile(dir,function (error,json){
                    if (error) return next();
                    json.file = file;
                    json.size = json.content.length;
                    book.list.push(json);
                    return next();
                });
            },function (){
                final(null,book);
            },Loader.thread);
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
        if (error) return final(error,book);
        book = new Book(json);
        if (!Loader.check) return final(null,book);
        if (!Loader.check.add && !Loader.check.remove) return final(null,book);
        var files = [];
        try{
            var files = fs.readdirSync(location);
        }catch (error){}
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
            utils.parallel(outOfhash,function (file,next){
                var dir = path.join(location,file);
                jsonFileSync(dir,function (error,json){
                    if (error) return next();
                    json.file = file;
                    json.size = json.content.length;
                    book.list.push(json);
                    return next();
                });
            },function (){
                final(null,book);
            },Loader.thread);
        }else {
            final(null,book);
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