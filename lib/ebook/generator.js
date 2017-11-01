"use strict";
var fs = require("fs");
var path = require("path");
var Book = require('../Book');
var Ebk = require('./index');

function and(f1,f2){
    return function(){
        return f1.apply(null,arguments) && f2.apply(null,arguments)
    }
}

function or(f1,f2){
    return function(){
        return f1.apply(null,arguments) || f2.apply(null,arguments)
    }
}

function not(fn){
    return function(){
        return !fn.apply(null,arguments)
    }
}

function True(){
    return true;
}

var MAX_LEN = 1000;

function toFunction(str){
    var arr = str.split(':');
    var key = arr[0];
    var func = arr[1];
    var error = new Error('invalid rule');
    if(!~['title','content','id','index','date','length'].indexOf(key)){
        throw error;
    }
    if(func[0] === '~') return not(toFunction(key+':'+func.slice(1)))
    var compiled,found;
    var isReg = /^\[\[(.*)\]\]$/;
    var isStr = /^\[(.*)\]$/;
    var isNumber = /^(\{|<)(.*),(.*)(\}|>)$/;
    if(~['title','content','id'].indexOf(key)){
        if(found=func.match(isReg)){
            var regexp = new RegExp(found[1],'gi');
            return function(chapter){
                return regexp.test(chapter[key])
            }
        }else if(found=func.match(isStr)){
            var str = found[1];
            return function(chapter){
                return str === chapter[key]
            }
        }else{
            throw error
        }
    }else if(~['length','date'].indexOf(key)){
        if(found=func.match(isNumber)){
            var lower = Number(found[2] || -Infinity)
            var upper = Number(found[3] || Infinity)
            var funcs ={
                '{':function(chapter){return chapter[key] >= lower},
                '<':function(chapter){return chapter[key] > lower},
                '>':function(chapter){return chapter[key] < upper},
                '}':function(chapter){return chapter[key] <= upper}
            }
            if(isNaN(lower) || isNaN(upper)){
                throw error
            }
            return and(funcs[found[1]],funcs[found[4]])
        }else{
            throw error
        }
    }else{
        if(found=func.match(isNumber)){
            var lower = Number(found[2] || 0)
            var upper = Number(found[3] || MAX_LEN)
            if(isNaN(lower) || isNaN(upper)){
                throw error
            }
            if(lower < 0){
                lower = lower%MAX_LEN + MAX_LEN
            }
            if(upper < 0){
                upper = upper%MAX_LEN + MAX_LEN
            }
            console.log(lower,upper)
            var funcs ={
                '{':function(chapter){return chapter[key] >= lower},
                '<':function(chapter){return chapter[key] > lower},
                '>':function(chapter){return chapter[key] < upper},
                '}':function(chapter){return chapter[key] <= upper}
            }
            return and(funcs[found[1]],funcs[found[4]])
        }else{
            throw error
        }
    }
}

function Tree(){
    this.left = null
    this.right = null
    this.operation = null
}

function token(rule){
    var len=rule.length,
    tree = new Tree,
    stack = [],
    funcstr = '',
    char,
    idx
    function lastLevel(){
        tree = stack.pop()
    }
    function nextLevel(){
        tree.next = new Tree()
        stack.push(tree)
        tree = tree.next
    }
    for(idx=0; idx<len; idx++){
        char = rule[idx]
        if(char === '('){
            nextLevel()
        }else if(char === ')'){
            tree.right = funcstr
            funcstr = ''
            lastLevel()
            if(!tree.left){
                tree.left = tree.next
            }else{
                tree.right - tree.next
            }
            delete tree.next
        }else if(char === '&'){
            if(funcstr && !tree.left){
                tree.left = funcstr
                funcstr = ''
            }
            tree.operation = 'and'
        }else if(char === '|'){
            if(funcstr && !tree.left){
                tree.left = funcstr
                funcstr = ''
            }
            tree.operation = 'or'
        }else{
            funcstr += char
        }
    }
    if(stack.length){
        throw new Error('invalid rule')
    }
    tree.right = funcstr
    return compile(tree)
}

function compile(tree){
    var logics = {
        'and':and,
        'or':or
    }
    if(!tree) return True
    if(typeof tree === 'string') return toFunction(tree)
    if(!tree.operation){
        return compile(tree.left || tree.right)
    }else{
        return logics[tree.operation](compile(tree.left),compile(tree.right))
    }
}
module.exports = function (msg){
    var directory = msg.directory;
    var formation = msg.formation;
    var bookdir = msg.bookdir;
    var book = new Book(bookdir);
    book.loadChapterContent(function (){
        book.sortBy('id');
        var bookData = book.valueOf();
        MAX_LEN = bookData.list.length;
        bookData.list.forEach(function(chapter,index){
            chapter.index = index;
            chapter.length = chapter.content.length;
        })
        if(msg.filter){
            bookData.list = bookData.list.filter(token(msg.filter))
        }
        if (!bookData.meta.title) return process.exit();
        var filename = bookData.meta.author + " - " + bookData.meta.title + "." + formation;
        var filedir = path.join(directory,filename);
        var generator = Ebk[formation];
        generator(bookData,function (data){
            fs.writeFile(filedir,data,function (err){
                if (err){
                    process.send({msg:"fail"});
                }else {
                    process.send({msg:"success"});
                }
                process.exit();
            });
        });
    });
};

/*module.exports({
    directory:'E:\\MyBooks\\Library\\ebook',
    formation:'epub',
    bookdir:'E:\\MyBooks\\Library\\books\\fd987fa3-9a1a-fe00-1498-3e5514b121c7'
});*/


process.on("message",module.exports);