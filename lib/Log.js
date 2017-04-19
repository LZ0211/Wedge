const fs = require("fs");

module.exports = function (file,mode){
    var handle = fs.openSync(file,mode || "w+");
    process.on("exit",function (){
        fs.closeSync(handle);
    });
    process.on("unhandledRejection",function(reason, p){
        var data = 'Unhandled Rejection at: Promise' + p + 'reason:' + reason;
        data = new Buffer(data);
        fs.writeSync(handle,data,0,data.length);
    });
    process.on("uncaughtException",function(err){
        var data = 'Caught exception:' + err + '\n' + err.stack;
        data = new Buffer(data);
        fs.writeSync(handle,data,0,data.length);
    });
    return function (){
        var args = [].slice.call(arguments);
        args.forEach(function (arg){
            if (typeof arg == "object"){
                arg = JSON.stringify(arg,null,2);
            }else {
                arg = ""+arg;
            }
            var data = new Buffer(arg + "\r\n");
            fs.writeSync(handle,data,0,data.length);
        });
    }
}