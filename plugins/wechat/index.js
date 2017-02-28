module.exports = function (){
    var fs = this.lib.fs;
    var querystring = this.lib.querystring;
    var request = this.request;
    var Parser = this.Parser;
    var self = this;
    var initTime = + new Date;
    var stat = {
        type:"[app-timing]",
        data:{
            appTiming:{
                qrcodeStart:initTime,
                qrcodeEnd:initTime
            },
            pageTiming:{
                navigationStart:initTime,
                unloadEventStart:initTime,
                unloadEventEnd:initTime,
                redirectStart:0,
                redirectEnd:0,
                fetchStart:initTime,
                domainLookupStart:initTime,
                domainLookupEnd:initTime,
                connectStart:initTime,
                connectEnd:initTime,
                secureConnectionStart:initTime,
                requestStart:initTime,
                responseStart:initTime,
                responseEnd:initTime,
                domLoading:initTime,
                domInteractive:initTime,
                domContentLoadedEventStart:initTime,
                domContentLoadedEventEnd:initTime,
                domComplete:initTime,
                loadEventStart:initTime,
                loadEventEnd:initTime
            }
        }
    };
    var req = {
        type:"[app-runtime]",
        data:{
            unload:{
                listenerCount:114,
                watchersCount:105,
                scopesCount:27
            }
        }
    };
    var message = {};
    var BaseRequest = {};
    var uuid,url,sId;

    function getBaseRequest(){
        BaseRequest.DeviceID = "e" + ("" + Math.random().toFixed(15)).substring(2, 17)
        return BaseRequest;
    }

    var utils = {
        isRoomContact: function (e) {
            return !!e && /^@@|@chatroom$/.test(e)
        },
        now: function () {
            return +new Date;
        },
        getUser: function (key){
            return message.init.User[key];
        },
        getBatchContact: function (){
            var username = this.getUser('UserName');
            return message.init.ContactList.filter(function (item){
                return item.MemberList.some(function (member){
                    return member.UserName == username;
                });
            });
        },
        findUserByNickName: function (name){
            return message.contact.MemberList.filter(function (item){
                return item.NickName == name;
            });
        }
    }

    function getsId(fn){
        request.get('https://wx.qq.com/').then(data=>{
            var str = data.toString();
            var $ = Parser(str,'https://wx.qq.com/').$;
            sId = $('script').eq(-4).attr('src');
            return fn();
        },()=>getsId(fn));
    }
    function getStat(fn){
        var time = +new Date;
        request.get(sId + '&_=' + time).then(fn,()=>getStat(fn));
    }
    function statReport(fn){
        var cookie = request.cookies.getCookie('https://wx.qq.com/');
        var parsed = querystring.parse(cookie);
        function getCookie(key){
            if (parsed[key]){
                return key+'='+parsed[key];
            }
            return '';
        }
        var payload = {
            BaseRequest:{
                Uin: getCookie('wxuin'),
                Sid: getCookie('wxsid'),
                Skey: '',
            },
            Count:2,
            List:[{Text:JSON.stringify(req),Type:1},{Text:JSON.stringify(stat),Type:1}]
        }
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatreport?fun=new')
            .send();
    }
    function getUUID(fn){
        var time = +new Date;
        request.get('https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_='+time).then(data=>{
            var str = data.toString();
            uuid = str.match(/window.QRLogin.code = 200; window.QRLogin.uuid = "(.*)?";/)[1];
            return fn();
        },()=>getUUID(fn));
    }
    function getQRcode(fn){
        request.get('https://login.weixin.qq.com/qrcode/'+uuid).then(data=>{
            var file = uuid + '.jpg';
            fs.writeFileSync(file,data);
            self.openDir(file);
            return fn();
        },()=>getQRcode(uuid));
    }
    function login(fn){
        var time = +new Date;
        function polling(){
            var now = +new Date;
            if (now - time > 180000){
                console.log("验证超时...请重新链接...");
                return;
            }
            request.get('https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid=' + uuid + '&tip=0&r=' + ~now + '&_=' + now).then(data=>{
                var str = data.toString();
                if (/window.redirect_uri/i.test(str)){
                    url = str.match(/window.redirect_uri="(.*)?";/)[1];
                    return fn();
                }
                setTimeout(polling,500);
            },polling);
        }
        polling();
    }
    function newLoginPage(fn){
        request.get(url+'&fun=new&version=v2').then(data=>{
            var str = data.toString();
            var $ = Parser(str,url).$;
            BaseRequest.Skey = message.skey = $('skey').text();
            BaseRequest.Sid = message.wxsid = $('wxsid').text();
            BaseRequest.Uin = message.wxuin = $('wxuin').text();
            message.pass_ticket = $('pass_ticket').text();
            return fn();
        },()=>newLoginPage(fn));
    }
    function wxInit(fn){
        var time = +new Date;
        var data = {
            BaseRequest:getBaseRequest()
        }
        var payload = new Buffer(JSON.stringify(data));
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r='+ ~time + '&pass_ticket=' + message.pass_ticket).send(payload).then(data=>{
            var str = data.toString();
            var msg = JSON.parse(str);
            console.log(JSON.stringify(msg,null,2));
            message.init = msg;
            return fn();
        },()=>wxInit(fn));
    }
    function wxstatusnotify(fn){
        var time = +new Date;
        var data = {
            BaseRequest:getBaseRequest(),
            ClientMsgId: time,
            Code: 3,
            FromUserName: utils.getUser('UserName'),
            ToUserName: utils.getUser('UserName')
        }
        var payload = new Buffer(JSON.stringify(data));
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify?lang=zh_CN&pass_ticket=' + message.pass_ticket).send(payload).then(data=>{
            var str = data.toString();
            var msg = JSON.parse(str);
            message.statusnotify = msg;
            return fn();
        },()=>wxstatusnotify(fn));
    }
    function wxgetcontact(fn){
        var time = +new Date;
        request.get('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket=' +  message.pass_ticket + '&r=' + time + '&seq=0&skey=' + message.skey).then(data=>{
            var str = data.toString();
            var msg = JSON.parse(str);
            console.log(JSON.stringify(msg,null,2));
            message.contact = msg;
            return fn();
        },()=>wxgetcontact(fn));
    }
    function wxbatchgetcontact(fn){
        var time = +new Date;
        var list = utils.getBatchContact().map(item=>{
            return {
                ChatRoomId:"",
                UserName:item.UserName
            }
        });
        var data = {
            BaseRequest:getBaseRequest(),
            Count:list.length,
            List:list
        }
        var payload = new Buffer(JSON.stringify(data));
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=' + time + '&lang=zh_CN&pass_ticket=' + message.pass_ticket).send(payload).then(data=>{
            var str = data.toString();
            var msg = JSON.parse(str);
            //console.log(JSON.stringify(msg,null,2));
            return fn();
        },()=>wxbatchgetcontact(fn));
    }
    function wxsendmsg(fn){
        var data = {
            BaseRequest:getBaseRequest(),
            Msg:createMsg(),
            Scene:0
        }
        var payload = new Buffer(JSON.stringify(data));
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=zh_CN&pass_ticket='  + message.pass_ticket).send(payload).then(data=>{
            var str = data.toString();
            var msg = JSON.parse(str);
            //console.log(JSON.stringify(msg,null,2));
            return wxsendmsg(fn);
        },()=>wxsendmsg(fn))
    }
    function wxsync(fn){
        var data = {
        };
        request.post('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=' + message.Sid + '&skey=' + message.skey + '&lang=zh_CN&pass_ticket=' + message.pass_ticket)
    }

    function createMsg(msg){
        var MsgId = (utils.now() + Math.random().toFixed(3)).replace(".", "");
        return {
            ClientMsgId: MsgId,
            Content: self.lib.Random.select(strs),
            FromUserName: utils.getUser('UserName'),
            LocalID:(utils.now() + Math.random().toFixed(3)).replace(".", ""),
            ToUserName:utils.findUserByNickName('Kiki')[0].UserName,
            Type:1
        }
    }

    this.series([
        //getsId,
        //getStat,
        getUUID,
        getQRcode,
        login,
        newLoginPage,
        wxInit,
        //wxstatusnotify,
        wxgetcontact,
        //wxbatchgetcontact,
        wxsendmsg,
        //(fn)=>wxsendmsg(createMsg('o(╯□╰)o'),fn),
        //(fn)=>wxsendmsg(createMsg('路过打酱油的...'),fn),
        //(fn)=>wxsendmsg(createMsg('((o(^_ ^)o))'),fn),
        //(fn)=>wxsendmsg(createMsg('(*>﹏<*)′ ~'),fn),
        //(fn)=>wxsendmsg(createMsg('O(∩_∩)O~'),fn),
    ])
}