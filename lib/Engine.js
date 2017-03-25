const Engines = {
    "baidu":{
        "url": "https://www.baidu.com/s?wd=%keyword%&rsv_spt=1&rsv_iqid=0x96272cd60002200d&issp=1&f=3&rsv_bp=0&rsv_idx=2&ie=utf-8&rqlang=&tn=99190945_s_hao_pg&rsv_enter=1&inputT=3752",
        "host": ".baidu.com",
        "selector": ".result h3.t a"
    },
    "sogou":{
        "url": "https://www.sogou.com/web?ie=UTF-8&query=%keyword%",
        "host": ".sogou.com",
        "selector": ".vrwrap h3.vrTitle a"
    },
    "360":{
        "url": "https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q=%keyword%",
        "host": ".so.com",
        "selector": ".result h3.res-title a"
    }
}

const request = require("./request");
const Parser = require("./Parser");

function parallel(array,fn,final,threadNumber){
    var final = final || noop;
    var threadNumber = threadNumber || 3;
    var running = 0;
    var sumLength = array.length;
    array = array.concat();
    var execute = (fn)=>{
        var element = array.shift();
        if (element){
            running += 1;
            fn(element,()=>{
                running -= 1;
                //threadLog && this.log(sumLength - array.length - running + " of " + sumLength);
                execute(fn);
            });
        }else {
            if (running == 0) return final();
        }
    }
    for (var index=0;index<threadNumber;index++){
        execute(fn);
    }
}

function SearchEngine(name){
    var Engine = Engines[name];
    function setEngine(name){
        Engine = Engines[name];
        return this;
    }
    function search(keyword,fn){
        var url = Engine.url.replace('%keyword%',keyword);
        var urls = [];
        request.get(url).then(data=>{
            var $ = Parser(data,url).$;
            var links = [];
            $(Engine.selector).each((i,v)=>{
                var href = $(v).attr('href');
                if (href.match(Engine.host)){
                    links.push(href+'&wd=');
                }else {
                    urls.push(href);
                }
            });

            parallel(links,(link,next)=>{
                request.get(link).referer(link).then(data=>{
                    var $ = Parser(data,link).$;
                    var content = $('meta[http-equiv="refresh"]').attr('content');
                    if (!content) return next();
                    urls.push(content.replace(/0;URL='(.*)'/,"$1"));
                    return next();
                },next);
            },()=>fn(urls));
        },()=>search(keyword,fn));
        return this;

    }
    return {
        setEngine:setEngine,
        search:search
    }
}

module.exports = SearchEngine;