var slice = [].slice;
function curry(fn){
    var length = fn.length;
    return function (){
        var callee = arguments.callee;
        var args = [].slice.apply(arguments);
        var len = args.length;

        if (len >= length){
            return fn.apply(null,args);
        }
        return function (){
            var _args = args.concat([].slice.apply(arguments));
            return callee.apply(null,_args);
        }
    }
}

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

function not(fn){
    return function (){
        return !fn.apply(null,arguments)
    }
}

function or(){
    var fns = slice.apply(arguments);
    return function (){
        var args = slice.apply(arguments);
        return fns.some(function (fn){
            return fn.apply(null,args);
        });
    }
}

function and(){
    var fns = slice.apply(arguments);
    return function (){
        var args = slice.apply(arguments);
        return fns.every(function (fn){
            return fn.apply(null,args);
        });
    }
}

function bigger(a,b){
    return a > b;
}

function smaller(a,b){
    return a < b;
}

function equal(a,b){
    return a === b;
}

function biggerThan(a){
    return curry(smaller)(a);
}

function smallerThan(a){
    return curry(bigger)(a);
}


module.exports = {
    curry:curry,
    compose:compose,
    not:not,
    or:or,
    and:and,
    bigger:bigger,
    smaller:smaller,
    equal:equal,
    biggerThan:biggerThan,
    smallerThan:smallerThan
}