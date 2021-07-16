/* */ 
(function(Buffer, process) {
  'use strict';
  var MAX_BYTES = 65536;
  var MAX_UINT32 = 4294967295;
  function oldBrowser() {
    throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11');
  }
  var Buffer = require('safe-buffer').Buffer;
  var crypto = global.crypto || global.msCrypto;
  if (crypto && crypto.getRandomValues) {
    module.exports = randomBytes;
  } else {
    module.exports = oldBrowser;
  }
  function randomBytes(size, cb) {
    if (size > MAX_UINT32)
      throw new RangeError('requested too many random bytes');
    var bytes = Buffer.allocUnsafe(size);
    if (size > 0) {
      if (size > MAX_BYTES) {
        for (var generated = 0; generated < size; generated += MAX_BYTES) {
          crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES));
        }
      } else {
        crypto.getRandomValues(bytes);
      }
    }
    if (typeof cb === 'function') {
      return process.nextTick(function() {
        cb(null, bytes);
      });
    }
    return bytes;
  }
})(require('buffer').Buffer, require('process'));
