const execute = require('./generator')
process.on("message",msg=>execute(msg,code=>process.send({code:code},process.exit)));