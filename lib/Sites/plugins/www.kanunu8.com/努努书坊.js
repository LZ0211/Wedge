module.exports = {
    "siteName":"努努书坊",
    "siteURL":"http://www.kanunu8.com",
    "history":[],
    "charset":"gbk",
    "filter":{
    },
    "selector":{
        "indexPage":{
            "index":function($){return $('table:contains("内容简介")').next().find('a').map((i,v)=>({href:$(v).attr('href'),text:$(v).text()})).toArray()},
            "infoURL":null
        },
        "infoPage":{
            "title":function($){return $('h1 strong').text()},
            "author":function($){return $('td[height="30"]').text()},
            "brief":function($){return $('.p10-24').eq(1).html()},
            "cover":function($){return $('.mr11 img').attr('src')},
            "classes":function($){return $('.p10-24 strong').eq(0).text()},
            "isend":true
        },
        "contentPage":{
            "content":function($){return $('table p').html()},
            "footer":function($){return $('a.a2').length}
        }
    },
    "replacer":{
        "author":[" 发布时间[\\s\\S]*","[\\s\\S]*?作者："],
        "brief":"内容简介：",
        "classes":{"&middot;":"·"}
    }
}