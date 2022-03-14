"use strict";
const fs = require("fs");

const SIZE = 1048576;

module.exports = function (file,mode){
    var handle = fs.openSync(file,mode || "a+");
    var stat = fs.fstatSync(handle);
    var length = stat.size;
    function log(data){
        fs.writeSync(handle,data,0,data.length);
        length += data.length;
        if(length >= SIZE){
            fs.closeSync(handle);
            handle = fs.openSync(file,'w+');
            length = 0;
        }
    }
    process.on("exit",()=>fs.closeSync(handle));
    process.on("unhandledRejection",(reason, p)=>log(Buffer.from('Unhandled Rejection at: Promise' + p + 'reason:' + reason)));
    process.on("uncaughtException",err=>log(Buffer.from('Caught exception:' + err + '\n' + err.stack)));
    return function (){
        var args = [].slice.call(arguments);
        args.forEach(function (arg){
            if (typeof arg == "object"){
                arg = JSON.stringify(arg,null,2);
            }else {
                arg = ""+arg;
            }
            log(Buffer.from('[' + (new Date()).toLocaleString() + '] ' + arg + "\r\n"));
        });
    };
};