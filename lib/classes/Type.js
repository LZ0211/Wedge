function toReStr(str) {
    return str.replace(/[()\[\]{}|+.,^$?\\*]/g, "\\$&");
}

var toString = Object.prototype.toString;

var is = {};
["RegExp","Object","Function","String","Array"].forEach(function (type){
    is["is"+type]=function (value){
        return toString.call(value) === "[object "+type+"]"
    }
});

function compose(){
    var args = [].slice.apply(arguments);
    var fn = args.pop();
    if (args.length == 0) return fn;
    return function (){
        return compose.apply(null,args)(fn.apply(null,arguments));
    }
}

function merge(plugins,constructor){
    var Super = compose(plugins,constructor);
    Super.prototype.constructor = constructor;
    for (var x in constructor.prototype){
        Super.prototype[x] = constructor.prototype[x];
    }
    Super.prototype.apply = function (fn){
        var args = [].slice.call(arguments,1);
        return fn.apply(this,args);
    }
    for (var x in plugins.prototype){
        Super.prototype[x] = plugins.prototype[x];
    }
    return Super;
}


function createType(defaut,constructor){
    var defaut = defaut;
    var Super = constructor;
    function Type(arg){
        if (is.isFunction(arg)){
            return createType(defaut,merge(arg,Super));
        }
        var value = arg || defaut;
        function format(input){
            if (input == undefined) return value;
            /*if (typeof input.valueOf == "function"){
                return Super(input.valueOf());
            }
            if (typeof input.toString == "function"){
                return Super(input.toString());
            }*/
            return Super(input);
        }
        //构造函数
        function classes(){};
        //继承原型
        classes.prototype = new Super();
        classes.prototype.constructor = Super;
        for (var f in Super.prototype){
            classes.prototype[f] = Super.prototype[f];
        }
        //固定接口
        classes.prototype.val = function (input){
            if (arguments.length == 0){
                return value;
            }
            value = format(input);
            return this;
        }
        classes.prototype.add = classes.prototype.add || function (input){
            this.val(value + input);
            return this;
        }
        classes.prototype.valueOf = classes.prototype.valueOf || function (){
            return value;
        }
        //初始化值
        value = format(value);
        return new classes();
    }
    return Type;
}

module.exports = createType;
