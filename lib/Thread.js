"use strict";
function Thread(){
    var Queue = [];
    var Excute = (item,next)=>next();
    var maxThread = 1;
    var running = 0;
    var started = false;
    var threadLog = false;
    var label = "";
    var endFun = [];
    var push = item=>Queue.push(item);
    var object = {};
    var doExcute = number=>{
        if (Queue.length){
            var item = Queue.shift();
            //running += 1;
            threadLog && threadLog(label + "<thread " + number + "> " + running + ' quests is running, '+ Queue.length + ' quests is waiting...');
            Excute(item,()=>{
                //running -= 1;
                setImmediate(()=>doExcute(number));
            });
        }else{
            running -= 1;
            threadLog && threadLog(label + "<thread " + number + "> " + running + ' quests is running, '+ Queue.length + ' quests is waiting...');
            if(running == 0) return end();
        }
    };
    var start = ()=>{
        started = true;
        var len = Math.min(maxThread,Queue.length) - running;
        for(var i=0;i<len;i++){
            running += 1;
            doExcute(running);
        }
        if(running == 0) end();
        return object;
    };
    var end = fn=>{
        if(typeof fn == 'function'){
            endFun.push(fn);
        }else{
            endFun.forEach(item=>item(fn));
        }
        return object;
    };
    var use = fn=>{
        if(typeof fn == 'function' && fn.length == 2){
            Excute = fn;
        }else{
            throw new Error(fn + 'is not a valid function');
        }
        return object;
    };
    var queue = arr=>{
        if(Array.isArray(arr)){
            arr.forEach(push);
        }else{
            push(arr);
        }
        started && start();
        return object;
    };
    var setThread = num=>{
        num = Number(num);
        if(isNaN(num)){
            num = 1;
        }
        maxThread = num;
        started && start();
        return object;
    };
    var log = logFun=>{
        if(typeof logFun === 'function'){
            threadLog = logFun;
        }
        return object;
    };
    object.use = use;
    object.queue = queue;
    object.end = end;
    object.start = start;
    object.setThread = setThread;
    object.log = log;
    object.label = lab=>{
        if(typeof lab == 'string' && lab){
            label = '['+ lab + ']:';
        }
        return object;
    };
    return object;
}

function noop(){
}

function toArray(arrayLike){
    return [].slice.call(arrayLike);
}

function combine(thisFun,nextFun){
    if (!nextFun) return thisFun;
    if (thisFun.length == 0) return function (){
        var argv = toArray(arguments);
        thisFun.apply(null,argv);
        nextFun.apply(null,argv);
        return this;
    };
    return function (){
        var argv = toArray(arguments);
        argv[thisFun.length - 1] = nextFun;
        thisFun.apply(null,argv);
        return this;
    };
}

function series(args){
    var nextFun;
    while (args.length){
        var thisFun = args.pop();
        nextFun = combine(thisFun,nextFun);
    }
    return nextFun;
}

function shunt(args){
    var count = 0,threads = args.length;
    return function (final){
        if (threads == 0) return final();
        while (args.length){
            var thisFun = args.shift();
            if (thisFun.length == 0){
                (function(){
                    thisFun();
                    count += 1;
                    if (count == threads) return final();
                })();
            }else {
                thisFun(function (){
                    count += 1;
                    if (count == threads) return final();
                });
            }
        }
    };
}

module.exports = Thread;
Thread.series = series;
Thread.shunt = shunt;
