"use strict";
const querystring = require('querystring')
const fs = require('fs')
const SQL = require('./sql.js')

const sqlstr = 'CREATE TABLE IF NOT EXISTS book_metadatas (uuid CHARACTER(36) PRIMARY KEY,title VARCHAR(255),author VARCHAR(255),classes VARCHAR(255),source VARCHAR(255),origin VARCHAR(255),isend INTEGER,date INTEGER,brief TEXT);'

function convert(data){
    if(null == data) return 'NULL'
    if(true === data) return 1
    if(false === data) return 0
    if('string' == typeof data){
        data = data.replace(/'/g,"''")//'需要转义
        return `'${data}'`
    }
    return `${data}`
}

function toArray(db){
    db = db && db[0]
    if(!db) return []
    let keys = db.columns
    return db.values.map(values=>{
        let record = {}
        values.forEach((value,index)=>{
            record[keys[index]] = values[index]
        })
        return record
    })
}

function queryStr(string){
    var query = querystring.parse(string)
    function toRule(k,v){
        if(v=='') return ''
        if(v==='null') return `${k}=NULL`
        if(v=='true') return `${k}=1`
        if(v=='false') return `${k}=0`
        if(/^\d+$/.test(v)) return `${k}=${v}`
        if(Array.isArray(v)) return `(${v.map(vv=>toRule(k,vv)).filter(x=>!!x).join(' OR ')})`
        return `${k}='${v}'`
    }
    return Object.keys(query).map(k=>toRule(k,query[k])).filter(x=>!!x).join(' AND ')
}

function DataBase(){
    let dbFile = null,
        db = new SQL.Database(),
        isSync = false,
        isLocked = false,
        timer = null,
        interval = 1000,
        object = {}

    db.run(sqlstr)
    function useFile(file){
        if(!dbFile) process.on('exit',closeSync)//只绑定一次
        dbFile = file
        try{
            let buffer = fs.readFileSync(dbFile)
            db = new SQL.Database(buffer)
            fs.copyFileSync(dbFile, dbFile + '.bak')
        }catch(e){
            try{
                let buffer = fs.readFileSync(dbFile + '.bak')
                db = new SQL.Database(buffer)
            }catch(err){
                let data = db.export()
                let buffer = Buffer.from(data)
                fs.writeFileSync(dbFile, buffer)
            }
        }
        // fs.watch(dbFile,function(){
        //     try{
        //         let buffer = fs.readFileSync(dbFile)
        //         db = new SQL.Database(buffer)
        //     }catch(e){
        //         //do nothing
        //     }
        // });
        return object
    }

    function closeSync(){
        if(dbFile && 'string' == typeof dbFile){
            let data = db.export()
            let buffer = Buffer.from(data)
            fs.writeFileSync(dbFile, buffer)
        }
    }

    function close(){
        if(!isSync || !dbFile || timer) return object
        if(isLocked){
            timer = setTimeout(()=>{
                clearTimeout(timer)
                timer = null
                return close()
            },interval * 20)
        }
        let bengin = Date.now()
        fs.rename(dbFile,dbFile + '.bak',err=>{
            let data = db.export()
            let buffer = Buffer.from(data)
            fs.writeFile(dbFile, buffer,err=>{
                isLocked = false
                interval = Date.now() - bengin
            })
        })
        isLocked = true
        return object
    }

    function sync(stat){
        isSync = !!stat
        return object
    }

    function load(records){
        db.run('DELETE FROM book_metadatas;')
        records.forEach(push)
        return object
    }

    function get(uuid){
        return db.exec(`SELECT * FROM book_metadatas WHERE uuid = '${uuid}'`)
    }

    function set(uuid,record){
        let sqlstr = 'UPDATE book_metadatas SET ' + Object.keys(record).map(k=>`${k} = ${convert(record[k])}`).join(', ') + ` WHERE uuid = '${uuid}'`
        db.run(sqlstr)
        if(isSync) close()
        return object
    }

    function push(record){
        if(get(record.uuid).length){
            set(record.uuid,record)
        }else{
            let sqlstr = `INSERT INTO book_metadatas (${Object.keys(record).join(',')}) VALUES (${Object.keys(record).map(k=>convert(record[k])).join(', ')})`
            db.run(sqlstr)
        }
        if(isSync) close()
        return object
    }

    function remove(uuid){
        db.run(`DELETE FROM book_metadatas WHERE uuid = '${uuid}';`)
        if(isSync) close()
        return object
    }

    function query(rule){
        let datas = null
        try{
            let sqlstr = 'SELECT * FROM book_metadatas WHERE ' + queryStr(rule)
            datas = db.exec(sqlstr)
        }catch(e){
            datas = selectAll()
        }
        return toArray(datas)
    }

    function selectAll(){
        return db.exec('SELECT * FROM book_metadatas')
    }

    function concat(records){
        records.forEach(push)
        return object
    }

    function attr(key){
        let records = db.exec(`SELECT ${key} FROM book_metadatas`)
        if(!records.length) return []
        records = records[0]
        return records.values.map(arr=>arr[0])
    }

    function sql(str){
        try{
            return toArray(db.exec(str))
        }catch(e){
            return []
        }
    }

    object.file = useFile
    object.close = close
    object.closeSync = closeSync
    object.sync = sync
    object.get = get
    object.set = set
    object.push = push
    object.remove = remove
    object.query = query
    object.attr = attr
    object.sql = sql
    object.load = load
    object.concat = concat
    return object
}

module.exports = DataBase