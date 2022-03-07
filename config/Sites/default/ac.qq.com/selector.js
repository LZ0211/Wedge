module.exports = {
  "infoPage": {
    "match": "/\\/Comic\\/ComicInfo\\/id\\/\\d+/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "$('.mod-footer-info').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('h2.works-intro-title').text().trim()",
      "author": "$('.works-author-name').text().trim()",
      "classes": "'漫画'",
      "isend": "$('.works-intro-status').text()",
      "cover": "$.location($('.works-cover img').attr('src'))",
      "brief": "$('.works-intro-short').html()"
    }
  },
  "indexPage": {
    "match": "/\\/Comic\\/ComicInfo\\/id\\/\\d+/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "$('.mod-footer-info').length > 0",
    "filter": "$('.ui-icon-pay').prev('a').remove()",
    "bookIndexs": "$('.works-chapter-list a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text().trim()})).toArray()"
  },
  "contentPage": {
    "match": "/\\/ComicView\\/index\\/id\\/\\d+\\/cid\\/\\d+/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "source": "$.location()",
      "content": $=>{
        var str = $.raw;
        var data = str.match(/var DATA\s*=\s*'(.*)?',/)[1];
        var nonce = str.match(/window\[.*\]\s*=\s*(.*)/g)[1].match(/window\[.*\]\s*=\s*(.*)/)[1];
        nonce = nonce.replace("document.children","1");
        nonce = nonce.replace("document.getElementsByTagName('html')","1");
        nonce = nonce.replace("window.Array","1");
        nonce = eval(nonce);
        var T = data.split('');
        var locate;
        var N=nonce.match(/\d+[a-zA-Z]+/g);
        var len = N.length;
        while(len--){
          locate = parseInt(N[len]) & 255;
          str = N[len].replace(/\d+/g,'');
          T.splice(locate,str.length);
        }
        str = Buffer.from(T.join(''),'base64').toString();
        str = JSON.parse(str);
        return str.picture.map(x=>'<img src="'+x.url+'">').join('\n')
      }
    }
  }
}