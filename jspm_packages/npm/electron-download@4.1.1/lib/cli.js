/* */ 
(function(process) {
  'use strict';
  const download = require('./index');
  const minimist = require('minimist');
  const opts = minimist(process.argv.slice(2));
  if (opts['strict-ssl'] === false) {
    opts.strictSSL = false;
  }
  download(opts, (err, zipPath) => {
    if (err)
      throw err;
    console.log('Downloaded zip:', zipPath);
    process.exit(0);
  });
})(require('process'));
