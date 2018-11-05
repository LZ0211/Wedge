const crypto = require('crypto');
function decode(obj){
    var content = obj.content;
    var keys = obj.keys;
    var len = keys.length;
    var accessKey = obj.accessKey;
    var keyArr = accessKey.split("");
    var keyLen = keyArr.length;
    var array = [];
    array.push(keys[(keyArr[keyLen - 1].charCodeAt(0)) % len]);
    array.push(keys[(keyArr[0].charCodeAt(0)) % len]);
    for (var i = 0; i < array.length; i++) {
        content = Buffer.from(content,'base64');
        var key = Buffer.from(array[i],'base64');
        var iv = content.slice(0, 16);
        var text = content.slice(16);
        var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        var decoded  = decipher.update(text, 'base64', 'utf8');
        decoded += decipher.final( 'utf8' );
        content = decoded;
    }
    return content;
}

module.exports = {
  "infoPage": {
    "match": "$('.book-intro').length",
    "indexPage": "$.location($('a:contains(立即阅读)').attr('href'))",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('img.lazyload').eq(1).attr('alt')",
      "author": "$('h3.title a').text().trim()",
      "classes": "$('.breadcrumb a').eq(-1).text()",
      "isend": "$('.update-state').text()",
      "cover": "$.location($('img.lazyload').eq(1).attr('data-original'))",
      "brief": "$('.book-desc').html()"
    }
  },
  "indexPage": {
    "match": "/chapter-list/i.test($.location())",
    "infoPage": "$.location($('a:contains(详情)').attr('href'))",
    "footer": "$('.footer').length > 0",
    "filter": "$('.icon-lock').parent('a').remove()",
    "bookIndexs": "$('.book-chapter-list a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
    "contentPage": {
    "match": "$('h3.chapter').length",
    "footer": "true",
    "request":$ => {
        var qs = $.location().replace('http://www.ciweimao.com/chapter/','chapter_id=');
        return {
            url:'http://www.ciweimao.com/chapter/ajax_get_session_code',
            method:'POST',
            data:qs,
            success:data => {
                var chapter_access_key = data.chapter_access_key;
                if(data.code !== 100000) return data.tip;
                return {
                    request:{
                        url:'http://www.ciweimao.com/chapter/get_book_chapter_detail_info',
                        method:'POST',
                        data:qs+'&chapter_access_key='+chapter_access_key,
                        headers:{
                            "X-Requested-With":"XMLHttpRequest",
                            "Referer":$.location()
                        },
                        success:data => {
                            if(data.code !== 100000) return data.tip;
                            return decode({
                                content: data.chapter_content,
                                keys: data.encryt_keys,
                                accessKey: chapter_access_key
                            });
                        }
                    }
                }
            }
        }
    }
  }
}

