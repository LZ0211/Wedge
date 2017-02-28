module.exports = {
    each:function (object,fn){
        for (var x in object){
            fn.call(object,x,object[x],object);
        }
    },
    map:function (object,fn){
        var obj = {};
        for (var x in object){
            obj[x] = fn.call(object,x,object[x],object);
        }
        return obj;
    },
    filter:function (object,fn){
        var obj = {};
        for (var x in object){
            if (fn.call(object,x,object[x],object)){
                obj[x] = object[x];
            }
        }
        return obj;
    },
    keys:function (object){
        return Object.keys(object);
    },
    vals:function (object){
        return Object.keys(object).map(function (key){
            return object[key];
        });
    },
    pairs:function (object){
        return Object.keys(object).map(function (key){
            return [key,object[key]];
        });
    },
    set:function (object,attr,value){
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
    },
    get:function (object,attr){
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
    },
    clone:function (object){
        if (Array.isArray(object)) return object.concat();
        if (typeof object === "object"){
            var _object = {};
            for (var k in object){
                if (object.hasOwnProperty(k)){
                    _object[k] = object[k];
                }
            }
            return _object;
        }else {
            return object;
        }
    },
    deepClone:function (object){
        var callee = arguments.callee;
        if (Array.isArray(object)){
            return object.map(k=>callee(k));
        }
        if (typeof object === "object"){
            var _object = {};
            for (var k in object){
                if (object.hasOwnProperty(k)){
                    _object[k] = callee(object[k]);
                }
            }
            return _object;
        }
        else {
            return object;
        }
    }
}