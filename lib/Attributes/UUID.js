var crypto = require('crypto');

function Uuid(input){
    if (input.match(/[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/)){
        return input;
    }
    var hash = crypto.createHash("md5").update(input).digest("hex");
    var lens = [8,4,4,4,12];
    var array = [],offset=0;
    lens.forEach(function (len){
        array.push(hash.substring(offset,offset+len));
        offset += len;
    });
    return array.join("-");
}

module.exports = require("../Type").createType("",String)(Uuid);