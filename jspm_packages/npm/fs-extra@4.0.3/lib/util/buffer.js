/* */ 
(function(Buffer) {
  module.exports = function(size) {
    if (typeof Buffer.allocUnsafe === 'function') {
      try {
        return Buffer.allocUnsafe(size);
      } catch (e) {
        return new Buffer(size);
      }
    }
    return new Buffer(size);
  };
})(require('buffer').Buffer);
