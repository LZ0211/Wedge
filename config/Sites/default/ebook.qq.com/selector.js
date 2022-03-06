module.exports = {
  "infoPage": {
    "match": "/intro\\.html/i.test($.location())",
    "indexPage": "$.location().replace('intro','intro/directory')",
    "footer": "$('.footer').length > 0",
    "filter": "$('#totalIntro em').remove()",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('.tit_1').eq(0).text()",
      "author": "$('span:contains(作者)').find('a').text()",
      "classes": "$('span:contains(类别)').find('a').text()",
      "isend": "$('#d_right').text()",
      "cover": "$.location($('a img').attr('src'))",
      "brief": "$('#totalIntro').html()"
    }
  },
  "indexPage": {
    "match": "/directory.html/i.test($.location())",
    "infoPage": "$.location().replace('intro/directory','intro')",
    "footer": "true",
    "bookIndexs":"($ = $.load($.data.listHtml)) && $('a:contains(免费)').map((i,v)=>({href:$(v).attr('href'),text:$(v).attr('title')})).toArray()"
  },
  "contentPage": {
    "match": "/hvread.html/i.test($.location())",
    "footer": "true",
    "request": $=>{
      var script = $('script').text();
      return {
        url : 'http://ebook.qq.com/hvread/nextbystep.html',
        method : 'POST',
        data : $.location().replace('http://ebook.qq.com/hvread.html?','')+'&w=602&fontsize=14',
        dataType : "json",
        success : function (data){
          $("body").html(data.data.content);
          $('div.bookreadercontent').find('p').last().remove();
          return $('div.bookreadercontent').html();
        },
        headers:{
          referer:$.location(),
          'X-Requested-With':'XMLHttpRequest',
        }
      }
    }
  }
}