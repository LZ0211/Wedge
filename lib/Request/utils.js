"use strict";
var zlib = require("zlib");
var StringDecoder = require('string_decoder').StringDecoder;
var Stream = require('stream');

exports.needUnzip = function (res){
    if (res.statusCode === 204 || res.statusCode === 304) {
        return false;
    }
    if (res.headers['content-length'] === '0') {
        return false;
    }
    return /^\s*(?:deflate|gzip)\s*$/.test(res.headers['content-encoding']);
}

exports.unzip = function(req, res){
  var unzip = zlib.createUnzip();
  var stream = new Stream;
  var decoder;

  stream.req = req;

  unzip.on('error', function(err){
    stream.emit('error', err);
  });

  res.pipe(unzip);

  // override `setEncoding` to capture encoding
  res.setEncoding = function(type){
    decoder = new StringDecoder(type);
  };

  // decode upon decompressing with captured encoding
  unzip.on('data', function(buf){
    if (decoder) {
      var str = decoder.write(buf);
      if (str.length) stream.emit('data', str);
    } else {
      stream.emit('data', buf);
    }
  });

  unzip.on('end', function(){
    stream.emit('end');
  });

  // override `on` to capture data listeners
  var _on = res.on;
  res.on = function(type, fn){
    if ('data' == type || 'end' == type) {
      stream.on(type, fn);
    } else if ('error' == type) {
      stream.on(type, fn);
      _on.call(res, type, fn);
    } else {
      _on.call(res, type, fn);
    }
  };
};
exports.isRedirect = function(code) {
  return ~[301, 302, 303, 305, 307, 308].indexOf(code);
}
exports.type = function(str){
  return str.split(/ *; */).shift();
};
exports.isImage = function(mime) {
  var parts = mime.split('/');
  var type = parts[0];
  var subtype = parts[1];
  return 'image' == type;
}
exports.isText = function(mime) {
  var parts = mime.split('/');
  var type = parts[0];
  var subtype = parts[1];
  return 'text' == type
    || 'x-www-form-urlencoded' == subtype;
}
exports.isJSON = function(mime) {
  return /[\/+]json\b/.test(mime);
}

exports.charset = function (str){
    return str.split(/ *; */)[1];
}

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

exports.async = async;
exports.autoRetry = retry;
exports.autoContinue = function (array,fn,callback){
    callback = callback || noop;
    return async.thread().series(array.map((v)=>(next)=>fn(v,next)),callback);
};
exports.parallel = function (array,fn,callback,num){
    async.thread().setThread(num).parallel(array.map((v)=>(next)=>fn(v,next)),callback);
};