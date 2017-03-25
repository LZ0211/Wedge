module.exports = {
  "infoPage": {
    "match": "/\\/olread\\/\\d+\\/\\d+\\/index\\.html$/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "$('#site_notice').length > 0",
    "filter": "$('.intro strong').remove()",
    "bookInfos": {
      "source": "$.location()",
      "title": "$('.chapter_list_novel_title > h1').text()",
      "author": "$('.article_detail').text()",
      "classes": "$('.article_detail').text()",
      "isend": "$('.article_detail a').last().text()",
      "cover": "$.location($('.cover img').attr('src'))",
      "brief": "$('.intro').html()"
    }
  },
  "indexPage": {
    "match": "/\\/olread\\/\\d+\\/\\d+\\/index\\.html$/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "$('#site_notice').length > 0",
    "filter": $=>{
        var list = $(".chapter_list_chapter");
        var temp = {};
        var arr=[];
        for (var i=0;i<list.length ;i++ ){
            temp[i%4]=list.eq(i);
            if (i%4 == 3){
                arr.push(temp[0].find("a").eq(0));
                arr.push(temp[1].find("a").eq(0));
                arr.push(temp[2].find("a").eq(0));
                arr.push(temp[3].find("a").eq(0));
                arr.push(temp[0].find("a").eq(1));
                arr.push(temp[1].find("a").eq(1));
                arr.push(temp[2].find("a").eq(1));
                arr.push(temp[3].find("a").eq(1));
            }
        }
        var $chapter_list = $("#chapter_list");
        $chapter_list.empty();
        arr.forEach(function (v){
            $chapter_list.append(v)
        });
    },
    "bookIndexs": "$('#chapter_list a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/\\/olread\\/\\d+\\/\\d+\\/\\w+\\.html$/i.test($.location())",
    "footer": "$('#site_notice').length > 0",
    "chapterInfos": {
      "source": "$.location()",
      "content": "$('#text_area').html()"
    }
  }
}