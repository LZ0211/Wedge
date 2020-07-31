const Koa = require('koa');
const Router = require('koa-router');
const fs = require('fs');
const Path = require('path');
const Compress = require('koa-compress');
const zlib = require('zlib');
const LocalAddress = require('./LocalAddress');
const Mime = require('./mime');

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
    ctx.response.set('expires', new Date(Date.now() + time * 1000).toString());
    ctx.response.set('Cache-Control','max-age=' + time);
}

async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path,(err, data)=>resolve(data));
    })
}

module.exports = function (){
    const app = new Koa();
    const router = new Router();

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

    router.get('/',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/index.html'))
    })

    router.get('/dev',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'index_dev.html'))
    })

    router.get('/index.html',async (ctx,next)=>{
        ctx.compress = true;
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream(Path.join(__dirname,'./src/index.html'))
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
            ctx.response.body = data.toString().replace(/,\s*\"cover\"\s*:\s*\"[^\s\"]*\"/,"")
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
            setCache(ctx,10*24*3600)
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
            spawn.removeBookRecord(ctx.params.uuid)
            this.spawn().deleteBook(ctx.params.uuid)
        }).then(next)
    })

    router.post('/end/:uuid', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var spawn = this.spawn()
            spawn.loadBook(ctx.params.uuid,function(){
                spawn.book.setMeta('isend',true);
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
                        ctx.response.set('Content-Disposition', `attachment;filename="${encodeURIComponent(Path.basename(filename))}"`)
                        ctx.response.body = fs.createReadStream(filename)
                        return resolve()
                    }
                }
                spawn.generateEbook(null,ebookfile=>{
                    ctx.response.type = 'application/epub+zip';
                    if (!ebookfile){
                        ctx.response.status = 404
                        reject()
                    }else{
                        ctx.response.set('Content-Disposition', `attachment;filename="${encodeURIComponent(Path.basename(ebookfile))}"`)
                        ctx.response.body = fs.createReadStream(ebookfile)
                        resolve()
                    }
                })
            })
        }).then(next)
    })

    router.post('/add/:url', (ctx, next)=>{
        return new Promise((resolve, reject)=>{
            var url = decodeURIComponent(ctx.params.url)
            var spawn = this.spawn()
            spawn.getBookMeta(url,()=>spawn.getBookCover(()=>spawn.updateBookMeta(()=>spawn.sendToDataBase(()=>{
                ctx.compress = true;
                ctx.response.type = 'application/json';
                ctx.response.body = spawn.database.query()
                resolve()
                spawn.createBook(()=>spawn.checkBookCover(()=>spawn.getBookIndexs(x=>spawn.getChapters(x,()=>spawn.saveBook(()=>spawn.sendToDataBase(()=>spawn.generateEbook(()=>spawn.end())))))))
            }))))
        }).then(next)
    })

    app.use(router.routes()).use(router.allowedMethods());

    this.server = ()=>{
        const port = this.getConfig('server.port',3000);
        console.log(`start server ${LocalAddress.en0 || LocalAddress.eth0}:${port}`);
        app.listen(port);
    }
}