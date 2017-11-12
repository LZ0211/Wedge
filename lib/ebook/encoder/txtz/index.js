var Zip = require('../zip');
var txt = require('../txt');

function encode(str){
    return str.split('').map(char=>`&#${char.charCodeAt(0)};`).join('')
}
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
function metadata(book){
    return `<metadata>
    <dc-metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oebpackage="http://openebook.org/namespaces/oeb-package/1.0/">
    <dc:Title>${encode(book.meta.title)}</dc:Title>
    <dc:Language>zh</dc:Language>
    <dc:Description>${encode(book.meta.brief)}</dc:Description>
    <dc:Publisher>Wedge</dc:Publisher>
    <dc:Creator file-as="${encode(book.meta.author)}" role="aut">${encode(book.meta.author)}</dc:Creator>
    <dc:Subject>${encode(book.meta.classes)}</dc:Subject>
    <dc:Date>${formatTime(new Date(),'yyyy-MM-ddThh:mm:ss+00:00')}</dc:Date>
    <dc:Identifier id="uuid_id" scheme="uuid">${book.meta.uuid}</dc:Identifier>
    </dc-metadata>
    <x-metadata>
    <meta name="cover" content="cover"/>
    <meta name="ms-chaptertour" content="chaptertour"/>
    </x-metadata>
    </metadata>`
}

module.exports = function (book,fn){
    txt(book,function(text){
        var ebk = new Zip();
        ebk.writeFile("cover.jpeg", Buffer.from(book.meta.cover, 'base64'), true);
        ebk.writeFile("metadata.opf", metadata(book), true);
        ebk.writeFile("index.txt", text, true);
        fn(ebk.generate());
    });
}