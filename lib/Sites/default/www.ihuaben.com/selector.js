module.exports = {
  "infoPage": {
    "match": "/^http:\\/\\/www\\.ihuaben\\.com\\/book\\/\\d+\\.html$/i.test($.location())",
    "indexPage": "$.location().replace(/\\\?.*/,'')+'?sortType=1&page=1'",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.text-danger').text().trim()",
      "author": "$('.text-muted').eq(0).text().trim()",
      "classes": "$('.text-muted').eq(1).text().trim()",
      "isend": "false",
      "cover": "$.location($('.cover > img').attr('src'))",
      "brief": "$('.text-muted.aboutbook').html()"
    }
  },
  "indexPage": {
    "match": "/^http:\\/\\/www\\.ihuaben\\.com\\/book\\/\\d+\\.html/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "$('.footer').length > 0",
    "request": $=>{
        var arr = [];
        $('.chapterTitle a').each((i,v)=>{
          arr.push({
            href:$.location($(v).attr('href')),
            text:$(v).text()
          });
        });
        var thisPage = $.location();
        var nextPage = $.location($('.pagination a').last().attr('href'));
        //console.log(thisPage,nextPage);
        if(nextPage == thisPage) return arr;
        var success = data=>{
            var str = data.toString();
            $('html').html(str);
            $('.chapterTitle a').each((i,v)=>{
              arr.push({
                href:$.location($(v).attr('href')),
                text:$(v).text()
              });
            });
            var nextPage = $.location($('.pagination a').last().attr('href'));
            //console.log(thisPage,nextPage);
            if(nextPage == thisPage) return arr;
            thisPage = nextPage;
            return {
                url:nextPage,
                success:success,
            }
        }
        thisPage = nextPage;
        return {
            url:nextPage,
            success:success,
        }
    }
  },
  "contentPage": {
    "match": "/^http:\\/\\/www\\.ihuaben\\.com\\/book\\/\\d+\\/\\d+\\.html$/i.test($.location())",
    "footer": "$('.footer').length > 0",
    "chapterInfos": {
      "content": "$('#contentsource').html()"
    }
  }
}