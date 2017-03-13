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

var classes = {
    string:require('../type').String,
    number:require('../type').Number,
    boolean:require('../type').Boolean,
    integer:require('../type').Integer,
    path:require('./path'),
    id : require("./id"),
    url : require("./url"),
    isend : require("./isend"),
    time : require("./time"),
    uuid : require("./uuid"),
    text : require("./text"),
    base64 : require("./base64")
};
module.exports = function (setting){
    var setting = clone(setting);

    return function Attributes(data){
        var data = clone(data) || {};
/*        for(var k in data){
            if(!setting.hasOwnProperty(K)){
                delete data[k];
            }
        }*/
        function noop(){}
        noop.prototype.constructor = Attributes;
        //全局设置
        noop.prototype.setting = setting;
        noop.prototype.addKey = function (key,val){
            if (arguments.length < 2){
                return this;
            }
            if (key in setting){
                return this;
            }
            setting[key] = val;
            this.init();
            return this;
        };
        noop.prototype.delKey = function (keys){
            var self = this;
            if (arguments.length >= 2){
                return this.del([].slice.call(arguments));
            }
            if (Array.isArray(keys)){
                keys.forEach(function (key){
                    self.delKey(key);
                });
                return this;
            }
            delete setting[keys];
            delete this[keys];
            changed = true;
        };
        noop.prototype.setKey = function (key,val){
            setAttr(setting,key,val);
            return this;
        };
        noop.prototype.config = function (config){
            this.delKey(this.keys());
            for (var key in config){
                this.addKey(key,config[key]);
            }
            this.init();
            return this;
        };
        //初始化对象自身
        noop.prototype.init = function (){
            for (var key in setting){
                var config = setting[key];
                var type = config.type;
                var value = config.value;
                this[key] = new classes[type](data[key] || value);
            }
            return this;
        };
        //设置值
        noop.prototype.set = function (key,val){
            if (val == undefined && typeof key == "object"){
                for (var x in key){
                    this.set(x,key[x]);
                }
                return this;
            }
            data[key] = val;
            if (this.hasOwnProperty(key)){
                this[key].val(val);
            }
            return this;
        };
        //获取值
        noop.prototype.get = function (key){
            if (!this.hasOwnProperty(key)) return;
            return this[key].val();
        };
        noop.prototype.keys = function (){
            return Object.keys(setting);
        };
        noop.prototype.valueOf = function (){
            this.init();
            var json = {};
            this.keys().forEach(function (key){
                json[key] = object[key].val();
            });
            return json;
        };
        noop.prototype.toString = function (){
            return JSON.stringify(this.valueOf(),null,2);
        };
        var object = new noop();
        object.init();
        return object;

    }
}

module.exports.classes = classes;