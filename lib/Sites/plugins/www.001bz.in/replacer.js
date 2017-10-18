module.exports = {
  "infoPage": {
    "match": null,
    "indexPage": null,
    "footer": null,
    "bookInfos": {
      "source": null,
      "title": null,
      "author": null,
      "classes": null,
      "isend": ["状态："],
      "cover": null,
      "brief": ["[\\s\\S]*?简介："],
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
                var arr = str.split(/<.*?>/);
                if (arr.length < 8)return str;
                var found = [];
                [
                    [/[百度搜索找回网址版主综合社区◆▼▲●■★▶◀♠♥♦♣△▽○◇□☆◣◥◤◢∷∵∴∶↑↓◎╙╜╓╖╰`]/g,8,36],
                    [/[ωщШЩшwWｗＷ零○0０\.壹点1１ьЪbБЬъвBｂＢzZｚＺЛЙиnńň∏ΠΩηπNｎＮΝéèêēěeЁёEｅＥτtTｔＴ]/g,7,15],
                    [/[最快看更新]/g,5,40],
                    [/[看第一时间更新]/g,8,40],
                    [/[看更多精彩小说尽在版主站]/g,9,65],
                    [/[百度搜索第一版主小说站]/g,8,40],
                    [/[网站请大家到]/g,6,40],
                    [/[快看更新要来]/g,6,40],
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
                if (found.length){
                    //console.log(found);
                }
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
            "看~精`彩-尐`说~烬`恠 第`一~版-注\\*尐^说",
            "更*多`精;彩'小\\*说'尽\\|在' 第'一;版'主\\*小'说\\*站",
            "[wWｗＷ].{0,5}[wWｗＷ].{0,5}[wWｗＷ].{0,5}[0０].{0,5}[1１].{0,5}[ьЪbБЬъвBｂＢ].{0,5}[zZｚＺ].{0,5}[nNｎＮΝ].{0,5}[eEｅＥ].{0,5}[tTｔＴ]",
            "[wWｗＷ].{0,5}[wWｗＷ].{0,5}[wWｗＷ].{0,5}[0０].{0,5}[1１].{0,5}[ьЪbБЬъвBｂＢ].{0,5}[zZｚＺ].{0,5}[cCｃＣ].{0,5}[oOｏＯ].{0,5}[mMｍＭ]",
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