function isSBCcase(str){
    return !str.charAt(0).match(/[\u0000-\u00ff]/i)
}

function strLength(str){
    var length = 0;
    for (var i = 0; i < str.length; i++){
        length += isSBCcase(str[i]) ? 2 : 1;
    }
    return length;
}

function chars(char,length){
	var str = '';
	for(var i=0;i<length;i++){
		str += char;
	}
	return str;
}

function cutOff(str,length){
	str = str.substr(0,str.length-2);
	var strLen = strLength(str);
	while(strLen+3>length){
		str = str.substr(0,str.length-2);
		strLen = strLength(str);
	}
	return str + chars('.',length-strLen);
}

function leftPad(str,length){
	var strLen = strLength(str);
	if(length == strLen) return str;
	if(length > strLen) return str + chars(' ',length-strLen);
	return cutOff(str,length);
}

function center(str,length){
	var strLen = strLength(str);
	if(length == strLen) return str;
	if(length > strLen) return chars(' ',Math.floor(length/2-strLen/2)) + str + chars(' ',Math.ceil(length/2-strLen/2));
	return cutOff(str,length);
}

function Object2Array(object){
	var array = [];
	for(var x in object){
		array.push(object[x]);
	}
	return array;
}

function showDataBase(array){
	if(array.length == 0) return;
	var keys = Object.keys(array[0]),
		table = {},ceil,maxLen = {};
	maxLen['#'] = strLength(array.length+1+'');
	keys.forEach(key=>table[key]=[key]);
	array.forEach(item=>keys.forEach(key=>table[key].push(item[key])));
	keys.forEach(key=>maxLen[key]=Math.min(36,Math.max.apply(Math,table[key].map(strLength))));
	ceils = Object2Array(maxLen).map(number=>chars('-',number));
	table = [];
	table.push(ceils.join('---'));
	table.push(['#'].concat(keys).map(str=>leftPad(str,maxLen[str])).join(' | '));
	table.push(ceils.join('-+-'));
	array.forEach((item,index)=>{
		var array = [leftPad(index+1+'',maxLen['#'])];
		for(var x in item){
			array.push(leftPad(item[x],maxLen[x]));
		}
		table.push(array.join(' | '));
	});
	table.push(ceils.join('---'));
	table.forEach(line=>console.log(line));
}

module.exports = showDataBase;