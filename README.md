# Wedge
可配置的小说下载工具
## 快速开始
```Javascript
#!/usr/bin/env node
const Wedge = require("./wedge");
const app = new Wedge("./library");
app.start()
```
## 使用教程
```Javascript
//引入wedge模块
const Wedge = require("./wedge");
//创建App，参数为工作路径
var App = new Wedge(workdir);
//新建书籍
App.newBook(url);
//更新书籍
App.updateBook(uuid);
//批量新建书籍
App.newBooks([url1,url2,url3,...]);
//批量更新书籍
App.updateBooks([uuid1,uuid2,uuid3,...]);
//终端提示输入界面
App.start()
```
### 数据库命令
```Javascript
//primary key，唯一值
//当设定primary key以后，如果record不存在该key将被过滤
//如果存在有键值冲突将发生覆盖
App.database.unique('uuid');
//filter,返回数组
App.database.filter(record=>record.isend == true);
//map
App.database.map(record=>record.uuid);
//each
App.database.each(console.log);
//attr，返回所有记录的键值
App.database.attr('uuid');//等效于map(record=>record.uuid)
//push, 添加一条记录
App.database.push({
	title:'...',
	author:'...',
	uuid:'...'
});
//remove(index)，移除一条记录
App.database.remove(0);
//get(index)，读取一条记录
App.database.get(0);
//set(index,object),修改一条记录，在下次执行unique(key)前不受primary key的影响
App.database.set(0,{});
//load(db),替换整个db表
App.database.load([]);
//file(f),load本地文件(如果存在)，并本地化数据库（实时保存）
App.database.file('metadatas.json');
//keys()，返回所有记录的primary key的键值
App.database.keys();
//hashBy(key)，根据键值返回所有记录的hash表
App.database.hashBy('source');
//query()，简易的query命令，类url的querystring
//等同于filter
App.database.query('classes=奇幻玄幻&classes=历史军事&isend=true');
//等效于App.database.filter(record=>(record.classes=='奇幻玄幻' || record.classes==='历史军事')&&record.isend==true)
```

### 配置参数[可选]
参数配置，初次运行时会在工作路径新建json格式的配置文件，可手动修改

#### 网络请求参数
```Javascript
//请求失败重连次数
App.config.set('request.reconnect',5);
//请求超时时间
App.config.set('request.timeout',5000);
//设置代理
App.config.set('request.proxy','127.0.0.1:8087');
App.config.set('request.proxy',{host:'localhost',port:'8087'});
//设置代理认证
App.config.set('request.proxyAuth',{username:'###',password:'###'});
```

#### 电子书参数
```Javascript
//生成电子书保存路径
App.config.set('ebook.directory','E:/MyBooks/Library/ebook');
//电子书格式，默认epub
//支持txt,fb2,epub,umd,rtf,json,htmlz,docx,txt.zip(txt格式的压缩文件),fb2.zip(fb2格式的压缩文件),html.zip(分章节的html压缩文件)
App.config.set('ebook.formation','epub');
/*
是否创建电子书，子进程命令
'auto'——发生修改后自动创建新的电子书(包括书籍metadata变动或有下载新章节)
true——每次调用生成命令都会创建新的电子书
false——关闭该功能
*/
App.config.set('ebook.activated','auto');
//电子书生成后自动打开文件目录
App.config.set('ebook.opendirectory',false);
//电子书生成后自动打开文件
App.config.set('ebook.openebookfile',false);
```

#### 线程参数
```Javascript
//执行章节下载时的并行数目
App.config.set('thread.execute',5);
//批量新建小说时的并行数目
App.config.set('thread.new',5);
//批量更新小说时的并行数目
App.config.set('thread.update',5);
//合并目录时的并行数目
App.config.set('thread.merge',5);
//下载图片时的并行数目
App.config.set('thread.image',5);
```

#### 数据库参数
```Javascript
//实时同步本地
App.config.set('database.sync',true);
//修改primary键
App.config.set('database.primary','uuid');
```

#### 书籍参数
```Javascript
//同步加载
App.config.set('book.sync',true);
//异步加载
App.config.set('book.sync',false);
//自动检查目录，添加已有的章节信息或移除已被删除的章节
App.config.set('book.check',true);
//如果存在相同小说时，是否切换新的的源
App.config.set('book.changesource',false);
//切换新的的源后是否覆盖旧章节
App.config.set('book.override',false);
//章节中发现图片链接是是否下载图片到本地
App.config.set('book.imagelocalization',false);
//是否从起点等原创网站搜索书籍信息
//建议开启，当下载网站不在规则库中能够辅助搜集书籍信息
App.config.set('book.searchmeta',true);
//深度下载，如果章节内容中存在超链接，将下载该链接内容
App.config.set("book.deepdownload",true);
//设置最大下载深度
App.config.set("book.maxdepth",2);
```

#### App参数
```Javascript
//输出运行日志
App.config.set('app.log',true);
//输出运行日志到本地文件
App.config.set('app.log','LOG.txt');
//输出debug信息
App.config.set('app.debug',true);
```

