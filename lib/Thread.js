function compose(f1,f2){
    return function (){
        f2();
        f1();
    }
}

var ThreadLog = false;

function Thread(fn,endFun,thread){
    var execute = fn,
        waiting = [],
        running = [],
        interval = 100,
        Log = ThreadLog;

    if (thread !== undefined){
        thread = parseInt(thread);
        if (isNaN(thread)){
            thread = 1;
        }
        if (typeof endFun !== "function"){
            endFun = function(){}
        }
    }else {
        if (typeof endFun === "function"){
            thread = 1;
        }else {
            thread = parseInt(endFun);
            endFun = function(){}
            if (isNaN(thread)){
                thread = 1;
            }
        }
    }

    function Wrap(data){
        return function (){
            execute(data,function (){
                for (var j=0;j<running.length; j++){
                    if (running[j] == data){
                        running.splice(j,1);
                        break;
                    }
                }
                Log && console.log(running.length + ' Quests is Runing, '+ waiting.length + ' Quests is Waiting...');
                if (running.length == 0 && waiting.length == 0){
                    return end();
                }
                return setImmediate(Run);
            });
        }
    }

    function Run(){
        var len = thread-running.length;
        for (var i=0;i<len;i++){
            if (waiting.length){
                var ele = waiting.shift();
                running.push(ele);
                setTimeout(Wrap(ele),interval * i);
            }
        }
    }

    function start(parallelQuests,threadNumber){
        setThread(threadNumber,true);
        append(parallelQuests,true);
        if (waiting.length == 0) return end();
        Run();
        return this;
    }

    function append(data,notAutoRun){
        if (Array.isArray(data)){
            [].push.apply(waiting,data);
        }else {
            waiting.push(data);
        }
        notAutoRun || Run();
        return start;
    }

    function end(fn){
        if (typeof fn == "function"){
            endFun = compose(fn,endFun);
        }else {
            endFun();
        }
        return start;
    }

    function log(){
        return {
            maxThread:maxThread,
            running:running,
            waiting:waiting
        }
    }

    function setThread(number,notAutoRun){
        if (number !== undefined){
            number = Number(number);
            if (!isNaN(number)){
                thread = number;
            }
        }
        notAutoRun || Run();
        return start;
    }

    start.append = append;
    start.end = end;
    start.log = {
        on:()=>Log=true,
        off:()=>Log=false,
        info:log,
    };
    start.setThread = setThread;
    return start;
}

Thread.LOG = {
    on:()=>ThreadLog=true,
    off:()=>ThreadLog=false
}

function noop(){
}

function toArray(arrayLike){
    return [].slice.call(arrayLike);
}

function combine(thisFun,nextFun){
    if (!nextFun) nextFun = noop;
    if (thisFun.length == 0) return function (){
        var argv = toArray(arguments);
        thisFun.apply(null,argv);
        setImmediate(function(){
            nextFun.apply(null,argv);
        });
        return this;
    };
    return function (){
        var argv = toArray(arguments);
        argv[thisFun.length - 1] = nextFun;
        setImmediate(function(){
            thisFun.apply(null,argv);
        });
        return this;
    }
}

function series(args){
    var nextFun;
    while (args.length){
        var thisFun = args.pop();
        nextFun = combine(thisFun,nextFun)
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
    }
}

module.exports = Thread;
Thread.series = series;
Thread.shunt = shunt;

/*function loop(data,f){
    console.log(data)
    new Promise(function (resolve,reject){
        return reject('dddd')
    }).then(f,f)
    //setTimeout(f,500);
}

function loop2(data,f){
    console.log(data)
    console.log('loop2');
    setTimeout(f,2500);
}

function loop3(data,f){
    console.log('loop3');
    setTimeout(f,1500);
}

function end(){
    console.log(arguments)
    console.log('end')
}

series([loop,loop2,loop2,loop,loop,loop3,end])(12)*/