"use strict";
var http = require('http'),
    https = require('https'),
    zlib = require('zlib'),
    URL = require('url'),
    Stream = require('stream'),
    inherits = require('util').inherits,
    querystring = require('querystring'),
    cookies = require('./cookies'),
    mime = require('./mime'),
    utils = require('./utils'),
    Cache = require("./cache"),
    config = require("./config"),
    path = require("path"),
    fs = require("fs"),
    Headers = require('./headers');

var protocols = {
  'http:': http,
  'https:': https
};

function binary(res,fn){
    var data = [];
    var method = res.req.method;
    var status = res.statusCode;
    res.on('data', function(chunk){
        data.push(chunk);
    });
    res.on('end', function () {
        var buffer = Buffer.concat(data);
        var length = res.headers['content-length'];
        if (!length){
            if (status == 206){
                length = parseInt(res.headers['content-range'].split("/")[1]);
            }else {
                return fn(null, res, buffer);
            }
        }
        var len = buffer.length;
        if (len >= length - 20){
            return fn(null, res, buffer);
        }
        if (method == "HEAD"){
            return fn(null,res,buffer);
        }
        var err = new Error("MISS DATA");
        fn(err,null,buffer);
    });
}
var Parser = {
    "image":binary,
    "bin":binary,
    "json":function(res, fn){
        var text = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            text += chunk;
        });
        res.on('end', function(){
            var err = null,body=null;
            try {
                body = text && JSON.parse(text);
            } catch (e){
                err = e;
                err.rawResponse = text || null;
                err.statusCode = res.statusCode;
            } finally {
                fn(err, res, body);
            }
        });
    },
    "text":function(res, fn){
        var text = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            text += chunk;
        });
        res.on('end', function (){
            fn(null, res, text);
        });
    },
    "form":function (res, fn){
        var text = '';
        res.setEncoding('ascii');
        res.on('data', function(chunk){
            text += chunk;
        });
        res.on('end', function(){
            try {
                fn(null, querystring.parse(text));
            } catch (err) {
                fn(err);
            }
        });
    }
};

function parse(res,fn){
    var contentType = res.headers['content-type'] || "";
    var mime = utils.type(contentType);
    var charset = utils.charset(contentType);
    res.on('error',fn);
    if (utils.isJSON(mime)){
        return Parser.json(res,fn);
    }else if (utils.isText(mime)){
        if (charset && charset.match(/utf-?8/i)){
            return Parser.text(res,fn);
        }else {
            return Parser.bin(res,fn);
        }
    }else {
        return Parser.bin(res,fn);
    }
}

mime.define({
  'application/x-www-form-urlencoded': ['form', 'urlencoded', 'form-data']
});

