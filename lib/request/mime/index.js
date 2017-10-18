exports.types = {};
exports.extensions = {};
exports.define = function (map){
    for (var type in map){
        var exts = map[type];
        exts.forEach(function (ext){
            this.types[ext] = type;
        }.bind(this));
        if (!this.extensions[type]) {
          this.extensions[type] = exts[0];
        }
    }
};
exports.define(require('./mime'));
exports.lookup = function(path, fallback) {
    var ext = path.replace(/.*[\.\/\\]/, '').toLowerCase();
    return this.types[ext] || fallback || this.default_type;
}

exports.default_type = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';

exports.extension = function(mimeType) {
  var type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
  return this.extensions[type];
};