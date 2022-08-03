module.exports = {
  "infoPage": {
    "match": "/\\.qidian.com\\/info\\/\\d+/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "$('.footer').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('meta[property=\"og:novel:book_name\"]').attr('content')",
      "author": "$('meta[property=\"og:novel:author\"]').attr('content')",
      "classes": "$('meta[property=\"og:novel:category\"]').attr('content')",
      "isend": "$('meta[property=\"og:novel:status\"]').attr('content')",
      "cover": "$('meta[property=\"og:image\"]').attr('content')",
      "brief": "$('meta[property=\"og:description\"]').attr('content')"
    }
  },
  "indexPage": {
    "match": "/\\.qidian.com\\/info\\/\\d+/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "$('.footer').length > 0",
    "request": $=>{
        var isFree = !!$('.flag').length;
        if(!isFree){
            $('.iconfont').parent('li').remove();
        }
        var thisList = $('.volume').find('li a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray();
        return {
            url:'http://book.qidian.com/ajax/book/category?_csrfToken=' + $.getCookie('_csrfToken') + '&bookId=' + $.location().replace('http://book.qidian.com/info/',''),
            success:data=>{
                data = JSON.parse(data.toString());
                var volums = data.data.vs.slice(1);
                if(!isFree){
                    volums = volums.filter(volum=>!volum.vS);
                }
                volums.forEach(volum=>{
                    thisList = thisList.concat(volum.cs.map(o=>{
                        return {
                            href:'http://read.qidian.com/chapter/'+o.cU,
                            text:o.cN
                        }
                    }));
                });
                return thisList;
            }
        }
    }
  },
  "contentPage": {
    "match": "/.qidian.com\\/chapter\\/\\S+\\/\\S+$/i.test($.location())",
    "footer": "$('.chapter-control').length > 0",
    "chapterInfos": {
      "title": "$('h3.j_chapterName').text()",
      "source": "$.location()",
      "content": "$('.read-content').html()"
    }
  }
}