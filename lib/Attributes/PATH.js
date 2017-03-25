var toSimple = require("./toSimple");
module.exports = require("../Type").String(function (string){
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
        [/《/g,""],
        [/》/g,""],
        [/^\s+/g,""],
        [/\s+$/g,""],
        [/[\r\n\t\f\v]+/g,""],
    ];

    table.forEach(function (pair){
        string = string.replace(pair[0],pair[1]);
    });

    string = string.replace(/&#(x)?([^&]{1,5});?/g,function($, $1, $2){
        return String.fromCharCode(parseInt($2, $1 ? 16 : 10));
    });

    string = string.split('').map(char=>toSimple[char] || char).join('');

    return string;
});