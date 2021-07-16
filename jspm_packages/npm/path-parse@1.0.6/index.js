/* */ 
(function(process) {
  'use strict';
  var isWindows = process.platform === 'win32';
  var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
  var splitTailRe = /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;
  var win32 = {};
  function win32SplitPath(filename) {
    var result = splitDeviceRe.exec(filename),
        device = (result[1] || '') + (result[2] || ''),
        tail = result[3] || '';
    var result2 = splitTailRe.exec(tail),
        dir = result2[1],
        basename = result2[2],
        ext = result2[3];
    return [device, dir, basename, ext];
  }
  win32.parse = function(pathString) {
    if (typeof pathString !== 'string') {
      throw new TypeError("Parameter 'pathString' must be a string, not " + typeof pathString);
    }
    var allParts = win32SplitPath(pathString);
    if (!allParts || allParts.length !== 4) {
      throw new TypeError("Invalid path '" + pathString + "'");
    }
    return {
      root: allParts[0],
      dir: allParts[0] + allParts[1].slice(0, -1),
      base: allParts[2],
      ext: allParts[3],
      name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
    };
  };
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var posix = {};
  function posixSplitPath(filename) {
    return splitPathRe.exec(filename).slice(1);
  }
  posix.parse = function(pathString) {
    if (typeof pathString !== 'string') {
      throw new TypeError("Parameter 'pathString' must be a string, not " + typeof pathString);
    }
    var allParts = posixSplitPath(pathString);
    if (!allParts || allParts.length !== 4) {
      throw new TypeError("Invalid path '" + pathString + "'");
    }
    allParts[1] = allParts[1] || '';
    allParts[2] = allParts[2] || '';
    allParts[3] = allParts[3] || '';
    return {
      root: allParts[0],
      dir: allParts[0] + allParts[1].slice(0, -1),
      base: allParts[2],
      ext: allParts[3],
      name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
    };
  };
  if (isWindows)
    module.exports = win32.parse;
  else
    module.exports = posix.parse;
  module.exports.posix = posix.parse;
  module.exports.win32 = win32.parse;
})(require('process'));
