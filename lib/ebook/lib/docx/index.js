var Zip = require('../zip');
var html = require("../html");

var Content_Types = '<?xml version="1.0" encoding="utf-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/endnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/></Types>';

var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>';

var docProps = {
    app(){
        return '<?xml version="1.0" encoding="utf-8"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Wedge</Application><AppVersion>1.13</AppVersion><DocSecurity>0</DocSecurity><HyperlinksChanged>false</HyperlinksChanged><LinksUpToDate>true</LinksUpToDate><ScaleCrop>false</ScaleCrop><SharedDoc>false</SharedDoc><Company>裂章</Company></Properties>';
    },
    core(book){
        var time = formatTime(new Date(),'yyyy-MM-ddThh:mm:ssZ');
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${book.meta.title}</dc:title><dc:subject>${book.meta.classes}</dc:subject><dc:creator>${book.meta.author}</dc:creator><cp:keywords>${book.meta.title},${book.meta.author}</cp:keywords><dc:description>${book.meta.brief}</dc:description><cp:lastModifiedBy>Wedge</cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">${time}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${time}</dcterms:modified><dc:language>zh</dc:language></cp:coreProperties>`;
    }
}

var word = {
    refs: {
        document: '<?xml version="1.0" encoding="utf-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="styles.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Id="rId1"/><Relationship Target="fontTable.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Id="rId4"/><Relationship Target="webSettings.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Id="rId3"/><Relationship Target="numbering.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Id="rId2"/><Relationship Target="media/cover.jpeg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Id="rId5"/></Relationships>',
        fontTable: '<?xml version="1.0" encoding="utf-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'

    },
    fontTable: '<?xml version="1.0" encoding="utf-8"?>\n<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:font w:name="cnepub"/></w:fonts>',
    numbering: '<?xml version="1.0" encoding="utf-8"?>\n<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>',
    styles: '<?xml version="1.0" encoding="utf-8"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" w:asciiTheme="minorHAnsi"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:bidi="zh" w:eastAsia="zh" w:val="zh"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:styleId="Normal" w:type="paragraph" w:default="1"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:beforeLines="100" w:afterLines="100" w:line="312" w:lineRule="atLeast"/><w:ind w:firstLineChars="200"/><w:jc w:val="both"/></w:pPr><w:rPr><w:rFonts w:ascii="cnepub" w:cs="cnepub" w:eastAsia="cnepub" w:hAnsi="cnepub"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:b w:val="off"/><w:bCs w:val="off"/><w:i w:val="off"/><w:iCs w:val="off"/><w:color w:val="000000"/><w:shd w:fill="auto"/><w:u w:val="none"/><w:dstrike w:val="off"/><w:strike w:val="off"/><w:caps w:val="off"/><w:smallCaps w:val="off"/><w:shadow w:val="off"/><w:spacing w:val="0"/><w:vertAlign w:val="baseline"/><w:bdr w:space="0" w:sz="0" w:val="none" w:color="auto"/></w:rPr></w:style><w:style w:styleId="Heading 1" w:type="paragraph"><w:name w:val="Heading 1"/><w:qFormat/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:firstLine="0" w:firstLineChars="0"/><w:jc w:val="center"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b w:val="on"/><w:bCs w:val="on"/></w:rPr></w:style></w:styles>',
    webSettings: '<?xml version="1.0" encoding="utf-8"?>\n<w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:optimizeForBrowser/><w:allowPNG/><w:doNotSaveAsSingleFile/></w:webSettings>',
    document(book){
        var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body><w:p><w:r><w:drawing><wp:anchor distB="0" distL="0" distR="0" distT="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:align>center</wp:align></wp:positionH><wp:positionV relativeFrom="page"><wp:align>center</wp:align></wp:positionV><wp:extent cx="7559999" cy="10691999"/><wp:effectExtent b="0" l="0" r="0" t="0"/><wp:wrapTopAndBottom/><wp:docPr descr="封面" id="1" name="cover.jpg"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr descr="封面" id="0" name="cover.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId5"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="7559999" cy="10691999"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading 1"/><w:pageBreakBefore w:val="on"/></w:pPr><w:r><w:t>目录</w:t></w:r></w:p>';
        var length = book.list.length;
        if(length === 0){
            xml += '';
        }else if(length === 1){
            xml += `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:ind w:firstLine="0" w:firstLineChars="0" w:left="0" w:leftChars="0"/><w:pageBreakBefore w:val="off"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \h </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:hyperlink w:anchor="Top_of_${book.list[0].id}_html"><w:r><w:rPr><w:color w:themeColor="hyperlink" w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${book.list[0].title}</w:t></w:r></w:hyperlink><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
        }else{
            xml += `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:ind w:firstLine="0" w:firstLineChars="0" w:left="0" w:leftChars="0"/><w:pageBreakBefore w:val="off"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \h </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:hyperlink w:anchor="Top_of_${book.list[0].id}_html"><w:r><w:rPr><w:color w:themeColor="hyperlink" w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${book.list[0].title}</w:t></w:r></w:hyperlink></w:p>`;
            
            for(var i=1;i<length-1;i++){
                xml += `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:ind w:firstLine="0" w:firstLineChars="0" w:left="0" w:leftChars="0"/></w:pPr><w:hyperlink w:anchor="Top_of_${book.list[i].id}_html"><w:r><w:rPr><w:color w:themeColor="hyperlink" w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${book.list[i].title}</w:t></w:r></w:hyperlink></w:p>`;
            }
            xml += `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:ind w:firstLine="0" w:firstLineChars="0" w:left="0" w:leftChars="0"/></w:pPr><w:hyperlink w:anchor="Top_of_${book.list[length-1].id}_html"><w:r><w:rPr><w:color w:themeColor="hyperlink" w:val="0000FF"/><w:u w:val="single"/></w:rPr><w:t>${book.list[length-1].title}</w:t></w:r></w:hyperlink><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
        }
        xml += book.list.map((chapter,index)=>(
            `<w:p><w:bookmarkStart w:id="${index+1}" w:name="${leftPad(index+1,'0',5)}"/><w:pPr><w:pStyle w:val="Heading 1"/><w:pageBreakBefore w:val="on"/></w:pPr><w:r><w:t>${chapter.title}</w:t></w:r><w:bookmarkEnd w:id="${index+1}"/></w:p>` + encode(chapter.content).split('\n').map(line=>`<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t>${line}</w:t></w:r></w:p>`).join('')
        )).join('');
        xml += '<w:sectPr><w:pgSz w:h="16837" w:w="11905"/><w:pgMar w:left="1440" w:bottom="1440" w:right="1440" w:top="1440"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>';
        return xml;
    }
}

