/* */ 
(function(process) {
  var async = require('./async'),
      abort = require('./abort');
  ;
  module.exports = iterate;
  function iterate(list, iterator, state, callback) {
    var key = state['keyedList'] ? state['keyedList'][state.index] : state.index;
    state.jobs[key] = runJob(iterator, key, list[key], function(error, output) {
      if (!(key in state.jobs)) {
        return;
      }
      delete state.jobs[key];
      if (error) {
        abort(state);
      } else {
        state.results[key] = output;
      }
      callback(error, state.results);
    });
  }
  function runJob(iterator, key, item, callback) {
    var aborter;
    if (iterator.length == 2) {
      aborter = iterator(item, async(callback));
    } else {
      aborter = iterator(item, key, async(callback));
    }
    return aborter;
  }
})(require('process'));
