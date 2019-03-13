const fs = require("fs");
const encoder = require('./encoder');

process.on("message",options=>{
    var formation = options.formation;
    var filename = options.filename;
    encode = encoder[formation];
    if(!encode) return process.send({code:1},process.exit);
    try{
        fs.readFile(filename,(err,buffer)=>{
            if(err) return process.send({code:1},process.exit);
            encoder.unwbk(buffer,book=>encode(book,data=>fs.writeFile(filename.replace('.wbk','.'+formation),data,err=>{
                if(err) return process.send({code:1},process.exit);
                return process.send({code:0},process.exit);
            })));
        });
    }catch(e){
        console.log(e)
        return process.send({code:1},process.exit);
    }
})