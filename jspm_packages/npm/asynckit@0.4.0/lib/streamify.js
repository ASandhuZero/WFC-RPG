/* */ 
var async = require('./async');
module.exports = {
  iterator: wrapIterator,
  callback: wrapCallback
};
function wrapIterator(iterator) {
  var stream = this;
  return function(item, key, cb) {
    var aborter,
        wrappedCb = async(wrapIteratorCallback.call(stream, cb, key));
    ;
    stream.jobs[key] = wrappedCb;
    if (iterator.length == 2) {
      aborter = iterator(item, wrappedCb);
    } else {
      aborter = iterator(item, key, wrappedCb);
    }
    return aborter;
  };
}
function wrapCallback(callback) {
  var stream = this;
  var wrapped = function(error, result) {
    return finisher.call(stream, error, result, callback);
  };
  return wrapped;
}
function wrapIteratorCallback(callback, key) {
  var stream = this;
  return function(error, output) {
    if (!(key in stream.jobs)) {
      callback(error, output);
      return;
    }
    delete stream.jobs[key];
    return streamer.call(stream, error, {
      key: key,
      value: output
    }, callback);
  };
}
function streamer(error, output, callback) {
  if (error && !this.error) {
    this.error = error;
    this.pause();
    this.emit('error', error);
    callback(error, output && output.value);
    return;
  }
  this.push(output);
  callback(error, output && output.value);
}
function finisher(error, output, callback) {
  if (!error) {
    this.push(null);
  }
  callback(error, output);
}
