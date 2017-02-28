var crypto = require('crypto');
var querystring = require("querystring");
var sqlite3 = require('sqlite3');
sqlite3.verbose();

//new sqlite3.Database(filename, [mode], [callback])
//mode (optional): One or more of sqlite3.OPEN_READONLY, sqlite3.OPEN_READWRITE and sqlite3.OPEN_CREATE. The default value is OPEN_READWRITE | OPEN_CREATE.
var db = undefined;

function uuid(hash){
    var lens = [8,4,4,4,12];
    var array = [],offset=0;
    lens.forEach(function (len){
        array.push(hash.substring(offset,offset+len));
        offset += len;
    });
    return array.join("-");
}

function qsTosql(string){
    var query = querystring.parse(string);
    var rules = [];
    for (var key in query){
        var val = query[key];
        if (val !== ""){
            if (!Array.isArray(val)){
                if (/^\d+$/.test(val) == false){
                    val = "'" + val + "'";
                }
                rules.push([key, val].join('='));
            }else {
                val = val.map(function(v){
                    if (/^\d+$/.test(v) == false){
                        v = "'" + v + "'";
                    }
                    return [key, v].join('=');
                }).join(" OR ");
                rules.push("(" + val + ")");
            }
        }
    }
    return rules.join(" AND ");
}

exports.connect = function(callback){
    db = new sqlite3.Database("metadata.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        function(error){
            if (error){
                console.log('FAIL on creating database ' + error);
                callback(error,null);
            } else {
                callback(null,db);
            }
        });
}

exports.setup = function(callback){
    db.run("CREATE TABLE IF NOT EXISTS metadata" +
            " (title TEXT" +
            ", author VARCHAR(255)" +
            ", date DATETIME" +
            ", id VARCHAR(32) PRIMARY KEY" +
            ", uuid VARCHAR(36)" +
            ", classes TEXT" +
            ", brief TEXT" +
            ", isend INTEGER" +
            ", source TEXT" +
            ", lastChapter TEXT" +
            ")",function (error){
                if (error){
                    console.log('FAIL on create table ' + error);
                    callback(error);
                }else {
                    callback(null);
                }
            }
    );
}

exports.insert = function(record,callback){
    var id = crypto.createHash("md5").update(record.title + "-" + record.author).digest("hex");
    var values = [
        record.title, 
        record.author, 
        new Date(record.date), 
        id, 
        uuid(id),
        record.classes || "",
        record.brief || "",
        record.isend ? 1 : 0,
        record.source || "", 
        record.lastChapter || ""
    ];
    db.run("INSERT INTO metadata (title, author, date, id, uuid, classes, brief, isend, source, lastChapter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        values,
        function(error){
            if (error){
                console.log('FAIL on add ' + error);
                callback(error);
            } else {
                callback(null);
            }
        });
}

exports.each = function(doEach, callback){
    db.each("SELECT * FROM metadata", function(err, row){
        if (err){
            console.log('FAIL to retrieve row ' + err);
            callback(err, null);
        } else {
            doEach(row);
        }
    }, callback);
}

exports.map = function (doMap,callback){
    var arr = [];
    db.each("SELECT * FROM metadata", function(err, row){
        if (err){
            console.log('FAIL to retrieve row ' + err);
            callback(err, null);
        } else {
            arr.push(doMap(row));
        }
    }, function (){
        callback(null,arr);
    });
}

exports.filter = function (doEach,callback){
    var arr = [];
    db.each("SELECT * FROM metadata", function(err, row){
        if (err){
            console.log('FAIL to retrieve row ' + err);
            callback(err, null);
        } else {
            if (doEach(row)){
                arr.push(row);
            }
        }
    }, function (){
        callback(null,arr);
    });
}

exports.not = function (doEach,callback){
    var arr = [];
    db.each("SELECT * FROM metadata", function(err, row){
        if (err){
            console.log('FAIL to retrieve row ' + err);
            callback(err, null);
        } else {
            if (!doEach(row)){
                arr.push(row);
            }
        }
    }, function (){
        callback(null,arr);
    });
}

exports.query = function (qs,callback){
    db.all("SELECT * FROM metadata WHERE " + qsTosql(qs) ,function (err,rows){
        if (err){
            callback(err,null)
        }else {
            callback(null,rows);
        }
    });
}

exports.search = function (qs,callback){
    qs = "'%" + qs + "%'";
    var sql = ["title","author","classes","brief","lastChapter"]
        .map(x=>[x,"LIKE",qs].join(" "))
        .join(" OR ");
    db.all("SELECT * FROM metadata WHERE " + sql ,function (err,rows){
        if (err){
            callback(err,null)
        }else {
            callback(null,rows);
        }
    });
}

exports.remove = function(object, callback){
    db.run("DELETE FROM metadata WHERE " + qsTosql(querystring.stringify(object)),
        function(err){
            if (err){
                console.log('FAIL to delete ' + err);
                callback(err);
            } else {
                callback(null);
            }
        });
}

exports.get = function(object,callback){
    db.get("SELECT * FROM metadata WHERE " + qsTosql(querystring.stringify(object)),
        function(err,row){
            if (err){
                console.log('FAIL to delete ' + err);
                callback(err,null);
            } else {
                callback(null,row);
            }
        });
}

exports.getAll = function(object,callback){
    db.all("SELECT * FROM metadata WHERE " + qsTosql(querystring.stringify(object)),
        function(err,row){
            if (err){
                console.log('FAIL to delete ' + err);
                callback(err,null);
            } else {
                callback(null,row);
            }
        });
}

exports.update = function(object, callback){
    var keys = Object.keys(object);
    var values = keys.map(x=>object[x]).concat([object.id]);
    var sql = "UPDATE metadata SET" +
        keys.map(x=> " " + x + " = ?").join(",") +
        " WHERE id = ?";
    db.run(sql,values,
        function(err){
            if (err){
                console.log('FAIL on updating table ' + err);
                callback(err);
            } else {
                callback(null);
            }
        });
}

exports.connect()