module.exports = {
  "infoPage": {
    "match": "!!$('#bookinfo').length",
    "indexPage": "$.location()",
    "footer": "!!$('.footer').length",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.book_info > h3 > a').text().trim()",
      "author": "$('dd > a').eq(0).text().trim()",
      "classes": "$('dd > a').eq(1).text().trim()",
      "isend": "true",
      "cover": "$.location($('#bookinfo img').attr('src'))",
      "brief": "$('#bookIntro').html()"
    }
  },
  "indexPage": {
    "match": "/http:\\/\\/dushu\\.qq\\.com\\/intro\\.html\\?bid=\\d+/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "!!$('.footer').length",
    "request": "{url:'http://dushu.qq.com/intro/listcontent.html',method:'POST',data:$.location().replace('http://dushu.qq.com/intro.html?','')+'&pageIndex=1',success:data=>{$('#chapterList').html(data.ListHTMl);return $('span.free').prev('a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()}}"
  },
  "contentPage": {
    "match": "/http:\\/\\/dushu\\.qq\\.com\\/read.html\\?bid=\\d+&cid=\\d+/i.test($.location())",
    "footer": "true",
    "request": $=>{
        return {
          url : $.location().replace('http://dushu.qq.com/read.html?bid=','http://dushu.qq.com/read/').replace('&cid=','/'),
          method : 'POST',
          data : 'lang=&w=830&fontsize=14',
          dataType : "json",
          success : function (data){
            $(".readPageWrap").html(data.Content);
            $('div.bookreadercontent').find('p').last().remove();
            return $('div.bookreadercontent').html();
          }
       }
    }
  }
}