module.exports = function (book,fn){
    var classes = book.meta.get('classes'),
        author = book.meta.get('author'),
        title = book.meta.get('title'),
        uuid = book.meta.get('uuid'),
        cover = book.meta.get('cover'),
        brief = book.meta.get('brief').split('\n').map(line=>'        <p>' + line + '</p>');

    var chapters = [];
    book.list.each(chapter=>{
        chapters.push('    <section>');
        chapters.push('      <title><strong>' + chapter.get('title') + '</strong></title>');
        chapter.get('content').split('\n').forEach(line=>{
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
        '      <date>' + book.meta.date.format('dd.mm.yyyy') + '</date>',
        '      <id>' + uuid +'</id>',
        '      <version>2.0</version>',
        '    </document-info>',
        '    <publish-info>',
        '      <book-name>' + title + '</book-name>',
        '      <publisher>裂章</publisher>',
        '      <year>' + book.meta.date.format('yyyy') + '</year>',
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