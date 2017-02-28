module.exports = function (ip,files){
    if (ip && files){
        return this.parallel(files,(file,next)=>{
            try{
                var body = this.lib.fs.readFileSync(file);
            }catch (err){
                this.log(err.toString());
                return next();
            }
            var boundary = '----WebKitFormBoundary' + this.lib.Random.uuid(16);
            var filename = this.lib.Path.basename(file);
            var payload = [];
            var head = '--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="sfile"; filename="' + filename + '"\r\n'
                + 'Content-Type: application/octet-stream\r\n'
                + '\r\n';
            var tail = '\r\n--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="btn"\r\n'
                + '\r\n'
                + '上传\r\n'
                + '--' + boundary + '--';
            payload.push(new Buffer(head));
            payload.push(body);
            payload.push(new Buffer(tail));
            payload = Buffer.concat(payload);
            this.request.post(ip)
            .setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary)
            .send(payload)
            .end(()=>{
                console.log(filename + "上传成功...");
                next();
            });
        },this.noop,1);
    }
    var self = this;
    self.terminal(["请输入IP地址："],function(ip){
        var callee = arguments.callee;
        var regexp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)/g;
        var found = ip.match(regexp);
        if (!found){
            console.log("IP地址不正确");
            return self.terminal(["请输入IP地址："],callee);
        }
        ip = 'http://' + ip + '/upload';
        self.terminal(["拖动文件到窗口："],function(file){
            var callee = arguments.callee;
            file = file.replace(/^"/,'').replace(/"$/,'');
            if (file == '') return process.exit();
            try{
                var body = self.lib.fs.readFileSync(file);
            }catch (err){
                self.log(err.toString());
                return self.terminal(["拖动文件到窗口："],callee);
            }
            var boundary = '----WebKitFormBoundary' + self.lib.Random.uuid(16);
            var filename = self.lib.Path.basename(file);
            var payload = [];
            var head = '--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="sfile"; filename="' + filename + '"\r\n'
                + 'Content-Type: application/octet-stream\r\n'
                + '\r\n';
            var tail = '\r\n--' + boundary + '\r\n'
                + 'Content-Disposition: form-data; name="btn"\r\n'
                + '\r\n'
                + '上传\r\n'
                + '--' + boundary + '--';
            payload.push(new Buffer(head));
            payload.push(body);
            payload.push(new Buffer(tail));
            payload = Buffer.concat(payload);
            self.request.post(ip)
            .setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary)
            .send(payload)
            .end(()=>{
                console.log(filename + "上传成功...");
                self.terminal(["拖动文件到窗口："],callee);
            });
        });
    });
}