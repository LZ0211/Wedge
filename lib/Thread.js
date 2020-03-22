"use strict";

function Thread(options){
    function route(i){
        let next = setImmediate.bind(null,route.bind(null,i));
        if(interval>0){
            next = setTimeout.bind(null,route.bind(null,i),interval);
        }
        if(queue.length === 0){
            if(running > 0){
                running -= 1;
                log(`[${label}threads]<thread ${i}> finished, ${running} threads is running`);
            }
            if(running === 0){
                started = false;
                log(`[${label}threads]end`);
                return end();
            }
            return;
        }
        if(pause){
            running -= 1;
            log(`[${label}threads]stop <thread ${i}>, ${running} threads is running, ${queue.length} queueTasks left`);
            return;
        }
        let item = queue.shift();
        log(`[${label}threads][thread ${i}] ${running} threads is running, ${queue.length} queueTasks is waiting`);
        execute(item,next);
    }
    let execute = (item,next)=>next(),
        end = noop,
        error = noop,
        log = noop,
        label = '',
        pause = false,
        started = false,
        running = 0,
        interval = 0,
        queue = [],
        push = queue.push.bind(queue),
        thread = 1;
    if(typeof options === 'object'){
        if(typeof options.execute === 'function'){
            execute = options.execute;
        }
        if(typeof options.end === 'functionn'){
            end = options.end;
        }
        if(typeof options.error === 'functionn'){
            error = options.error;
        }
        let number = parseInt(options.thread);
        if(typeof number === 'number'){
            thread = number;
        }
    }
    return {
        threads(number){
            if(number == null){
                number = thread;
            }
            if(typeof number !== 'number') throw new Error('thread parameter must be integer');
            thread = parseInt(number);
            return this;
        },

        setThread(number){
            return this.threads(number);
        },

        interval(number){
            if(number == null){
                number = interval;
            }
            if(typeof number !== 'number') throw new Error('interval parameter must be integer');
            interval = parseInt(number);
            return this;
        },

        error(func){
            if(typeof func !== 'function') throw new Error('func is not function');
            error =  func;
            return this;
        },

        use(func){
            if(typeof func !== 'function') throw new Error('func is not function');
            execute =  func;
            return this;
        },

        end(func){
            if(typeof func !== 'function') throw new Error('func is not function');
            end = func;
            return this;
        },

        push(item){
            push(item);
            this.autoAdjust();
            return this;
        },

        queue(arr){
            if(Array.isArray(arr)){
                arr.forEach(a=>push(a));
            }else{
               push(arr);
           }
            this.autoAdjust();
            return this;
        },

        start(){
            if(!started && !queue.length) return end();
            log(`[${label}threads]start`);
            var nums = thread - running;
            if(nums === 0) return this;
            nums = Math.min(nums,queue.length);
            started = true;
            if(nums === 0) return this;
            for(let i=0;i<nums;i++){
                let n = running+1;
                log(`[${label}threads]<thread ${n}> started`);
                if(interval > 0){
                    setTimeout(route.bind(null,n),interval*i);
                }else{
                    setImmediate(route.bind(null,n));
                }
                running += 1;
            }
            return this;
        },

        autoAdjust(){
            if(started) return this.start();
        },

        label(v){
            if(null == v) return label.trim();
            v = String(v).trim();
            if(v){
                label = v + ' ';
            }
            return this;
        },

        suspend(){
            log(`[${label}threads]suspend`);
            pause = true;
            return this;
        },

        resume(){
            log(`[${label}threads]resume`);
            pause = false;
            this.start();
            return this;
        },

        log(func){
            if(typeof func !== 'function') throw new Error('func is not function');
            log = func;
            return this;
        }
    }
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

