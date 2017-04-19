module.exports = function (){
    var randomLink = links=>this.lib.Random.select(links);
    var Chapter = new this.lib.classes.Attributes([
        ["title","Title"],
        ["id","Id"],
        ["source","String"],
        ["date","Time"],
        ["content","Content"],
    ]);
    var pipe = (links,fn)=>{
        console.log(this.book.metaValue());
        console.log(links);
        fn(randomLink(links));
    }
    var final = (chapter,then)=>{
        chapter = Chapter.set(chapter).valueOf();
        for (var x in chapter){
            console.log(x,chapter[x]);
        }
    }
    this.testRule = function (url){
        this.Thread.series([
            this.getBookMeta.bind(this),
            this.updateBookMeta.bind(this),
            this.getBookIndexs.bind(this),
            pipe,
            this.getChapterContent.bind(this),
            this.mergeChapterContent.bind(this),
            final
        ])(url);
    }
}