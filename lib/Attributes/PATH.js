var toSimple = require("./toSimple");
module.exports = require("../Type").createType("",String)(function (string){
    var table = [
        [/&nbsp;/g,""],
        [/\.+$/g,""],
        [/^\.+/g,""],
        [/:/g,"："],
        [/\?/g,"？"],
        [/\*/g,""],
        [/\\/g,""],
        [/\//g,""],
        [/\|/g,"&brvbar;"],
        [/</g,"&lt;"],
        [/>/g,"&gt;"],
        [/"/g,"'"],
        [/^\s+/g,""],
        [/\s+$/g,""],
        [/[\r\n\t\f\v]+/g,""],
    ];

    table.forEach(function (pair){
        string = string.replace(pair[0],pair[1]);
    });

    string = string.split('').map(char=>toSimple[char] || char).join('');

    return string;
});