function encode(str){
    str = String(str) || "";
    return str.replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/'/g,"&#39;")
    .replace(/"/g,"&quot;");
}

function uuid(){
    return [0,0,0,0].map(x=>Math.floor(Math.random()*256)).map(x=>x.toString(16)).map(x=>x.toUpperCase()).join('');
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

module.exports = function (book,fn){
    var ebk = new Zip();

    ebk.writeFile('[Content_Types].xml',Content_Types,true);

    ebk.writeFile('_rels/.rels',rels,true);

    ebk.writeFile('docProps/app.xml',docProps.app(),true);
    ebk.writeFile('docProps/core.xml',docProps.core(book),true);

    ebk.writeFile('word/_rels/document.xml.rels',word.refs.document,true);
    ebk.writeFile('word/_rels/fontTable.xml.rels',word.refs.fontTable,true);

    ebk.writeFile('word/fontTable.xml',word.fontTable,true);

    ebk.writeFile('word/media/cover.jpeg',Buffer.from(book.meta.cover,'base64'),true);

    ebk.writeFile('word/numbering.xml',word.numbering,true);
    ebk.writeFile('word/styles.xml',word.styles,true);
    ebk.writeFile('word/webSettings.xml',word.webSettings,true);
    ebk.writeFile('word/document.xml',word.document(book),true);
    fn(ebk.generate());
}