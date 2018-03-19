module.exports = function (){
    this.deepQuest = function (urls,selector){
        this.debug('deepQuest');
        var Quests = [];
        var push = link=>Quests.push(link);
        if (!Array.isArray(urls)) urls = [urls];
        var getLinks = (url,then)=>{
            var options = {
                url:url,
                success:data=>{
                    var $ = this.Parser(data,url);
                    selector($).forEach(push);
                    return then();
                },
                error:()=>this.request(options)
            }
            this.request(options);
        }
        var final = ()=>{
            var sources = {};
            this.database.sql('SELECT uuid, source, isend FROM book_metadatas;').forEach(record=>sources[record.source]=record);
            var inDB = [];
            var outDB = [];
            Quests.forEach(url=>{
                var record = sources[url];
                if(record && !record.isend){
                    inDB.push(record.uuid);
                }else{
                    outDB.push(url);
                }
            });
            this.newBooks(outDB);
            this.updateBooks(inDB);
        }
        this.Thread()
        .use(getLinks)
        .end(final)
        .queue(urls)
        .setThread(this.config.get('thread.deepQuest'))
        .log(this.debug.bind(this))
        .label("deepQuest")
        .start();
    }
}