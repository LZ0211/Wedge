(function (root){
    //This random generator use MT19937
    //generate a random seed for Mersenne twister algorithm.
    var SEED = Math.random() * new Date();
    var MT = [parseInt(SEED)];
    var RAND_MAX = 0x7fffffff;
    var index = 0;

    //Initialize the generator from the seed
    for (var i=1;i<624 ;i++ ){
        MT[i] = (1812433253 * (MT[i-1] ^ (MT[i-1] >> 30)) + i) & 0xffffffff;
    }

    //genarate random number
    function msRand(){
        if (index === 0){
            msRenerate();
        }
        var y = MT[index];
        y = y ^ (y >> 11);
        y = y ^ ((y << 7) & 0x9d2c5680);
        y = y ^ ((y << 15) & 0xefc60000);
        y = y ^ (y >> 18);
        index = (index + 1) % 624;
        return y;
    }

    function msRenerate(){
        var i,y;
        for (i=0;i<624 ;i++ ){
            y = (MT[i] & 0x80000000) + (MT[(i+1) % 624] & 0x7fffffff);
            MT[i] = MT[(i + 397) % 624] ^ (y >> 1);
            if ( y % 2 !== 0){
                MT[i] = MT[i] ^ 0x9908b0df;
            }
        }
    }

    //Return a random number between [0,1)
    function uniform(){
        return msRand()/ RAND_MAX;
    }

    /*
        Return random Float number between (start,end).
        the defaut value of `start` and `end` is 0 and 1.
        randFloat() <--> [0,1)
        randFloat(a) <--> [0,a)
        randFloat(a,b) <--> [a,b)
    */
    function randFloat(start,end){
        if (undefined == start){
            return uniform();
        }
        if (undefined == end){
            return start * uniform();
        }
        return start + uniform()*(end-start);
    }

    function randInt(){
        return parseInt(randFloat.apply(null,arguments));
    }

    function Int32(){
        return msRand();
    }

    function toHex(number){
        return number.toString(16);
    }

    function color(){
        return [randInt(0,256),randInt(0,256),randInt(0,256)];
    }

    function leftpad(str,len,char){
        len = len || 4;
        char = char || "0";
        return new Array(len + 1 - str.length).join(char) + str;
    }

    function colorHex(){
        return "#" + color().map(toHex).map(function (v){
            return leftpad(v,2,0);
        }).join("");
    }

    function select(list,fn){
        fn = fn || uniform;
        var randNum = Math.abs(fn());
        if (randNum > 1){
            randNum = randNum % 1.0;
        }
        randNum = Math.floor(randNum * list.length);
        return list[randNum];
    }

    function choice(list){
        return select(list);
    }

    function shuffle(list){
        if (typeof list === "string"){
            return shuffle(list.split('')).join('');
        }
        if (Array.isArray(list)){
            return list.concat([]).sort(function(a,b){return uniform()-0.5});
        }
        return list;
    }

    function range(head,tail,step){
        var argv = [].slice(arguments);
        var head = 0,tail = 0,step = 1,array = [];
        switch(argv.length){
            case 1:
                tail = argv[0];
                break;
            case 2:
                head = argv[0];
                tail = argv[1];
                break;
            case 3:
                head = argv[0];
                tail = argv[1];
                step = argv[2];
                break;
        }
        for (var i=head;i<=tail ;i += step){
            array.push(i);
        }
        return shuffle(array);
    }

    function uuid(len, radix){
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
            uuid = [],
            radix = radix || chars.length,
            i;
        if (len){
            for (var i = 0; i < len; i++){
                uuid[i] = chars[0|uniform()*radix];
            }
        }
        else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | uniform()*16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join('');
    }

    function sample(array,num){
        var copy = [].map.call(array,function(v){return v});
        num = num || randInt(1,copy.length);
        if (num >= copy.length){
            return shuffle(copy);
        }else {
            var arr = [];
            while(arr.length<num){
                copy=this.shuffle(copy);
                arr.push(copy.shift());
            }
            return arr;
        }
    }

    function Uniform(lower,upper){
        return function (){
            return lower + uniform()*(upper-lower);
        }
    }

    function Gaussian(mu,sigma){
        return function (){
            return normal()*Math.sqrt(sigma)+mu;
        }
    }

    function Lognormal(mu,sigma){
        var generator = Gaussian(mu,sigma);
        return function (){
            return Math.exp(generator());
        }
    }

    //Box–Muller transform
    var normal = (function (){
        var generate = false;
        var v1=0.0, v2=0.0, x=0.0;
        var uniform = new Uniform(-1,1);
        return function (){
            if (generate){
                generate = false;
                return  v2 * x;
            }else {
                var s;
                do{
                    v1 = uniform();
                    v2 = uniform();
                    s = v1*v1 + v2*v2;
                }while(s == 0 || s >= 1)
                x = Math.sqrt(-2 * Math.log(s) / s);
                generate = true;
                return v1 * x;
            }
        }
    })();

    function Bernoulli(prob){
        var prob = prob;
        return function (){
            return uniform() < prob;
        }
    }

    //factorial f(N) = N!
    var factorial = (function(){
        var record = [1,1];
        return function (n){
            if (!record[n]){
                record[n] = n*arguments.callee(n-1);
            }
            return record[n];
        }
    })()

    function Binomial(up,prob){
        var generator = Bernoulli(prob);
        return function (){
            var x = 0;
            for (var i=0;i<up ;i++ ){
                if (generator()){
                    x += 1;
                }
            }
            return x;
        }
    }

    function negativeBinomial(times,prob){
        var generator = new Bernoulli(prob);
        return function (){
            var success=0,fail=0;
            do{
                if (generator()){
                    success += 1;
                }else {
                    fail += 1;
                }
            }
            while (fail<times);
            return success;
        }
    }

    function Cauchy(location,scale){
        return function (){
            return Math.tan(uniform() * Math.PI) * scale + location;
        }
    }

    function Gumbel(location,scale){
        return function (){
            return -Math.log(Math.log(1/uniform())) * scale + location;
        }
    }

    function Logistic(location,scale){
        return function (){
            return -Math.log(1/uniform() - 1) * scale + location;
        }
    }

    /*
    Marsaglia and Tsang (2001).
    */
    function Gamma(shape,scale){
        return function (){
            var d = shape - 1 / 3;
            var c = 1 / Math.sqrt(9 * d);
            do {
                do {
                    var x = gaussian();
                    var v = Math.pow(c * x + 1, 3);
                } while (v <= 0);
                var u = uniform();
                var x2 = Math.pow(x, 2);
            } while (u >= 1 - 0.0331 * x2 * x2 && Math.log(u) >= 0.5 * x2 + d * (1 - v + Math.log(v)));
            if (shape < 1) {
                return scale * d * v * Math.exp(exponential() / -shape);
            } else {
                return scale * d * v;
            }
        }
    }

    function Chisquared(degree){
        return Gamma(degree/2,2);
    }

    function Poisson(mean){
        var c = Math.exp(-mean);
        return function (){
            var x=0,b=1;
            do {
                x += 1;
                b *= uniform();
            }
            while(b>=c);
            return x;
        }
    }

    function Exponential(lamda){
        return function (){
            return -Math.log(uniform())/lamda;
        }
    }

    function Geometric(prob){
        var temp = Math.log(1-prob);
        return function (){
            return Math.ceil(Math.log(uniform())/temp) - 1;
        }
    }

    function Weibull(shape,scale){
        var temp = -Math.pow(scale,shape);
        return function (){
            return Math.pow(temp*Math.log(uniform()),1/shape);
        }
    }

    function Rayleigh(scale){
        return Weibull(2,scale);
    }

    function gaussian(mu,sigma){
        if (undefined == mu){
            mu = 0;
            sigma = 1;
        }
        if (undefined == sigma){
            sigma = 1;
        }
        return Gaussian(mu,sigma)();
    }

    function lognormal(mu,sigma){
        if (undefined == mu){
            mu = 0;
            sigma = 1;
        }
        if (undefined == sigma){
            sigma = 1;
        }
        return Lognormal(mu,sigma)();
    }

    function bernoulli(prob){
        if (undefined == prob){
            prob = 0.5;
        }
        return Bernoulli(prob)();
    }

    function cauchy(location,scale){
        if (undefined == location){
            location = 0;
            scale = 1;
        }
        if (undefined == scale){
            scale = 1;
        }
        return Cauchy(location,scale)();
    }

    function gumbel(location,scale){
        if (undefined == location){
            location = 0;
            scale = 1;
        }
        if (undefined == scale){
            scale = 1;
        }
        return Gumbel(location,scale)();
    }

    function logistic(location,scale){
        if (undefined == location){
            location = 0;
            scale = 1;
        }
        if (undefined == scale){
            scale = 1;
        }
        return Logistic(location,scale)();
    }

    function poisson(mean){
        mean = mean || 1;
        return Poisson(mean)();
    }

    function gamma(shape,scale){
        if (undefined == shape){
            shape = 1;
            scale = 1;
        }
        if (undefined == scale){
            scale = 1;
        }
        return Gamma(shape,scale)();
    }

    function chisquared(degree){
        if (undefined == degree){
            degree = 1;
        }
        return Chisquared(degree)();
    }

    function exponential(lamda){
        lamda = lamda || 1;
        return Exponential(lamda)();
    }

    function geometric(prob){
        prob = prob || 0.5;
        return Geometric(prob)();
    }

    function binomial(up,prob){
        return Binomial(up,prob)();
    }

    function weibull(shape,scale){
        if (undefined == shape){
            shape = 1;
            scale = 1;
        }
        if (undefined == scale){
            scale = 1;
        }
        return Weibull(shape,scale)();
    }

    var JSrandom = {
        randFloat:randFloat,
        randInt:randInt,
        Int32:Int32,
        color:color,
        colorHex:colorHex,
        uuid:uuid,
        select:select,
        choice:choice,
        sample:sample,
        shuffle:shuffle,
        Uniform:Uniform,
        Gaussian:Gaussian,
        Lognormal:Lognormal,
        Bernoulli:Bernoulli,
        Cauchy:Cauchy,
        Gumbel:Gumbel,
        Logistic:Logistic,
        Poisson:Poisson,
        Gamma:Gamma,
        Chisquared:Chisquared,
        Exponential:Exponential,
        Geometric:Geometric,
        Binomial:Binomial,
        Weibull:Weibull,
        Rayleigh:Rayleigh,
        uniform:uniform,
        gaussian:gaussian,
        lognormal:lognormal,
        bernoulli:bernoulli,
        cauchy:cauchy,
        gumbel:gumbel,
        logistic:logistic,
        poisson:poisson,
        gamma:gamma,
        chisquared:chisquared,
        exponential:exponential,
        geometric:geometric,
        binomial:binomial,
        weibull:weibull
    };

    if (typeof define === "function" && define.amd) {
        define(function () {
            return JSrandom;
        });
    }else if(typeof module !== "undefined" && typeof require === "function") {
        module.exports = JSrandom;
    }else {
        (function () {
            var oldGlobal = root.JSrandom;
            JSrandom.noConflict = function () {
                root.JSrandom = oldGlobal;
                return this;
            };
        })();
        root.JSrandom = JSrandom;
    }


    //functional paradigm test
    /*function curry(fn){
        var length = fn.length;
        return function (){
            var callee = arguments.callee;
            var args = [].slice.apply(arguments);
            var len = args.length;

            if (len >= length){
                return fn.apply(null,args);
            }
            return function (){
                var _args = args.concat([].slice.apply(arguments));
                return callee.apply(null,_args);
            }
        }
    }

    function compose(){
        var args = [].slice.apply(arguments);
        var fn = args.pop();
        if (args.length == 0){
            return fn;
        }
        return function (){
            return compose.apply(null,args)(fn.apply(null,arguments));
        }
    }

    var toString = function (x){
        return x.toString();
    }
    var toFixed = curry(function (digit,number){
        return number.toFixed(digit);
    })

    var between = curry(function (a,b,x){
        return a + (b-a) * x;
    });

    var generator = compose(toFixed(5),between(1,10),uniform);

    console.log(generator())*/
})(this)


