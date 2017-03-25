var Metadata = require('./Metadata');
var List = require("./List");
var path = require('path');
var fs = require('fs');


function Book(json){
    json = json || {};
    this.meta = new Metadata(json.meta);
    this.list = new List(json.list);
    this.interval = 1000;
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

Book.prototype.localization = function(dir,fn){
    var self = this;
    if(this.timer) {
        fn();
        return this;
    };
    if(this.lock){
        var self = this;
        this.timer = setTimeout(function(){
            clearTimeout(self.timer);
            self.timer = null;
            return self.localization(dir,fn);
        },this.interval * 10);
        return this;
    }
    var file = path.join(dir,'index.book');
    var time = new Date;
    this.meta.set("date",+new Date());
    fs.writeFile(file,this.toString(),function(){
        self.lock = false;
        self.interval = new Date - time;
        return fn();
    });
    this.lock = true;
    return this;
}

module.exports = Book;