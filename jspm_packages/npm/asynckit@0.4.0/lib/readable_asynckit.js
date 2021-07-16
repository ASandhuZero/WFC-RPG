/* */ 
var streamify = require('./streamify'),
    defer = require('./defer');
;
module.exports = ReadableAsyncKit;
function ReadableAsyncKit() {
  ReadableAsyncKit.super_.apply(this, arguments);
  this.jobs = {};
  this.destroy = destroy;
  this._start = _start;
  this._read = _read;
}
function destroy() {
  if (this.destroyed) {
    return;
  }
  this.destroyed = true;
  if (typeof this.terminator == 'function') {
    this.terminator();
  }
}
function _start() {
  var runner = arguments[0],
      args = Array.prototype.slice.call(arguments, 1),
      input = args[0],
      endCb = streamify.callback.call(this, args[args.length - 1]);
  ;
  args[args.length - 1] = endCb;
  args[1] = streamify.iterator.call(this, args[1]);
  defer(function() {
    if (!this.destroyed) {
      this.terminator = runner.apply(null, args);
    } else {
      endCb(null, Array.isArray(input) ? [] : {});
    }
  }.bind(this));
}
function _read() {}
