module.exports = function(){
    this.convertEbook = function (bookdir,ebookdir,format){
        bookdir = bookdir || this.bookdir;
        if(!bookdir){
            return this.prompt(["请输入书籍路径："],dir=>{
                this.convertEbook(dir,ebookdir,format);
            });
        }
        ebookdir = ebookdir || this.config.get("ebook.directory") || "./";
        ebookdir = this.lib.Path.resolve(ebookdir);
        format = format || this.config.get("ebook.formation") || "epub";
        format = format.toLowerCase();
        this.lib.fs.mkdirsSync(ebookdir);
        var work = this.lib.child_process.fork(this.lib.Path.join(__dirname,"../../lib/ebook/generator.js"),{cwd:process.cwd()});
        work.send({
            directory:ebookdir,
            formation:format,
            bookdir:bookdir
        });
        this.log("generating ebook...");
        work.on("message",msg=>{
            if (msg.msg == "success"){
                this.log("ebook generated successful...");
            }else {
                this.log("ebook generation failed...");
            }
        });
    }
}