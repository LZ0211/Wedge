const fs = require("fs");
const log = console.log;

module.exports = function (file,mode){
    var handle = fs.openSync(file,mode || "w+");
    console.log = function (){
        var args = [].slice.call(arguments);
        log.apply(console,arguments);
        var now = (new Date()).toGMTString();
        args.forEach(function (arg){
            if (typeof arg == "object"){
                arg = JSON.stringify(arg,null,2);
            }else {
                arg = ""+arg;
            }
            var data = new Buffer(now + "\r\n" + arg + "\r\n");
            fs.writeSync(handle,data,0,data.length);
        });
    }
    process.on("exit",function (){
        fs.closeSync(handle);
    })
}