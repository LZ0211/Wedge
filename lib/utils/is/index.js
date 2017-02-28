var slice = [].slice;
var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var dash = require("../dash");
var curry = dash.curry;
var compose = dash.compose;
var not = dash.not;
var or = dash.or;
var and = dash.and;

var is = {};

;(function (){
    ["Function","Array","String","Object","RegExp","Date","HTMLDocument","Boolean","Error","Symbol"].forEach(function (type){
       is["is"+type] = function (value){
            return toString.call(value) === "[object "+type+"]"
        }
    });
})()

function type(v){
    return typeof type;
}

var propertyOf = curry(function(property,object){
    return object[property];
})

var kindof = curry(function (type,value){
    return type == typeof value;
})

var equal = curry(dash.equal);

var bigger = curry(function (a,b){
    return a < b;
})

var smaller = curry(function (a,b){
    return a > b;
})

var mode = curry(function (a,b){
    return b % a;
})

var getLength = propertyOf("length");

is.isNaN = function (nan){
    return nan !== nan;
}

is.isZero = compose(equal(0),Number);

is.isNumber = compose(not(is.isNaN),Number);

is.isArray = Array.isArray || is.isArray;

is.isEmptyArray = and(is.isArray,compose(is.isZero,getLength));

is.isArrayLike = and(kindof("object"),compose(and(is.isNumber,isFinite,bigger(-1)),getLength));

is.isUndefined = or(kindof("undefined"),is.isNull);

is.isDefined = not(is.isUndefined);

is.isNull = equal(null);

is.isInfinite = not(isFinite);

is.isPositive = and(is.isNumber,bigger(0));

is.isNegative = and(is.isNumber,smaller(0));

is.isInteger = and(not(is.isString),is.isNumber,compose(equal(0),mode(1),Number));

is.isOdd = and(is.isInteger,compose(equal(1),mode(2),Number));

is.isEven = and(is.isInteger,compose(equal(0),mode(2),Number));

is.isPrimitive = or(kindof("string"),kindof("number"),kindof("boolean"),is.isNull);


module.exports = is;