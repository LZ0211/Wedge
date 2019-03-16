function parse(str){
    let stack = [];
    let tree = [];
    let arr = str.split('');
    let isStr = false;
    let isRange = false;
    let key = '';
    let func = '';
    let range = [];
    let error = new Error('invalid rule');
    while(arr.length){
        let char = arr.shift();
        if(isStr){
            if(char === '\\'){
                let next = arr.shift();
                func += char;
                func += next;
            }else if(char === '/'){
                tree.push(`chapter.${key}.match(new RegExp("${func.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}","i"))`);
                key = "";
                func = "";
                isStr = false;
            }else{
                func += char;
            }
            continue;
        }
        if(isRange){
            if(char === ' '){
                //no nothing
            }else if(char === ','){
                range.push(func)
                func = ''
            }else if(char == '>'){
                range.push(func)
                if(range.length >2) throw error;
                if(range.length === 1){
                    let x = range[0];
                    if(!x){
                        tree.push('true');
                    }else if(!x.match(/^[-+]?\d+\.?\d*$/) && !x.match(/^[-+]?\d*\.\d+$/)){
                        throw error;
                    }else{
                        tree.push(`${x} == chapter.${key}`);
                    }
                }else{
                    let x = range[0];
                    let y = range[1];
                    if(!x){
                        x='-Infinity';
                    }else if(!x.match(/^[-+]?\d+\.?\d*$/) && !x.match(/^[-+]?\d*\.\d+$/)){
                        throw error;
                    }
                    if(!y){
                        y='Infinity';
                    }else if(!y.match(/^[-+]?\d+\.?\d*$/) && !y.match(/^[-+]?\d*\.\d+$/)){
                        throw error;
                    }
                    tree.push(`${x} < chapter.${key} && chapter.${key} > ${y}`);
                }
                key = "";
                func = "";
                range = [];
                isRange = false;
            }else{
                func += char;
            }
            continue;
        }
        if(char === '('){
            if(key){
                if(key === '&'){
                    tree.push('&&');
                    key = '';
                }else if(key === '|'){
                    tree.push('||');
                    key = '';
                }else if(key === '~'){
                    tree.push('!');
                    key = '';
                }else{
                    throw error;
                }
            }
            let temp = [];
            stack.push(tree);
            tree.push(temp);
            tree = temp;
            continue;
        }
        if(char === ')'){
            if(key || func) throw error;
            tree = stack.pop();
            continue;
        }
        if(char === ' '){
            if(key){
                if(key === '&'){
                    tree.push('&&');
                    key = '';
                }else if(key === '|'){
                    tree.push('||');
                    key = '';
                }else if(key === '~'){
                    tree.push('!');
                    key = '';
                }else{
                    throw error;
                }
            }
            continue;
        }
        if(char === ':'){
            if(!~['title','content','id','index','date','content.length','title.length','id.length'].indexOf(key)){
                throw error
            }
            let next = arr.shift();
            while(next === ' '){
                next = arr.shift();
            }
            if(next === '/'){
                if(!~['title','content','id'].indexOf(key)) throw error;
                isStr = true;
                isRange = false;
            }else if(next === '<'){
                if(!~['index','date','content.length','title.length','id.length'].indexOf(key)) throw error;
                isRange = true;
                isStr = false;
            }else{
                throw error;
            }
            continue;
        }
        if(char === '\\'){//转义符
            let next = arr.shift();
            func += char;
            key +=  next;
            continue;
        }
        if(char === '~'){
            if(!key && !func){
                tree.push('!');
                continue;
            }
            throw error
        }
        key += char;
    }
    if(stack.length) throw error

    function toFunc(tree){
        let str = ''
        let isExpr = false;
        for(let i=0;i<tree.length;i++){
            let func = tree[i];
            if(func === '&&' || func === '||'){
                if(!isExpr) throw error;
            }
            if(Array.isArray(func)){
                str += '(' + toFunc(func) + ')';
                isExpr = true;
            }else if(func === 'true' || func === 'false'){
                str += func
                isExpr = true;
            }else if(func !== '&&' && func !== '||' && func !== '!'){
                str += '(' + func + ')';
                isExpr = true;
            }else if(func === '!'){
                str += func;
                isExpr = false;
            }else{
                str += ' ' + func + ' ';
                isExpr = false;
            }
        }
        str = str.replace(/^!true/g,'false')
        .replace(/^!false/g,'true')
        .replace(/true && /gi,'')
        .replace(/false \|\| /g,'')
        .replace(/false && .*/g,'false')
        .replace(/true \|\| .*/g,'true')
        return str;
    }
    return new Function('chapter',`return ${toFunc(tree)}`);
}

module.exports = parse