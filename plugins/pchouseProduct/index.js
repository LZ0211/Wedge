process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = function (){
    var self = this,
        Random = this.lib.Random,
        querystring = this.lib.querystring,
        URL = this.lib.url,
        request = this.request,
        Decoder = this.Decoder,
        Parser = this.Parser;
    function Login(fn){
        self.terminal(['请输入用户名：','请输入密码：'],(username,password)=>{
            var username = username || 'huangzixin',
                password = password || 'BEactive4';
            request.post('https://219.136.245.112/security-server/auth.do').send({
                'return':'http://product.pchouse.com.cn/admin/login.jsp?method=login',
                'username':username,
                'password':password,
                'login':''
            }).end(fn);
        });
    }
    function getProducts(fn){
        request.get('http://product.pchouse.com.cn/admin/product3/list.jsp?q_eq_id=&q_like_name=&brand_name=&brand_id=&q_like_nick=&q_like_creator=&q_ge_createDate=&q_createDate=&cId=&aId=&oId=&bigId=&q_eq_status_i=1&q_eq_isImport_i=&pageSize=25')
        .then(data=>{
            var doc = Decoder.decode(data,'gbk');
            var $ = Parser(doc,'').$;
            var list = $('#tableBox').find('a:contains(修改)').map((i,v)=>$(v).attr('href')).toArray();
            return fn(list);
        },()=>getProducts(fn));
    }

    function processProduct(url,fn){
        request.get(url).then(data=>{
            var doc = Decoder.decode(data,'gbk');
            var $ = Parser(doc,'').$;
            var $form = $('#mainForm');
            return fn($form.find(':input').map((i,v)=>{
                return {
                    name:$(v).attr('name'),
                    value:$(v).val(),
                }
            }).toArray());
        },()=>processProduct(url,fn))
    }

    function getProductDetail(form,fn){
        var webUrl = form.filter(x=>x.name === 'webUrl')[0].value;
        request.get(webUrl).then(data=>{
            var doc = Decoder.decode(data,'gbk');
            var $ = Parser(doc,'').$;
            var $UL = $('#J_AttrUL');
            var productInfos = {
                brand:$UL.find('li').eq(0).attr('title')
            };
            console.log(productInfos)
        },()=>getProductDetail(form,fn));
    }

    /*self.series([
        Login,
        getProducts,
        (list,next)=>next(Random.select(list)),
        processProduct,
        getProductDetail,
        (form,next)=>console.log(form),
    ]);*/
    request.get('https://s.click.taobao.com/t?e=m%3D2%26s%3DK2JZYr%2FCgvccQipKwQzePOeEDrYVVa64yK8Cckff7TVRAdhuF14FMcI6%2FAGkzZ7s5x%2BIUlGKNpXjXTiwrfrH3VknIGKhvPZobuA%2FdMV3i3uqJ%2FmFRSPcAc7LeZmvwVhF78FqzS29vh5nPjZ5WWqolN%2FWWjML5JdM90WyHry0om2Nvbus5Wc1bAglcpSNR%2F6IkefkC%2BVayy0Iv0wsbEmLog%3D%3D').end((err,res,data)=>{
        var req = res.req;
        //var headers = req._headers;
        //var url = 'https://' + headers.host + req.path;
        var query = URL.parse(req.path).query;
        var qso = querystring.parse(query);
        console.log(qso.tu)
        //console.log(data.toString())
        request.get(qso.tu).then(data=>console.log(data),console.log)
    })
}

//e=m=2&s=qa5fGVqCg+ccQipKwQzePOeEDrYVVa64yK8Cckff7TVRAdhuF14FMfMQihLQ3O1Qxq3IhSJN6GTjXTiwrfrH3VknIGKhvPZobuA/dMV3i3uqJ/mFRSPcAc7LeZmvwVhF78FqzS29vh5nPjZ5WWqolN/WWjML5JdM90WyHry0om1cDrdnj1yMDNwuJNg1807wv6lJmPDjOHs9peD8rCcfzw==

//https://s.click.taobao.com/t?e=m=2&s=qa5fGVqCg+ccQipKwQzePOeEDrYVVa64yK8Cckff7TVRAdhuF14FMfMQihLQ3O1Qxq3IhSJN6GTjXTiwrfrH3VknIGKhvPZobuA/dMV3i3uqJ/mFRSPcAc7LeZmvwVhF78FqzS29vh5nPjZ5WWqolN/WWjML5JdM90WyHry0om1cDrdnj1yMDNwuJNg1807wv6lJmPDjOHs9peD8rCcfzw==&et=uqX3fNsNy/fyoDdzhk6Cj8TdbhGq6OWE