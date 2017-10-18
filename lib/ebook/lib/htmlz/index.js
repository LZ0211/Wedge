var Zip = require('../zip');
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

function encode(str){
    str = String(str) || "";
    return str.replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/'/g,"&#39;")
    .replace(/"/g,"&quot;");
}

var Template = {
    css: "@font-face {\r\n\tfont-family:\"cnepub\";\r\n\tsrc:url(res:///opt/sony/ebook/FONT/tt0011m_.ttf), url(res:///tt0011m_.ttf);\r\n}\r\nbody {\r\n\tpadding: 0%;\r\n\tmargin-top: 0%;\r\n\tmargin-bottom: 0%;\r\n\tmargin-left: 1%;\r\n\tmargin-right: 1%;\r\n\tline-height:130%;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\ndiv {\r\n\tmargin:0px;\r\n\tpadding:0px;\r\n\tline-height:130%;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\np {\r\n\ttext-align: justify;\r\n\ttext-indent: 2em;\r\n\tline-height:130%;\r\n}\r\n.cover {\r\n\twidth:100%;\r\n\tpadding:0px;\r\n}\r\n.center {\r\n\ttext-align: center;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.left {\r\n\ttext-align: center;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.right {\r\n\ttext-align: right;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.quote {\r\n\tmargin-top: 0%;\r\n\tmargin-bottom: 0%;\r\n\tmargin-left: 1em;\r\n\tmargin-right: 1em;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\nh1 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:xx-large;\r\n}\r\nh2 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:x-large;\r\n}\r\nh3 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:large;\r\n}\r\nh4 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:medium;\r\n}\r\nh5 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:small;\r\n}\r\nh6 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:x-small;\r\n}",
    html(book){
        var array = [
            '<html>',
            '  <head>',
            '    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />',
            '    <link href="style.css" rel="stylesheet" type="text/css" />',
            `    <title>${book.meta.title}</title>`,
            '  </head>',
            '  <body>',
            '    <div class="metadata">',
            '      <div style="text-align:center">',
            '        <img class="cover" src="cover.jpg"/>',
            '      </div>',
            `      <h1>${book.meta.title}</h1>`,
            `      <h2>${book.meta.author}</h2>`,
            '      <div class="brief">',
            '        <b>【简介】</b>'
        ];
        encode(book.meta.brief).split('\n').forEach(line=>array.push(
            `        <p>${line}</p>`
        ));
        array.push('      </div>');
        array.push('    </div>');
        array.push('    <div class="list">');
        array.push('      <ul>');
        book.list.forEach(chapter=>array.push(
            `        <li><a href="#${chapter.id}">${chapter.title}</a></li>`
        ));
        array.push('      </ul>');
        array.push('    </div>');
        book.list.forEach(chapter=>{
            array.push(`    <div class="chapter" id="${chapter.id}" name="${chapter.id}">`);
            array.push(`      <h3 class="title">${chapter.title}</h3>`);
            array.push('      <div id="content">');
            encode(chapter.content).split('\n').forEach(line=>array.push(`        <p>${line}</p>`));
            array.push('      </div>');
            array.push('    </div>');
        });
        array.push('  </body>');
        array.push('</html>');
        return array.join('\n')
    },
    metadata(book){
        return [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uuid_id" version="2.0">',
        '    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">',
        `        <dc:identifier opf:scheme="uuid" id="uuid_id">${book.meta.uuid}</dc:identifier>`,
        `        <dc:title>${book.meta.title}</dc:title>`,
        `        <dc:creator opf:file-as="${book.meta.author}" opf:role="aut">${book.meta.author}</dc:creator>`,
        `        <dc:date>${formatTime(new Date(),'yyyy-MM-ddThh:mm:ss+00:00')}</dc:date>`,
        `        <dc:description>${book.meta.brief}</dc:description>`,
        '        <dc:publisher>Wedge</dc:publisher>',
        '        <dc:language>zh</dc:language>',
        `        <dc:subject>${book.meta.classes}</dc:subject>`,
        '    </metadata>',
        '    <guide>',
        '        <reference href="cover.jpg" title="封面" type="cover"/>',
        '    </guide>',
        '</package>'].join('\n')
    }
}

module.exports = function (book,fn){
    var ebk = new Zip();
    ebk.writeFile('style.css',Template.css,true);
    ebk.writeFile('metadata.opf',Template.metadata(book),true);
    ebk.writeFile('index.html',Template.html(book),true);
    ebk.writeFile('cover.jpg',Buffer.from(book.meta.cover,'base64'),true);
    fn(ebk.generate());
}