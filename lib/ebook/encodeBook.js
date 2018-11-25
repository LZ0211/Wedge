"use strict";
function encode(str){
    str = String(str) || "";
    return str.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g,'')
    .replace(/&(amp;|amp；)+/g,"&")
    .replace(/&(nbsp|nbs|nbp|nsp|bsp|nb|ns|np|bs|bp|sp)(;|；)/g,' ')
    .replace(/&(apos|apo|aos|aps|pos|ap|ao|as|po|ps|os)(;|；)/g,"'")
    .replace(/&(quot|quo|qut|qot|uot|qu|qo|qt|uo|ut|ot)(;|；)/g,'"')
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/'/g,"&apos;")
    .replace(/"/g,"&quot;");
}

function encodeBook(book){
    book.meta.title = encode(book.meta.title);
    book.meta.author = encode(book.meta.author);
    book.meta.classes = encode(book.meta.classes);
    book.meta.brief = encode(book.meta.brief);
    book.list.forEach(chapter=>{
        chapter.title = encode(chapter.title);
        chapter.content = encode(chapter.content);
    });
}

module.exports = encodeBook;