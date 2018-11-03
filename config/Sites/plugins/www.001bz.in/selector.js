module.exports = {
  "infoPage": {
    "match": "$('div.list_box').length",
    "indexPage": "$.location()",
    "footer": "$('.floatBox').length",
    "filter": "$('div.words').find('a').each((i,v)=>{$(v).replaceWith($(v).text())})",
    "bookInfos": {
      "source": "$.location()",
      "title": "$('.title h2').text()",
      "author": "$('div.info a').eq(0).text()",
      "classes": "$('div.info a').eq(1).text()",
      "isend": "$('li.wj').text()",
      "cover": "$.location($('div.pic img').attr('src'))",
      "brief": "$('div.words').html()"
    }
  },
  "indexPage": {
    "match": "$('div.list_box').length",
    "infoPage": "$.location()",
    "footer": "$('.floatBox').length",
    "bookIndexs": "$('div.list_box a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "true",
    "footer": "true",
    "filter0": "$('#content').find('img,script').remove()",
    "filter1": "$('#content').find('a').each((i,v)=>{$(v).replaceWith($(v).text())})",
    "chapterInfos": {
      "title": "$('.box_con h2').text()",
      "source": "$.location()",
      "content": $=>{
        var code = $('meta[name=client]').attr('content');
        if(!code) return;
        var idx = Buffer.from(code,'base64').toString().split(',');
        var hash = {};
        $('#content p').each((i,v)=>{
          hash[idx[i]] = $(v).text().trim().replace(/地[阯址]发[佈布].*/,'');
        });
        //console.log(hash);
        return Object.keys(hash).sort((a,b)=>a-b).map(x=>hash[x]).filter(x=>!x.match(/(第壹版主|第一版主)/)).filter(x=>!x.match(/[dｄDＤ][ｉＩiǐIìīΙ]\s?[γｙyYｙＹ]/)).join('\n')
      },
      "nextPage": "$.location($('a.curr').next().attr('href'))"
    }
  }
}