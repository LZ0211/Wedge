module.exports = {
  "infoPage": {
    "match": "/detail/i.test($.location())",
    "indexPage": "$.location()",
    "footer": "true",
    "request": $=>({
      "url": "https://pre-api.youdubook.com/api/webNovelDetail?novel_id=" + $.location().split('/').pop(),
      "dataType": "json",
      "success": data=>({
        "title": data.data.novel_name,
        "author": data.data.novel_author,
        "classes": data.data.type_name,
        "isend": data.data.novel_process_name,
        "cover": data.data.novel_cover,
        "brief": data.data.novel_info,
      })
    })
  },
  "indexPage": {
    "match": "/detail/i.test($.location())",
    "infoPage": "$.location()",
    "footer": "true",
    "request": $=>({
      "url":"https://pre-api.youdubook.com/api/directoryList?orderBy=0&nid=" + $.location().split('/').pop(),
      "dataType": "json",
      "success": data=>data.data.data.filter(x=>!x.chapter_isvip).map(x=>({href:"https://pre-api.youdubook.com/api/readNew?nid=" + $.location().split('/').pop() + "&vid=" + x.chapter_vid + "&chapter_id=" + x.chapter_cid + "&chapter_order=" + x.chapter_order,text:x.chapter_name, "dataType": "json"}))
    })
  },
  "contentPage": {
    "match": "/readNew/i.test($.location())",
    "footer": "true",
    "chapterInfos": {
      "content": "$.data.content"
    }
  }
}