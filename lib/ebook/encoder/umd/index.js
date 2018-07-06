"use strict";
var zlib = require('zlib');
var fs = require('fs');
var Bin = require("../binary");
var Random = require('../../../JSrandom');
function leftPad(str,padding,length){
    str = '' + str;
    if (str.length >= length){
        return str;
    }
    for (var i=str.length;i<length;i++){
        str = padding + str;
    }
    return str;
}
function formatTime(date,template){
    var time = new Date(date)
    var day = template || "yyyy-MM-dd hh:mm:ss";
    day = day.replace(/(y+)/,function ($,$1){
        return leftPad(time.getFullYear(),0,$1.length)
    });
    day = day.replace(/(M+)/,function ($,$1){
        return leftPad(time.getMonth() + 1,0,$1.length)
    });
    day = day.replace(/(d+)/,function ($,$1){
        return leftPad(time.getDate(),0,$1.length)
    });
    day = day.replace(/(h+)/,function ($,$1){
        return leftPad(time.getHours(),0,$1.length)
    });
    day = day.replace(/(m+)/,function ($,$1){
        return leftPad(time.getMinutes(),0,$1.length)
    });
    day = day.replace(/(s+)/,function ($,$1){
        return leftPad(time.getSeconds(),0,$1.length)
    });
    return day;
}
const NOCOVER = fs.readFileSync(__dirname+'/nocover');

function template(book){
    book.list.forEach(chapter=>{
        chapter.content = chapter.title + '\n' + chapter.content;
    })
    var content = Bin(Buffer.from(book.list.map(x=>x.content).join(''),'ucs2'));

    function createHeader(){
        return Bin('899b9ade2301000008010000','hex').seek(-2).writeInt16LE(Random.randInt(1025,32767)).rawBuffer;
    }
    
    function createMeta(){
        var meta = {
            title:Buffer.from(book.meta.title,'ucs2'),
            author:Buffer.from(book.meta.author,'ucs2'),
            year:Buffer.from(formatTime(book.meta.date,'yyyy'),'ucs2'),
            month:Buffer.from(formatTime(book.meta.date,'MM'),'ucs2'),
            day:Buffer.from(formatTime(book.meta.date,'dd'),'ucs2'),
            classes:Buffer.from(book.meta.classes,'ucs2'),
            publish:Buffer.from('Wedge','ucs2'),
            sell:Buffer.from('Wedge','ucs2'),
        }
        return Buffer.concat([
            Bin('2302000000','hex').seek(-1).writeInt8(meta.title.length+5).concat(meta.title).rawBuffer,
            Bin('2303000000','hex').seek(-1).writeInt8(meta.author.length+5).concat(meta.author).rawBuffer,
            Bin('2304000000','hex').seek(-1).writeInt8(meta.year.length+5).concat(meta.year).rawBuffer,
            Bin('2305000000','hex').seek(-1).writeInt8(meta.month.length+5).concat(meta.month).rawBuffer,
            Bin('2306000000','hex').seek(-1).writeInt8(meta.day.length+5).concat(meta.day).rawBuffer,
            Bin('2307000000','hex').seek(-1).writeInt8(meta.classes.length+5).concat(meta.classes).rawBuffer,
            Bin('2308000000','hex').seek(-1).writeInt8(meta.publish.length+5).concat(meta.publish).rawBuffer,
            Bin('2309000000','hex').seek(-1).writeInt8(meta.sell.length+5).concat(meta.sell).rawBuffer,
        ]);
    }
    
    function createLength(){
        return Bin('230b00000900000000','hex').seek(-4).writeInt32LE(content.length+5).rawBuffer;
    }
    
    function createOffset(){
        var random = Random.randInt(12288,16383);
        var offset = Bin(Buffer.alloc(book.list.length * 4));
        var pos = 0;
        var bin = Bin('238300010900000000240000000000000000','hex');
        bin.seek(5).writeInt32LE(random)
        bin.seek(-8).writeInt32LE(random)
        bin.writeInt32LE(book.list.length * 4 + 9)
        
        book.list.forEach(chapter=>{
            offset.writeInt32LE(pos);
            pos += chapter.content.length * 2;
        });
        return bin.concat(offset.rawBuffer).rawBuffer;
    }
    
    function createList(){
        var random = Random.randInt(16384,20479);
        var bin = Bin('238400010900000000240000000000000000','hex');
        var titles = [];
        var buf;
        bin.seek(5).writeInt32LE(random).seek(-8).writeInt32LE(random);
        book.list.forEach(chapter=>{
            buf = Buffer.from(chapter.title,'ucs2');
            titles.push(Buffer.from([buf.length]));
            titles.push(buf);
        });
        buf = Buffer.concat(titles);
        return bin.writeInt32LE(buf.length+9).concat(buf).rawBuffer;
    }
    
    function createContent(){
        var siteA = Random.randInt(0,content.length/32768);
        var siteB = Random.randInt(0,content.length/32768);
        var sub,blocks = [],random,randoms=[];
        while(true){
            sub = content.read(32768);
            if(sub.length){
                random = Random.randInt(4.02653e+009,4.29497e+009);
                sub = zlib.deflateSync(sub);
                blocks.push(Bin('240000000000000000','hex').seek(1).writeUInt32LE(random).writeInt32LE(sub.length + 9).concat(sub).rawBuffer);
                if(randoms.length == siteA){
                    blocks.push(Buffer.from('230a000009','hex'));
                    blocks.push(Buffer.from(book.meta.uuid.slice(0,8),'hex'));
                }
                if(randoms.length == siteB){
                    blocks.push(Buffer.from('23f100001500000000000000000000000000000000','hex'));
                }
                randoms.push(random);
            }else{
                random = Random.randInt(8192,12287);
                blocks.push(Bin('2381000109000000002400000000','hex').seek(5).writeInt32LE(random).seek(11).writeInt32LE(random).writeInt32LE(randoms.length * 4 + 9).rawBuffer);
                randoms.reverse().forEach(random=>{
                    var buf = Buffer.alloc(4);
                    buf.writeUInt32LE(random);
                    blocks.push(buf);
                });
                return Buffer.concat(blocks);
            }
        }
    }
    
    function createCover(){
        var coverBuf = book.meta.cover ? Buffer.from(book.meta.cover,'base64') : NOCOVER;
        var random = Random.randInt(4096,8191);
        return Bin('238200010a0100000000240000000000000000','hex').seek(6).writeInt32LE(random).seek(-8).writeInt32LE(random).writeInt32LE(coverBuf.length+9).concat(coverBuf).rawBuffer;
    }

    function createPageOffset(){
        return Buffer.concat([
            Bin('2387')
        ])
    }
    
    function createTail(length){
        return Bin('230c00010900000000','hex').seek(-4).writeInt32LE(length+9).rawBuffer;
    }

    var stream = [
        createHeader(),
        createMeta(),
        createLength(),
        createOffset(),
        createList(),
        createContent(),
        createCover()
    ];
    stream.push(createTail(stream.map(x=>x.length).reduce((x,y)=>x+y,0)));
    return Buffer.concat(stream);
}



module.exports = function (book,fn){
    fn(template(book));
}