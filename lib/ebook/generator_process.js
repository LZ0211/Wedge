const execute = require('./generator')
process.on("message",msg=>execute(msg,(code,filename)=>process.send({code:code,filename:filename},process.exit)));