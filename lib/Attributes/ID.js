module.exports = require("../Type").createType("",String)(function (string){
    string = string.replace(/\D/g,"");

    for (var i=string.length;i<5;i++){
        string = "0" + string;
    }

    return string;
});