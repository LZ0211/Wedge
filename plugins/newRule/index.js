module.exports = function(){
	var URL = this.lib.URL,
	    fs = this.lib.fs,
	    Path = this.lib.Path,
	    dirname = Path.resolve(__dirname,'../../lib/Sites/plugins/');
	this.newRule = function(){
		var createIndex = ()=>{
			var hostname,charset;
			this.Thread.series([
				next=>this.prompt(["请输入网址："],url=>{
					var parsed = URL.parse(url);
					hostname = parsed.hostname;
					return next();
				}),
				next=>this.prompt(["请输入网站编码："],_charset=>{
					charset = _charset;
					return next();
				}),
				next=>{
					var dirname = Path.join(dirname,hostname);
					fs.mkdirsSync(dirname);
					var domain = hostname.replace('www','');
					var script = 
					'module.exports = {\n' + 
					'    "host": "'+hostname+'",\n' +
					'    "match": [\n' +
					'        "'+domain+'"\n' +
					'    ],\n' +
					'    "charset": "'+charset+'",\n' +
					'    "selector":require("./selector"),\n'+
					'    "replacer":require("./replacer")\n'+
					'}';
					fs.writeFileSync(Path.join(dirname,'index.js'),script);
					return next();
				}
			]);
			
		}
	}
}