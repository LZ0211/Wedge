module.exports = require("../Type").createType("",String)(function (string){
    var table = [
        [/^\s+/g,""],
        [/\s+$/g,""],
        [/[\r\n\t\f\v]+/g,""],
    ];
    var replace = String.prototype.replace;
    table.forEach(function (pair){
        string = replace.apply(string,pair);
    });
    var str = "";
    while (str !== string){
        str = string;
        string = string.replace(/&amp;/g,"&");
    }
    return string;
});