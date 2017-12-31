const SQL = require('../../../sql')

function convert(data){
    if(null == data) return 'NULL';
    if(true === data) return 1;
    if(false === data) return 0;
    if('string' == typeof data) return `'${data}'`;
    return `${data}`;
}

module.exports = function (book,fn){
	var db = new SQL.Database();
	db.run(`CREATE TABLE meta (uuid CHARACTER(36) PRIMARY KEY,title VARCHAR(255),author VARCHAR(255),classes VARCHAR(255),source VARCHAR(255),origin VARCHAR(255),isend INTEGER,date INTEGER,brief TEXT,cover TEXT);`);
	db.run(`CREATE TABLE list (id VARCHAR(18) PRIMARY KEY,title VARCHAR(255),source VARCHAR(255),date INTEGER,content TEXT);`);
	db.run(`INSERT INTO meta (${Object.keys(book.meta).join(',')}) VALUES (${Object.keys(book.meta).map(k=>convert(book.meta[k])).join(', ')});`);
	book.list.forEach(chapter=>{
		db.run(`INSERT INTO list (${Object.keys(chapter).join(',')}) VALUES (${Object.keys(chapter).map(k=>convert(chapter[k])).join(', ')});`);
	});
    fn(Buffer.from(db.export()));
};