module.exports = function (){
    this.testSelector = function (url){
        var options = {
            url:url,
            success:data=>{
                var $ = this.Parser(data,url);
                var compile = code=>new Function('$','return ('+code+')');
                var sandBox = str=>{
                    var func = compile(str);
                    try{
                        console.log(func($));
                    }catch (e){
                        console.log('\x1B[31m' + e + '\x1B[39m');
                    }
                    this.prompt(["\x1B[36m>\x1B[39m"],sandBox);
                }
                this.prompt(["\x1B[36m>\x1B[39m"],sandBox);
            },
            error:e=>console.log('\x1B[31mFailed to load resource: net::'+e+'\x1B[39m')
        }
        this.request(options);
    }
}