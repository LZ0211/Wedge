const zlib = require("zlib");
const Bin = require("../binary");

function value2bin(value){
    switch(typeof value){
        case 'string':
            var data = Buffer.from(value);
            return Bin('00000000','hex').writeInt32BE(data.length).concat(data).rawBuffer;
        case 'number':
            return Bin('00000000','hex').writeDoubleBE(value).rawBuffer;
        case 'boolean':
            return Bin('00','hex').writeInt8(value ? 1 : 0).rawBuffer;
        case 'object':
            var data = object2bin(value);
            return Bin('00000000','hex').writeInt32BE(data.length).concat(data).rawBuffer;
    }
}
function object2bin(obj){
}

console.log(value2bin('edhwuefhqhfu'))