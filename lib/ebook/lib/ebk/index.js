var Encode = require("./Encode");
var json = require("../json");


module.exports = function (book){
    var book = book.use(json);
    return Encode(book);
}