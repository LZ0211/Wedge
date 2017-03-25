function compose(f1,f2){
    return function (){
        f2();
        f1();
    }
}

var ThreadLog = false;
var runningThread = 0;

function Thread(fn,endFun,thread){
    var execute = fn,
        waiting = [],
        running = [],
        interval = 100,
        Log = ThreadLog;

    if (thread !== undefined){
        thread = parseInt(thread);
        if (isNaN(thread)){
            thread = 3;
        }
        if (typeof endFun !== "function"){
            endFun = function(){}
        }
    }else {
        if (typeof endFun === "function"){
            thread = 3;
        }else {
            thread = parseInt(endFun);
            endFun = function(){}
            if (isNaN(thread)){
                thread = 3;
            }
        }
    }

    if (runningThread > 0){
        thread = 1;
    }else {
        runningThread = Infinity;
        endFun = compose(endFun,function(){
            runningThread = 0;
        });
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

module.exports = Thread;
