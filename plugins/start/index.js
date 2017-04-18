module.exports = function (){
    this.start = function (){
        var args = [].slice.call(arguments);
        if (args.length == 1){
            var argv = args[0];
            if (!Array.isArray(argv)){
                argv = [argv];
            }
            this.Thread().use((argv,next)=>{
                if (argv.match(/http/i)) return this.spawn().newBook(argv).end(next);
                if (this.lib.fs.existsSync(argv)) return this.spawn().updateBook(argv).end(next);
                if (!this.Engine) return next();
                this.Engine.search(argv,list=>{
                    var inSites = list.filter(x=>this.Sites.search(x) !== this.Sites.auto);
                    if (inSites.length >= 1) return this.spawn().newBook(inSites[0]).end(next);
                    this.spawn().newBook(list[0]).end(next);
                });
            }).queue(argv).start();
        }else {
            start(args);
        }
    };
}