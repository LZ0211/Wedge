const URL = require("url");
const path = require("path");
const fs = require("fs");
const auto = require("./auto");

function encode(selector,name){
    if (typeof selector !== "function"){
        var fn = "try{return " + (selector ? '(' + selector + ')' : '') + "}catch(e){console.log('warning: A error occur in " + name + "');console.log(e);}";
        return new Function("$",fn);
    }else {
        return function ($){
            var self=this;
            try{
                return selector.call(self,$);
            }catch (e){
                console.log('warning: A error occur in '+name);
                console.log(e);
            }
        }
    }
}

function compile(options){
    var parsed = {};
    for (var x in options){
        var v = options[x];
        if (typeof v == "object"){
            var sub = compile(v);
            parsed[x] = sub;
        }else {
            try{
                parsed[x] = encode(v,x).bind(parsed);
            }catch (e){
                console.log("warning: A error is found when compile of " + x)
            }
        }
    }
    return parsed;
}

var Sites = [];

function clearCache(path){
    for(var x in require.cache){
        if(~x.indexOf(path)){
            require.cache[x] = null;
        }
    }
}

function addRule(root){
    var dirname = path.join(__dirname,root);
    function add(file){
        try{
            var idx = Sites.length;
            var modulePath = './'+root+'/'+file;
            var site = require(modulePath);
            site.selector = compile(site.selector);
            Sites.push(site);
            var fullpath = path.join(dirname,file);
            fs.watch(fullpath,function(){
                try{
                    clearCache(fullpath);
                    var site = require(modulePath);
                    site.selector = compile(site.selector);
                    Sites[idx] = site;
                }catch(e){
                    //do nothing
                }
            });
        }catch(e){
            console.log("warning:"+e)
        }
    }
    fs.readdirSync(dirname).filter(file=>file!=='.DS_Store').forEach(add)
    fs.watch(dirname,function(event,file){
        event === 'rename' && fs.existsSync(path.join(dirname,file)) && add(file)
    });
}

addRule('default')
addRule('plugins')

module.exports = {
    search:function (url){
        url = url.toLowerCase();
        var host = URL.parse(url).hostname;
        for (var i=0;i<Sites.length ;i++ ){
            var site = Sites[i];
            if (site.host === host){
                return site;
            }
        }
        for (var i=0;i<Sites.length ;i++ ){
            var site = Sites[i];
            for (var j=0;j<site.match.length;j++){
                if(~host.indexOf(site.match[j])){
                    return site;
                }
            }
        }
        return auto;
    },
    inject:function(site){
        site.selector = compile(site.selector);
        Sites.push(site);
    },
    alias:function (oldName,newName){
        var site = this.search(oldName);
        if (site !== auto){
            site.match.push(URL.parse(newName).hostname);
        }
    },
    auto:auto
}