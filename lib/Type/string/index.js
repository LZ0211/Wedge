function fn(x){return x;}

["indexOf","match","replace","search","slice","split","substr","substring","toLowerCase","toUpperCase","charAt","charCodeAt","concat","trim"].forEach(function (name){
    fn.prototype[name] = function (){
        return String.prototype[name].apply(this.val(),arguments);
    }
});

module.exports = require("../createType")('',String)(fn);