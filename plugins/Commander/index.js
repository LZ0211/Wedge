module.exports = function (){
    var self = this;
    var fn = function (command){
        try{
            var sandbox = self.spawn();
            sandbox.end(function (){
                self.terminal(["\x1B[36m>>>\x1B[39m"],fn);
            });
            console.log((new Function("sandbox","with(sandbox){return (" + command + ")}"))(sandbox))

        }catch (e){
            console.log('\x1B[31m' + e + '\x1B[39m');
        }
        
        self.terminal(["\x1B[36m>>>\x1B[39m"],fn);
    }
    self.terminal(["\x1B[36m>>>\x1B[39m"],fn);
}