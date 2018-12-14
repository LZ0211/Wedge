module.exports = {
  "infoPage": {
    "match": "$('.bookInfor').length",
    "indexPage": "$.location($('.tryRead').parent('a').attr('href'))",
    "footer": "$('.v1_foot').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('.bookname h2').text()",
      "author": "$('span.author').text()",
      "classes": "$('.bookL > s').text()",
      "isend": "$('.newIcon').length",
      "cover": "$.location($('.bookL img').eq(0).attr('src'))",
      "brief": "$('.bookinf03 p').html()"
    }
  },
  "indexPage": {
    "match": "/Chapter.Index/i.test($.location())",
    "infoPage": "$.location($('.header a').attr('href'))",
    "footer": "true",
    "request": $=>{
      var url = $.location();
      var bid = url.match(/(bid=\d+)/i)[1];
      var page = 1;
      var cache = [];
      var success = data=>{
        var free = data.list.filter(item=>item.priceTag == '免费');
        cache = cache.concat(free)
        if(free.length < 50) return cache.map(item=>({url:'http://ireader.com.cn/index.php?ca=Chapter.Index&pca=Chapter.Index&' + bid + '&cid=' + item.id,text:item.chapterName}))
        page += 1;
        return {
          url:'http://ireader.com.cn/index.php?ca=Chapter.List&ajax=1&' + bid + '&page=' + page + '&pageSize=50',
          method : 'GET',
          dataType : "json",
          success: success
        }
      }
      return {
        url:'http://ireader.com.cn/index.php?ca=Chapter.List&ajax=1&' + bid + '&page=1&pageSize=50',
        method : 'GET',
        dataType : "json",
        success: success
      }
    }
  },
  "contentPage": {
    "match": "/Chapter.Index/i.test($.location())",
    "footer": "true",
    "filter": "$('.article h2').remove()",
    "chapterInfos": {
      "source": "$.location()",
      "content": "$('.article').html()"
    }
  }
}