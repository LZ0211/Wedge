const os = require('os')
const iptable = {}
const ifaces=os.networkInterfaces()

for (let dev in ifaces){
    ifaces[dev].forEach((details,alias)=>{
        if (details.family=='IPv4'){
            iptable[dev] = details.address
        }
    })
}
module.exports = iptable