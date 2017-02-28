# Wedge
可配置的小说下载工具
## 使用教程
```Javascript
//引入wedge模块
const Wedge = require("./wedge");
//创建App，参数为工作路径
var App = new Wedge("./library");
//新建书籍
App.newBook(url);
//更新书籍
App.updateBook(dir);
//批量新建书籍
App.newBooks([url1,url2,url3,...]);
//批量更新书籍
App.updateBooks([dir1,dir2,dir3,...]);
//合并多个目录并下载
App.start([url1,url2,url3,...])
```
### 小插件
```Javascript
//测试当前页面是否在规则库中
App.plugins.testRule(url);
//测试jquery命令
App.plugins.testSelector(url);
//发送小说到ireader阅读器
App.plugins.sendToiReader();
//发送小说到QQ阅读器
App.plugins.sendToQQ();
//深度任务,采集多个页面中的链接并批量新建小说
App.plugins.deepQuest([urls],selector);
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
```

#### 电子书参数
```Javascript
//生成电子书保存路径
App.config.set('ebook.directory','E:/MyBooks/Library/ebook');
//电子书格式，默认epub
//支持txt,fb2,epub,json,txt.zip(txt格式的压缩文件),fb2.zip(fb2格式的压缩文件),html.zip(分章节的html压缩文件)
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

#### 书籍参数
```Javascript
//如果存在相同小说时，是否切换新的的源
App.config.set('book.changesource',false);
//切换新的的源后是否覆盖旧章节
App.config.set('book.override',false);
//章节中发现图片链接是是否下载图片到本地
App.config.set('book.imagelocalization',false);
//是否从起点等原创网站搜索书籍信息
//建议开启，当下载网站不在规则库中能够辅助搜集书籍信息
App.config.set('book.searchmeta',true);
```

### 添加网站规则
在wedge/lib/parser/sites路径下
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
