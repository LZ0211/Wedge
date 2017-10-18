function _decryptByBaseCode(text,base){if(!text){return text;}
    var arrStr=[],arrText=text.split('\\');for(var i=1,len=arrText.length;i<len;i++){arrStr.push(String.fromCharCode(parseInt(arrText[i],base)));}
    return arrStr.join('');
}
module.exports = {
  "infoPage": {
    "match": "/^http:\\/\\/chuangshi\\.qq\\.com\\/\\w+\\/\\w+\\/\\d+\\.html/i.test($.location())",
    "indexPage": "$.location($('#readNow').attr('href'))",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.left > .title a').eq(-2).text()",
      "author": "$('.au_name a').text()",
      "classes": "$('.left > .title a').eq(-3).text()",
      "isend": "$('#novelInfo').find('span.red2').text()",
      "cover": "$.location($('.cover img').attr('src'))",
      "brief": "$('.info').html()"
    }
  },
  "indexPage": {
    "match": "/^http:\\/\\/chuangshi\\.qq\\.com\\/\\w+\\/\\w+\\/\\w+\\-l\\.html/i.test($.location())",
    "infoPage": "$.location($('.tablist a').eq(0).attr('href'))",
    "footer": "$('.footer').length > 0",
    "filter": "$('.list:contains(VIP卷)').remove()",
    "bookIndexs": "$('.list > ul').find('a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/^http:\\/\\/chuangshi\\.qq\\.com\\/\\w+\\/\\w+\\/\\w+\\-r\\-\\d+\\.html/i.test($.location())",
    "footer": "true",
    "request":$=>{
        var script = $('script').last().text();
        var matched,bid,uuid;
        if (matched = script.match(/bid = "(\d+)"/)){
            bid = matched[1];
        }
        if (matched = script.match(/uuid = "(\d+)"/)){
            uuid = matched[1];
        }
        return {
            url : 'http://chuangshi.qq.com/index.php/Bookreader/' + bid + '/' + uuid,
            method : 'POST',
            data : 'lang=zhs',
            dataType : "json",
            success : function (data){
                $("#chaptercontainer").html(_decryptByBaseCode(data.Content,30));
                return {
                    title:$.location(),
                    content:$('div.bookreadercontent').html()
                }
            }
        }
    }
  }
}