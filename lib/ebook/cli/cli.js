"use strict";
const readline = require("readline");
const commander = require('../generator');

var argv = process.argv;
var msg = {};
for (var i=0;i<argv.length;i++){
    if (argv[i] == '-f'){
        msg.formation = argv[i+1];
    }
    if (argv[i] == '-i'){
        msg.bookdir = argv[i+1];
    }
    if (argv[i] == '-o'){
        msg.directory = argv[i+1];
    }
    if (argv[i] == '-s'){
        msg.filter = argv[i+1];
    }
}

var lostArgv = [];
if (!msg.bookdir){
    lostArgv.push('bookdir');
}
if (!msg.formation){
    lostArgv.push('formation');
}
if (!msg.directory){
    lostArgv.push('directory');
}

function terminal(docs,fn){
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var args = [];
    var len = Math.max(docs.length,fn.length);
    var ref = 0;
    if (len == 0)return fn.apply(this,args);
    var listener=()=>{
        rl.question(docs[ref],input=>{
            args.push(input);
            ref += 1;
            if(ref === len){
                rl.close();
                return fn.apply(null,args);
            }else{
                return listener();
            }
        });
    };
    listener();
}

terminal(lostArgv.map(v=>'Please input ebook ' + v + ': '),function (){
    for (var i=0;i<arguments.length ;i++ ){
        msg[lostArgv[i]] = arguments[i];
    }
    commander(msg,process.exit);
});