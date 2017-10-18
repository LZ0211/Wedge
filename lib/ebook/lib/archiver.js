function Archiver(){
}
Archiver.prototype.append = function (file,content){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self[floder] = self[floder] || new Archiver();
        self = self[floder];
    }
    self[arr.shift()] = Buffer.from(content);
    return this
};
Archiver.prototype.each = function(fn){
    for(var name in this){
        if(this.hasOwnProperty(name)){
            fn(name,this[name],Buffer.isBuffer(this[name]));
        }
    }
    return this;
};
Archiver.prototype.files = function(){
    var arr = [],data;
    for(var name in this){
        data = this[name];
        if(this.hasOwnProperty(name) && Buffer.isBuffer(data)){
            arr.push([name,data]);
        }
    }
    return arr;
};
Archiver.prototype.dirs = function(){
    var arr = [],data;
    for(var name in this){
        data = this[name];
        if(this.hasOwnProperty(name) && data instanceof Archiver){
            arr.push([name,data]);
        }
    }
    return arr;
};
Archiver.prototype.get = function (file){
    var arr = file.split(/[\\\/]/);
    var self = this;
    while (arr.length > 1){
        var floder = arr.shift();
        self = self[floder];
        if (!self){
            return
        }
    }
    return self[arr.shift()];
}