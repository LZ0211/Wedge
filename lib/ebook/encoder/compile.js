"use strict";
function leftPad(str,padding,length){
    str = '' + str;
    if (str.length >= length){
        return str;
    }
    for (var i=str.length;i<length;i++){
        str = padding + str;
    }
    return str;
}

Date.prototype.formation = function(template){
	var day = template || "yyyy-MM-dd hh:mm:ss";
	var time = this;
    day = day.replace(/(y+)/,function ($,$1){
        return leftPad(time.getFullYear(),0,$1.length);
    });
    day = day.replace(/(M+)/,function ($,$1){
        return leftPad(time.getMonth() + 1,0,$1.length);
    });
    day = day.replace(/(d+)/,function ($,$1){
        return leftPad(time.getDate(),0,$1.length);
    });
    day = day.replace(/(h+)/,function ($,$1){
        return leftPad(time.getHours(),0,$1.length);
    });
    day = day.replace(/(m+)/,function ($,$1){
        return leftPad(time.getMinutes(),0,$1.length);
    });
    day = day.replace(/(s+)/,function ($,$1){
        return leftPad(time.getSeconds(),0,$1.length);
    });
    return day;
};

var templateSettings = {
	evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
	interpolate: /\{\{=([\s\S]+?)\}\}/g,
	encode:      /\{\{!([\s\S]+?)\}\}/g,
	conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
	iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
	varname:	"book",
};

function encodeHTMLSource() {
	var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
		matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
	return function(code) {
		return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
	};
}

function unescape(code) {
	return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
}

function template(tmpl) {
	var setting = templateSettings,
		cse = { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
		sid = 0,
		needhtmlencode, 
		indv;
	var str = "var encodeHTML = (" + encodeHTMLSource.toString() + "());var out='"
	str += (tmpl.replace(/'|\\/g, "\\$&")
		.replace(setting.interpolate, function(m, code) {
			return cse.start + unescape(code) + cse.end;
		})
		.replace(setting.encode, function(m, code) {
			needhtmlencode = true;
			return cse.startencode + unescape(code) + cse.end;
		})
		.replace(setting.conditional, function(m, elsecase, code) {
			return elsecase ?
				(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
				(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
		})
		.replace(setting.iterate, function(m, iterate, vname, iname) {
			if (!iterate) return "';} } out+='";
			sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
			return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
				+vname+"=arr"+sid+"["+indv+"+=1];out+='";
		})
		.replace(setting.evaluate, function(m, code) {
			return "';" + unescape(code) + "out+='";
		})
		+ "';return out;")
		.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
		.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");

	try {
		return new Function(setting.varname, str);
	} catch (e) {
		/* istanbul ignore else */
		if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
		throw e;
	}
}
var fs = require('fs');
module.exports = function(file){
	return template(fs.readFileSync(file).toString());
};