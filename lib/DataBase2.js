"use strict";
const querystring = require('querystring')
const sqlite3 = require('sqlite3').verbose()

const sqlstr = 'CREATE TABLE IF NOT EXISTS book_metadatas (uuid CHARACTER(36) PRIMARY KEY,title VARCHAR(255),author VARCHAR(255),classes VARCHAR(255),source VARCHAR(255),origin VARCHAR(255),isend INTEGER,date INTEGER,brief TEXT);';

function queryStr(string){
    let query = querystring.parse(string);
    function toRule(k,v){
        if(v=='') return '';
        if(v==='null') return `${k}=NULL`;
        if(v=='true') return `${k}=1`;
        if(v=='false') return `${k}=0`;
        if(/^\d+$/.test(v)) return `${k}=${v}`;
        if(Array.isArray(v)) return `(${v.map(vv=>toRule(k,vv)).filter(x=>!!x).join(' OR ')})`;
        return `${k}='${v}'`;
    }
    let condition = Object.keys(query).map(k=>toRule(k,query[k])).filter(x=>!!x).join(' AND ')
    if(condition) return ' WHERE ' + condition
    return ''
}
function DataBase(file,callback){
    return new Promise(function(resolve,reject){
        let db = new sqlite3.Database(file,function(err){
            if(err) return reject(err)
            db.run(sqlstr,function(err){
                if(err) return reject(err)
                return resolve({
                    get:function (uuid){
                        return new Promise(function(resolve,reject){
                            db.get('SELECT * FROM book_metadatas WHERE uuid = ?',uuid,function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    set:function(uuid,data){
                        return new Promise(function(resolve,reject){
                            db.run('UPDATE book_metadatas SET title = $title, author = $author, classes = $classes, source = $source, origin = $origin, isend = $isend, date = $date, brief = $brief WHERE uuid = $uuid',{
                                $uuid: uuid,
                                $title: data.title,
                                $author: data.author,
                                $classes: data.classes,
                                $source: data.source,
                                $origin: data.origin,
                                $isend: data.isend ? 1:0,
                                $date: Date.now(),
                                $brief: data.brief
                            },function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    insert:function(data){
                        return new Promise(function(resolve,reject){
                            db.run('INSERT INTO book_metadatas (uuid,title,author,classes,source,origin,isend,date,brief) VALUES ($uuid,$title,$author,$classes,$source,$origin,$isend,$date,$brief)',{
                                $uuid: data.uuid,
                                $title: data.title,
                                $author: data.author,
                                $classes: data.classes,
                                $source: data.source,
                                $origin: data.origin,
                                $isend: data.isend ? 1:0,
                                $date: Date.now(),
                                $brief: data.brief
                            },function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    push:function(data){
                        return this.get(data.uuid).then(found=>{
                            if(!found){
                                return this.insert(data)
                            }else{
                                return this.set(data.uuid,data)
                            }
                        })
                    },
                    sql:function(str){
                        return new Promise(function(resolve,reject){
                            db.run(str,function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    remove:function(uuid){
                        return new Promise(function(resolve,reject){
                            db.run('DELETE FROM book_metadatas WHERE uuid = ?',uuid,function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    query:function(rule){
                        return new Promise(function(resolve,reject){
                            db.all('SELECT * FROM book_metadatas' + queryStr(rule),function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    },
                    attr:function(key){
                        return new Promise(function(resolve,reject){
                            db.all(`SELECT ${key} FROM book_metadatas`,function(err,data){
                                if(err) return reject(err)
                                return resolve(data.map(x=>x[key]))
                            })
                        })
                    },
                    close:function(){
                        return new Promise(function(resolve,reject){
                            db.close(function(err,data){
                                if(err) return reject(err)
                                return resolve(data)
                            })
                        })
                    }
                })
            })
        })
    })
}

module.exports = DataBase