module.exports = function (book,fn){
    fn(JSON.stringify(book,null,2));
};