/* */ 
(function(process) {
  'use strict';
  var util = require('util');
  var currentlyUnhandled = require('currently-unhandled');
  module.exports = util.deprecate(function(process) {
    return {currentlyUnhandled: currentlyUnhandled(process)};
  }, 'loudRejection/api is deprecated. Use the currently-unhandled module instead.');
})(require('process'));
