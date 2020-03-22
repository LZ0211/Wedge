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
            function(str){
                var dict = {"ai":"爱","gao2":"搞","lu3":"颅","sao":"骚","xing":"性",
                "bang":"棒","gong":"共","luan":"乱","se":"色","xiong":"胸",
                "bang2":"帮","gong2":"宫","lun":"伦","sha":"杀","xue":"学",
                "bao":"暴","gou":"狗","lun2":"轮","she":"舌","xue2":"穴",
                "bi":"逼","gui":"龟","luo":"裸","she2":"射","xue3":"血",
                "biao":"婊","gun":"棍","ma":"麻","shen":"呻","yao":"摇",
                "bo":"勃","guo":"国","ma2":"马","shi":"尸","yao2":"药",
                "cao":"操","han":"含","ma3":"妈","shi2":"湿","yi":"义","cha":"插",
                "hu":"胡","mang":"氓","shou":"兽","yi2":"漪","chao":"潮","hui":"秽",
                "mei":"美","shu":"熟","yin":"吟","chu":"处","ji":"挤","mi":"咪",
                "shui":"水","yin2":"阴","chun":"唇","ji2":"鸡","mi2":"蜜","si":"死",
                "yin3":"淫","dan":"弹","ji3":"纪","mie":"灭","si2":"丝","ying":"硬",
                "dan2":"蛋","ji4":"妓","mu":"母","suan":"酸","you":"铀","dang":"党",
                "jian":"奸","nai":"奶","tai":"台","you2":"幼","dang2":"荡","jian2":"贱",
                "nei":"内","tao":"涛","yu":"欲","di":"嫡","jiao":"交","nen":"嫩","tian":"舔",
                "zai":"宰","di2":"弟","jie":"介","niao":"尿","tong":"童","ze":"泽","ding":"丁",
                "jin":"锦","nu":"奴","tou":"偷","zha":"炸","dong":"洞","jing":"茎","pao":"炮",
                "tui":"腿","zhan":"斩","du":"毒","jing2":"精","peng":"鹏","tun":"臀","zhi":"指",
                "du2":"杜","jiu":"九","pi":"屁","tun2":"吞","zhong":"中","fen":"粉","jue":"厥",
                "qiang":"枪","wang":"亡","zhu":"主","feng":"缝","keng":"坑","qin":"亲","wei":"未",
                "zu":"足","fu":"妇","ling":"凌","qing":"情","wen":"温","zuo":"做","fu2":"腐",
                "liu":"流","ri":"日","xi":"锡","gan":"干","lou":"漏","rou":"肉","xi2":"席","gang":"肛",
                "lu":"露","ru":"乳","xi3":"吸","gao":"高","lu2":"撸","ru2":"辱","xian":"酰","jv":"具","jv2":"菊","nue":"虐"};
                return str.replace(/<img src="[^<>]*\/toimg\/data\/(\w{2,16}).png"\s*\/?>/gi,($,$1)=>{
                  var str = $1.substr(0,$1.length/2)
                  return dict[str] || str
                })
            },
            function (str){
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