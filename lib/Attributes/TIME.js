function Time(input){
    if (typeof input == "undefined"){
        return +new Date();
    }
    return parseInt(input);
}

function leftPad(str,padding,length){
    str = '' + str;
    if (str.length >= length){
        return str;
    }
    for (var i=str.length;i<=length;i++){
        str = padding + str;
    }
    return str;
}

Time.prototype.format=function (template){
    var time = new Date(this.val())
    var day = template || "yyyy-MM-dd hh:mm:ss";
    day = day.replace(/(y+)/,function ($,$1){
        return leftPad(time.getFullYear(),0,$1.length)
    });
    day = day.replace(/(M+)/,function ($,$1){
        return leftPad(time.getMonth() + 1,0,$1.length)
    });
    day = day.replace(/(d+)/,function ($,$1){
        return leftPad(time.getDate(),0,$1.length)
    });
    day = day.replace(/(h+)/,function ($,$1){
        return leftPad(time.getHours(),0,$1.length)
    });
    day = day.replace(/(m+)/,function ($,$1){
        return leftPad(time.getMinutes(),0,$1.length)
    });
    day = day.replace(/(s+)/,function ($,$1){
        return leftPad(time.getSeconds(),0,$1.length)
    });
    return day;
}

Time.prototype.date = function (){
    return new Date(this.val())
}

module.exports = require("../Type").createType(+new Date(),Time);

/*var date = new module.exports();
console.log(date.format('dd.mm.yyyy'))*/