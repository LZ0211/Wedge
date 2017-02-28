function toReStr(str) {
    return str.replace(/[()\[\]{}|+.,^$?\\*]/g, "\\$&");
}

var toString = Object.prototype.toString;
function isRegExp(value){
    return toString.call(value) === "[object RegExp]"
}

function isObject(value){
    return toString.call(value) === "[object Object]"
}

function isFunction(value){
    return toString.call(value) === "[object Function]"
}

function isString(value){
    return toString.call(value) === "[object String]"
}
var fn = function (input){
    return input;
}
fn.prototype.replace = function (selector){
    var value = this.val();
    if (isFunction(selector)){
        value = selector(value);
        this.val(value);
        return value;
    }
    if (isString(selector)){
        try{
            var regexp = new RegExp(selector,"gi");
        }catch (e){
            var regexp = new RegExp(toReStr(selector),"gi");
        }
        return this.replace(regexp);
    }
    if (Array.isArray(selector)){
        selector.forEach(this.replace.bind(this));
        return this.val();
    }
    if (isRegExp(selector)){
        value = value.replace(selector,"");
        this.val(value);
        return value;
    }
    if (isObject(selector)){
        Object.keys(selector).forEach(function (k){
            try{
                var regexp = new RegExp(k,"gi");
            }catch (e){
                var regexp = new RegExp(toReStr(k),"gi");
            }
            value = value.replace(regexp,selector[k]);
        });
        this.val(value);
        return value;
    }
    return value;
};
module.exports = require("../../Type").createType("",fn);