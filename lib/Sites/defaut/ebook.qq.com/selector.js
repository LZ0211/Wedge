module.exports = {
  "infoPage": {
    "match": "/intro\\.html/i.test($.location())",
    "indexPage": "$.location().replace('http://ebook.qq.com/intro.html','http://ebook.qq.com/intro/directory.html')+'&pageIndex=1'",
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
    "infoPage": "$.location().replace('http://ebook.qq.com/intro/directory.html','http://ebook.qq.com/intro.html').replace('&pageIndex=1','')",
    "footer": "true",
    "bookIndexs":"$('a').map((i,v)=>({href:($(v).attr('href')||'').replace(/[\"\\\\]/g,''),text:$(v).text().replace(/&nbsp;/g,' ')})).toArray().slice(0,30)"
  },
  "contentPage": {
    "match": "/hvread.html/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "source": "$.location()",
      "content": "null",
      "ajax":$=>{
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
                  'referer':$.location(),
                  'X-Requested-With':'XMLHttpRequest',
                }
            }
        }
    }
  }
}