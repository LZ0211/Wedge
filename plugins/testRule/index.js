module.exports = function (url){
    this.url = url;
    var createBook = next=>{
        this.log(this.bookMeta);
        this.Loader.bookIndex("./",(error,book)=>{
            this.book = book;
            return next();
        });
    }
    this.series([
        next=>this.getBookMeta(next),
        createBook,
        next=>this.searchBookMeta(next),
        next=>this.updateBookMeta(next),
        next=>{this.log(this.book);next()},
        next=>this.getBookIndex(next),
        next=>this.mergeBookIndex(next),
        next=>{this.log(this.bookIndex);next()},
        next=>next(this.lib.Random.select(this.bookIndex)),
        (link,next)=>this.getChapter(link,next),
        (chapter,then)=>this.mergeChapter(chapter,then),
        (chapter,then)=>this.getChapterImages(chapter,then),
        (chapter,then)=>this.formatChapter(chapter,then),
        (chapter,then)=>{
            chapter = chapter.valueOf();
            for (var x in chapter){
                this.log(x,chapter[x]);
            }
            then();
        },
        next=>this.end()
    ]);
}