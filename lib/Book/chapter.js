var Attributes = require("../Attributes");

module.exports = new Attributes({
    "title":{
        "type":"path",
        "value":""
    },
    "id":{
        "type":"id",
        "value":0
    },
    "source":{
        "type":"url",
        "value":""
    },
    "date":{
        "type":"time",
        "value":+new Date()
    },
    "size":{
        "type":"integer",
        "value":0
    },
    "content":{
        "type":"text",
        "value":""
    }
});