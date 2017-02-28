function isBase64(str){
    if (!str) return false;
    var len = str.length;
    if (!len || len % 4 !== 0 || /[^A-Z0-9+\/=]/i.test(str)){
        return false;
    }
    var firstPaddingChar = str.indexOf('=');
    return firstPaddingChar === -1 || firstPaddingChar === len - 1 || firstPaddingChar === len - 2 && str[len - 1] === '=';
}

function Base64(buffer){
    if (Buffer.isBuffer(buffer)){
        return new Buffer(buffer).toString("base64");
    }
    if (typeof buffer == "string"){
        if (/http/i.test(buffer)){
            return buffer;
        }else if (isBase64(buffer)){
            return buffer;
        }else {
            return new Buffer(buffer).toString("base64");
        }
    }
    return "";
}

Base64.prototype.toBuffer = function (){
    return new Buffer(this.val(),"base64");
}

module.exports = require("../Type").createType("",Base64);