### plugins小插件
```Javascript
//启用或添加插件
//修改工作路径的setting.json文件后重启程序
{
  "name": "5sing",
  "activated": false,//未启动
  "func": "./plugins/5sing"//插件脚本路径
}
//将书籍文件发送到手机阅读器；参数不齐全时自动进入终端界面提示输入
//QQ阅读器（默认开启）
App.sendToQQ(ip,[files]);
App.sendToQQ();
//iReader阅读器（默认开启）
App.sendToiReader();
//搜索引擎（默认开启）
App.Engine.search(title,callback);
//设置搜索引擎;默认为sogou
App.Engine.setEngine("360");
App.Engine.setEngine("baidu");
//简单的控制台输入界面（默认开启）
App.start()
/*
请选择功能
  0) 新建书籍
  1) 更新书籍
  2) 自动更新
  3) 批量添加书籍
  4) 生成电子书
  5) 搜索书籍
  6) 发送到手机
  7) 使用引擎搜索
  8) 修改配置
  9) 数据库检索
  10) 退出
*/
//电子书生成（默认开启）
App.convertEbook(bookdir[,ebookdir,formation])
//测试选择器（默认关闭）
//进入终端界面，类似于浏览器控制台
App.testSelector(url);
//测试站点规则（默认关闭）
//用于测试站点规则是否有效
App.testRule(url)
//深度任务（默认开启）
//根据输入的地址和选择器获取书籍链接并批量新建下载任务
App.deepQuest([urls],selector)
//5sing下载音乐（默认关闭）
App._5sing(url)
//下载页面中的图片
App.getPageImages(url,options);
//options参数;可选项
options.ext = 'jpg|png|jpeg|gif'；//筛选符合扩展名的图片
options.size = 10240; //单位B,筛选大于该数值的图片
options.location = "./"; 图片保存位置
options.rename = "<name><ext>"; 图片保存的重命名规则
```

### 添加网站规则
#### 临时添加
App.Sites.inject(rule);
#### 永久添加
在wedge/lib/sites路径下
defaut为原创小说网站，
plugins为盗链网站
![host]命名的为匹配多个网站的规则

规则文件由三部分组成：index.js, selector.js(json), replacer.json

####主文件（index.js）
```Javascript
module.exports = {
    "host":"www.23zw.com",//站点host
    "match":[//其他相同规则的站点host
        "www.23zw.com",
        "www.23zw.me"
    ],
    "charset":"gbk",//网页编码，不填的话程序会尝试自动解码
    "selector":require("./selector"),
    "replacer":require("./replacer")
}
```

####选择器
按照jquery函数填写规则，启动时自动编译成函数
添加一个$.location()函数，返回当前页面的location 或 resolve url地址
```Javascript
{
  "infoPage": {
    "match": "!!$('.btnlinks > a.read').length",//是否匹配书籍信息页面
    "indexPage": "$.location($('.btnlinks > a.read').attr('href'))",//书籍目录页的链接
    "footer": "$('.footer').length > 0",//页面footer,防止网络延迟下的页面内容缺失，可直接填true
    "bookInfos": {//采集书籍信息
      "title": "$('#content h1').text()",//书籍名称
      "author": "$('th:contains(作者)').next('td').text()",//书籍作者
      "classes": "$('th:contains(类别)').next('td').text()",//书籍分类
      "isend": "$('th:contains(状态)').next('td').text()",//书籍完结状态
      "cover": "$.location($('a.hst img').attr('src'))",//书籍封面链接
      "brief": " $('p:contains(内容简介)').nextAll('p').html()"//书籍简介
    }
  },
  "indexPage": {
    "match": "!!$('.tags').length",//是否匹配书籍目录页
    "infoPage": "$.location($('.bdsub > dl > dt > a').last().attr('href'))",//书籍信息页的链接
    "footer": "!!$('.tags').length",
    "filter": "$('td:contains(更新重要通告)').remove()",//过滤信息
    "bookIndexs": "$('td.L a').map((i,v)=>({href:$.location($(v).attr('href')),text:$(v).text()})).toArray()"//书籍章节链接，返回{href:,text:}格式的数组
  },
  "contentPage": {
    "match": "!!$('#footlink').length",//是否匹配章节页
    "footer": "!!$('#footlink').length",
    "chapterInfos": {
      "source": "$.location()",//页面地址
      "content": "$('#contents').html()"//页面内容
    }
  }
}
```

#### 替换器
结构同上，可省略
字符串会编译成正则表达式进行替换
{key:value}对象格式会将key编译成正则表达式并替换成value
```Javascript
{
  "infoPage": {
    "bookInfos": {
      "title": ["全文阅读"]
    }
  },
  "contentPage": {
    "chapterInfos": {
      "content": ["看最快更新","一秒记住.*?免费阅读！"]
    }
  }
}
```
#### 全局替换器
./lib/classes/Filter.json
```Javascript
{
    "chapterTitle":[],//全局章节标题过滤规则
    "chapterBeforeFilter":[],//内置过滤前的原始html文件的过滤规则
    "chapterAfterFilter":[
        "readx();",
        "天才壹秒记住.*为您提供精彩小说阅读。",
        "天才一秒记住.*为您提供精彩小说阅读。",
        "^<<",
        "手机用户请浏览.*",
        "公告：本站推荐一款免费小说APP.*"
    ]//内置过滤后进一步的过滤
}
```