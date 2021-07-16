/* */ 
(function(process) {
  'use strict';
  var pna = require('process-nextick-args');
  function destroy(err, cb) {
    var _this = this;
    var readableDestroyed = this._readableState && this._readableState.destroyed;
    var writableDestroyed = this._writableState && this._writableState.destroyed;
    if (readableDestroyed || writableDestroyed) {
      if (cb) {
        cb(err);
      } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
        pna.nextTick(emitErrorNT, this, err);
      }
      return this;
    }
    if (this._readableState) {
      this._readableState.destroyed = true;
    }
    if (this._writableState) {
      this._writableState.destroyed = true;
    }
    this._destroy(err || null, function(err) {
      if (!cb && err) {
        pna.nextTick(emitErrorNT, _this, err);
        if (_this._writableState) {
          _this._writableState.errorEmitted = true;
        }
      } else if (cb) {
        cb(err);
      }
    });
    return this;
  }
  function undestroy() {
    if (this._readableState) {
      this._readableState.destroyed = false;
      this._readableState.reading = false;
      this._readableState.ended = false;
      this._readableState.endEmitted = false;
    }
    if (this._writableState) {
      this._writableState.destroyed = false;
      this._writableState.ended = false;
      this._writableState.ending = false;
      this._writableState.finished = false;
      this._writableState.errorEmitted = false;
    }
  }
  function emitErrorNT(self, err) {
    self.emit('error', err);
  }
  module.exports = {
    destroy: destroy,
    undestroy: undestroy
  };
})(require('process'));
