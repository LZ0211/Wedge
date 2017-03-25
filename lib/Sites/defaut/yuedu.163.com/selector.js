module.exports = {
  "infoPage": {
    "match": "/^http:\\/\\/yuedu.163.com\\/source\\/\\w+$/i.test($.location())",
    "indexPage": "$.location().replace('source/','newBookReader.do?operation=info&sourceUuid=')",
    "footer": "$('.m-foot').length > 0",
    "filter": "$('.txt').find('a').remove()",
    "bookInfos": {
      "source": "$.location()",
      "title": "$('.f-fl h3').text()",
      "author": "$('.f-fl td').eq(3).text()",
      "classes": "$('.f-fl td').eq(1).text()",
      "isend": "$('.f-fl td').eq(9).text()",
      "cover": "$.location($('.cover img').attr('src'))",
      "brief": "$('.detail').eq(0).find('.txt').eq(-1).html()"
    }
  },
  "indexPage": {
    "match": "/^http:\\/\\/yuedu.163.com\\/newBookReader\\.do\\?operation=info&sourceUuid=\\w+$/i.test($.location())",
    "infoPage": "$.location().replace('newBookReader.do?operation=catalog&sourceUuid=','source/')",
    "footer": "true",
    "bookIndexs":"this.match($) && JSON.parse($.html()).catalog.filter(item=>!item.needPay).map(item=>({href:$.location().replace(/newBookReader.*?sourceUuid=/i,'book_reader/')+'/'+item.uuid,text:item.title}))"
  },
  "contentPage": {
    "match": "/^http:\\/\\/yuedu.163.com\\/book_reader\\/\\w+\\/\\w+$/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "source": "$.location()",
      "content": "",
      "ajax":$=>{
            var url = $.location();
            var arr = url.split("/");
            var articleUuid = arr.pop();
            var sourceUuid = arr.pop();
            return {
                url : 'http://yuedu.163.com/getArticleContent.do?sourceUuid=' + sourceUuid + "&articleUuid=" + articleUuid,
                method : 'GET',
                dataType : "json",
                success : function (data){
                    return new Buffer(data.content,"base64").toString();
                }
            }
        }
    }
  }
}