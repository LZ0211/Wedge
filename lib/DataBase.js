var querystring = require("querystring");
var fs = require("fs");

function database(){
    var database=[],hash={},key="",location;
    var locked=false,timer=null,interval=1000;
    function queryFn(string){
        var query = querystring.parse(string);
        var rules = [];
        for (var key in query){
            var val = query[key];
            if (val !== ""){
                if (!Array.isArray(val)){
                    val = [val];
                }
                val = val.map(function(v){
                    if (/^(\d+|true|false)$/.test(v) == false){
                        v = '"' + v + '"';
                    }
                    return ['record["', key, '"]==', v].join('');
                }).join(" || ");
                rules.push("(" + val + ")");
            }
        }
        return new Function("record","return " + rules.join("&&"));
    }

    function file(f){
        location = f;
        try{
            var data = fs.readFileSync(location);
            var str = data.toString();
            load(JSON.parse(str));
            fs.writeFileSync(f+'.bak',data);
        }catch (err){
            try{
                var data = fs.readFileSync(location+'.bak');
                var str = data.toString();
                load(JSON.parse(str));
                fs.writeFileSync(location,str);
            }catch(e){
                fs.writeFileSync(location,'[]');
            }
        }
        process.on("exit",closeSync);
    }
    function closeSync(){
        try{
            fs.writeFileSync(location,JSON.stringify(database,null,2));
        }catch (e){
        }
    }

    function close(){
        if (!location) return;
        //有正在等待的任务
        if (timer) return;
        //有正在运行的任务，等待
        if (locked){
            timer = setTimeout(function(){
                clearTimeout(timer);
                timer = null;
                return close();
            },interval * 5);
            return;
        }
        //开始运行，锁定
        var bengin = +new Date;
        fs.renameSync(location,location+'.bak');
        fs.writeFile(location,JSON.stringify(database,null,2),function (err){
            err && console.log(err)
            //解除锁定
            locked = false;
            interval = new Date - bengin;
        });
        locked = true;
    }

    function load(db){
        if (undefined !== db){
            database = db;
        }
        return database;
    }
    function valueOf(){
        return database.concat();
    }
    function get(index){
        return database[index];
    }
    function set(index,record){
        database[index] = record;
        return database;
    }
    function slice(){
        return [].slice.apply([database].concat(arguments));
    }
    function push(record){
        if (key){
            var thiskey = record[key];
            if (!thiskey) return database;
            var index = indexOf(thiskey);
            if (index >= 0){
                set(index,record);
            }else {
                log(thiskey,size());
                database.push(record);
            }
        }else {
            database.push(record);
        }
        close();
        return database;
    }
    function each(fn){
        return database.forEach(fn);
    }
    function map(fn){
        return database.map(fn);
    }
    function filter(fn){
        return database.filter(fn);
    }
    function attr(k){
        return map(function (record){
            return record[k];
        });
    }
    function remove(indexs){
        var logs = {};
        if (!Array.isArray(indexs)){
            indexs = [indexs]
        }
        indexs.forEach(function (v){
            logs[v] = true;
        });
        database = filter(function (v,i){
            return !logs[i];
        });
        key && unique(key);
        return database;
    }
    function indexOf(v){
        return hash[v];
    }
    function log(k,v){
        hash[k] = v;
    }
    function unique(k){
        key = k;
        hash = {};
        var indexs = [];
        each(function (record,i){
            if(record == undefined){
                indexs.push(i);
                return;
            }
            var k = record[key];
            if (k == undefined){
                indexs.push(i);
                return;
            }
            var index = indexOf(k);
            if (index != undefined){
                indexs.push(index);
            }
            log(k,i-indexs.length);
        });
        indexs.length && remove(indexs);
        return database;
    }
    function keys(){
        return Object.keys(hash);
    }
    function query(str){
        return filter(queryFn(str));
    }
    function logs(){
        return hash;
    }
    function size(){
        return database.length;
    }
    function sortBy(k){
        database.sort(function (a,b){
            return a[k]-b[k];
        });
        return database;
    }
    function sort(fn){
        database.sort(fn);
        return database;
    }
    function reverse(){
        database.reverse();
        return database;
    }
    function concat(db){
        database = database.concat(db);
        return database;
    }
    function mergeBy(k){
        key = k;
        hash = {};
        var indexs = [];
        each(function (record,i){
            var k = record[key];
            if (k == undefined){
                indexs.push(i);
                return;
            }
            var index = indexOf(k);
            if (index != undefined){
                var old = get(index);
                for (var x in record){
                    old[x] = record[x];
                }
                indexs.push(i);
            }
            log(k,i);
        });
        remove(indexs);
        each(function (record,i){
            var k = record[key];
            log(k,i);
        });
    }
    function hashBy(k){
        var object = {};
        each(function (record){
            object[record[k]] = record;
        });
        return object;
    }

    return {
        file:file,
        close:close,
        load:load,
        valueOf:valueOf,
        indexOf:indexOf,
        get:get,
        set:set,
        slice:slice,
        push:push,
        concat:concat,
        reverse:reverse,
        sort:sort,
        sortBy:sortBy,
        mergeBy:mergeBy,
        hashBy:hashBy,
        each:each,
        map:map,
        filter:filter,
        attr:attr,
        remove:remove,
        unique:unique,
        keys:keys,
        logs:logs,
        query:query,
        size:size
    }
}

module.exports = database;
