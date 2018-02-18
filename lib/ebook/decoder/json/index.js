module.exports = function (buffer,fn){
    fn(JSON.parse(buffer.toString()));
};