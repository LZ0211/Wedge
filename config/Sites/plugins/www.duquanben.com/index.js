module.exports = {
    "host":"www.ybdu.com",
    "match":[
        "www.quanben.com",
        "www.ybdu.com",
        "www.duquanben.com"
    ],
    "charset":"gbk",
    "interval": 1500,
    "selector":require("./selector"),
    "replacer":require("./replacer")
}