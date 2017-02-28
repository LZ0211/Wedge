var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

try{
    var Log = require("./logs");
}
catch (r){
    var Log = {};
}

var dir = __dirname;

function noop(){}

process.on("exit",function (){
    for (var url in Log){
        var cache = Log[url];
        var file = cache.getFileName();
        if (cache.isExpired()){
            try{
                fs.unlinkSync(file);
            }
            catch (r){
            }
        }else {
            if (!fs.existsSync(file)){
                fs.writeFileSync(file,cache._data);
                delete cache._data;
            }
        }
    }
    fs.writeFileSync(path.join(__dirname,"./logs.json"),JSON.stringify(Log,null,4),"utf8")
});

function Cache(){
    return this.init.apply(this,arguments);
}

Cache.prototype.init = function (res,buf){
    if (!res || !buf){
        return this;
    }
    var expires = res.headers["expires"];
    var etag = res.headers["etag"];
    var modified = res.headers["last-modified"];
    var cachecontrol = res.headers["cache-control"];
    if (cachecontrol == "no-cache"){
        return null;
    }else if (cachecontrol == "no-store"){
        this._data = buf;
    }else {
        var now = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        this._hash = crypto.createHash('sha1').update(date + random).digest('hex');
        this._data = buf;
        fs.writeFile(this.getFileName(),buf);
    }
    var cacheTime = cachecontrol.match(/max-age=(\d+)/);
    if (cacheTime){
        cacheTime = cacheTime[1];
    }else {
        cacheTime = 0;
    }

    if (expires){
        this._expires = new Date(expires);
    }
    if (cacheTime){
        this._expires = new Date(new Date() + cacheTime * 1000);
    }
    if (etag){
        this._etag = etag;
    }
    if (modified){
        this._modified = new Date(lasmodified);
    }
    return this;
}

Cache.prototype.isExpired = function (){
    return new Date(this._expires) - new Date() < 0;
}

Cache.prototype.lastModified = function (){
    return new Date(this._modified).toGMTString();
}

Cache.prototype.Etag = function (){
    return this._etag;
}

Cache.prototype.getFileName = function (){
    return path.join(dir,this._hash);
}

Cache.prototype.getData = function (callback){
    var self = this;
    if (this._data){
        callback(this._data);
    }else {
        fs.readFile(self.getFileName(),function (e,buf){
            self._data = buf;
            callback(buf);
        });
    }
}

Cache.prototype.valueOf = function (){
    return {
        expires : + this._expires,
        modified : + this._modified,
        etag : this._etag,
        hash : this._hash
    }
}

Cache.prototype.toString = function (){
    return JSON.stringify(this.valueOf().null,2);
}

Cache.parse = function (obj){
    var cache = new Cache();
    cache._expires = obj.expires;
    cache._modified = obj.modified;
    cache._etag = obj.etag;
    cache._hash = obj.hash;
    return cache;
}

function get(url){
    return Log[url];
}

function set(url,res,buf){
    var cache = new Cache(res,buf);
    if (cache){
        Log[url] = cache;
    }
}

function del(url){
    delete Log[url];
}

module.exports = {
    get:get,
    set:set,
    del:del
}

for (var url in Log){
    Log[url] = Cache.parse(Log[url]);
}