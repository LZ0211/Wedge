module.exports = {
  "infoPage": {
    "match": "/book/.test($.location())",
    "indexPage": "$.location().replace('book','catalog')",
    "footer": "false",
    "request": $=>{
      var id = $.location().split('/').pop();
      return {
        url: "https://apiuser.yueduyun.com/w/block/book?book_id=" + id,
        dataType : "json",
        success: data=>({
          "origin":$.location(),
          "source":$.location(),
          "title":data.data.book_name,
          "author":data.data.author_name,
          "classes":data.data.category_name,
          "isend":data.data.book_end,
          "cover":data.data.book_cover,
          "brief":data.data.book_intro
        })
      }
    }
  },
  "indexPage": {
    "match": "/catalog/.test($.location())",
    "infoPage": "$.location().replace('catalog','book')",
    "filter": "$('li:contains(vip)').remove()",
    "footer": "false",
    "bookIndexs": "$('.catalog a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/read/.test($.location())",
    "footer": "true",
    "request": $=>{
      var arr = $.location().split('/');
      var cid = arr.pop();
      var bid = arr.pop();
      return {
        url: "https://apiuser.yueduyun.com/app/chapter/chapter_content?book_id=" + bid + "&chapter_id=" + cid,
        dataType : "json",
        success: data=>data.data.chapter_content
      }
    }
  }
}