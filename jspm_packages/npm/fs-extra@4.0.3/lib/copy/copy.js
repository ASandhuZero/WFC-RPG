/* */ 
(function(process) {
  'use strict';
  const fs = require('graceful-fs');
  const path = require('path');
  const ncp = require('./ncp');
  const mkdir = require('../mkdirs/index');
  const pathExists = require('../path-exists/index').pathExists;
  function copy(src, dest, options, callback) {
    if (typeof options === 'function' && !callback) {
      callback = options;
      options = {};
    } else if (typeof options === 'function' || options instanceof RegExp) {
      options = {filter: options};
    }
    callback = callback || function() {};
    options = options || {};
    if (options.preserveTimestamps && process.arch === 'ia32') {
      console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`);
    }
    const basePath = process.cwd();
    const currentPath = path.resolve(basePath, src);
    const targetPath = path.resolve(basePath, dest);
    if (currentPath === targetPath)
      return callback(new Error('Source and destination must not be the same.'));
    fs.lstat(src, (err, stats) => {
      if (err)
        return callback(err);
      let dir = null;
      if (stats.isDirectory()) {
        const parts = dest.split(path.sep);
        parts.pop();
        dir = parts.join(path.sep);
      } else {
        dir = path.dirname(dest);
      }
      pathExists(dir, (err, dirExists) => {
        if (err)
          return callback(err);
        if (dirExists)
          return ncp(src, dest, options, callback);
        mkdir.mkdirs(dir, (err) => {
          if (err)
            return callback(err);
          ncp(src, dest, options, callback);
        });
      });
    });
  }
  module.exports = copy;
})(require('process'));
