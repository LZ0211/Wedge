const compile = require('../compile')
const html = require("../html")
const child_process = require('child_process')
const fs = require("fs")
const path = require("path")
const os = require('os')
    
const convert = {
    opf: compile(__dirname+'/template.opf'),
    ncx: compile(__dirname+'/template.ncx')
}

function makedirsSync(dir){
    if (fs.existsSync(dir)) return;
    var dirname = path.dirname(dir);
    fs.existsSync(dirname) || makedirsSync(dirname);
    fs.mkdirSync(dir);
}

function removedirsSync(root){
    if (!fs.existsSync(root)) return;
    var filestat = fs.statSync(root);
    if (filestat.isDirectory() == true){
        var files = fs.readdirSync(root);
        files.forEach(function (file){
            removedirsSync(path.join(root,file));
        });
        fs.rmdirSync(root);
    }else {
        fs.unlinkSync(root);
    }
}
function noop(){}
module.exports = function(book,fn){
    let platform = os.platform()
    let kindlegenPath = null
    if(platform.match(/^win/)){
        kindlegenPath = path.join(__dirname,"../kimdlegen/win")
    }else if(platform.match(/darwin/)){
        kindlegenPath = path.join(__dirname,"../kimdlegen/mac")
    }else if(platform.match(/linux/)){
        kindlegenPath = path.join(__dirname,"../kimdlegen/linux")
    }else{
        throw new Error(`Kindlegen doesn't support ${platform} platform!`)
    }
    let kindlegen = path.join(kindlegenPath,'kindlegen')
    let local = os.tmpdir()
    let temp = path.join(local,'Wedge_'+Math.random().toString(16).slice(2)+'.tmp');
    makedirsSync(temp+'/css');
    makedirsSync(temp+'/images');
    fs.writeFileSync(`${temp}/content.opf`,convert.opf(book));
    fs.writeFileSync(`${temp}/toc.ncx`,convert.ncx(book));
    html(book,files=>{
        fs.writeFileSync(`${temp}/coverpage.html`,files.get('coverpage.html'));
        fs.writeFileSync(`${temp}/css/style.css`,files.get('css/style.css'));
        fs.writeFileSync(`${temp}/images/cover.jpg`, Buffer.from(files.get('images/cover.jpg'),'base64'));
        book.list.forEach(chapter=>fs.writeFileSync(`${temp}/${chapter.id}.html`,files.get(`${chapter.id}.html`)));
        child_process.exec(`${kindlegen} ${temp}/content.opf -dont_append_source -verbose -c1 -o kindle`,(err,stdout, stderr)=>{
            fs.readFile(`${temp}/kindle`,(err,data)=>{
                if(err){
                    fn()
                }else{
                    fn(data)
                }
                removedirsSync(temp);
            })
        })
    })   
}