module.exports = {
  "infoPage": {
    "match": "/book-detail/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "true",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.book-title').text()",
      "author": "$('.book-update span').eq(0).text()",
      "classes": "$('.book-tags').text()",
      "isend": "$('.book-update').text()",
      "cover": "$.location($('.book-cover img').attr('src'))",
      "brief": "$('.intro').html()"
    }
  },
  "indexPage": {
    "match": "/book-detail/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "true",
    "request": $=>{
      var bid = $.location().replace("https://book.qq.com/book-detail/","");
      return {
        url: "https://book.qq.com/api/book/detail/chapters?bid=" + bid,
        method : 'POST',
        dataType : "json",
        success: data=>data.data.filter(x=>x.free).map(x=>({text:x.chapterName,href:'https://book.qq.com/book-read/' + bid + '/' + x.cid}))
      }
    }
  },
  "contentPage": {
    "match": "/book-read/i.test($.location())",
    "footer": "true",
    "chapter": {
      "content": ""
    }
  }
}