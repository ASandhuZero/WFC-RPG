/* */ 
(function(process) {
  'use strict';
  const fs = require('graceful-fs');
  const path = require('path');
  const invalidWin32Path = require('./win32').invalidWin32Path;
  const o777 = parseInt('0777', 8);
  function mkdirs(p, opts, callback, made) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    } else if (!opts || typeof opts !== 'object') {
      opts = {mode: opts};
    }
    if (process.platform === 'win32' && invalidWin32Path(p)) {
      const errInval = new Error(p + ' contains invalid WIN32 path characters.');
      errInval.code = 'EINVAL';
      return callback(errInval);
    }
    let mode = opts.mode;
    const xfs = opts.fs || fs;
    if (mode === undefined) {
      mode = o777 & (~process.umask());
    }
    if (!made)
      made = null;
    callback = callback || function() {};
    p = path.resolve(p);
    xfs.mkdir(p, mode, (er) => {
      if (!er) {
        made = made || p;
        return callback(null, made);
      }
      switch (er.code) {
        case 'ENOENT':
          if (path.dirname(p) === p)
            return callback(er);
          mkdirs(path.dirname(p), opts, (er, made) => {
            if (er)
              callback(er, made);
            else
              mkdirs(p, opts, callback, made);
          });
          break;
        default:
          xfs.stat(p, (er2, stat) => {
            if (er2 || !stat.isDirectory())
              callback(er, made);
            else
              callback(null, made);
          });
          break;
      }
    });
  }
  module.exports = mkdirs;
})(require('process'));
