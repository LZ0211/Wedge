var decoder = require('../../../decoder');

function encode(str){
    return [].map.call(decoder.encode(str,'gbk'),x=>"\\'"+x.toString(16)).join('')
}

function template(book){  
    return [
        "{\\rtf1\\ansi\\ansicpg1252\\cocoartf1504\\cocoasubrtf830",
        "{\\fonttbl\\f0\\fnil\\fcharset134 PingFangSC-Regular;\\f1\\fnil\\fcharset0 LucidaGrande;}",
        "{\\colortbl;\\red255\\green255\\blue255;}",
        "{\\*\\expandedcolortbl;;}",
        "{\\*\\listtable{\\list\\listtemplateid1\\listhybrid{\\listlevel\\levelnfc23\\levelnfcn23\\leveljc0\\leveljcn0\\levelfollow0\\levelstartat1\\levelspace360\\levelindent0{\\*\\levelmarker \\{square\\}}{\\leveltext\\leveltemplateid1\\'01\\uc0\\u9642 ;}{\\levelnumbers;}\\fi-360\\li720\\lin720 }{\\listname ;}\\listid1}}",
        "{\\*\\listoverridetable{\\listoverride\\listid1\\listoverridecount0\\ls1}}",
        "\\paperw11900\\paperh16840\\margl1440\\margr1440\\vieww14960\\viewh13620\\viewkind0",
        "\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\qc\\partightenfactor0",
        "",
        `\\f0\\fs72 \\cf0 ${encode(book.meta.title)}`,
        "\\fs48 \\",
        "",
        `\\fs36 ${encode(book.meta.author)}\\`,
        "{\\shp{\\*\\shpinst\\shpleft14\\shptop271\\shpright4383\\shpbottom6337\\shpfhdr0\\shpbxmargin\\shpbxignore\\shpbymargin\\shpbyignore\\shpwr2\\shpwrk0\\shpfblwtxt0\\shpz0\\shplid2050{\\sp{\\sn shapeType}{\\sv 75}}{\\sp{\\sn fFlipH}{\\sv 0}}{\\sp{\\sn fFlipV}{\\sv 0}}",
        "{\\sp{\\sn pib}{\\sv {\\pict\\picscalex5871\\picscaley8088\\piccropl0\\piccropr0\\piccropt0\\piccropb0\\picw132\\pich132\\picwgoal75\\pichgoal75\\jpegblip\\bliptag-27338650{\\*\\blipuid fe5ed8662283528c0df6c82776feb0dc}",
        `${[].map.call(Buffer.from(book.meta.cover,'base64'),x=>x<16?'0'+x.toString(16):x.toString(16)).join('')}`,
        "}",
        "}}{\\sp{\\sn pibFlags}{\\sv 2}}{\\sp{\\sn fRecolorFillAsPicture}{\\sv 0}}{\\sp{\\sn fUseShapeAnchor}{\\sv 0}}{\\sp{\\sn fLine}{\\sv 0}}{\\sp{\\sn posrelh}{\\sv 0}}",
        "{\\sp{\\sn posrelv}{\\sv 0}}{\\sp{\\sn dhgt}{\\sv 251660288}}{\\sp{\\sn fLayoutInCell}{\\sv 1}}}}",
        "\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\partightenfactor0",
        "",
        "\\fs48 \\cf0 \\'a1\\'be\\'bc\\'f2\\'bd\\'e9\\'a1\\'bf",
        "\\fs36 \\",
        ""].join('\n')
    + book.meta.brief.split('\n').map(encode).map(line=>`      ${line}`).join('\\\n')
    +  [
        "",
        "\\fs48 \\page \\",
        "\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\qc\\partightenfactor0",
        "\\cf0 \\'c4\\'bf\\'c2\\'bc\\",
        "\\pard\\tx220\\tx720\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\li720\\fi-720\\pardirnatural\\partightenfactor0",
        ""
    ].join('\n')
    + book.list.map(chapter=>[
        "\\ls1\\ilvl0",
        "\\fs36 {\\listtext	",
        "\\f1 \\uc0\\u9642 ",
        `\\f0 	}${encode(chapter.title)}`,
        "\\fs48 \\"
    ].join('\n')).join('\n')
    + book.list.map(chapter=>[
        "page \\",
        "\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\qc\\partightenfactor0",
        `\\cf0 ${encode(chapter.title)}\\`,
        "\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\partightenfactor0",
        "",
        "\\fs36 \\cf0 "
    ].join('\n') + chapter.content.split('\n').map(encode).map(line=>`      ${line}`).join('\\\n') + '\n\\fs48 \\').join('')
    + '\n}'
}

module.exports = function(book,fn){
    fn(template(book))
}