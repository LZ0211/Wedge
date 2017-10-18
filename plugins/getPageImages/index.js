module.exports = function (){
    this.getPageImages = function (url,options){
        var link = this.lib.util.formatLink(url);
        options = options || {};
        options.ext = options.ext || 'bmp|jpg|png|svg|ico|gif|jpeg|apng|webp|tif|tga|ppm|pgm|pbm|pcx|jpm|jng';
        options.rename = options.rename || '<name><ext>';
        options.size = options.size || '10240';
        options.location = options.location || this.dir;
        options.prefix = options.prefix || '00000'
        link.success = data => {
            var $ = this.Parser(data,link.url);
            var images = $('img').map((i,v)=>{
                var src = $(v).attr('src');
                var alt = $(v).attr('alt')
                return {
                    src:src,
                    alt:alt
                }
            }).toArray();
            images = images.filter(image=>image.src);
            images.forEach(image=>{
                image.src = $.location(image.src);
                var parsedURL = this.lib.url.parse(image.src);
                image.host = parsedURL.hostname;
                image.path = parsedURL.pathname;
                var parsedPATH = this.lib.Path.parse(image.path);
                image.name = parsedPATH.name;
                image.dir = parsedPATH.dir;
                image.ext = parsedPATH.ext;
                image.basename = parsedPATH.base;
            });
            var extReg = new RegExp('\\.('+options.ext+')$','gi');
            images = images.filter(image=>image.ext.match(extReg));
            this.Thread().use((image,next)=>{
                var link = {url:image.src};
                link.error = next;
                link.success = data => {
                    image.buffer = data;
                    image.size = data.length;
                    return next();
                }
                this.request(link);
            }).end(()=>{
                images = images.filter(image=>image.buffer);
                images = images.filter(image=>image.size > options.size);
                images.forEach((image,index)=>image.index = index);
                images.forEach((image,index)=>image.rename = options.rename.replace(/<([^<>]*)?>/g,($,$1)=>image[$1] || '<'+$1+'>'));
                images.forEach((image,index)=>{
                    if(~options.rename.indexOf('<prefix>')){
                        image.rename = image.rename.replace('<prefix>','')
                        var name = image.rename.replace(extReg,'');
                        var sublength = options.prefix.length - name.length;
                        if (sublength<=0) return
                        image.rename = options.prefix.slice(0,sublength) + image.rename;
                    }
                });
                this.Thread().use((image,next)=>{
                    var filename = this.lib.Path.resolve(options.location,image.rename);
                    var dirname = this.lib.Path.dirname(filename);
                    this.lib.fs.mkdirsSync(dirname);
                    this.lib.fs.writeFile(filename,image.buffer,next);
                }).queue(images).setThread(6).start();
            }).queue(images).setThread(3).start();
        }
        this.request(link);
    }
}