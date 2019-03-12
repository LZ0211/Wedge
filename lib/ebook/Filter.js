function and(f1,f2){
    return function(){
        return f1.apply(null,arguments) && f2.apply(null,arguments);
    };
}

function or(f1,f2){
    return function(){
        return f1.apply(null,arguments) || f2.apply(null,arguments);
    };
}

function not(fn){
    return function(){
        return !fn.apply(null,arguments);
    };
}

function True(){
    return true;
}

function toFunction(str){
    var arr = str.split(':');
    var key = arr[0];
    var func = arr[1];
    var error = new Error('invalid rule');
    if(!~['title','content','id','index','date','length'].indexOf(key)){
        throw error;
    }
    if(func[0] === '~') return not(toFunction(key+':'+func.slice(1)));
    var compiled,found;
    var isReg = /^\[\[(.*)\]\]$/;
    var isStr = /^\[(.*)\]$/;
    var isNumber = /^(\{|<)(.*),(.*)(\}|>)$/;
    if(~['title','content','id'].indexOf(key)){
        if(found=func.match(isReg)){
            var regexp = new RegExp(found[1],'gi');
            return function(chapter){
                return regexp.test(chapter[key]);
            }
        }else if(found=func.match(isStr)){
            var str = found[1];
            return function(chapter){
                return str === chapter[key];
            };
        }else{
            throw error;
        }
    }else{
        if(found=func.match(isNumber)){
            var lower = Number(found[2] || -Infinity);
            var upper = Number(found[3] || Infinity);
            var funcs ={
                '{':function(chapter){return chapter[key] >= lower},
                '<':function(chapter){return chapter[key] > lower},
                '>':function(chapter){return chapter[key] < upper},
                '}':function(chapter){return chapter[key] <= upper}
            };
            if(isNaN(lower) || isNaN(upper)){
                throw error;
            }
            return and(funcs[found[1]],funcs[found[4]])
        }else{
            throw error;
        }
    }
}

function Tree(){
    this.left = null;
    this.right = null;
    this.operation = null;
}

function token(rule){
    if(typeof rule == 'undefined' || rule == undefined) return ()=>true
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
    if(!tree) return True;
    if(typeof tree === 'string') return toFunction(tree)
    if(!tree.operation){
        return compile(tree.left || tree.right);
    }else{
        return logics[tree.operation](compile(tree.left),compile(tree.right));
    }
}

module.exports = token;