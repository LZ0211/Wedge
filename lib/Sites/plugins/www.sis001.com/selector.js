module.exports = {
  "infoPage": {
    "match": "!!$('.threadlist').length",
    "indexPage": "$.location()",
    "footer": "!!$('.footer').length",
    "bookInfos": {
      "title": "$('div.mainbox > h1 > a').text().trim()",
      "author": "'sis001'",
      "classes": "$('div.mainbox > h1 > a').text().trim()",
      "isend": "false",
      "cover": "$.location('images/green001/logo.png')",
      "brief": ""
    }
  },
  "indexPage": {
    "match": "!!$('.threadlist').length",
    "infoPage": "$.location()",
    "footer": "!!$('.footer').length",
    "filter": $=>{
      $('span.threadpages').remove();
      $('th:contains("版务")').remove();
      $('th:contains("公告")').remove();
      $('th:contains("阅读权限")').remove();
      $('img[alt="全局置顶"]').parents('th').remove();
      $('img[alt="分类置顶"]').parents('th').remove();
    },
    "bookIndexs": "$('th > span > a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text(),id:$(v).attr('href').replace(/.*?thread-(\\d+).*/i,'$1')})).toArray()"
  },
  "contentPage": {
    "match": "!!$('div.t_msgfont').length",
    "footer": "!!$('.footer').length",
    "filter1": $=>{
        $('div.t_msgfont').find('fieldset,table').remove();
        var $posts=$('div.mainbox'),
            main=$posts.first().find('div.t_msgfont'),
            html='';
        $posts.each(function(c,a){
            a=$(a);
            var b=a.find('div.t_msgfont');
            if(1E3<b.text().length||a.find('#ajax_thanks').length)html+=b.html()
        });
        main.html(html);
        main.append($('.postattachlist a').eq(1).clone());
    },
    "chapterInfos": {
      "source": "$.location()",
      "content": "$('div.t_msgfont').eq(0).html()",
      "nextPage": "$.location($('.pages_btns > .pages > a.next').attr('href'))"
    }
  }
}