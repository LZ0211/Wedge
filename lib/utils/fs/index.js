var async = require("../async");
function mkdirsSync(dir){
    if (fs.existsSync(dir)){
        return
    }
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || mkdirsSync(dirname);
    fs.mkdirSync(dir);
}

function mkdirs(dir,callback){
    callback = callback || noop;
    var _callback = function(){fs.mkdir(dir,callback);}
    fs.exists(dir,function (exist){
        exist ? callback() : mkdirs(path.dirname(dir),_callback);
    });
}

function rmdirsSync(root){
    if (!fs.existsSync(root)){
        return
    }
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            rmdirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
}

function isEmpty(f,callback){
    fs.stat(f,function (err,stats){
        if (err) return callback(false);
        if (stats.isFile()){
            if (stats.size == 0){
                return callback(true);
            }
            return callback(false);
        }
        if (stats.isDirectory()){
            fs.readdir(f,function (err,files){
                if (err) return callback(false);
                if (files.length == 0){
                    return callback(true);
                }
                return callback(false);
            });
        }
    });
}

function rmdirs(dir,callback){
    callback = callback || noop;
    fs.exists(dir,function (exist){
        if (!exist) return callback();
        fs.stat(dir,function (err,stats){
            if (err)throw err;
            if (stats.isFile()){
                fs.unlink(dir,callback);
            }
            if (stats.isDirectory()){
                fs.readdir(dir,function (err,files){
                    if (err) throw err;
                    async.thread().parallel(files.map(function (file){
                        return function(next){
                            rmdirs(path.join(dir,file),next);
                        }
                    }),function(){
                        fs.rmdir(dir, callback);
                    });
                });
            }
        });
    });
}

function walkSync(root, callback){
    let callee = function (root){
        let files = fs.readdirSync(root);
        let stats = {};
        files.forEach(function (file){
            let real = path.join(root,file);
            stats[real] = {};
            let filestat = fs.statSync(real);
            if (filestat.isDirectory() == true){
                stats[real].isDirectory=true;
            }else {
                stats[real].isDirectory=false;
            }
        });
        for (let file in stats){
            let stat = stats[file];
            if (stat.isDirectory){
                callee(file);
            }else {
                callback(file)
            }
        }
    }
    callee(root);
}

function walk(dir,callback){
    callback = callback || noop;
    let array = [],
        running = null,
        callee = function (dir,_call){
            _call = _call || noop;
            fs.exists(dir,function (exist){
                if (!exist) return;
                fs.stat(dir,function (err,stats){
                    if (err) throw err;
                    if (stats.isFile()){
                        array.push(function (next){
                            callback(dir);
                            next();
                        });
                    }
                    if (stats.isDirectory()){
                        array.push(function (next){
                            fs.readdir(dir,function (err,files){
                                if (err) throw err;
                                callback(dir);
                                async.thread().parallel(files.map(function (file){
                                    file = path.join(dir,file);
                                    return function (next){
                                        callee(file,next);
                                    }
                                }),next);
                            });
                        });
                    }
                    async.thread().parallel(array,_call);
                });
            });
        }
    callee(dir);
}

function isEmptySync(file){
    var stats = fs.statSync(file);
    if (stats.isFile()){
        return stats.size == 0;
    }
    if (stats.isDirectory()){
        return fs.readdirSync(file).length == 0;
    }
}
module.exports = {
    mkdirs:mkdirs,
    mkdirsSync:mkdirsSync,
    rmdirs:rmdirs,
    rmdirsSync:rmdirsSync,
    isEmpty:isEmpty,
    isEmptySync:isEmptySync,
    walk:walk,
    walkSync:walkSync
}