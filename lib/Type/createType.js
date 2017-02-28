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
    if (args.length == 0){
        return fn;
    }
    return function (){
        return compose.apply(null,args)(fn.apply(null,arguments));
    }
}


function createType(defaut,constructor){
    var fns = [constructor];
    var defaut = defaut;
    var parser = compose(constructor);
    function Super(){};
    Super.prototype.constructor = constructor;
    for (var x in constructor.prototype){
        Super.prototype[x] = constructor.prototype[x];
    }
    Super.prototype.apply = function (fn){
        var args = [].slice.call(arguments,1);
        return fn.apply(this,args);
    }
    function Type(arg){
        if (is.isFunction(arg)){
            fns.push(arg);
            parser = compose(arg,parser);
            for (var x in arg.prototype){
                Super.prototype[x] = arg.prototype[x];
            }
            return Type;
        }
        var value = arg || defaut;
        function format(input){
            if (input == undefined)return value;
            if (typeof input.valueOf == "function"){
                return parser(input.valueOf());
            }
            if (typeof input.toString == "function"){
                return parser(input.toString());
            }
            return parser(input);
        }
        //构造函数
        function classes(){};
        //继承原型
        classes.prototype = new Super();
        //classes.prototype.constructor = constructor;
        //固定接口
        classes.prototype.val = function (input){
            if (arguments.length == 0){
                return value;
            }
            value = format(input);
            return this;
        }
        classes.prototype.add = function (input){
            value += input;
            return this;
        }
        classes.prototype.valueOf = function (){
            return value;
        }
        //初始化值
        value = format(arg);
        return new classes();
    }
    return Type;
}

module.exports = createType;
