function hs_decrypt(str,key){if(str==""){return"";}
    var v=str2long(str,false);var k=str2long(key,false);var n=v.length-1;var z=v[n-1],y=v[0],delta=0x9E3779B9;var mx,e,q=Math.floor(6+52/(n+1)),sum=q*delta&0xffffffff;while(sum!=0){e=sum>>>2&3;for(var p=n;p>0;p--){z=v[p-1];mx=(z>>>5^y<<2)+(y>>>3^z<<4)^(sum^y)+(k[p&3^e]^z);y=v[p]=v[p]-mx&0xffffffff;}
        z=v[n];mx=(z>>>5^y<<2)+(y>>>3^z<<4)^(sum^y)+(k[p&3^e]^z);y=v[0]=v[0]-mx&0xffffffff;sum=sum-delta&0xffffffff;}
    return long2str(v,true);}

function str2long(s,w){var len=s.length;var v=[];for(var i=0;i<len;i+=4)
{v[i>>2]=s.charCodeAt(i)|s.charCodeAt(i+1)<<8|s.charCodeAt(i+2)<<16|s.charCodeAt(i+3)<<24;}
    if(w){v[v.length]=len;}
    return v;}

function long2str(v,w){var vl=v.length;var sl=v[vl-1]&0xffffffff;for(var i=0;i<vl;i++)
{v[i]=String.fromCharCode(v[i]&0xff,v[i]>>>8&0xff,v[i]>>>16&0xff,v[i]>>>24&0xff);}
    if(w){return v.join('').substring(0,sl);}
    else{return v.join('');}}

function base64decode(str){var c1,c2,c3,c4,base64DecodeChars=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1];var i,len,out;len=str.length;i=0;out="";while(i<len){do{c1=base64DecodeChars[str.charCodeAt(i++)&0xff];}while(i<len&&c1==-1);if(c1==-1)break;do{c2=base64DecodeChars[str.charCodeAt(i++)&0xff];}while(i<len&&c2==-1);if(c2==-1)break;out+=String.fromCharCode((c1<<2)|((c2&0x30)>>4));do{c3=str.charCodeAt(i++)&0xff;if(c3==61)return out;c3=base64DecodeChars[c3];}while(i<len&&c3==-1);if(c3==-1)break;out+=String.fromCharCode(((c2&0XF)<<4)|((c3&0x3C)>>2));do{c4=str.charCodeAt(i++)&0xff;if(c4==61)return out;c4=base64DecodeChars[c4];}while(i<len&&c4==-1);if(c4==-1)break;out+=String.fromCharCode(((c3&0x03)<<6)|c4);}
    return out;}

function utf8to16(str){var out,i,len,c;var char2,char3;out="";len=str.length;i=0;while(i<len){c=str.charCodeAt(i++);switch(c>>4){case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:out+=str.charAt(i-1);break;case 12:case 13:char2=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x1F)<<6)|(char2&0x3F));break;case 14:char2=str.charCodeAt(i++);char3=str.charCodeAt(i++);out+=String.fromCharCode(((c&0x0F)<<12)|((char2&0x3F)<<6)|((char3&0x3F)<<0));break;}}
    return out;}

module.exports = {
  "infoPage": {
    "match": "/^http:\\/\\/www\\.hongshu\\.com\\/book\\/\\d+\\/$/i.test($.location())",
    "indexPage": "$.location($('.list').attr('href'))",
    "footer": "$('.footer').length > 0",
    "bookInfos": {
      "origin": "$.location()",
      "title": "$('h1.fllf').text().trim()",
      "author": "$('.fmtopname').text().trim()",
      "classes": "$('.infor a').eq(0).text()",
      "isend": "$('.infor').text()",
      "cover": "$.location($('.img img').attr('src'))",
      "brief": "($('.intro').attr('hidecontent') || '').replace(/%([0-9A-F][0-9A-F])/gi,(a,b)=>String.fromCharCode(parseInt(b,16))).replace(/%u([0-9A-F][0-9A-F][0-9A-F][0-9A-F])/gi,(a,b)=>String.fromCharCode(parseInt(b,16)))"
    }
  },
  "indexPage": {
    "match": "/^http:\\/\\/www\\.hongshu\\.com\\/bookreader\\/\\d+\\/$/i.test($.location())",
    "infoPage": "$.location($('.qh').attr('href'))",
    "footer": "$('.footer').length > 0",
    "filter": "$('.vip').prev().remove()",
    "bookIndexs": "$('.columns a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"
  },
  "contentPage": {
    "match": "/^http:\\/\\/www\\.hongshu\\.com\\/content/i.test($.location())",
    "footer": "true",
    "request": $=>{
      var arr = $.location().replace('http://www.hongshu.com/content/','').replace('.html','').replace('/','-').split('-');
      return {
        url:'http://www.hongshu.com/bookajax.do',
        method:'POST',
        dataType:'json',
        data:'method=getchptkey&bid='+arr[0]+'&cid='+arr[2],
        success:data=>{
          var key = data.key;
          if(!key) return;
          return {
              url:'http://www.hongshu.com/bookajax.do',
              method:'POST',
              dataType:'json',
              data:'method=getchpcontent&bid='+arr[0]+'&jid='+arr[1]+'&cid='+arr[2],
              success:data=>utf8to16(hs_decrypt(base64decode(data.content), key))
          }
        }
      }
    }
  }
}