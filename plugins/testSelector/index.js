function command(doc,fn){
    var args = [];
    var len = Math.max(doc.length,fn.length);
    var ref = 0;
    if (len == 0)return fn.apply(null,args);
    process.stdin.setEncoding("utf8");
    process.stdout.write(doc[ref] || "");
    var listener = function (data){
        data = data.replace(/\s+$/,'');
        args.push(data);
        ref += 1;
        if (ref == len){
            process.stdin.removeListener("data",listener);
            fn.apply(null,args);
        }else {
            process.stdout.write(doc[ref]);
        }
    }
    process.stdin.on("data",listener);
}
module.exports = function (url){
    var app = this;
    app.request.get(url).then(function (data){
        command(["Please input charset:"],function(charset){
            if (charset == "utf8" || charset == "gbk"){
                var str = app.Decoder.decode(data,charset);
                var $ = app.Parser(str,url).$;
                command(["\x1B[36m>>>\x1B[39m"],function (selector){
                    try{
                        var fun = new Function("$","return "+selector);
                        console.log(fun.call(app,$));
                    }catch (e){
                        console.log('\x1B[31m' + e + '\x1B[39m');
                    }
                    command(["\x1B[36m>>>\x1B[39m"],arguments.callee);
                });
            }else {
                command(["Please input charset:"],arguments.callee);
            }
        });
    });
}