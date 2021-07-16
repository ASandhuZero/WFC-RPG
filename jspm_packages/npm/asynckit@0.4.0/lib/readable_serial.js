/* */ 
(function(process) {
  var serial = require('../serial');
  module.exports = ReadableSerial;
  function ReadableSerial(list, iterator, callback) {
    if (!(this instanceof ReadableSerial)) {
      return new ReadableSerial(list, iterator, callback);
    }
    ReadableSerial.super_.call(this, {objectMode: true});
    this._start(serial, list, iterator, callback);
  }
})(require('process'));
