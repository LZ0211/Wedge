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
      "cover": "",
      "brief": "$('.book-intro').html()"
    }
  },
  "indexPage": {
    "match": "$('.info').length",
    "infoPage": "$.location()",
    "footer": "$('.footer').length",
    "bookIndexs": "$('.list').eq(1).find('a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()",
    "nextPage":"$.location($('a.nextPage').attr('href').replace('_1/','/'))"
  },
  "contentPage": {
    "match": "$('.page-content').length",
    "footer": "$('.footer').length",
    "chapterInfos": {
      "title": "$('.box_con h2').text()",
      "source": "$.location()",
      "content": "$('.page-content').html()",
      "nextPage": "$.location($('a.curr').next().attr('href'))",
      "identify": "true"
    }
  }
}