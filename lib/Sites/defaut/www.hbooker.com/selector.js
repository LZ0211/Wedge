module.exports = {
  "infoPage": {
    "match": "/book_detail/i.test($.location())",
    "indexPage": "$.location($('a.read').attr('href'))",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('.book-title h3').text().trim()",
      "author": "$('.book-title a').text().trim()",
      "classes": "$('.breakcrumb a').eq(-1).text()",
      "isend": "$('.book-property').text()",
      "cover": "$.location($('.book-cover img').attr('src'))",
      "brief": "$('.book-desc').html()"
    }
  },
  "indexPage": {
    "match": "/get_chapter_list/i.test($.location())",
    "infoPage": "$.location($('a:contains(返回书页)').attr('href'))",
    "footer": "$('.footer').length > 0",
    "bookIndexs": "$('.book-chapter-list a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/book_chapter_detail/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "source": "$.location()",
      "content": "",
      "ajax":$=>{
        var qs = $.location().replace('http://www.hbooker.com/chapter/book_chapter_detail/','chapter_id=');
        return {
          url:'http://www.hbooker.com/chapter/ajax_get_session_code',
          method:'POST',
          data:qs,
          success:data=>{
            var chapter_access_key = data.chapter_access_key;
            return {
              url:'http://www.hbooker.com/chapter/get_book_chapter_detail_info',
              method:'POST',
              data:qs+'&chapter_access_key='+chapter_access_key,
              success:data=>{
                return data.chapter_content;
              }
            }
          }
        }
      }
    }
  }
}