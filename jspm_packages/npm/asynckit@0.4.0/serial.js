/* */ 
(function(process) {
  var serialOrdered = require('./serialOrdered');
  module.exports = serial;
  function serial(list, iterator, callback) {
    return serialOrdered(list, iterator, null, callback);
  }
})(require('process'));
