var Utils = {};

;(function (){
    var toString = Object.prototype.toString;
    ["Function","Array","String","Number","Object","RegExp","Date","HTMLDocument"].forEach(function (type){
        Utils["is" + type] = function (value){
            return toString.call(value) === "[object "+type+"]"
        }
    });
})()

Utils.trim = function (str){
    str = str.replace(/^[\s\u00A0\u3000\u0020 ]*/,"");
    return str;
};

Utils.trimTail = function (str){
    str = str.replace(/[\s\u00A0\u3000\u0020 ]*$/,"");
    return str;
};

Utils.isSBCcase = function (str){
    return !str.charAt(0).match(/[\u0000-\u00ff]/i)
};

Utils.lineLength = function (str){
    var length = 0;
    for (var i = 0; i < str.length; i++){
        length += this.isSBCcase(str[i]) ? 2 : 1;
    }
    return length
};

Utils.isStart = function (str){
    str = str.replace(/(\s|\u00A0|\u0020|\u3000)/ig," ");
    var startMark = ["  ","　"];
    var fixedMark = ["的"];
    var spaceStart = startMark.some(function(mark){
        return Utils.startWith(str,mark);
    });
    var fixed = fixedMark.some(function(mark){
        return Utils.startWith(Utils.trim(str),mark);
    });
    return spaceStart && !fixed
};

Utils.startWith = function (str,tag){
    return tag===str.substring(0,tag.length);
};

Utils.endWith = function (str,tag){
    return tag===str.substring(str.length-tag.length);
};

Utils.isEnd = function (str){
    var endMark = ["。”","……”","？”","！”","。」","……」","？」","！」","。","……","？","！","… 」"];
    return endMark.some(function (mark){
        return Utils.endWith(str,mark)
    })
};

Utils.deleteSpaceLine = function (str){
    var arr = str.split(/\n|\r/);
    var filted = [];
    var isSpace;
    arr.forEach(function (v){
        v = v.replace(/\u00A0/ig," ");
        v = v.replace(/\u0020/ig," ");
        v = v.replace(/\u3000/ig,"  ");
        v = v.replace(/\s*$/ig,"");
        isSpace = false;
        if (v.length == 0){
            isSpace = true
        }
        else {
            filted.push(v)
        }
    });
    return filted;
};

Utils.mergeLines = function (str){
    var sArray = this.deleteSpaceLine(str);
    if (sArray.length === 0){
        return str
    }
    //console.log(sArray)
    var needMerge = false;
    var noEndlines = 0;
    //统计各行的字节长度
    var dict = [];
    for (var i=0;i<sArray.length ;i++ ){
        dict.push(this.lineLength(sArray[i]));
        //统计没有结束符的行数
        if (!this.isEnd(sArray[i])){
            noEndlines += 1;
        }
    }
    //计算总长度
    var sumlength = dict.reduce(function(a,b){return a+b},0);
    //找出平均长度
    var avglength = sumlength/sArray.length;
    //找出最大的长度
    var maxlength = Math.max.apply(null,dict);
    //找出最小的长度
    var minlength = Math.min.apply(null,dict);
    
    //统计各字节长度的行数
    var list = {};
    dict.forEach(function (len){list[len] = list[len] || 0;list[len] += 1});
    //找出最多的长度
    var times = 0,mostlength=0
    for (var len in list){
        if (list[len] > times){
            times = list[len];
            mostlength = len 
        }
    }

    //不需要合并行的情况
    needMerge = this.needMerge(sArray.length,noEndlines,mostlength,avglength,maxlength,minlength)
    if (!needMerge){
        return sArray.map(this.trim).join("\n");
    }
    //console.log(["总行数",sArray.length,"\n没有结束符的行数",noEndlines,"\n行数最多的长度",mostlength,"\n平均长度",avglength,"\n最大的长度",maxlength,"\n最小的长度",minlength].join(""));
    var noMerge = true;
    for (var i=0;i<sArray.length-1 ;i++ ){
        var now = sArray[i];
        var next = sArray[i+1];
        if (this.needReturn(now,next,mostlength)){
            sArray[i] = this.join(now,"\n");
        }else {
            noMerge = false;
        }
    }
    if (noMerge){
        return sArray.map(this.trim).join("");
    }
    return this.mergeLines(sArray.map(this.trim).join(""));
};

Utils.needMerge = function (length,noEndlines,mostlength,avglength,maxlength,minlength){
    if (noEndlines/length < 0.1){
        return;
    }
    if (mostlength > 100 && maxlength>mostlength*1.5){
        return;
    }
    if (mostlength < 60){
        return;
    }
    return true;
}

Utils.isCuttingline = function (str){
    var arr = str.split("");
    var rarr = [];
    var char = arr[0];
    rarr.push(char);
    for (var i=1,l=arr.length;i<l ; i++){
        if (arr[i] !== char){
            char = arr[i];
            rarr.push(char);
        }
    }
    return (str.length >= 10 && rarr.length/str.length <= 0.5) || (str.length > 4 && rarr.length/str.length <= 0.25)
};

Utils.needReturn = function (now,next,mostlength){
    var thislength = this.lineLength(now);
    var nextlength = this.lineLength(next);
    //需要分段的情况
    /*
    情况1. 下一行开头有空白符
    */
    if (this.isStart(next)){
        return true
    }
    /*
    情况2. 本行结尾有结束符(下一行没有空白符)
    */
    else if (this.isEnd(now)){
        //本行长度不等于主要长度
        if (thislength !== mostlength){
            return true
        }
        //本行长度等于主要长度
        //下一行长度
        else if (nextlength < mostlength){
            return true
        }
    }
    /*
    情况3. 分隔行(下一行没有空白符,本行没有有结束符)
    */
    else if (this.isCuttingline(now) || this.isCuttingline(next)){
        return true
    }
    /*
    情况4. 本行长度小于主要长度*0.75(下一行没有空白符,本行没有有结束符)
    */
    else if (thislength < mostlength*0.75){
        return true
    }
    /*
    */
};

Utils.join = function (){
    return [].join.call(arguments,"");
}


module.exports = function (string){
    return Utils.mergeLines(string);
};