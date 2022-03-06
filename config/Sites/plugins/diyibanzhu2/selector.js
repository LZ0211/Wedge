module.exports = {
  "infoPage": {
    "match": "$('.info').length",
    "indexPage": "$.location()",
    "footer": "$('.footer').length",
    "bookInfos": {
      "source": "$.location()",
      "title": "$('h1').text()",
      "author": "$('.info').text()",
      "classes": "$('.info').text()",
      "isend": "$('.status').text()",
      "cover": "$.location($('.container img').eq(0).attr('src'))",
      "brief": "$('.book-intro').html()"
    }
  },
  "indexPage": {
    "match": "$('.info').length",
    "infoPage": "$.location()",
    "footer": "$('.footer').length",
    "bookIndexs": "$('.chapter-list .list').find('a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()",
    "nextPage":"$.location($('a.nextPage').attr('href'))"
  },
  "contentPage": {
    "match": "$('.page-content').length",
    "footer": "$('.footer').length",
    "filter": "$('.page-content p').filter((i,v)=>$(v).attr('id')||$(v).attr('style')).remove()",
    "chapterInfos": {
      "title": "$('.page-title').text()",
      "source": "$.location()",
      "content": "$('.page-content').html()",
      "nextPage": "$.location($('.curr').next().attr('href'))",
    }
  }
}