function noop(){}
function encodeURL(url){
    url = encodeURI(url);
    //修复重复编码
    url = url.replace(/%25/g,'%');
    //url = url.replace(/&amp;/g,'&');
    return url;
}
function Request(url,method) {
    Stream.call(this);
    this.headers = {};
    this.method = method || "GET";
    this.url = encodeURL(url);
    this._headers = {};
    this._query = {};
    this._data = {};
    this._timeout = config.Timeout || 5000;
    this._callback = [];
    this._agent = false;
    this._redirects = 0;
    this._maxRedirects = config.maxRedirects || 5;
    this._redirectList = [];
    this._maxReconnects = config.maxReconnects || 3;
    this.writable = true;
    this.setHeader(new Headers(this.url));
    this.cookie();
    //this.query(URL.parse(this.url).query);
    return this.init();
}
inherits(Request,Stream);
var Proto = Request.prototype;
Proto.init = function (){
    this.on("error",e=>{return e;});
    if (this.method === "GET"){
        var mime = path.extname(URL.parse(this.url).pathname).replace(".","");
        this.accept(mime);
    }
    if (this.method === "POST"){
        this.type("form");
    }
    return this;
};
Proto.reconnect = function (times){
    this._maxReconnects = times;
    return this;
};
Proto.timeout = function (ms){
    this._timeout = ms;
    return this;
};
Proto.use = function (fn){
    fn(this);
    return this;
};
Proto.set = Proto.setHeader = function (key,val){
    if (typeof key == "object"){
        for (var k in key) {
          this.setHeader(k, key[k]);
        }
        return this;
    }
    if (undefined == val){
        this.unsetHeader(key);
        return this;
    }
    this._headers[key.toLowerCase()] = val;
    this.headers[key] = val;
    return this;
};
Proto.del = Proto.unsetHeader = function (){
    for(var i=0;i<arguments.length;i++){
        var key = arguments[i].toLowerCase();
        delete this._headers[key];
        for(var k in this.headers){
            if(key == k.toLowerCase()){
                delete this.headers[k];
            }
        }
    }
    return this;
};
Proto.getHeader = function (key){
    return this._headers[key.toLowerCase()];
};
//Proto.get = Proto.getHeader;
//Proto.set = Proto.setHeader;
//Proto.unset = Proto.unsetHeader;
Proto.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.req && this.req.abort(); // node
  this.emit('abort');
  return this;
};
Proto.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    timeout:this._timeout,
    data: this._data,
  };
};
Proto.send = function(data){
    var isobj = utils.isObject(data);
    var type = this.getHeader('content-type');

    // merge
    if (isobj && utils.isObject(this._data)) {
        for (var key in data) {
            this._data[key] = data[key];
        }
    } else if (utils.isString(data)) {
        // default to x-www-form-urlencoded
        if (!type) this.type('form');
        type = this.getHeader('content-type');
        if ('application/x-www-form-urlencoded' == type) {
            this._data = querystring.parse(this._data);
            data = querystring.parse(data);
            this.send(data);
        } else {
            if (utils.isObject(this._data)){
                this._data = "";
            }
            this._data += data;
        }
    } else {
        this._data = data;
    }
    if (!type) this.type('json');
    return this;
};
Proto.redirects = function (n){
    this._maxRedirects = n;
    return this;
};
Proto.type = function(type){
    this.setHeader('Content-Type', ~type.indexOf('/') ? type : mime.lookup(type));
    return this;
};
Proto.accept = function(type){
    this.setHeader('Accept',~type.indexOf('/') ? type : mime.lookup(type));
    return this;
};
Proto.charset = function(char){
    if (this.method === "GET" && char){
        this.setHeader('Accept-Charset',char);
    }
    if (this.method === "POST" && char){
        this.setHeader('Content-Type',this.getHeader('Content-Type') + "; charset=" + char.toUpperCase());
    }
    return this;
};
Proto.referer = function(ref){
    this.setHeader('Referer', encodeURL(ref));
    return this;
};
Proto.auth = function(user, pass){
    var str = new Buffer(user + ':' + pass).toString('base64');
    this.setHeader('Authorization', 'Basic ' + str);
    return this;
};
Proto.ca = function(cert){
    this._ca = cert;
    return this;
};
Proto.query = function(val){
    if (utils.isObject(val)){
        for (var key in val) {
            this._query[key] = val[key];
        }
    }else if (utils.isString(val)){
        val = querystring.parse(val);
        return this.query(val);
    }
    return this;
};
Proto.callback = function (err,res,buffer){
    if (utils.isFunction(err)){
        this._callback.push(err);
    }else {
        this._callback.forEach(function (fn){
            fn(err,res,buffer);
        });
    }
};
Proto.redirect = function(res){
    var url = res.headers.location;
    var ref = this.url;
    if (!url) {
        return this.callback(new Error('No location header for redirect'), res);
    }
    url = URL.resolve(this.url, url);
    delete this.req;

    // redirect
    this.url = url;
    this._data = {};
    this._query = {};
    this.setHeader(new Headers(url));
    this.cookie();
    this.referer(ref);
    //this.query(URL.parse(url).query);
    this.emit('redirect', res);
    this._redirectList.push(this.url);
    this.end();
    return this;
};
Proto.agent = function(agent){
    if (!arguments.length) return this._agent;
    this._agent = agent;
    return this;
};
Proto.proxy = function (host,port){
    if (typeof host == 'object'){
        this._proxy = host;
        return this;
    }
    if (!port && host.match(':')){
        this._proxy = {
            host:host.split(':')[0],
            port:host.split(':')[1]
        };
        return this;
    }
    this._proxy = {
        host:host,
        port:port
    };
    return this;
};
Proto.proxyAuth = function(user, pass){
    if (typeof user == 'object'){
        pass = user.password;
        user = user.username;
    }
    var str = new Buffer(user + ':' + pass).toString('base64');
    this.setHeader('Proxy-Authorization', 'Basic ' + str);
    return this;
};
Proto.cookie = function (cookie){
    var cookie = cookie || cookies.getCookie(this.url);
    cookie ? this.setHeader("Cookie",cookie) : this.unsetHeader("Cookie");
    return this;
};
Proto.pipe = function(stream, options){
    this.piped = true;
    var self = this;
    this.end();
    this.req.on('response', function(res){
        // redirect
        var redirect = utils.isRedirect(res.statusCode);
            if (redirect && self._redirects++ !== self._maxRedirects) {
            return self.redirect(res).pipe(stream, options);
        }
        if (res.statusCode !== 200){
            return self.pipe(stream, options);
        }
        if (utils.needUnzip(res)) {
            res.pipe(zlib.createUnzip()).pipe(stream, options);
        } else {
            res.pipe(stream, options);
        }
        res.on('end', function(){
            self.emit('end');
        });
    });
    // this.req.on('error',function (err){
    //     self.pipe(stream, options);
    // });
    return stream;
};
Proto.request = function (){
    var self = this;
    var options = {};
    var querystr = querystring.stringify(this._query);
    var url = this.url;
    if (!~url.indexOf('http')) url = 'http://' + url;
    //var parsed = URL.parse(url, true);
    //url = parsed.protocol + "//" + parsed.host + parsed.pathname;
    //if (querystr) url += "?" + querystr;
    var parsedUrl = URL.parse(url, true);
    var search = parsedUrl.search;
    if(querystr){
        search = search || "?";
        search += querystr;
    }
    this.protocol = parsedUrl.protocol;
    this.host = parsedUrl.host;
    options.method = this.method;
    options.headers = this.headers;
    options.host = parsedUrl.host;
    options.hostname = parsedUrl.hostname;
    options.port = parsedUrl.port;
    options.path = parsedUrl.pathname + search;
    options.ca = this._ca;
    options.agent = this._agent;
    options.rejectUnauthorized = false;
    if (this._proxy){
        options.path = this.protocol + '//' + this.host + options.path;
        options.hostname = options.host = this._proxy.host;
        options.port = this._proxy.port;
    }
    var req = this.req = protocols[parsedUrl.protocol].request(options);
    req.on('drain', function(){
        self.emit('drain');
    });
    req.on('error', function(e){
        self.emit('error',e);
        //if (self._aborted) return;
        //if (self.res) return;
        self.callback(e);
    });
    req.on('response',function (res){
        self.emit("response",res);
    });
    req.setTimeout(this._timeout,function(){
        req.abort();
        self.emit("timeout");
    });
    return req;
};
Proto.end = function (callback){
    var self = this;
    var req = this.request();
    callback && this.callback(callback);

    function fn(err,res,buffer){
        self.buffer = buffer;
        self.emit('end');
        err ? self.callback(err) : self.callback(null, res, buffer);
    }
    req.on('response',function (res){
        self.res = res;
        var redirect = utils.isRedirect(res.statusCode);
        cookies.setCookie(self.url,res);

        if (self.piped) return;
        // redirect
        if (redirect && self._redirects++ !== self._maxRedirects){
            return self.redirect(res);
        }

        if (utils.needUnzip(res)){
            utils.unzip(req, res);
        }
        parse(res,fn);
    });
    if (this.method == "POST"){
        var data = this._data;
        if (utils.isObject(data)){
            var type = this.getHeader('content-type');
            if(!!~type.indexOf('application/json')){
                data = JSON.stringify(this._data);
            }else{
                data = querystring.stringify(this._data).replace(/%20/g,"+");
            }
        }
        req.setHeader('Content-Length',Buffer.byteLength(data,'uft8'));
        req.write(data);
    }
    req.end();
    return this;
};
Proto.promise = function (){
    var self = this;
    var times = 0,maxtimes = this._maxReconnects;
    var defer = function (resolve,reject){
        self.end(function(err,res,buffer){
            if (res && /^20.$/.test(res.statusCode) && buffer){
                resolve(buffer);
            }else if (err){
                ++times < maxtimes ? self.end() : setImmediate(()=>reject(err.code));
            }else if (buffer){
                setImmediate(()=>reject(buffer));
            }else {
                ++times < maxtimes ? self.end() : setImmediate(()=>reject(res.statusCode));
            }
        });
    };
    return new Promise(defer);
};
Proto.then = function (success,fail){
    if (typeof success !== "function"){
        success = noop;
    }
    if (typeof fail !== "function"){
        fail = noop;
    }
    return this.promise().then(success,fail);
};


