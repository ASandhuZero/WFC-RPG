/* */ 
(function(process) {
  var iterate = require('./lib/iterate'),
      initState = require('./lib/state'),
      terminator = require('./lib/terminator');
  ;
  module.exports = parallel;
  function parallel(list, iterator, callback) {
    var state = initState(list);
    while (state.index < (state['keyedList'] || list).length) {
      iterate(list, iterator, state, function(error, result) {
        if (error) {
          callback(error, result);
          return;
        }
        if (Object.keys(state.jobs).length === 0) {
          callback(null, state.results);
          return;
        }
      });
      state.index++;
    }
    return terminator.bind(state, callback);
  }
})(require('process'));
