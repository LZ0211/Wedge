module.exports = function (){
    var fs = this.lib.fs;
    var path = this.lib.Path;
    var util = this.lib.util;
    var request = this.lib.request;
    var database = this.database;
    var Parser = this.Parser;
    this._5sing = function (url,fn){
        fn = this.next(fn);
        this.config.set('database.primary','songID');
        this.database.unique('songID');
        var found = database.query("sourceUrl="+url);
        if (found.length) return fn();
        request.get(url).then(data=>{
            var Info = this.lib.classes.Attributes([
                ["songID","Integer"],
                ["songType","String"],
                ["songName","Title"],
                ["file","Link"],
                ["singerID","Integer"],
                ["avatar","Link"],
                ["collect","Boolean"],
                ["sourceUrl","Link"]
            ]);
            var $ = Parser(data.toString(),url);
            var script = $("#songinfo_script").text();
            if (!script) return fn();
            var window = {};
            (new Function("window",script))(window);
            var str = new Buffer(window.globals.ticket,"base64").toString();
            Info.set(JSON.parse(str));
            Info.set('sourceUrl',url);
            $(".lrc_info_clip.lrc-tab-content").find('a').each((i,v)=>$(v).replaceWith($(v).html()));
            var lrc = $(".lrc_info_clip.lrc-tab-content").html();
            var dir = path.join(this.dir,''+Info.get('songID'));
            var coverFile = path.join(dir,'cover.jpg');
            var songName = path.join(dir,Info.get('songName'));
            var songInfo = songName + '.info';
            var songLrc = songName + '.lrc';
            var songSrc = Info.get('file');
            var songFile = songName + path.extname(songSrc);
            fs.mkdirs(dir,()=>{
                fs.writeFile(songInfo,Info.toString());
                fs.writeFile(songLrc,this.lib.classes.Text(lrc).val());
                fs.exists(coverFile,exist=>{
                    !exist && request.get(Info.get('avatar')).then(data=>fs.writeFile(coverFile,data));
                });
                fs.exists(songFile,exist=>{
                    if (exist){
                        database.push(Info.valueOf());
                        return fn();
                    }
                    request.get(songSrc)
                    .setHeader("X-Requested-With","ShockwaveFlash/22.0.0.192")
                    .then(data=>fs.writeFile(songFile,data,()=>{
                        database.push(Info.valueOf());
                        return fn();
                    }),fn);
                });
            });
        },fn);
        return this;
    }
}