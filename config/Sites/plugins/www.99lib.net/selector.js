module.exports = {
  "infoPage": {
    "match": "$('#book_info').length",
    "indexPage": "$.location()",
    "footer": "$('#foot').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('#book_info h2').text()",
      "author": "$('#book_info > h4 > a').eq(0).text()",
      "classes": "$('div.title > a').last().text()",
      "isend": "true",
      "cover": "$.location($('#book_info > img').attr('src'))",
      "brief": "$('#book_info > div.intro').html()"
    }
  },
  "indexPage": {
    "match": "$('#book_info').length",
    "infoPage": "$.location()",
    "footer": "$('#foot').length",
    "bookIndexs": "$('#dir > dd > a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "$('#content').length",
    "footer": "$('#foot').length",
    "chapterInfos": {
      "title": "$('#content h2').text()",
      "content": $=>{
        var hash = Buffer.from($('meta[name=\"client\"]').attr('content'),'base64').toString().split(/[A-Z]+%/);
        var arr = [];
        var doms = $('#content').children().map((i,v)=>$(v).html().replace('<span class="notetext" data-note="','[[').replace('"></span>',']]').replace(/<[^<>]+?>/g,''));
        var idx = 0;
        hash.forEach((v,i)=>{
          if(v<3){
            arr[v] = doms[i+1];
            idx += 1;
          }else{
            arr[v-idx] = doms[i+1];
            idx += 2
          }
        })
        return arr.join('\n');
      }
    }
  }
}