module.exports = function (defaut,config){
    function getAttr(object,attr){
        var list = attr.split(".");
        var key = list.shift();
        var obj= object[key];
        while (list.length){
            if (typeof obj !== "object"){
                return undefined;
            }
            key = list.shift();
            obj = obj[key]
        }
        return obj;
    }

    function setAttr(object,attr,value){
        var list = attr.split(".");
        var obj = object;
        var key = list.shift();
        while (list.length){
            if (typeof obj[key] !== "object"){
                obj[key] = {};
            }
            obj = obj[key];
            key = list.shift();
        }
        obj[key] = value;
        return object;
    }

    function clone(object){
        if (Array.isArray(object)){
            return object.map(k=>clone(k));
        }
        if (typeof object === "object"){
            var _object = {};
            for (var k in object){
                if (object.hasOwnProperty(k)){
                    _object[k] = clone(object[k]);
                }
            }
            return _object;
        }else {
            return object;
        }
    }

    function merge(a,b){
        for (var k in b){
            if (!a.hasOwnProperty(k)){
                a[k] = b[k];
            }else {
                if (typeof a[k] == "object" && typeof b[k] == "object"){
                    merge(a[k],b[k]);
                }
            }
        }
        return a;
    }

    function noop(){
    }

    var fs;

    var defaut = defaut || {};
    var config = config || {};
    config = merge({},config);
    config = merge(config,defaut);

    var object = {
        set:function (key,val){
            if (!key) return;
            if (undefined == val && typeof key == "object"){
                for (var k in key){
                    config[k] = clone(key[k]);
                }
            }else {
                setAttr(config,key,val);
            }
            return object;
        },
        get:function (key){
            if (!key) return;
            return getAttr(config,key);
        },
        defaut:function (defaut){
            config = merge(config,defaut);
            return object;
        },
        file:function (file){
            if (!fs){
                fs = require("fs");
            }
            var defaut = {};
            try{
                defaut = JSON.parse(fs.readFileSync(file).toString());
            }catch (e){
                fs.writeFileSync(file,object.toString());
                //console.log(e);
            }
            object.set(defaut);
            process.on("exit",function (){
                fs.writeFileSync(file,object.toString());
            });
            return object;
        },
        keys:function (hash){
            var list = [];
            hash = hash || config;
            Object.keys(hash).forEach(function (k){
                if (typeof hash[k] !== "object"){
                    list.push(k);
                }else {
                    object.keys(hash[k]).forEach(function (_k){
                        list.push(k+"."+_k);
                    });
                }
            });
            return list;
        }
    }

    Object.defineProperty(object,"valueOf",{
        get:function (){
            return function (){
                return config;
            };
        },
        set:noop
    });

    Object.defineProperty(object,"toString",{
        get:function (){
            return function (){
                return JSON.stringify(config,null,2);
            };
        },
        set:noop
    });

    return object;
}