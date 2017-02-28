module.exports = function (){
    console.log("启动WebSocket服务器...");
    var Quest = [];
    var running = 0;
    return this.WebSocket.createServer(connect=>{
        connect.on("text",msg=>{
            try{
                var msgs = JSON.parse(msg);
                msgs.forEach(msg=>Quest.push(msg));
            }catch (e){
                Quest.push(msg);
            }
            if (running < 3){
                this.parallel(Quest,url=>{
                    running += 1;
                    this.spawn().newBook(url).end(()=>{
                        running -= 1;
                    });
                },()=>{},3-running);
            }
            connect.close();
        });
        connect.on("close",()=>{});
        connect.on("error",()=>{});
    }).listen(3000);
}