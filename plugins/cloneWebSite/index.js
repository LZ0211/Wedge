module.exports = function (){
    var lib = this.lib,
        util = lib.util,
        fs = lib.fs,
        request = lib.request,
        Path = lib.Path,
        URL = lib.url,
        querystring = lib.querystring,
        Log = lib.Log,
        Parser = this.Parser,
        Thread = this.Thread;
    function PathLegalization(str){
        return str
            .replace(/\?/g,'%3F')
            .replace(/\\/g,'%5C')
            .replace(/</g,'%3C')
            .replace(/>/g,'%3E')
            .replace(/:/g,'%3A')
            .replace(/"/g,'%22')
            .replace(/\*/g,'')
            .replace(/\|/g,'%7C')
    }
    this.cloneWebSite = function (url){
        var link = util.formatLink(url);
        var parsedURL = URL.parse(link.url);
        var hostname = parsedURL.hostname;
        fs.mkdirsSync(hostname);
        process.chdir(hostname);
        var log = new Log('log.txt','a+');
        var hashTable = {};
        fs.readFileSync('log.txt').toString().split(/[\r\n]/).filter(x=>x).forEach(x=>hashTable[x]=true);
        var htmlThread,cssThread,jsThread,imageThread;
        function pipeHTML(url,fn){
            if (hashTable[url]) return fn();
            var parsedURL = URL.parse(url);
            var path = parsedURL.path;
            var dir = Path.dirname(path);
            fs.mkdirsSync(dir);
            request.get(url).then(function (data){
                hashTable[url] = true;
                log(url);
                pushQuest(data);
                fs.writeFile(PathLegalization(path),data,fn);
            },fn);
        }
        function pipeImage(url,fn){
            if (hashTable[url]) return fn();
            var parsedURL = URL.parse(url);
            var path = parsedURL.path;
            var dir = Path.dirname(path);
            fs.mkdirsSync(dir);
            request.get(url).then(function (data){
                hashTable[url] = true;
                log(url);
                pushQuest(data);
                fs.writeFile(PathLegalization(path),data,fn);
            },fn);
        }
        function pushQuest(data,fn){
        }
        htmlThread = Thread(pipeHTML);
    }
}