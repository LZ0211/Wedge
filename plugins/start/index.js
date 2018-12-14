var _showDatabase = require('./showDatabase');
module.exports = function (){
    var Stack = [],thisOpt,app=this;
    
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
    function unqiueArray(arr){
        var log = {};
        var _arr = [];
        arr.forEach(v=>{
            if(v in log) return;
            _arr.push(v);
            log[v] = true;
        });
        return _arr;
    }
    function showmainOptions(){
        Stack = [];
        Select(mainOptions);
    }
    function goBack(){
        Select(Stack.pop() || mainOptions);
    }
    function refresh(){
        Select(thisOpt || mainOptions);
    }
    
    function multInput(fn){
        return function(){
            var rl = app.lib.readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.setPrompt('>');
            rl.prompt();
            var args = [];
            rl.on('line',input=>{
                input = input.trim();
                if(input !== ''){
                    args.push(input);
                    rl.prompt()
                }else{
                    rl.close();
                    return fn(args)
                }
            });
        }
    }
    
    function showDatabase(items){
        var keys = app.config.get('database.showkeys') || ['uuid','title','author','classes','isend','date'];
        items = items.map(item=>{
            item.date = formatTime(item.date);
            item.isend = ''+item.isend;
            item.brief = item.brief.replace(/\s/g,' ');
            var newItem = {};
            keys.forEach(key=>{
                newItem[key] = item[key];
            });
            return newItem;
        });
        _showDatabase(items);
        refresh();
    }

    function showDetail(items){
        items.forEach(item=>{
            console.log(`【书名】${item.title}\n【作者】${item.author}\n【类别】${item.classes}\n【唯一码】${item.uuid}\n【完结】${!!item.isend}\n【更新时间】${formatTime(item.date)}\n【官网】${item.origin}\n【来源】${item.source}\n【简介】${item.brief}`);
            console.log('---------------------------------------------------------------------------');
        });
        refresh();
    }

    function showDatabaseOptions(items){
        if(items.length === 0){
            console.log('数据库中未检索到相关书籍');
            return refresh();
        }
        function output(key){
            return function(){
                console.log(unqiueArray(items.map(item=>item[key])).join('\n'));
                refresh();
            }
        }
        var subOptions = [
            returnOption,
            main,
            {text:'显示表格',func:[[],()=>showDatabase(items)]},
            {text:'显示详情',func:[[],()=>showDetail(items)]},
            {text:'过滤数据',func:[
                ['请输入过滤条件：'],
                str=>{
                    var regexp = /^(title|author|classes|brief|isend|date|uuid|source|origin)(\.match\(('.*'|".*"|\/.*\/)\)|(>=|==|===|<=|<|>|!=|!==)(\d|true|false|'.*'|".*"))/
                    if(regexp.test(str) == false){
                        console.log('输入错误...');
                        console.log('过滤规则为[<key>(==|>=|<=|match)<value>]');
                        return refresh();
                    }
                    try{
                        var func = new Function('item','return item.'+str);
                        items = items.filter(func);
                    }catch(e){
                    }
                    refresh();
                }
            ]},
            {text:'导出数据',options:[
                returnOption,
                main,
                {text:'导出书名',func:[[],output('title')]},
                {text:'导出作者',func:[[],output('author')]},
                {text:'导出ID',func:[[],output('uuid')]},
                {text:'导出类别',func:[[],output('classes')]},
                {text:'导出链接',func:[[],output('source')]},
                exit
            ]},
            {
                text:'批量操作',
                options:[
                    returnOption,
                    main,
                    {text:'更新书籍',func:[[],()=>app.updateBooks(items.map(item=>item.uuid))]},
                    {text:'刷新书籍信息',func:[[],()=>app.refreshBooks(items.map(item=>item.uuid))]},
                    {text:'重新下载书籍',func:[[],()=>app.reDownloadBooks(items.map(item=>item.uuid))]},
                    {text:'导出书籍',func:[[],()=>app.outportBooks(items.map(item=>item.uuid))]},
                    {text:'生成电子书',func:[[],()=>app.ebooks(items.map(item=>item.uuid))]},
                    {text:'删除书籍',func:[[],()=>app.deleteBooks(items.map(item=>item.uuid))]},
                    {text:'删除书籍记录',func:[[],()=>app.removeBookRecords(items.map(item=>item.uuid))]},
                    exit
                ]
            },exit
        ];
        Stack.push(thisOpt);
        Select(subOptions);
    }
    
    const returnOption = {
        text: '返回上一级菜单',
        func: [[],goBack]
    };

    const main = {
        text: '返回主菜单',
        func: [[],showmainOptions]
    }

    const exit = {
        text:'退出',
        options:[
            main,
            returnOption,
            {text:'确定退出',func:[[],()=>process.exit()]}
        ]
    }
    
    const mainOptions = [
        {   text:'返回',func: [[],goBack]},
        {
            text:'新建书籍',
            func:[['请输入下载链接：'],url=>app.newBook(url)]
        },{
            text:'更新书籍',
            func:[['请输入书籍ID：'],uuid=>app.updateBook(uuid)]
        },{
            text:'重新下载书籍',
            func:[['请输入书籍ID：'],uuid=>app.reDownloadBook(uuid)]
        },{
            text:'刷新书籍信息',
            func:[['请输入书籍ID：'],uuid=>app.refreshBook(uuid)]
        },{
            text:'生成电子书',
            func:[['请输入书籍ID：'],uuid=>app.ebook(uuid)]
        },{
            text:'导入书籍',
            func:[['拖拽wbk文件到窗口：'],file=>app.importWBK(file.trim().replace(/(^"|"$)/gi,'').replace(/\\( |\[|\])/gi,'$1'))]
        },{
            text:'导出书籍',
            func:[['请输入书籍ID：'],uuid=>app.outportBook(uuid)]
        },{
            text:'删除书籍',
            func:[['请输入书籍ID：'],uuid=>app.deleteBook(uuid)]
        },{
            text:'删除书籍记录',
            func:[['请输入书籍ID：'],uuid=>app.removeBookRecord(uuid)]
        },{
            text:'导入书籍记录',
            func:[['请输入书籍ID：'],uuid=>app.importBookRecord(uuid)]
        },{
            text:'修改书籍信息',
            func:[['请输入书籍ID：'],uuid=>{
                if (!app.lib.fs.existsSync(uuid)){
                    console.log('书籍不存在...')
                    return refresh();
                }
                function SelectOptions(next){
                    Select([
                        returnOption,
                        {text:'保存并退出',func:[[],next]},
                        {
                            text:`书名:${app.book.getMeta('title')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('title',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`作者:${app.book.getMeta('author')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('author',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`类别:${app.book.getMeta('classes')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('classes',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`书源:${app.book.getMeta('source')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('source',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`官网:${app.book.getMeta('origin')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('origin',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`完结:${app.book.getMeta('isend')}`,
                            func:[['>'],val=>{
                                app.book.setMeta('isend',val);
                                SelectOptions(next)
                            }]
                        },{
                            text:`简介:${app.book.getMeta('brief')}`,
                            func:[[],multInput(lines=>{
                                var val = lines.join('\n')
                                app.book.setMeta('brief',val);
                                SelectOptions(next)
                            })]
                        }
                    ])
                }
                function rename(next){
                    if(uuid !== app.book.getMeta('uuid')){
                        app.database.remove(uuid);
                        app.lib.fs.rmdirsSync(app.book.getMeta('uuid'));
                        app.lib.fs.renameSync(uuid, app.book.getMeta('uuid'));
                    }
                    next()
                }
                app.CMD('loadBook',[
                SelectOptions,
                next=>app.sendToDataBase(next),
                next=>app.saveBook(next),
                rename,
                goBack])(uuid)}
            ]
        },{
            text:'批量操作',
            options:[returnOption,{
                text:'新建书籍',
                func:[[],multInput(urls=>app.newBooks(urls))]
            },{
                text:'更新书籍',
                func:[[],multInput(uuids=>app.updateBooks(uuids))]
            },{
                text:'重新下载书籍',
                func:[[],multInput(uuids=>app.reDownloadBooks(uuids))]
            },{
                text:'刷新书籍信息',
                func:[[],multInput(uuids=>app.refreshBooks(uuids))]
            },{
                text:'导入书籍',
                func:[[],multInput(files=>app.Thread().use((file,next)=>app.spawn().end(next).importWBK(file.trim().replace(/(^"|"$)/gi,'').replace(/\\( |\[|\])/gi,'$1'))).queue(files).start())]
            },{
                text:'导出书籍',
                func:[[],multInput(uuids=>app.outportBooks(uuids))]
            },{
                text:'生成电子书',
                func:[[],multInput(uuids=>app.ebooks(uuids))]
            },{
                text:'转换电子书',
                func:[[],multInput(uuids=>app.convertEbooks(uuids.map(uuid=>uuid.trim().replace(/(^"|"$)/gi,'').replace(/\\( |\[|\])/gi,'$1'))))]
            },{
                text:'删除书籍',
                func:[[],multInput(uuids=>app.deleteBooks(uuids))]
            },{
                text:'删除书籍记录',
                func:[[],multInput(uuids=>app.removeBookRecords(uuids))]
            },{
                text:'导入书籍记录',
                func:[[],multInput(uuids=>app.importBookRecords(uuids))]
            },exit]
        },{
            text:'数据库检索',
            options:[
                returnOption,
                {text:'关键字检索',func:[['请输入关键词：'],name=>{
                    var items = app.database.query().filter(item=>(~item.title.indexOf(name) || ~item.author.indexOf(name) || ~item.classes.indexOf(name)));
                    showDatabaseOptions(items);
                }]},
                {text:'query查询',func:[['请输入查询字符串：'],string=>{
                    var items = app.database.query(string);
                    showDatabaseOptions(items);
                }]},
                {text:'SQL查询',func:[['请输入SQL：'],string=>{
                    var items = app.database.sql(string);
                    showDatabaseOptions(items);
                }]},exit
            ]
        },{
            text:'电子书格式转换',
            func: [['拖拽wbk文件到窗口：'],file=>app.convertEbook(file.trim().replace(/(^"|"$)/gi,'').replace(/\\( |\[|\])/gi,'$1'))]
        },{
            text:'发送到手机[需在同一局域网下]',
            options:[
                returnOption,{
                    text: '发送到iReader',
                    func:[[],()=>app.sendToiReader()]
                },{
                    text: '发送到QQ阅读',
                    func:[[],()=>app.sendToQQ()]
                },exit
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
                },exit
            ]
        },{
            text:'修改配置',
            func:[["请输入配置的参数名：","请输入配置的参数值"],(key,value)=>{
                    var origin = app.config.get(key);
                    console.log(`原始${key}参数的配置为${origin}`);
                    if(value==='false'){
                        app.config.set(key,false);
                    }else if(value==='true'){
                        app.config.set(key,true);
                    }else if(value.match(/^\d+(\.\d+)?$/)){
                        app.config.set(key,Number(value));
                    }else{
                        app.config.set(key,value);
                    }
                    console.log(`当前${key}参数的配置为${app.config.get(key)}`);
                    refresh();
                }
            ]
        },{
            text:'测试规则',
            func:[['请输入网址：'],url=>app.testRuleCmd(url)]
        },exit
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
            try{
                app.prompt.apply(app,func);
            }catch(e){
                console.log(e);
                refresh()
            }
        });
    }
    this.start = function(){
        showmainOptions();
        this.on('end',refresh);
    }
}