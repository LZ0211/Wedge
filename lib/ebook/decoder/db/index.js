const SQL = require('../../../sql')


function toArray(db){
    db = db && db[0];
    if(!db) return [];
    let keys = db.columns;
    return db.values.map(values=>{
        let record = {};
        values.forEach((value,index)=>{
            record[keys[index]] = values[index];
        });
        return record;
    });
}

module.exports = function (buffer,fn){
	var db = new SQL.Database(buffer);
	var book = {meta:{},list:[]};
	book.meta = toArray(db.exec(`SELECT * FROM meta`))[0];
    book.meta.isend = !!book.meta.isend;
    book.list = toArray(db.exec(`SELECT * FROM list`));
    fn(book);
};