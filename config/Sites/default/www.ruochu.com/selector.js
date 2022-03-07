module.exports = {
  "infoPage": {
    "match": "/ruochu\\.com\\/book\\/\\d+$/i.test($.location())",
    "indexPage": "$.location().replace('book','chapter')",
    "footer": "$('.footer').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('h1').eq(0).text().trim()",
      "author": "$('a.name strong').text().trim()",
      "classes": "$('.cate > a').text()",
      "isend": "!$('.is-serialize').length",
      "cover": "$.location($('.pic img').attr('src'))",
      "brief": "$('.summary .note').html()"
    }
  },
  "indexPage": {
    "match": "/ruochu\\.com\\/chapter\\/\\d+$/i.test($.location())",
    "infoPage": "$.location().replace('chapter','book')",
    "footer": "$('.footer').length",
    "filter": "$('.isvip').remove()",
    "bookIndexs": "$('ul.float-list > li > a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/book\\/\\d+\\/\\d+/i.test($.location())",
    "footer": "true",
    "request": $=>{
      return {
        "url":$.location().replace('book','ajax/book') + '?_' + Date.now(),
        "dataType": "json",
        "success": data=>JSON.parse(data).chapter.htmlContent
      }
    }
  }
}