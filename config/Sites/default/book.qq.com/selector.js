module.exports = {
  "infoPage": {
    "match": "/book-detail/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "true",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('meta[property=\"og:novel:book_name\"]').attr('content')",
      "author": "$('meta[property=\"og:novel:author\"]').attr('content')",
      "classes": "$('meta[property=\"og:novel:category\"]').attr('content')",
      "isend": "$('meta[property=\"og:novel:status\"]').attr('content')",
      "cover": "$('meta[property=\"og:image\"]').attr('content')",
      "brief": "$('meta[property=\"og:description\"]').attr('content')"
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