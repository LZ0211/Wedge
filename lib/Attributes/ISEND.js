module.exports = require("../Type").createType(false,function (value){
    if (value == undefined){
        return false;
    }else if (typeof value == "boolean"){
        return value;
    }else if (typeof value == "number"){
        return value > 0;
    }else if (typeof value == "string"){
        return /完成|完结|完本|终章|结局|全本|结束|结尾|末尾|末章/.test(value);
    }
    return false;
});