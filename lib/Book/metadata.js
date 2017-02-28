var Attributes = require("../attributes");
module.exports = new Attributes({
    "title":{
        "type":"path",
    },
    "author":{
        "type":"path",
    },
    "classes":{
        "type":"text",
    },
    "uuid":{
        "type":"uuid",
        "value":""
    },
    "source":{
        "type":"url",
    },
    "isend":{
        "type":"isend",
        "value":false
    },
    "date":{
        "type":"time",
        "value":+new Date()
    },
    "brief":{
        "type":"text",
        "value":""
    },
    "cover":{
        "type":"base64",
        "value":''
    }
});