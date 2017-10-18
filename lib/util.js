var fs = require("fs");
var path = require("path");
var Thread = require("./Thread");

function noop(){}

fs.mkdirsSync = function (dir){
    if (fs.existsSync(dir)){
        return;
    }
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || fs.mkdirsSync(dirname);
    fs.mkdirSync(dir);
};

fs.mkdirs = function (dir,callback){
    callback = callback || noop;
    fs.exists(dir,function (exist){
        exist ? callback() : fs.mkdirs(path.dirname(dir),function (){
            fs.mkdir(dir,callback);
        });
    });
};

fs.rmdirsSync = function (root){
    if (!fs.existsSync(root)) return;
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            fs.rmdirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
};

fs.rmdirs = function (dir,callback){
    callback = callback || noop;
    fs.exists(dir,function (exist){
        if (!exist) return callback(null);
        fs.stat(dir,function (err,stats){
            if (err) return callback(err);
            if (stats.isFile()) return fs.unlink(dir,callback);
            if (stats.isDirectory()){
                fs.readdir(dir,function (err,files){
                    if (err) return callback(err);
                    files = files.map(file=>path.join(dir,file));
                    Thread().use(fs.rmdirs).final(function (){
                        fs.rmdir(dir, callback);
                    }).queue(files).setThread(10).start();
                });
            }
        });
    });
};

fs.isEmpty = function (f,callback){
    fs.stat(f,function (err,stats){
        if (err) return callback(false);
        if (stats.isFile()){
            if (stats.size == 0){
                return callback(true);
            }
            return callback(false);
        }
        if (stats.isDirectory()){
            fs.readdir(f,function (err,files){
                if (err) return callback(false);
                if (files.length == 0){
                    return callback(true);
                }
                return callback(false);
            });
        }
    });
};

fs.isEmptySync = function (file){
    try{
        var stats = fs.statSync(file);
        if (stats.isFile()){
            return stats.size == 0;
        }
        if (stats.isDirectory()){
            return fs.readdirSync(file).length == 0;
        }
    }
    catch (e){
        return false;
    }
};


function clone(object){
    if (Array.isArray(object)){
        return object.concat();
    }
    if (typeof object === "object"){
        var _object = {};
        for (var k in object){
            if (object.hasOwnProperty(k)){
                _object[k] = object[k];
            }
        }
        return _object;
    }
    else {
        return object;
    }
}

function cloneDeep(object){
    if (Array.isArray(object)){
        return object.map(k=>cloneDeep(k));
    }
    if (typeof object === "object"){
        var _object = {};
        for (var k in object){
            if (object.hasOwnProperty(k)){
                _object[k] = cloneDeep(object[k]);
            }
        }
        return _object;
    }
    else {
        return object;
    }
}

function toArray(arrayLike){
    var arr = [];
    [].slice.call(arrayLike).forEach(function (item){
        if (Array.isArray(item)){
            item.forEach(arguments.callee);
        }else {
            arr.push(item);
        }
    });
    return arr;
}

function range(template,start,end){
    return Array(end-start+1).fill(start).map((x,y)=>x+y).map(x=>template.replace(/\*/g,x));
}

function encodeBase64(str){
    return new Buffer(str).toString('base64');
}

function decodeBase64(str){
    return new Buffer(str,'base64').toString();
}

function loadJSON(dir){
    return JSON.parse(fs.readFileSync(dir).toString());
}

function each(object,fn){
    for (var k in object){
        fn.call(object,k,object[k],object);
    }
}

function map(object,fn){
    var oo = {};
    for (var k in object){
        oo[k] = fn.call(object,k,object[k],object);
    }
    return oo;
}

function filter(object,fn){
    var oo = {};
    for (var k in object){
        if (fn.call(object,k,object[k],object)){
            oo[k] = object[k];
        }
    }
    return oo;
}

var toString = Object.prototype.toString;
function isRegExp(value){
    return toString.call(value) === "[object RegExp]";
}

function isObject(value){
    return toString.call(value) === "[object Object]";
}

function isFunction(value){
    return toString.call(value) === "[object Function]";
}

function isString(value){
    return toString.call(value) === "[object String]";
}
function toReStr(str) {
    return str.replace(/[()\[\]{}|+.,^$?\\*]/g, "\\$&");
}
function replace(value,selector){
    if(!value) return value;
    if (isFunction(selector)){
        value = selector(value);
        return value;
    }
    if (isString(selector)){
        var regexp;
        try{
            regexp = new RegExp(selector,"gi");
        }catch (e){
            regexp = new RegExp(toReStr(selector),"gi");
        }
        return replace(value,regexp);
    }
    if (Array.isArray(selector)){
        selector.forEach(x=>{
            value = replace(value,x);
        });
        return value;
    }
    if (isRegExp(selector)){
        value = value.replace(selector,"");
        return value;
    }
    if (isObject(selector)){
        Object.keys(selector).forEach(function (k){
            try{
                var regexp = new RegExp(k,"gi");
            }catch (e){
                var regexp = new RegExp(toReStr(k),"gi");
            }
            value = value.replace(regexp,selector[k]);
        });
        return value;
    }
    return value;
}

module.exports = {
    replace:replace,
    clone:clone,
    cloneDeep:cloneDeep,
    toArray:toArray,
    range:range,
    encodeBase64:encodeBase64,
    decodeBase64:decodeBase64,
    loadJSON:loadJSON,
    object:{
        each:each,
        map:map,
        filter:filter
    },
    is:{
        isFunction:isFunction,
        isRegExp:isRegExp,
        isObject:isObject,
        isString:isString,
    }
};