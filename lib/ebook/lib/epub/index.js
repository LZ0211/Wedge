var Epub = require('../JSZip');
var html = require("../html");
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
var Template = {};

Template.container = [
    '<?xml version="1.0"?>',
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">',
    '  <rootfiles>',
    '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>',
    '  </rootfiles>',
    '</container>'
].join('\r\n');

Template.opf = function (book){
    var classes = book.meta.classes,
        author = book.meta.author,
        title = book.meta.title,
        source = book.meta.source,
        uuid = book.meta.uuid,
        id = uuid.replace(/\-/g,''),
        date = formatTime(book.meta.date,'yyyy-MM-dd hh:mm:ss'),
        brief = book.meta.brief;
    var items = [],
        itemrefs = [],
        references = [];
    book.list.forEach(chapter=>{
        var id = chapter.id;
        var title = chapter.title;
        items.push('<item href="' + id + '.html" id="Chapter_' + id + '" title="' + title + '" media-type="application/xhtml+xml"/>');
        itemrefs.push('<itemref idref="Chapter_' + id + '" linear="yes"/>');
        references.push('<reference href="' + id + '.html" title="' + title + '" type="text"/>');
    });
    return [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uuid_id" version="2.0">',
        '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:opf="http://www.idpf.org/2007/opf" xmlns:calibre="http://calibre.kovidgoyal.net/2009/metadata">',
        '    <meta name="cover" content="cover-image"/>',
        '    <meta name="calibre:title_sort" content="' + title + '"/>',
        '    <meta name="calibre:timestamp" content="' + date + '"/>',
        '    <dc:subject>' + classes + '</dc:subject>',
        '    <dc:identifier id="uuid_id" opf:scheme="uuid">' + uuid + '</dc:identifier>',
        '    <dc:identifier opf:scheme="calibre">' + id + '</dc:identifier>',
        '    <dc:language>zh</dc:language>',
        '    <dc:title>' + title + '</dc:title>',
        '    <dc:date>' + date + '</dc:date>',
        '    <dc:creator opf:file-as="' + author + '" opf:role="aut">' + author + '</dc:creator>',
        '    <dc:source>' + source + '</dc:source>',
        '    <dc:publisher>裂章</dc:publisher>',
        '    <dc:description>' + brief + '</dc:description>',
        '  </metadata>',
        '  <manifest>',
        '    <item href="css/style.css" id="main-css" media-type="text/css"/>',
        '    <item href="coverpage.html" id="coverpage" media-type="application/xhtml+xml"/>'
    ].concat(items).concat([
        '    <item href="images/cover.jpg" id="cover-image" media-type="image/jpeg"/>',
        '    <item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/>',
        '  </manifest>',
        '  <spine toc="ncx">',
        '    <itemref idref="coverpage" linear="yes"/>',
    ]).concat(itemrefs).concat([
        '  </spine>',
        '  <guide>',
        '    <reference href="coverpage.html" title="封面" type="cover"/>',
    ]).concat(references).concat([
        '  </guide>',
        '</package>',
    ]).join('\r\n');
}

Template.ncx = function (book){
    var classes = book.meta.classes,
        author = book.meta.author,
        title = book.meta.title,
        uuid = book.meta.uuid,
        brief = book.meta.brief;
    var navPoints = [];
    book.list.forEach(chapter=>{
        var id = chapter.id;
        var title = chapter.title;
        navPoints.push('    <navPoint class="chapter" id="Chapter_' + id + '" playOrder="' + id + '">')
        navPoints.push('      <navLabel>');
        navPoints.push('        <text>' + title + '</text>');
        navPoints.push('      </navLabel>');
        navPoints.push('      <content src="' + id + '.html"/>');
        navPoints.push('    </navPoint>');
    });
    return [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="zho">',
        '  <head>',
        '    <meta content="' + uuid + '" name="dtb:uid"/>',
        '    <meta content="1" name="dtb:depth"/>',
        '    <meta content="0" name="dtb:totalPageCount"/>',
        '    <meta content="0" name="dtb:maxPageNumber"/>',
        '  </head>',
        '  <docTitle>',
        '    <text>' + title + '</text>',
        '  </docTitle>',
        '  <docAuthor>',
        '    <text>' + author + '</text>',
        '  </docAuthor>',
        '  <navMap>',
        '    <navPoint id="coverpage" playOrder="0">',
        '      <navLabel>',
        '        <text>封面</text>',
        '      </navLabel>',
        '      <content src="coverpage.html"/>',
        '    </navPoint>'
    ].concat(navPoints).concat([
        '  </navMap>',
        '</ncx>',
    ]).join('\r\n');
}

module.exports = function (book,fn){
    var ebk = new Epub();
    var opt = {createFolders:true};
    ebk.file('mimetype','application/epub+zip',{compression:'STORE'});
    ebk.file('META-INF/container.xml',Template.container,opt);
    ebk.file('OEBPS/content.opf',Template.opf(book),opt);
    ebk.file('OEBPS/toc.ncx',Template.ncx(book),opt);
    html(book,function (files){
        ebk.file('OEBPS/css/style.css',files.get('css/style.css'),opt);
        ebk.file("OEBPS/images/cover.jpg", files.get('images/cover.jpg'), {base64: true,createFolders:true});
        ebk.file('OEBPS/coverpage.html',files.get('coverpage.html'),opt);
        book.list.forEach(function (chapter,index){
            var file = chapter.id + '.html';
            ebk.file('OEBPS/' + file,files.get(file),opt);
        });
        fn(ebk.generate({type:"nodebuffer",compression:'DEFLATE'}));
    });
}