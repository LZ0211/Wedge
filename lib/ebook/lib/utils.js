"use strict"
var fs = require("fs");
var path = require("path");

;(function (){
    var toString = Object.prototype.toString;
    ["Function","Array","String","Number","Object","RegExp","Date","HTMLDocument"].forEach(function (type){
        exports["is" + type] = function (value){
            return toString.call(value) === "[object "+type+"]"
        }
    });
})()


function noop(){}

var async = {};
async._threads = 3;
async._running = 0;
async.setThread = function(val){
    this._threads = val || this._threads;
    return this;
};

async.series = function (array,callback){
    callback = callback || noop;
    var self = this;
    this._running += 1;
    let callee = function (...args){
        function pack(fn){
            let len = fn.length;
            if (len == 0){
                return ()=>{fn();callee()};
            }else {
                let _args = args.slice(args.length-len+1);
                return ()=>fn(..._args,callee);
            }
        }
        function decorate(fn){
            let len = fn.length;
            if (len == 0){
                return (next)=>{fn();next()};
            }else {
                let _args = args.slice(args.length-len+1);
                return (next)=>fn(..._args,next);
            }
        }
        let fn = array.shift();
        if (exports.isFunction(fn)){
            process.nextTick(pack(fn));
        }else if (exports.isArray(fn)){
            let fns = fn.filter((f)=>exports.isFunction(f));
            return process.nextTick(()=>{
                async.thread().all(fns.map(decorate),callee);
            });
        }else {
            return callback();
        }
    }
    callee();
    return this;
};
async.parallel = function (array,callback){
    callback = callback || noop;
    var threads = Math.min(array.length,this._threads);
    if (threads === 0){
        callback();
        return this;
    }
    var count = 0,self=this;
    for (var i=0;i<threads ;i++ ){
        this.series(array,function (){
            count += 1;
            self._running -= 1;
            if (self._running === 0){
                callback();
            }
        });
    }
    return this;
};

async.all = function (array,callback){
    callback = callback || noop;
    let len = array.length;
    let count = 0
    let callee = function (){
        count += 1;
        if (len == count)return callback();
    }
    array.forEach(function (fn){fn(callee)});
}

async.thread = function (){
    var Thread = function(){}
    Thread.prototype = this;
    return new Thread();
}


function mkdirsSync(dir){
    if (fs.existsSync(dir)){
        return
    }
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || mkdirsSync(dirname);
    fs.mkdirSync(dir);
}

function mkdirs(dir,callback){
    callback = callback || noop;
    var _callback = function(){fs.mkdir(dir,callback);}
    fs.exists(dir,function (exist){
        exist ? callback() : mkdirs(path.dirname(dir),_callback);
    });
}

function rmdirsSync(root){
    if (!fs.existsSync(root)){
        return
    }
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            rmdirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
}

function rmdirs(dir,callback){
    callback = callback || noop;
    fs.exists(dir,function (exist){
        if (!exist) return callback();
        fs.stat(dir,function (err,stats){
            if (err)throw err;
            if (stats.isFile()){
                fs.unlink(dir,callback);
            }
            if (stats.isDirectory()){
                fs.readdir(dir,function (err,files){
                    if (err) throw err;
                    async.thread().parallel(files.map(function (file){
                        return function(next){
                            rmdirs(path.join(dir,file),next);
                        }
                    }),function(){
                        fs.rmdir(dir, callback);
                    });
                });
            }
        });
    });
}

function walkSync(root, callback){
    let callee = function (root){
        let files = fs.readdirSync(root);
        let stats = {};
        files.forEach(function (file){
            let real = path.join(root,file);
            stats[real] = {};
            let filestat = fs.statSync(real);
            if (filestat.isDirectory() == true){
                stats[real].isDirectory=true;
            }else {
                stats[real].isDirectory=false;
            }
        });
        for (let file in stats){
            let stat = stats[file];
            if (stat.isDirectory){
                callee(file);
            }else {
                callback(file)
            }
        }
    }
    callee(root);
}

function walk(dir,callback){
    callback = callback || noop;
    let array = [],
        running = null,
        callee = function (dir,_call){
            _call = _call || noop;
            fs.exists(dir,function (exist){
                if (!exist) return;
                fs.stat(dir,function (err,stats){
                    if (err) throw err;
                    if (stats.isFile()){
                        array.push(function (next){
                            callback(dir);
                            next();
                        });
                    }
                    if (stats.isDirectory()){
                        array.push(function (next){
                            fs.readdir(dir,function (err,files){
                                if (err) throw err;
                                callback(dir);
                                async.thread().parallel(files.map(function (file){
                                    file = path.join(dir,file);
                                    return function (next){
                                        callee(file,next);
                                    }
                                }),next);
                            });
                        });
                    }
                    async.thread().parallel(array,_call);
                });
            });
        }
    callee(dir);
}

function isEmpty(file){
    var stats = fs.statSync(file);
    if (stats.isFile()){
        return stats.size == 0;
    }
    if (stats.isDirectory()){
        return fs.readdirSync(file).length == 0;
    }
}

function retry(options){
    let times = 0,
        maxtimes = options.times || options.max || 5,
        resolve = options.resolve,
        reject = options.reject || noop,
        promise = options.promise,
        callee = function (){
            promise().then(resolve,function(e){
                ++times < maxtimes ? callee() : reject(e);
            });
        }
    callee();
}

function clone(object){
    if (Array.isArray(object)){
        return object.concat();
    }
    if (typeof object === "object"){
        let _object = {};
        for (let k in object){
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
        let _object = {};
        for (let k in object){
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

function command(fn){
    var args = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data",(data)=>{
        data = data.replace(/\s+$/,'');
        if (!data){
            process.stdin.end();
            fn(...args);
        }else {
            args.push(data);
        }
    });
}

exports.mkdirsSync = mkdirsSync;
exports.mkdirs = mkdirs;
exports.rmdirsSync = rmdirsSync;
exports.rmdirs = rmdirs;
exports.isEmpty = isEmpty;
exports.walkSync = walkSync;
exports.walk = walk;
exports.autoRetry = retry;
exports.async = async;
exports.autoContinue = function (array,fn,callback){
    callback = callback || noop;
    return async.thread().series(array.map((v)=>(next)=>fn(v,next)),callback);
};
exports.parallel = function (array,fn,callback,num){
    async.thread().setThread(num).parallel(array.map((v)=>(next)=>fn(v,next)),callback);
};
exports.clone = clone;
exports.cloneDeep = cloneDeep;
exports.command = command;