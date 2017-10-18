"use strict";
var zlib = require("zlib");
var StringDecoder = require('string_decoder').StringDecoder;
var Stream = require('stream');

exports.needUnzip = function (res){
    if (res.statusCode === 204 || res.statusCode === 304) {
        return false;
    }
    if (res.headers['content-length'] === '0') {
        return false;
    }
    return /^\s*(?:deflate|gzip)\s*$/.test(res.headers['content-encoding']);
}

exports.unzip = function(req, res){
  var unzip = zlib.createUnzip();
  var stream = new Stream;
  var decoder;

  stream.req = req;

  unzip.on('error', function(err){
    stream.emit('error', err);
  });

  res.pipe(unzip);

  // override `setEncoding` to capture encoding
  res.setEncoding = function(type){
    decoder = new StringDecoder(type);
  };

  // decode upon decompressing with captured encoding
  unzip.on('data', function(buf){
    if (decoder) {
      var str = decoder.write(buf);
      if (str.length) stream.emit('data', str);
    } else {
      stream.emit('data', buf);
    }
  });

  unzip.on('end', function(){
    stream.emit('end');
  });

  // override `on` to capture data listeners
  var _on = res.on;
  res.on = function(type, fn){
    if ('data' == type || 'end' == type) {
      stream.on(type, fn);
    } else if ('error' == type) {
      stream.on(type, fn);
      _on.call(res, type, fn);
    } else {
      _on.call(res, type, fn);
    }
  };
};
exports.isRedirect = function(code) {
  return ~[301, 302, 303, 305, 307, 308].indexOf(code);
}
exports.type = function(str){
  return str.split(/ *; */).shift();
};
exports.isImage = function(mime) {
  var parts = mime.split('/');
  var type = parts[0];
  var subtype = parts[1];
  return 'image' == type;
}
exports.isText = function(mime) {
  var parts = mime.split('/');
  var type = parts[0];
  var subtype = parts[1];
  return 'text' == type
    || 'x-www-form-urlencoded' == subtype;
}
exports.isJSON = function(mime) {
  return /[\/+]json\b/.test(mime);
}

exports.charset = function (str){
    return str.split(/ *; */)[1];
}

;(function (){
    var toString = Object.prototype.toString;
    ["Function","Array","String","Number","Object","RegExp","Date","HTMLDocument"].forEach(function (type){
        exports["is" + type] = function (value){
            return toString.call(value) === "[object "+type+"]"
        }
    });
})()