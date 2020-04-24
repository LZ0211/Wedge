const epub = require('../epub2')
const child_process = require('child_process')
const path = require("path")
const os = require('os')
const fs = require('fs')

function noop(){}
module.exports = function(book,fn){
    let platform = os.platform()
    let kindlegenPath = null
    if(platform.match(/^win/)){
        kindlegenPath = path.join(__dirname,"kimdlegen/win")
    }else if(platform.match(/darwin/)){
        kindlegenPath = path.join(__dirname,"kimdlegen/mac")
    }else if(platform.match(/linux/)){
        kindlegenPath = path.join(__dirname,"kimdlegen/linux")
    }else{
        throw new Error(`Kindlegen doesn't support ${platform} platform!`)
    }
    let kindlegen = path.join(kindlegenPath,'kindlegen')
    let local = os.tmpdir()
    let temp = path.join(local,'Wedge_'+book.meta.uuid+'.epub');
    epub(book,data=>{
        fs.writeFileSync(temp,data)
        child_process.exec(`${kindlegen} ${temp} -dont_append_source -verbose -c1 -o ${book.meta.uuid}`,()=>fs.readFile(`${local}/${book.meta.uuid}`,(err,data)=>fn(data)))
    })
}