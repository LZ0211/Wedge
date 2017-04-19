var Encode = require("./Encode");
var jsonAsync = require('../json/async');


module.exports = function (book,callback){
    var book = book.use(jsonAsync,function (book){
        callback(Encode(book));
    });
}