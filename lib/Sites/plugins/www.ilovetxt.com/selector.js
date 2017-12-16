var KeyReplace = "暴逼插擦操淫阴屄潮抽处床春唇刺粗洞逗硬峰抚摸腹干搞根宫勾股狠滑魂鸡夹奸交精紧菊裤胯裸毛迷糜靡尿搐咛趴喷屁骑裙肉揉乳软润塞骚搔舌射兽爽酥烫舔胸脱吻慰握喔性痒药滢姨穴欲吸弄汁诱惑慾腿具咬吹味屌怒龟涨情坚体露屁液水肛蜜啊动激爱浪禁枪嫩搂母湿挺野幽呻吟舒荡缠泄裆驰勃箫额龙茎道棒抠疼麻醉按伦轮法国犯妈婆日色流睡阳味身胞恋腰胀爬禁撑叫黄缩虐妻进嘴腔嗷";

module.exports = {
  "infoPage": {
    "match": "$('.NovelContent').length",
    "indexPage": "$.location('Chapter.html')",
    "footer": "$('#CopyBottom').length",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('.NovelName h1').text().trim()",
      "author": "$('.NovelNote u').eq(0).text().trim()",
      "classes": "$('.NovelInfo dt').eq(0).find('a').eq(-1).text()",
      "isend": " $('.NovelNote li').eq(-1).text()",
      "cover": "$.location($('img.Pic_Line').attr('src'))",
      "brief": "$('.NovelContent').html()"
    }
  },
  "indexPage": {
    "match": "/Chapter.html$/i.test($.location())",
    "infoPage": "$.location('./')",
    "footer": "$('#CopyBottom').length",
    "filter": "$('.Chapter').eq(0).remove()",
    "bookIndexs": "$('.Chapter a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "$('.ChapterContent').length",
    "footer": "$('#CopyBottom').length",
    "chapterInfos": {
      "source": "$.location()",
      "content": $=>{
        var buf = Buffer.from($('#__VIEWSTATE').val(),'base64').slice(51);
        var txt = buf.toString();
        var start = $('#Content').text().trim().substr(0,24);
        txt = txt.replace(/<span class=['"]T_(\d+)['"]><\/span>/ig,function($,$1){
          return KeyReplace.charAt($1 - ($1.length == 3 ? 1 : 0)*10 - 1);
        });
        var arr = txt.split(start);
        arr[0] = '';
        txt = arr.join(start);
        return txt.split(/..Visiblehd/)[0];
      }
    }
  }
}