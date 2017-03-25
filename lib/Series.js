function Series(){
    var queue = [];
    var isRunning = false;
    var endFun = function(){};

    function Run(){
        if (isRunning) return;
        isRunning = true;
    }

    function append(data){
        if (Array.isArray(data)){
            [].push.apply(queue,data);
        }else {
            queue.push(data);
        }
    }

    function end(){
    }

    function start(fns){
        append(fns);
    }

    start.append = append;
    return start;
}