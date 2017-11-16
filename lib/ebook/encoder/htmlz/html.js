function encode(str){
    str = String(str) || "";
    return str.replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/'/g,"&#39;")
    .replace(/"/g,"&quot;");
}

function html(book){
    var array = [
        '<html>',
        '  <head>',
        '    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />',
        `    <title>${book.meta.title}</title>`,
        '      <style type="text/css">',
        '        @font-face {',
        '        	font-family:"cnepub";',
        '        	src:url(res:///opt/sony/ebook/FONT/tt0011m_.ttf), url(res:///tt0011m_.ttf);',
        '        }',
        '        body {',
        '        	padding: 0%;',
        '        	margin-top: 0%;',
        '        	margin-bottom: 0%;',
        '        	margin-left: 1%;',
        '        	margin-right: 1%;',
        '        	line-height:130%;',
        '        	text-align: justify;',
        '        	font-family:"cnepub", serif;',
        '        }',
        '        div {',
        '        	margin:0px;',
        '        	padding:0px;',
        '        	line-height:130%;',
        '        	text-align: justify;',
        '        	font-family:"cnepub", serif;',
        '        }',
        '        p {',
        '        	text-align: justify;',
        '        	text-indent: 2em;',
        '        	line-height:130%;',
        '        }',
        '        .cover {',
        '        	width:100%;',
        '        	padding:0px;',
        '        }',
        '        .center {',
        '        	text-align: center;',
        '        	margin-left: 0%;',
        '        	margin-right: 0%;',
        '        }',
        '        .left {',
        '        	text-align: center;',
        '        	margin-left: 0%;',
        '        	margin-right: 0%;',
        '        }',
        '        .right {',
        '        	text-align: right;',
        '        	margin-left: 0%;',
        '        	margin-right: 0%;',
        '        }',
        '        .quote {',
        '        	margin-top: 0%;',
        '        	margin-bottom: 0%;',
        '        	margin-left: 1em;',
        '        	margin-right: 1em;',
        '        	text-align: justify;',
        '        	font-family:"cnepub", serif;',
        '        }',
        '        h1 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:xx-large;',
        '        }',
        '        h2 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:x-large;',
        '        }',
        '        h3 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:large;',
        '        }',
        '        h4 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:medium;',
        '        }',
        '        h5 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:small;',
        '        }',
        '        h6 {',
        '        	line-height:130%;',
        '        	text-align: center;',
        '        	font-weight:bold;',
        '        	font-size:x-small;',
        '        }',
        '      </style>',
        '  </head>',
        '  <body>',
        '    <div class="metadata">',
        '      <div style="text-align:center">',
        `        <img class="cover" src="data:image/jpeg;base64,${book.meta.cover}"/>`,
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
}

module.exports = function (book,fn){
    fn(html(book));
}