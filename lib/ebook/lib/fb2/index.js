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

module.exports = function (book,fn){
    var classes = book.meta.classes,
        author = book.meta.author,
        title = book.meta.title,
        uuid = book.meta.uuid,
        cover = book.meta.cover,
        brief = book.meta.brief.split('\n').map(line=>'        <p>' + line + '</p>');

    var chapters = [];
    book.list.forEach(chapter=>{
        chapters.push('    <section>');
        chapters.push('      <title><strong>' + chapter.title + '</strong></title>');
        chapter.content.split('\n').forEach(line=>{
            chapters.push('      <p>' + line + '</p>');
        });
        chapters.push('    </section>');
    });
    var xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:xlink="http://www.w3.org/1999/xlink">',
        '  <stylesheet type="text/css">',
        '    .body{padding:0%;margin-top:0%;margin-bottom:0%;margin-left:1%;margin-right: 1%;line-height:130%;text-align:justify;}',
        '    .p{text-align:justify;text-indent:2em;line-height:130%;padding:50%;}',
        '  </stylesheet>',
        '  <description>',
        '    <title-info>',
        '      <genre>' + classes + '</genre>',
        '      <author>',
        '      <first-name></first-name>',
        '      <last-name>' + author + '</last-name>',
        '      </author>',
        '      <book-title>' + title + '</book-title>',
        '      <annotation>'
    ].concat(brief).concat([
        '      </annotation>',
        '      <coverpage><image xlink:href="#cover.jpg" /></coverpage>',
        '      <lang>zh</lang>',
        '      <keywords>' + [author,title,classes].join(', ') + '</keywords>',
        '    </title-info>',
        '    <document-info>',
        '      <author>',
        '      <first-name></first-name>',
        '      <last-name>' + author + '</last-name>',
        '      </author>',
        '      <program-used>Wedge</program-used>',
        '      <date>' + formatTime(book.meta.date,'dd.mm.yyyy') + '</date>',
        '      <id>' + uuid +'</id>',
        '      <version>2.0</version>',
        '    </document-info>',
        '    <publish-info>',
        '      <book-name>' + title + '</book-name>',
        '      <publisher>裂章</publisher>',
        '      <year>' + formatTime(book.meta.date,'yyyy') + '</year>',
        '      <isbn>' + uuid + '</isbn>',
        '    </publish-info>',
        '  </description>',
        '  <body>'
    ]).concat(chapters).concat([
        '  </body>',
        '  <binary content-type="image/jpeg" id="cover.jpg">' + cover + '</binary>',
        '</FictionBook>'
    ]).join('\r\n');
    fn(xml);
};