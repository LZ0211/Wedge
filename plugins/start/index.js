module.exports = function (){
    var Stack = [],thisOpt,app=this;
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
    function formatTime(date,template){
        var time = new Date(date)
        var day = template || "yyyy-MM-dd hh:mm:ss";
        day = day.replace(/(y+)/,function ($,$1){
            return leftPad(time.getFullYear(),0,$1.length)
        });
        day = day.replace(/(M+)/,function ($,$1){
            return leftPad(time.getMonth() + 1,0,$1.length)
        });
        day = day.replace(/(d+)/,function ($,$1){
            return leftPad(time.getDate(),0,$1.length)
        });
        day = day.replace(/(h+)/,function ($,$1){
            return leftPad(time.getHours(),0,$1.length)
        });
        day = day.replace(/(m+)/,function ($,$1){
            return leftPad(time.getMinutes(),0,$1.length)
        });
        day = day.replace(/(s+)/,function ($,$1){
            return leftPad(time.getSeconds(),0,$1.length)
        });
        return day;
    }
    function showmainOptions(){
        Select(mainOptions);
    }
    function goBack(){
        Select(Stack.pop() || mainOptions);
    }
    function refresh(){
        Select(thisOpt || mainOptions);
    }
    
    function multInput(arr,fn){
        app.prompt(['>'],input=>{
            if(input !== ''){
                arr.push(input);
                multInput(arr,fn);
            }else{
                return fn(arr);
            }
        });
    }
    
    function showDatabase(items){
        function center(str,length){
            var len = strLength(str);
            var sublen = length-len;
            var padding = sublen >> 1;
            return Array(padding).fill(' ').concat([str]).concat(Array(sublen-padding).fill(' ')).join('')
        }
        var titles = items.map(item=>item.title);
        var authors = items.map(item=>item.author);
        var maxTitleLength = Math.max.apply(Math,titles.map(strLength));
        var maxAuthorLength = Math.max.apply(Math,authors.map(strLength));
        var line = Array(84+maxTitleLength+maxAuthorLength).fill('-').join('');
        console.log(line);
        console.log(` ${center('书名',maxTitleLength)} | ${center('作者',maxAuthorLength)} |                 UUID                 | 小说类别 | 状态 |      更新时间      `);
        console.log(line);
        items.forEach(item=>{
            console.log(` ${center(item.title,maxTitleLength)} | ${center(item.author,maxAuthorLength)} | ${item.uuid} |${center(item.classes,10)}|${item.isend ? ' 完结 ' : ' 连载 '}| ${formatTime(item.date)} `);
        });
        console.log(line);
    }
    
    const returnOption = {
        text: '返回上一级',
        func: [[],goBack]
    };
    
    const mainOptions = [
        {
            text:'新建书籍',
            func:[['请输入下载链接：'],url=>app.end(refresh).newBook(url)]
        },{
            text:'更新书籍',
            func:[['请输入书籍ID：'],uuid=>app.end(refresh).updateBook(uuid)]
        },{
            text:'自动更新',
            func:[[],()=>app.end(refresh).updateAllBooks()]
        },{
            text:'批量添加书籍',
            func:[[],()=>multInput([],urls=>app.end(refresh).newBooks(urls))]
        },{
            text:'生成电子书',
            func:[['请输入书籍ID：'],uuid=>app.end(refresh).ebook(uuid)]
        },{
            text:'搜索书籍',
            func:[
                ['请输入关键词：'],name=>{
                    var items = app.database.filter(item=>(~item.title.indexOf(name) || ~item.author.indexOf(name) || ~item.classes.indexOf(name)));
                    if(items.length === 0){
                        console.log('数据库中未检索到相关书籍');
                        return refresh();
                    }
                    showDatabase(items);
                    refresh();
                }
            ]
        },{
            text:'发送到手机',
            options:[
                returnOption,{
                    text: '发送到iReader',
                    func:[[],()=>app.end(refresh).sendToiReader()]
                },{
                    text: '发送到QQ阅读',
                    func:[[],()=>app.end(refresh).sendToQQ()]
                }
            ]
        },{
            text:'使用引擎搜索',
            options:[
                returnOption,{
                    text: '百度baidu',
                    func: [
                        ['请输入关键词：'],keyword=>{
                            app.searchEngine.setEngine('baidu');
                            app.searchEngine.search(keyword,function(lists){
                                lists.forEach(list=>console.log(list));
                                refresh();
                            });
                        }
                    ]
                },{
                    text: '搜狗sogou',
                    func: [
                        ['请输入关键词：'],keyword=>{
                            app.searchEngine.setEngine('sogou');
                            app.searchEngine.search(keyword,function(lists){
                                lists.forEach(list=>console.log(list));
                                refresh();
                            });
                        }
                    ]
                },{
                    text: '360搜索',
                    func: [
                        ['请输入关键词：'],keyword=>{
                            app.searchEngine.setEngine('360');
                            app.searchEngine.search(keyword,function(lists){
                                lists.forEach(list=>console.log(list));
                                refresh();
                            });
                        }
                    ]
                },{
                    text: '必应bing',
                    func: [
                        ['请输入关键词：'],keyword=>{
                            app.searchEngine.setEngine('bing');
                            app.searchEngine.search(keyword,function(lists){
                                lists.forEach(list=>console.log(list));
                                refresh();
                            });
                        }
                    ]
                },{
                    text: '站内搜索',
                    func: [
                        ['请输入关键词：'],keyword=>{
                            app.searchEngine.setEngine('xxx');
                            app.searchEngine.search(keyword,function(lists){
                                lists.forEach(list=>console.log(list));
                                refresh();
                            });
                        }
                    ]
                },
            ]
        },{
            text:'修改配置',
            func:[["请输入配置的参数名：","请输入配置的参数值"],(key,value)=>{
                    var convert = {
                        'boolean': Boolean,
                        'string': String,
                        'number': Number,
                    }
                    var origin = app.config.get(key);
                    if(origin == null) return Select(options);
                    console.log(`原始${key}参数的配置为${origin}`);
                    app.config.set(key,convert[typeof origin](value));
                    console.log(`当前${key}参数的配置为${app.config.get(key)}`);
                    Select(options);
                }
            ]
        },{
            text:'数据库检索',
            func:[['请输入查询字符串：'],string=>{
                    console.log(app.database.query(string));
                    refresh();
                }
            ]
        },{
            text:'退出',
            func:[[],()=>process.exit()]
        }
    ]
    
    function Select(options){
        thisOpt = options;
        var text =  options.map((item,index)=>`  ${index}) ${item.text}`).join('\n')
        app.prompt([`请选择功能\n${text}\n`],function(index){
            index = index || 0;
            index = Number(index);
            if(isNaN(index) || index >= options.length){
                console.log('指令错误，请重新选择...');
                return Select(options);
            }
            var item = options[index];
            if(item.options){
                Stack.push(options);
                return Select(item.options);
            }
            var func = item.func;
            return app.prompt.apply(app,func);
        });
    }
    this.start =showmainOptions;
}