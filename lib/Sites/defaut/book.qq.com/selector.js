module.exports = {
  "infoPage": {
    "match": "/^http:\\/\\/book\\.qq\\.com\\/intro\\.html/i.test($.location())",
    "indexPage": "{method:'post',href:'http://book.qq.com/intro/listcontent.html',data:'bid='+$('#monthlyBtn').attr('bid')+'&pageIndex=1'}",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "source": "$.location()",
      "title": "$('.book_info > h3 > a').text()",
      "author": "$('dd > a').eq(0).text()",
      "classes": "$('dd.w_auth').eq(1).text()",
      "isend": "true",
      "cover": "$.location($('.bookBox img').attr('src'))",
      "brief": "$('#bookIntro').html()"
    }
  },
  "indexPage": {
    "match": "/listcontent/i.test($.location())",
    "infoPage": "",
    "footer": "true",
    "bookIndexs":"$('a').map((i,v)=>({href:($(v).attr('href')||'').replace(/[\"\\\\]/g,''),text:$(v).text().replace(/&nbsp;/g,' ')})).toArray().slice(0,20)"
  },
  "contentPage": {
    "match": "/^http:\\/\\/book\\.qq\\.com\\/read\\.html/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "source": "$.location()",
      "content": "null",
      "ajax":$=>{
            var script = $('script').text();
            //console.log(script)
            var matched,bid,cid;
            if (matched = script.match(/bid = "(\d+)"/)){
                bid = matched[1];
            }
            if (matched = script.match(/cid = "(\d+)"/)){
                cid = matched[1];
            }
            //console.log(bid,cid)
            return {
                url : 'http://book.qq.com/read/' + bid + '/' + cid,
                method : 'POST',
                data : 'lang=&w=830&fontsize=14',
                dataType : "json",
                success : function (data){
                    $("body").html(data.Content);
                    $('div.bookreadercontent').find('p').last().remove();
                    return $('div.bookreadercontent').html();
                }
            }
        }
    }
  }
}