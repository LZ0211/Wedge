'use strict';
/**
 * Class representing a header.
.* Construct header and simulate browser to anti anti-crawler tactics.
*/
var URL = require("url");
class Headers{
    /**
     * Constructor Header
     * @param {string} href - The href to visit
     */
    constructor(href){
        this['Accept']='text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
        this['Accept-Encoding']='gzip, deflate, sdch';
        this['Accept-Language']='en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4';
        this['Cache-Control']='max-age=0';
        this['Connection']='keep-alive';
        this['User-Agent']='Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36';
        this['Content-Type']='application/x-www-form-urlencoded';
        this["Referer"] = href;
        this["Host"] = URL.parse(href).host;
        //this["X-Requested-With"] = "XMLHttpRequest";
    }
    /**
     * Configure Header
     * @param {string} attribute
     * @param {string} value
     */
    setHeader(k,v){
        this[k] = v;
    };
}

module.exports = Headers