function Integer(number){
    return parseInt(number)
}

Integer.prototype.add = function (v){
    this.val(parseInt(this.val() + v));
    return this;
}
Integer.prototype.sub = function (v){
    this.val(parseInt(this.val() - v));
    return this;
}
Integer.prototype.div = function (v){
    this.val(parseInt(this.val() / v));
    return this;
}
Integer.prototype.mul = function (v){
    this.val(parseInt(this.val() * v));
    return this;
}
Integer.prototype.mod = function (v){
    this.val(parseInt(this.val() % v));
    return this;
}
module.exports = require("../createType")(0,Integer);