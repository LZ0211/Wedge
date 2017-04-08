module.exports = function (){
    this.deepQuest = function (urls,selector){
        this.debug('deepQuest');
        var Quests = [];
        var parser = new Function("$","return "+selector);
        var push = link=>Quests.push(link);
        if (!Array.isArray(urls)) urls = [urls];
        var getLinks = (url,then)=>{
            var options = {
                url:url,
                success:data=>{
                    var $ = this.Parser(data,url).$;
                    parser($).forEach(push);
                    return then();
                },
                error:()=>this.request(options)
            }
            this.request(options);
        }
        var final = ()=>{
            this.lib.fs.writeFile("Quests.txt",JSON.stringify(Quests));
            this.newBooks(Quests);
        }
        this.Thread(getLinks,final)(urls,5);
    }
}