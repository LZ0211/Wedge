const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const fs = require('fs');
const Path = require('path');
const Compress = require('koa-compress');
const zlib = require('zlib');
const LocalAddress = require('./LocalAddress');
const Mime = require('./mime');

function uuid(len, radix){
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
        uuid = [],
        radix = radix || chars.length,
        i,r;
    if (len){
        for (i = 0; i < len; i++){
            uuid[i] = chars[0|Math.random()*radix];
        }
    }else {
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}

function pathRep(str){
    const pair={
        ':':'：',
        '\\':'＼',
        '\/':'／',
        '?':'？',
        '<':'＜',
        '>':'＞',
        '|':'｜',
        '*':'＊',
        '"':'＂'
    }
    return str.replace(/[\:\\\/\?\<\>\|\*\"]/g,($,$1)=>pair[$1])
}

function isImage(data){
    let headers = {
        jpeg:'ffd8ff',
        png:'89504e47',
        gif:'47494638',
        tif:['4d4d','4949'],
        bmp:'424d',
        webp: '52494646',
        tga: ['00000200','00001000'],
        iff: '464f524d',
        ico:'000001000100',
        cur:'000002000100',
        jng:'8b4a4e47',
        pdf:'25504446',
    }
    let header = data.slice(0,12).toString('hex');
    var type,sign
    for(type in headers){
        sign = headers[type];
        if(typeof sign === 'string' && header.indexOf(sign) === 0) return type;
        if(Array.isArray(sign) && sign.some(x=>header.indexOf(x)===0)) return type;
    }
    return null;
}

function setCache(ctx,time){
    ctx.response.set('expires', new Date(Date.now() + time * 1000).toGMTString());
    ctx.response.set('Cache-Control','max-age=' + time);
}

async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path,(err, data)=>resolve(data));
    })
}

const count = (function(){
    var N = 0;
    return {
        add:function(){N += 1},
        sub:function(){N -= 1},
        val:function(){return N}
    }
})();


module.exports = function (){
    const app = new Koa();
    const router = new Router();
    const Queue = [];

    app.use(koaBody({ multipart: true }));

    app.use(Compress({
        filter (content_type) {
            return /text/i.test(content_type)
        },
        threshold: 2048,
        gzip: {
          flush: zlib.constants.Z_SYNC_FLUSH
        },
        deflate: {
          flush: zlib.constants.Z_SYNC_FLUSH,
        },
        br: false
    }));

    router.get('/src/:file',async (ctx,next)=>{
        let file = ctx.params.file
        let extname = Path.extname(file).slice(1);
        let filename = Path.join(__dirname,'./src/' + file);
        ctx.compress = true;
        ctx.response.type = Mime(extname);
        ctx.response.body = fs.createReadStream(filename)
        ctx.response.set()
        setCache(ctx,100)
    })

    router.get('/crypt',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/crypt.html'))
    })

    router.get('/crypt-list', async (ctx, next)=>{
        ctx.compress = true;
        ctx.response.type = "text/plain";
        ctx.response.body = uuid(32) + Buffer.from(JSON.stringify(this.database.query(ctx.request.querystring))).toString("base64")
    })

    router.get('/crypt-book/:uuid', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/index.book`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            ctx.compress = true
            ctx.response.type = "text/plain"
            ctx.response.body = uuid(32) + data.toString('base64')
            setCache(ctx,3000)
        }
    })

    router.get('/crypt-cover/:uuid', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/cover.jpg`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            ctx.compress = true
            ctx.response.type = "text/plain"
            ctx.response.body = uuid(32) + data.toString('base64')
            setCache(ctx,10*24*3600)
        }
    })

    router.get('/crypt-chapter/:uuid/:id', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/${ctx.params.id}.json`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            ctx.compress = true
            ctx.response.type = "text/plain"
            ctx.response.body = uuid(32) + data.toString('base64')
            setCache(ctx,10*24*3600)
        }
    })

    router.get('/crypt-img/:uuid/:id/:file', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/${ctx.params.id}/${ctx.params.file}`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            ctx.compress = true
            ctx.response.type = "text/plain"
            ctx.response.body = uuid(32) + data.toString('base64')
            setCache(ctx,100*24*3600)
        }
    })

