var Attributes = require("../attributes");
var Chapter = new Attributes({
    "title":{
        "type":"path",
        "value":""
    },
    "id":{
        "type":"id",
        "value":0
    },
    "source":{
        "type":"url",
        "value":"http://localhost"
    },
    "date":{
        "type":"time",
        "value":+new Date()
    },
    "file":{
        "type":"path",
        "value":""
    },
    "size":{
        "type":"integer",
        "value":0
    }
});

function List(input){
    var array = [];
    var hash = {};
    var uniqueKey;
    if (Array.isArray(input)){
        array = input;
    }
    array = array.map(function (chapter){
        return new Chapter(chapter);
    });
    function noop(){}
    noop.prototype = List.prototype;
    var object = new noop();

    Object.defineProperty(object,"valueOf",{
        set:noop,
        get:function (){
            return function (){
                return array.map(function (chapter){
                    return chapter.valueOf();
                });
            }
        }
    });
    Object.defineProperty(object,"toString",{
        set:noop,
        get:function (){
            return function (){
                return JSON.stringify(object.valueOf(),null,2);
            }
        }
    });
    object.push = function (chapter){
        array.push(new Chapter(chapter));
    }
    object.get = function (index){
        return array[index];
    }
    object.config = function (options){
        if (options == undefined){
            return new Chapter().setting;
        }
        Chapter = new Attributes(options);
        array.forEach(function (chapter){
            chapter.config(options);
        });
    }
    object.attr = function (key){
        return array.map(function (chapter){
            return chapter.get(key);
        })
    }
    object.hash = function (key){
        var hash = {};
        array.forEach(function (chapter,index){
            hash[chapter.get(key)] = [chapter,index];
        });
        return hash;
    }
    object.sortBy = function (key){
        array.sort((a,b)=>{
            return a.get(key) - b.get(key);
        });
        return object;
    }
    object.remove = function (indexs){
        var hash = {};
        indexs.forEach(function (index){
            hash[index] = true;
        });
        array = array.filter(function (chapter,index){
            return !hash[index];
        });
        return object;
    }
    object.empty = function (){
        array = [];
        hash = {};
        return object;
    }

    object.last = function (){
        return array[array.length-1];
    }

    object.each = function (fn){
        return array.forEach(fn);
    }
    object.map = function (fn){
        return array.map(fn);
    }
    object.filter = function (fn){
        return array.filter(fn);
    }

    return object;
}

module.exports = List;
