/* */ 
(function(process) {
  var serialOrdered = require('../serialOrdered');
  module.exports = ReadableSerialOrdered;
  module.exports.ascending = serialOrdered.ascending;
  module.exports.descending = serialOrdered.descending;
  function ReadableSerialOrdered(list, iterator, sortMethod, callback) {
    if (!(this instanceof ReadableSerialOrdered)) {
      return new ReadableSerialOrdered(list, iterator, sortMethod, callback);
    }
    ReadableSerialOrdered.super_.call(this, {objectMode: true});
    this._start(serialOrdered, list, iterator, sortMethod, callback);
  }
})(require('process'));
