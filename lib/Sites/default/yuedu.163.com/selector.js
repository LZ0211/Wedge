module.exports = {
  "infoPage": {
    "match": "/yuedu.163.com\\/source\\/\\w+$/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "$('.m-foot').length > 0",
    "filter": "$('.txt').find('a').remove()",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.f-fl h3').text().replace($('h3 a').text(),'').replace('&nbsp;著','')",
      "author": "$('h3 a').text()",
      "classes": "$('td:contains(分类)').next().text()",
      "isend": "$('.status').text()",
      "cover": "$.location($('.cover img').attr('src'))",
      "brief": "$('.description').html()"
    }
  },
  "indexPage": {
    "match": "/yuedu.163.com\\/source\\/\\w+$/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "true",
    "request": "{url: $.location().replace('yuedu.163.com/source/','yuedu.163.com/newBookReader.do?operation=info&sourceUuid=') + '&catalogOnly=true',success:data=>data.catalog.filter(x=>!x.needPay).map(x=>({href:$.location().replace('yuedu.163.com/source/','yuedu.163.com/book_reader/') + '/' + x.uuid,text:x.title}))}",
  },
  "contentPage": {
    "match": "/yuedu.163.com\\/book_reader\\/\\w+\\/\\w+$/i.test($.location())",
    "footer": "true",
    "request": $=>{
        var url = $.location();
        var arr = url.split("/");
        var articleUuid = arr.pop();
        var sourceUuid = arr.pop();
        return {
            url : $.location('/getArticleContent.do?sourceUuid=' + sourceUuid + "&articleUuid=" + articleUuid),
            method : 'GET',
            dataType : "json",
            success : data=>({
                content: new Buffer(data.content,"base64").toString()
            })
        }
    }
  }
}