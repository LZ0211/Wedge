module.exports = {
  "infoPage": {
    "match": null,
    "indexPage": null,
    "footer": null,
    "bookInfos": {
      "source": null,
      "title": null,
      "author": ["作者：","类型：[\\s\\S]*"],
      "classes": ["[\\s\\S]*类型：","字数：[\\s\\S]*"],
      "isend": null,
      "cover": null,
      "brief": "<a href[\\s\\S]*",
      "keywords": null
    }
  },
  "indexPage": {
    "match": null,
    "infoPage": null,
    "footer": null,
    "bookIndexs": null
  },
  "contentPage": {
    "match": null,
    "footer": null,
    "chapterInfos": {
      "title": null,
      "source": null,
      "content": [
          function (str){
              var dict = " 男人啊爱按暴臀逼擦潮操插吃抽处床春唇刺粗大洞逗硬儿反犯峰妇抚夫腹干搞根公宫勾股狠花滑坏魂鸡激夹奸交叫娇姐禁精进紧菊渴口裤胯快浪力搂乱裸妈毛迷靡妹摸嫩母娘尿咛女哦趴喷婆屁气枪窃骑妻情亲裙热日肉揉乳软润入塞骚色上舌射身深湿兽受舒爽水睡酥死烫痛舔天体挺头腿脱味慰吻握喔污下小性胸血穴阳痒药腰夜液野衣姨吟淫荫幽诱尤欲吁玉吮窄占征汁嘴，。…慾丢弄";
              str = str.replace(/<em class="?n_(\d+)"?><\/em>/g,function($,$1){return dict[$1]});
              var arr = str.split(/<.*?>/);
              if (arr.length < 8) return str;
              var found = [];
              [
                  [/[百度搜索找回网址版主综合社区◆▼▲●■★▶◀♠♥♦♣△▽○◇□☆◣◥◤◢∷∵∴∶↑↓◎╙╜╓╖╰`]/g,8,36],
                  [/[ωщШЩшwWｗＷ零○0０\.壹点1１ьЪbБЬъвBｂＢzZｚＺЛЙиnńň∏ΠΩηπNｎＮΝéèêēěeЁёEｅＥτtTｔＴ]/g,7,15],
                  [/[快看更多最快精彩小说时间更新要来尽在第一版主网站]/g,8,65],
                  [/[百度搜索第一版主小说站]/g,8,40],
                  [/[网站请大家到]/g,6,40],
                  [/[获得最新地址]/g,6,40],
                  [/[真正网站]/g,4,40],
                  [/[发送电子邮件到至dｄiｉyｙbｂaａnｎzｚhｈuｕ@qｑ.cｃoｏmｍ]/g,10,30]
              ].forEach(function (rule){
                  arr.forEach(function (line){
                      var list = {};
                      var str = line.replace(/^[\r\n\3000\a0]*/g,"");
                      var reg = rule[0];
                      var matched = reg.exec(str);
                      while (matched){
                          list[matched[0]] = true;
                          matched = reg.exec(str);
                      }
                      var length = Object.keys(list).length;
                      if (length >= rule[1] && str.length <= rule[2] && str.split(" ").length < 5){
                          found.push(line);
                      }
                  });
              });
              found.forEach(function (s){
                  str = str.replace("<br /><br />"+s+"<br /><br />","");//2,2
                  str = str.replace("<BR /><BR />"+s+"<BR /><BR />","");//2,2
                  str = str.replace("<br><br>"+s+"<br><br>","");//2,2
                  str = str.replace("<BR><BR>"+s+"<BR><BR>","");//2,2
                  str = str.replace("<br />"+s+"<br /><br />","");//1,2
                  str = str.replace("<BR />"+s+"<BR /><BR />","");//1,2
                  str = str.replace("<br>"+s+"<br><br>","");//1,2
                  str = str.replace("<BR>"+s+"<BR><BR>","");//1,2
                  str = str.replace(s+"<br /><br />","");//0,2
                  str = str.replace(s+"<BR /><BR />","");//0,2
                  str = str.replace(s+"<br><br>","");//0,2
                  str = str.replace(s+"<BR><BR>","");//0,2
                  str = str.replace("<br /><br />"+s+"<br />","");//2,1
                  str = str.replace("<BR /><BR />"+s+"<BR />","");//2,1
                  str = str.replace("<br><br>"+s+"<br>","");//2,1
                  str = str.replace("<BR><BR>"+s+"<BR>","");//2,1
                  str = str.replace("<br /><br />"+s,"");//2,0
                  str = str.replace("<BR /><BR />"+s,"");//2,0
                  str = str.replace("<br><br>"+s,"");//2,0
                  str = str.replace("<BR><BR>"+s,"");//2,0
                  str = str.replace("<br />"+s+"<br />","");//1,1
                  str = str.replace("<BR />"+s+"<BR />","");//1,1
                  str = str.replace("<br>"+s+"<br>","");//1,1
                  str = str.replace("<BR>"+s+"<BR>","");//1,1
                  str = str.replace("<br />"+s,"");//1,0
                  str = str.replace("<BR />"+s,"");//1,0
                  str = str.replace("<br>"+s,"");//1,0
                  str = str.replace("<BR>"+s,"");//1,0
                  str = str.replace(s+"<br />","");//0,1
                  str = str.replace(s+"<BR />","");//0,1
                  str = str.replace(s+"<br>","");//0,1
                  str = str.replace(s+"<BR>","");//0,1
                  str = str.replace(s,"");//0,0
              });
              return str;
          },
          function (str){
              var check = str.match(/</g);
              if (check && check.length > 10){
                  return str;
              }
              return str.split("\n").map(line=>line.replace(/"(.*)?"/g,"“$1”")).join("\n");
          },
          "<a.{0,80}a>",
          "<font [\\s\\S]*",
          "[^<>]+当前网址随时可能失效[^<>]+",
          "[^<>]+最新地址发布[^<>]+",
          "[^<>]+[4vν\\.cCｃＣoOｏＯōmMｍＭмwWｗＷ0０1１ьЪbБЬъвBｂＢzZｚＺnNｎＮΝeEｅＥtTｔＴ]{5,}[^<>]+",
          "[^<>]*地.{1,2}发.{1,2}页[^<>]*",
          "【本小说发自.*",
          "\"\\);",
          " ?\\('",
          "'\\) -- The CHM[\\s\\S]*",
          "'\\)\\n",
          "This file was saved using.*",
          "The CHM file was converted.*",
          "The file was .*",
          "Download ChmDecompiler .*",
          "Download Decompiler.*",
          "（结尾英文忽略即可）",
          "【更多小说请大家到.*?】",
          "第一版主既是",
          "手机看片[^<>]+",
          "^地.发.页.*\\n",
          "-\s*= 第.*?官网[\s\S]*?发送邮件.*\\n",
            {
                "“ ":"“",
                " ”":"”",
                "\\n“\\s+":"\n“",
                "\\s+”\\n":"”\n",
                "(「[^「」]{0,6}[^？。]」)\\n*":"$1",
                "(“[^“”]{0,6}[^？。]”)\\n*":"$1",
                "([……。！？])\\n([^「」]{0,30}」)":"$1$2",
                "([……。！？])\\n([^“”]{0,30}”)":"$1$2",
                "([……——])\\n([啊哎唔])":"$1$2",
                "([啊哎唔……——])”\\n的":"$1”的",
            }
        ]
    }
  }
}