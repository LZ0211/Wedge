var async = {};
async._threads = 3;
async._running = 0;
async.setThread = function(val){
    this._threads = val || this._threads;
    return this;
};

async.series = function (array,callback){
    callback = callback || noop;
    var self = this;
    this._running += 1;
    let callee = function (...args){
        function pack(fn){
            let len = fn.length;
            if (len == 0){
                return ()=>{fn();callee()};
            }else {
                let _args = args.slice(args.length-len+1);
                return ()=>fn(..._args,callee);
            }
        }
        function decorate(fn){
            let len = fn.length;
            if (len == 0){
                return (next)=>{fn();next()};
            }else {
                let _args = args.slice(args.length-len+1);
                return (next)=>fn(..._args,next);
            }
        }
        let fn = array.shift();
        if (exports.isFunction(fn)){
            process.nextTick(pack(fn));
        }else if (exports.isArray(fn)){
            let fns = fn.filter((f)=>exports.isFunction(f));
            return process.nextTick(()=>{
                async.thread().all(fns.map(decorate),callee);
            });
        }else {
            return callback();
        }
    }
    callee();
    return this;
};
async.parallel = function (array,callback){
    callback = callback || noop;
    var threads = Math.min(array.length,this._threads);
    if (threads === 0){
        callback();
        return this;
    }
    var count = 0,self=this;
    for (var i=0;i<threads ;i++ ){
        this.series(array,function (){
            count += 1;
            self._running -= 1;
            if (self._running === 0){
                callback();
            }
        });
    }
    return this;
};

async.all = function (array,callback){
    callback = callback || noop;
    let len = array.length;
    let count = 0
    let callee = function (){
        count += 1;
        if (len == count)return callback();
    }
    array.forEach(function (fn){fn(callee)});
}

async.thread = function (){
    var Thread = function(){}
    Thread.prototype = this;
    return new Thread();
}

module.exports = async;