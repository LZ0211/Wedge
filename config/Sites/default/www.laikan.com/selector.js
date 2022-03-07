module.exports = {
    "infoPage": {
        "match": "/book/i.test($.location())",
        "indexPage": "$.location()",
        "footer": "true",
        "request": $=>{
            var bid = $.location().split('/').pop();
            return {
                "url": "https://app2.motie.com/pc/book/" + bid + "/detail",
                "dataType": "json",
                "success": data=>({
                    "title": data.data.bookName,
                    "author": data.data.authorName,
                    "classes": data.data.tags,
                    "isend": data.data.finish,
                    "cover": data.data.bookPic,
                    "brief": data.data.content
                })
            }
        }
    },
    "indexPage": {
        "match": "/book/i.test($.location())",
        "infoPage": "$.location()",
        "footer": "true",
        "request": $=>{
            var bid = $.location().split('/').pop();
            return {
                "url": "https://app2.motie.com/pc/book/" + bid + "/catalog",
                "dataType": "json",
                "success": data=>data.data.data.filter(x=>x.free).map(x=>({href:"http://www.laikan.com/chapter/67930/" + x.id, text:x.name}))
            }
        }
    },
    "contentPage": {
        "match": "/chapter/i.test($.location())",
        "footer": "true",
        "request": $=>{
            var bid = $.location().split('/').pop();
            return {
                "url": "https://app2.motie.com/pc/chapter/" + bid + "/content",
                "dataType": "json",
                "success":data=>data.data.content
            }         
        }
    }
}