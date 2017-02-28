function fn(x){return x;}
fn.prototype.toFixed = function (){
    return Number.prototype.toFixed.apply(this.val(),arguments);
}
module.exports = require("../createType")(0,Number)(fn);