function get(url,data,fn){
    var req = new Request(url, 'GET');
    if ('function' == typeof data) fn = data, data = null;
    if (data) req.query(data);
    if (fn) req.end(fn);
    return req;
}
function post(url,data,fn){
    var req = new Request(url, 'POST');
    if ('function' == typeof data) fn = data, data = null;
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
}
function ajax(url, options){
    if ( typeof url == "object" ) {
        options = url;
        url = undefined;
    }
    options = options || {};
    options.url = url || options.url;
    options.method = options.method || options.type || "GET";
    options.timeout = options.timeout || 15000;
    var req = new Request(options.url, options.method);
    options.timeout && req.timeout(options.timeout);
    options.reconnect && req.reconnect(options.reconnect);
    options.proxy && req.proxy(options.proxy);
    options.proxyAuth && req.proxyAuth(options.proxyAuth);
    options.dataType && req.accept(options.dataType);
    options.data && options.method === "POST" && req.send(options.data);
    options.contentType && req.type(options.contentType);
    options.headers && req.setHeader(options.headers);
    return req.setHeader("X-Requested-With","XMLHttpRequest").then(options.success,options.error);
}
function head(url,data,fn){
    var req = new Request(url, 'HEAD');
    if ('function' == typeof data) fn = data, data = null;
    if (data) req.query(data);
    if (fn) req.end(fn);
    return req;
}
function put(url,data,fn){
    var req = new Request(url, 'PUT');
    if ('function' == typeof data) fn = data, data = null;
    if (data) req.send(data);
    if (fn) req.end(fn);
    return req;
}

