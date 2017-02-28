var Metadata = require('./Metadata');
var List = require("./List");


function Book(json){
    json = json || {};
    this.meta = new Metadata(json.meta);
    this.list = new List(json.list);
}

Book.prototype.valueOf = function (){
    return {
        meta:this.meta.valueOf(),
        list:this.list.sortBy("id").valueOf()
    }
}

Book.prototype.toString = function (){
    return JSON.stringify(this.valueOf(),null,2);
}

Book.prototype.config = function (options){
    if (options == undefined){
        return {
            meta:this.meta.config(),
            list:this.list.config(),
        }
    }
    if (options.meta){
        this.meta.config(options.meta);
    }
    if (options.list){
        this.list.config(options.list);
    }
}

module.exports = Book;