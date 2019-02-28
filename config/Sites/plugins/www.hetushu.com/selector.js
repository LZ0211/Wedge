module.exports = {
  "infoPage": {
    "match": "$('.book_info').length",
    "indexPage": "$.location()",
    "footer": "$('.foot').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('.book_info > h2').text()",
      "author": "$('.book_info a').eq(0).text().trim()",
      "classes": "$('.title a').last().text()",
      "isend": "$('.finish').length",
      "cover": "$.location($('.book_info > img').attr('src'))",
      "brief": "$('.book_info .intro').html()"
    }
  },
  "indexPage": {
    "match": "$('.book_info').length",
    "infoPage": "$.location()",
    "footer": "$('.foot').length",
    "bookIndexs": "$('#dir a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "$('#content').length",
    "footer": "$('#foot').length",
    "chapterInfos": {
      "content": $=>{
        var hash = Buffer.from($('meta[name=\"client\"]').attr('content'),'base64').toString().split(/[A-Z]+%/);
        var arr = [];
        var doms = $('#content').children().map((i,v)=>$(v).html().replace(/<(acronym|bdo|big|cite|code|dfn|kbd|q|s|samp|strike|tt|u|var|abbr|bdi|command|details|figure|footer|keygen|mark)>[\s\S]*<\/?\1>/g,''));
        var idx = 0;
        var star = $('#content h2').length;
        hash.forEach((v,i)=>{
          if(v<5){
            arr[v] = doms[i+star];
            idx += 1;
          }else{
            arr[v-idx] = doms[i+star];
          }
        })
        return arr.join('\n');
      }
    }
  }
}