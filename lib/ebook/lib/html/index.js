var Template = {};
Template.css = "@font-face {\r\n\tfont-family:\"cnepub\";\r\n\tsrc:url(res:///opt/sony/ebook/FONT/tt0011m_.ttf), url(res:///tt0011m_.ttf);\r\n}\r\nbody {\r\n\tpadding: 0%;\r\n\tmargin-top: 0%;\r\n\tmargin-bottom: 0%;\r\n\tmargin-left: 1%;\r\n\tmargin-right: 1%;\r\n\tline-height:130%;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\ndiv {\r\n\tmargin:0px;\r\n\tpadding:0px;\r\n\tline-height:130%;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\np {\r\n\ttext-align: justify;\r\n\ttext-indent: 2em;\r\n\tline-height:130%;\r\n}\r\n.cover {\r\n\twidth:100%;\r\n\tpadding:0px;\r\n}\r\n.center {\r\n\ttext-align: center;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.left {\r\n\ttext-align: center;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.right {\r\n\ttext-align: right;\r\n\tmargin-left: 0%;\r\n\tmargin-right: 0%;\r\n}\r\n.quote {\r\n\tmargin-top: 0%;\r\n\tmargin-bottom: 0%;\r\n\tmargin-left: 1em;\r\n\tmargin-right: 1em;\r\n\ttext-align: justify;\r\n\tfont-family:\"cnepub\", serif;\r\n}\r\nh1 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:xx-large;\r\n}\r\nh2 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:x-large;\r\n}\r\nh3 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:large;\r\n}\r\nh4 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:medium;\r\n}\r\nh5 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:small;\r\n}\r\nh6 {\r\n\tline-height:130%;\r\n\ttext-align: center;\r\n\tfont-weight:bold;\r\n\tfont-size:x-small;\r\n}";

Template.Chapter = function (chapter){
    var title = chapter.title,
        author = chapter.author,
        source = chapter.source,
        content = chapter.content.split('\n').map(line=>'        <p>'+line+'</p>');

    return [
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">',
        '<!-- source=' + source + ' -->',
        '  <head>',
        '    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
        '    <link rel="stylesheet" type="text/css" href="css/style.css"/>',
        '    <title>' + title + '</title>',
        '  </head>',
        '  <body>',
        '    <div id="main">',
        '      <h3 id="title">' + title + '</h3>',
        '      <div id="content">',
    ].concat(content).concat([
        '      </div>',
        '    </div>',
        '  </body>',
        '</html>'
    ]).join('\r\n');
}

Template.Coverpage = function (book){
    var title = book.meta.title,
        author = book.meta.author,
        brief = book.meta.brief.split('\n').map(line=>'        <p>'+line+'</p>');

    return [
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">',
        '  <head>',
        '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
        '    <meta name="right" content="该文档由裂章制作，仅供个人交流与学习使用。"/>',
        '    <link rel="stylesheet" type="text/css" href="css/style.css"/>',
        '    <title>封面</title>',
        '  </head>',
        '  <body>',
        '    <div class="main">',
        '      <div style="text-align:center">',
        '        <img class="cover" src="images/cover.jpg"/>',
        '      </div>',
        '      <h1>' + title + '</h1>',
        '      <h2>' + author + '</h2>',
        '      <div class="description">',
        '        <b>【简介】</b>',
    ].concat(brief).concat([
        '      </div>',
        '    </div>',
        '  </body>',
        '</html>'
    ]).join('\r\n');
}

function Files(){
}
Files.prototype.append = function (file,content){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self[floder] = self[floder] || new Files();
        self = self[floder];
    }
    self[arr.shift()] = content;
    return this
};
Files.prototype.get = function (file){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self = self[floder];
        if (!self){
            return
        }
    }
    return self[arr.shift()];
}


module.exports = function (book,fn){
    var files = new Files;
    files.append("css/style.css",Template.css);
    files.append("images/cover.jpg",book.meta.cover);
    files.append("coverpage.html",Template.Coverpage(book));
    book.list.forEach(function (chapter){
        files.append(chapter.id + ".html",Template.Chapter(chapter));
    });
    fn(files);
}
