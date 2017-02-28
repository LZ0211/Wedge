module.exports = function (urls,selector){
    var Quests = [];
    var fun = new Function("$","return "+selector);
    if (!Array.isArray(urls)) urls = [urls];
    this.parallel(urls,(url,then)=>{
        var fn = ()=>{
            this.getRawData({href:url},data=>{
                var $ = this.Parser(data,url).$;
                try{
                    fun($).forEach(link=>Quests.push(link));
                }catch (e){
                    console.log(e)
                }
                then();
            },fn);
        }
        return fn();
    },()=>{
        this.lib.fs.writeFile("Quests.txt",JSON.stringify(Quests));
        this.newBooks(Quests);
    },5);
}