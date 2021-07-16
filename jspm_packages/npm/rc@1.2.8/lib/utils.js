/* */ 
(function(process) {
  'use strict';
  var fs = require('fs');
  var ini = require('ini');
  var path = require('path');
  var stripJsonComments = require('strip-json-comments');
  var parse = exports.parse = function(content) {
    if (/^\s*{/.test(content))
      return JSON.parse(stripJsonComments(content));
    return ini.parse(content);
  };
  var file = exports.file = function() {
    var args = [].slice.call(arguments).filter(function(arg) {
      return arg != null;
    });
    for (var i in args)
      if ('string' !== typeof args[i])
        return;
    var file = path.join.apply(null, args);
    var content;
    try {
      return fs.readFileSync(file, 'utf-8');
    } catch (err) {
      return;
    }
  };
  var json = exports.json = function() {
    var content = file.apply(null, arguments);
    return content ? parse(content) : null;
  };
  var env = exports.env = function(prefix, env) {
    env = env || process.env;
    var obj = {};
    var l = prefix.length;
    for (var k in env) {
      if (k.toLowerCase().indexOf(prefix.toLowerCase()) === 0) {
        var keypath = k.substring(l).split('__');
        var _emptyStringIndex;
        while ((_emptyStringIndex = keypath.indexOf('')) > -1) {
          keypath.splice(_emptyStringIndex, 1);
        }
        var cursor = obj;
        keypath.forEach(function _buildSubObj(_subkey, i) {
          if (!_subkey || typeof cursor !== 'object')
            return;
          if (i === keypath.length - 1)
            cursor[_subkey] = env[k];
          if (cursor[_subkey] === undefined)
            cursor[_subkey] = {};
          cursor = cursor[_subkey];
        });
      }
    }
    return obj;
  };
  var find = exports.find = function() {
    var rel = path.join.apply(null, [].slice.call(arguments));
    function find(start, rel) {
      var file = path.join(start, rel);
      try {
        fs.statSync(file);
        return file;
      } catch (err) {
        if (path.dirname(start) !== start)
          return find(path.dirname(start), rel);
      }
    }
    return find(process.cwd(), rel);
  };
})(require('process'));
