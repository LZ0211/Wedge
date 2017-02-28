module.exports = function (url,fn){
    var Info = this.Attributes(this.config.get("formation.meta"));
    var fs = this.lib.fs;
    var path = this.lib.Path;
    var utils = this.lib.utils;
    var request = this.request;
    var database = this.database;
    var next = this.next.bind(this,fn);

    var found = database.query("sourceUrl="+url);
    if (found.length) return next();
    request.get(url).then(data=>{
        var parser = this.Parser(data.toString(),url);
        var $ = parser.$;
        var script = $("#songinfo_script").text();
        if (!script) return next();
        var window = {};
        (new Function("window",script))(window);
        var str = new Buffer(window.globals.ticket,"base64").toString();
        var info = Info(JSON.parse(str));
        info.set("sourceUrl",url)
        $(".lrc_info_clip.lrc-tab-content").find('a').each((i,v)=>$(v).replaceWith($(v).html()));
        var lrc = $(".lrc_info_clip.lrc-tab-content").html();
        lrc = this.Types.text(lrc).val();
        var dir = path.join(this.dir,''+info.get('songID'));
        var coverFile = path.join(dir,'cover.jpg');
        var songName = path.join(dir,info.get('songName'));
        var songInfo = songName + '.info';
        var songLrc = songName + '.lrc';
        var songSrc = info.get('file');
        var songFile = songName + path.extname(songSrc);
        utils.mkdirs(dir,()=>{
            fs.writeFile(songInfo,info.toString());
            fs.writeFile(songLrc,lrc);
            fs.exists(coverFile,exist=>{
                !exist && request.get(info.get('avatar')).then(data=>fs.writeFile(coverFile,data));
            });
            fs.exists(songFile,exist=>{
                if (exist){
                    database.push(info.valueOf());
                    return next();
                }
                request
                .get(songSrc)
                .setHeader("X-Requested-With","ShockwaveFlash/22.0.0.192")
                .then(data=>fs.writeFile(songFile,data,()=>{
                    database.push(info.valueOf());
                    return next();
                }),next);
            });
        });
    },next);
    return this;
}