function getFile(url,file){
    get(url).end(function (err,res,data){
        if (data){
            fs.writeFile(file,data,noop);
        }
    });
}

function breakPoint(url,file){
}

function download(url,file){
    file = file || decodeURIComponent(path.basename(URL.parse(url).pathname));
    head(url).end(function (err,res,buf){
        if (err) return getFile(url,file);
        var headers = res.headers;
        var acceptRanges = headers['accept-ranges'] == "bytes";
        var size = headers['content-length'];
        var limit = 1024 * 1024;
        var buffer = new Buffer(limit).fill(0x00);
        if (!size) return;
        if (size <= limit)return getFile(url,file);
        if (headers['content-diposition']){
            file = decodeURIComponent(headers['content-diposition'].split("filename=")[1]);
        }

        if (!acceptRanges) return getFile(url,file);

        try{
            //var cfg = fs.openSync(file + ".cfg","w+");
            var handle = fs.openSync(file,"w+");
            var head=0,tail = limit - 1;
            var quest = [];
            while (tail < size){
                quest.push([head,tail]);
                fs.writeSync(handle, buffer, 0, limit);
                head += limit;
                tail += limit;
            }
            quest.push([head,size-1]);
            fs.writeSync(handle, buffer, 0, size-head);
        }catch (e){
            return;
        }
        var finished = 0;
        utils.parallel(quest,function (range,next){
            var callee = arguments.callee;
            get(url).setHeader("Range","bytes="+range.join("-")).then(function (data){
                /*if (data.length !== limit){
                    console.log(data.length)
                    return callee(range,next);;
                }*/
                finished += range[1]-range[0] + 1;
                console.log(Math.round(10000*finished/size)/100 + "% finished...");
                fs.writeSync(handle, data, 0, data.length,range[0]);
                next();
            },function (){
                callee(range,next);
            });
        },function (){
            fs.closeSync(handle);
        },5);
    });
}


module.exports = {
    Request : Request,
    get : get,
    post : post,
    head : head,
    put : put,
    ajax : ajax,
    cookies:cookies,
    download:download
};

/*var buf = new Buffer(8);
buf.writeInt32LE(8192,0);
console.log(buf.readInt32LE(0))*/