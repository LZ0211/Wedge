const Engines = {
    "baidu":{
        "url": "https://www.baidu.com/s?wd=%keyword%&rsv_spt=1&rsv_iqid=0x96272cd60002200d&issp=1&f=3&rsv_bp=0&rsv_idx=2&ie=utf-8&rqlang=&tn=99190945_s_hao_pg&rsv_enter=1&inputT=3752&rn=50",
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
    },
    "bing":{
        "url": "http://cn.bing.com/search?q=%keyword%",
        "host": ".bing.com",
        "selector": ".b_algo h2 a"
    }
}

module.exports = function(){
    var Engine = Engines['sogou'];
    var defaultSearch = (keyword,fn)=>this.searchBook(keyword,list=>fn(list.map(item=>item[0])));
    var setEngine = name=>{
        if(name in Engines){
            Engine = Engines[name];
            searchEngine.search = search;
        }else{
            searchEngine.search = defaultSearch;
        }
        return searchEngine;
    };
    var search = (keyword,fn)=>{
        fn = this.next(fn);
        var link = Engine.url.replace('%keyword%',keyword);
        var urls = [];
        this.request({
            url:link,
            success:data=>{
                var $ = this.Parser(data,link);
                var links = [];
                $(Engine.selector).each((i,v)=>{
                    var href = $(v).attr('href');
                    if (href.match(Engine.host)){
                        links.push(href+'&wd=');
                    }else {
                        urls.push(href);
                    }
                });
                this.Thread().use((link,next)=>{
                    this.request({
                        url:link,
                        headers:{referer:link},
                        success:data=>{
                            var $ = this.Parser(data,link);
                            var content = $('meta[http-equiv="refresh"]').attr('content');
                            if (!content) return next();
                            urls.push(content.replace(/0;URL='(.*)'/,"$1"));
                            return next();
                        },
                        error:next
                    });
                }).end(()=>fn(urls)).queue(links).setThread(3).start();
            },
            error:()=>fn(urls)
        });
    };
    var searchEngine = {
        setEngine:setEngine,
        search:defaultSearch
    };
    this.searchEngine = searchEngine;
}
