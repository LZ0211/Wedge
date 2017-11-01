'use strict';
var querystring = require('querystring'),
    URL = require('url');
try{
    var cache = require('./cookies');
}
catch (e){
    cache = {};
}
/**
 * Class representing a cookie.
.* Can be used on server-side and client-side.
*/
class Cookie {
    /**
     * Constructor Cookie
     * @param {string} cookiestr
     */
    constructor(cookiestr){
        if (cookiestr instanceof Cookie){
            return cookiestr
        }
        this.name = null;
        this.value = null;
        this.expires = null;
        this.path = "/";
        this.domain = null;
        this.secure = false;
        this.httpOnly = false;
        if (cookiestr) {
            this.parse(cookiestr);
        }
        return this;
    }

    toString(){
        var query = [this.name + "=" + this.value];
        if (this.expires) {
            query.push("expires=" + this.getExpires());
        }
        if (this.domain) {
            query.push("domain=" + this.domain);
        }
        if (this.path) {
            query.push("path=" + this.path);
        }
        if (this.secure) {
            query.push("secure");
        }
        if (this.httpOnly) {
            query.push("httponly");
        }
        return query.join("; ");
    }

    toValueString(){
        return this.getName() + "=" + this.getValue();
    }

    parse(cookiestr){
        var parsed = querystring.parse(cookiestr,'; ');
        var self = this;
        Object.keys(parsed).forEach(function (key){
            var attr = key.toLowerCase();
            switch (attr){
                case 'expires':
                    self.setExpires(parsed[key]);
                    break;
                case 'max-age':
                    self.setMaxAge(parsed[key]);
                    break;
                case 'domain':
                    self.setDomain(parsed[key]);
                    break;
                case 'path':
                    self.setPath(parsed[key]);
                    break;
                case 'secure':
                    self.isSecure(true);
                    break;
                case 'httponly':
                    self.isHttpOnly(true);
                    break;
                default:
                    self.setName(key);
                    self.setValue(parsed[key]);
            }
        });
    }
    /**
     * set the cookie name.
     * @param {string} name.
     */
    setName(name){
        this.name = name;
    }
    /**
     * get the cookie name.
     * @return {string} name.
     */
    getName(){
        return this.name;
    }
    /**
     * set the cookie value.
     * @param {string} value.
     */
    setValue(value){
        this.value = decodeURIComponent(value);
    }
    /**
     * get the cookie value.
     * @return {string} value.
     */
    getValue(){
        return encodeURIComponent(this.value);
    }
    /**
     * set attribute max-age of the cookie.
     * @param {number} max-age.
     */
    setMaxAge(maxage){
        this["Max-Age"]=maxage;
    }
    /**
     * get attribute max-age of the cookie.
     * @return {number} attribute max-age.
     */
    getMaxAge(){
        return this["Max-Age"];
    }
    /**
     * set attribute path of the cookie.
     * @param {string} path.
     */
    setPath(path){
        this.path=path;
    }
    /**
     * get attribute path of the cookie.
     * @return {string} attribute path.
     */
    getPath(){
        return this.path;
    }
    /**
     * set attribute domain of the cookie.
     * @param {string} domain.
     */
    setDomain(domain){
        this.domain=domain;
    }
    /**
     * get attribute domain of the cookie.
     * @return {string} attribute domain.
     */
    getDomain(){
        return this.domain;
    }
    /**
     * set attribute expires of the cookie.
     * @param {date,number,date string} value.
     */
    setExpires(expires){
        this.expires = new Date(expires).toGMTString();
    }
    /**
     * get attribute expires of the cookie.
     * @return {date string} value.
     */
    getExpires(){
        return new Date(this.expires).toGMTString();
    }
    /**
     * set attribute secure of the cookie.
     * @param {bool} secure.
     * @return {bool} isSecure.
     */
    isSecure(secure){
        if (arguments.length === 0){
            return this.secure;
        }
        this.secure = Boolean(secure);
    }
    /**
     * set attribute secure of the cookie.
     * @param {bool} secure.
     * @return {bool} isSecure.
     */
    isHttpOnly(httponly){
        if (arguments.length === 0){
            return this.httpOnly;
        }
        this.httpOnly = Boolean(httponly);
    }
    /**
     * check whether the cookie has been expired.
     * @return {bool} whether cookie is expired.
     */
    isExpired(){
        return !this.expires || new Date() - new Date(this.expires) > 0
    }
    /*
     * check whether the cookie is match path
     * @param {string} pathname
     * @return {boolean} matched
    */
    match(path){
        if (this.path = "/"){
            return true;
        }
        var regexp = new RegExp("^"+this.path.replace(/\//g,"//"));
        if (regexp.test(path)){
            return true;
        }
        return false;
    }
}

/*
 * save cookie from response
 * @param {string} url
 * @param {object} response
*/
var setCookie = function (href,res){
    var cookies = res.headers["set-cookie"];
    if (!cookies) return;
    var host = URL.parse(href).hostname;
    cookies.forEach(function (cookie){
        var parsed = new Cookie(cookie);
        var domain = host;
        if (parsed.domain){
            domain = parsed.domain;
        }
        if (parsed.path){
            domain += parsed.path;
        }
        var lists = cache[domain] || {};
        lists[parsed.name] = cookie;
        cache[domain] = lists;
    });
};

/*
 * load cookie from cookie-cache
 * @param {string} url
 * @return {string} cookie
*/
var getCookie = function (href){
    var query = [];
    Object.keys(cache).forEach(function (domain){
        if(~href.indexOf(domain)){
            var cookies = cache[domain];
            Object.keys(cookies).forEach(function (name){
                var cookie = new Cookie(cookies[name]);
                query.push(cookie.toValueString());
            });
        }
    });
    return query.join("; ");
};

/*
 * delete cookie from cookie-cache
 * @param {string} host
*/
var delCookie = function (href){
    Object.keys(cache).forEach(function (domain){
        if(~href.indexOf(domain)){
            delete cache[domain];
        }
    });
};

module.exports = {
    Cookie:Cookie,
    setCookie:setCookie,
    getCookie:getCookie,
    delCookie:delCookie
}

process.on("exit",function (){
    var fs = require('fs'),
        path = require('path');
    Object.keys(cache).forEach(function (domain){
        var cookies = cache[domain];
        var keys = Object.keys(cookies);
        if(keys.length > 50){
            keys.forEach(function (name){
                var cookie = new Cookie(cookies[name]);
                if (cookie.isExpired()){
                    delete cookies[name];
                }
            })
        }
    });
    fs.writeFileSync(path.join(__dirname,"./cookies.json"),JSON.stringify(cache,null,4),"utf8");
});