/* */ 
(function(process) {
  var parallel = require('../parallel');
  module.exports = ReadableParallel;
  function ReadableParallel(list, iterator, callback) {
    if (!(this instanceof ReadableParallel)) {
      return new ReadableParallel(list, iterator, callback);
    }
    ReadableParallel.super_.call(this, {objectMode: true});
    this._start(parallel, list, iterator, callback);
  }
})(require('process'));