/*
    router.get('/app',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/app.html'))
    })

    router.get('/',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/home.html'))
    })

    router.get('/home.html',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/home.html'))
    })

    router.get('/book.html',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/book.html'))
    })

    router.get('/chapter.html',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/chapter.html'))
    })

    router.get('/list', async (ctx, next)=>{
        ctx.compress = true;
        ctx.response.type = 'application/json';
        ctx.response.body = this.database.query(ctx.request.querystring)
    })

    router.get('/book/:uuid', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/index.book`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            ctx.compress = true
            ctx.response.type = 'application/json'
            ctx.response.body = data.toString()
            setCache(ctx,3000)
        }
    })

    router.get('/cover/:uuid', async (ctx, next)=>{
        let filename = Path.join(this.dir,`${ctx.params.uuid}/cover.jpg`)
        let data = await readFile(filename)
        if(data == null){
            ctx.response.status = 404
        }else{
            //ctx.compress = true
            ctx.response.body = data;
            ctx.response.type = Mime(isImage(data) || "jpeg");
            setCache(ctx,600)
        }
    })

    router.get('/chapter/:uuid/:id', async (ctx, next)=>{
        ctx.response.type = 'application/json';
        let filename = Path.join(this.dir,`${ctx.params.uuid}/${ctx.params.id}.json`)
        if(fs.existsSync(filename)){
            ctx.compress = true;
            ctx.response.body = fs.createReadStream(filename)
            setCache(ctx,10*24*3600)
        }else{
            ctx.response.status = 404
        }
    })

    router.get('/img/:uuid/:id/:file', async (ctx, next)=>{
        let extname = Path.extname(ctx.params.file).slice(1);
        let filename = Path.join(this.dir,`${ctx.params.uuid}/${ctx.params.id}/${ctx.params.file}`)
        ctx.compress = true;
        ctx.response.type = Mime(extname);
        ctx.response.body = fs.createReadStream(filename)
        ctx.response.set()
        setCache(ctx,100*24*3600)
    })
*/
    router.post('/update/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            this.spawn()
            .end(function(){
                ctx.response.type = 'application/json';
                ctx.response.body = JSON.stringify({"code":1})
                return resolve()
            })
            .updateBook(ctx.params.uuid)
        }).then(next)
    })

    router.post('/delete/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.end(function(){
                ctx.compress = true;
                ctx.response.type = 'application/json';
                ctx.response.body = this.database.query()
                resolve()
            })
            spawn.deleteBook(ctx.params.uuid)
        }).then(next)
    })

    router.post('/recovery/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.end(function(){
                ctx.compress = true;
                ctx.response.type = 'application/json';
                ctx.response.body = this.database.query()
                resolve()
            })
            spawn.recoveryBook(ctx.params.uuid)
        }).then(next)
    })

    router.post('/meta/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.end(function(){
                ctx.response.type = 'application/json';
                ctx.response.body = JSON.stringify({"code":1})
                return resolve()
            });
            spawn.loadBook(ctx.params.uuid,()=>{
                spawn.book.setMeta(ctx.request.body)
                spawn.end()
            })
        }).then(next)
    })

    // router.post()

    router.post('/end/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.loadBook(ctx.params.uuid,function(){
                spawn.book.setMeta('isend',!spawn.book.getMeta("isend"));
                spawn.sendToDataBase(()=>spawn.saveBook(()=>{
                    ctx.response.type = 'application/json';
                    ctx.response.body = JSON.stringify({})
                    resolve()
                }))
            })
        }).then(next)
    })

    router.get('/ebook/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.config.set('ebook.activated',true);
            spawn.loadBook(ctx.params.uuid,()=>{
                let meta = spawn.book.meta
                let directory = spawn.getConfig("ebook.directory")
                let formation = spawn.getConfig("ebook.formation")
                let filename = spawn.getConfig("ebook.filename") || '{author} - {title}.{format}';
                let exts = {
                    'epub2':'epub',
                    'epub3':'epub',
                    'kf8': 'azw3',
                    'kf6': 'mobi',
                }
                formation = exts[formation] || formation;
                filename = filename
                    .replace(/{title}/gi,meta.title)
                    .replace(/{author}/gi,meta.author)
                    .replace(/{classes}/gi,meta.classes)
                    .replace(/{uuid}/gi,meta.uuid)
                    .replace(/{isend}/gi,meta.isend ? '完结':'连载')
                    .replace(/{format}/gi,formation)
                    .replace(/{formation}/gi,formation);
                filename = pathRep(filename)
                filename = Path.join(directory,filename);
                if (fs.existsSync(filename)){
                    if (fs.statSync(filename).mtime > meta.date){
                        ctx.response.type = 'application/epub+zip';
                        ctx.response.set('Content-Disposition', `attachment;filename*=UTF-8''${encodeURIComponent(Path.basename(filename))};filename="${encodeURIComponent(Path.basename(filename))}"`)
                        ctx.response.body = fs.createReadStream(filename)
                        return resolve()
                    }
                }
                spawn.generateEbook(null,()=>{
                    ctx.response.type = 'application/epub+zip';
                    ctx.response.set('Content-Disposition', `attachment;filename*=UTF-8''${encodeURIComponent(Path.basename(filename))};filename="${encodeURIComponent(Path.basename(filename))}"`)
                    ctx.response.body = fs.createReadStream(filename)
                    resolve()
                })
            })
        }).then(next)
    })

    router.post('/add/:url', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            Queue.push(decodeURIComponent(ctx.params.url))
            ctx.compress = true;
            ctx.response.type = 'application/json';
            ctx.response.body = this.database.query()
            resolve()
        }).then(next)
    })

    router.post('/newchapter/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn();
            spawn.loadBook(ctx.params.uuid,function(){
                spawn.getChapter(ctx.request.body,()=>{
                    ctx.response.type = 'application/json';
                    ctx.response.body = JSON.stringify({"code":1})
                    return resolve()
                })
            })
        }).then(next)
    })

    router.post('/edit/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            var uuid = ctx.params.uuid
            spawn.loadBook(uuid,function(){
                var book = spawn.book;
                book.setMeta(ctx.request.body);
                book.setMeta('date',+new Date);
                var _uuid = book.getMeta('uuid');
                if(_uuid != uuid){
                    spawn.database.remove(uuid);
                    fs.rmdirsSync(_uuid);
                    fs.renameSync(uuid, _uuid);
                }
                book.localizationSync(_uuid);
                ctx.response.type = 'application/json';
                ctx.response.body = JSON.stringify(book.meta)
                resolve()
            });
        }).then(next)
    })

    app.use(router.routes()).use(router.allowedMethods());

    app.on("error",(err,ctx)=>{
        console.log(err);
    })

    this.server = ()=>{
        const port = this.getConfig('server.port',3000);
        console.log(`start server ${LocalAddress.en0 || LocalAddress.eth0}:${port}`);
        app.listen(port);
    }

    setInterval(()=>{
        if(count.val() >= 3 || Queue.length == 0) return;
        var spawn = this.spawn()
        spawn.end(count.sub);
        count.add();
        spawn.newBook(Queue.shift())
    },15000);

}