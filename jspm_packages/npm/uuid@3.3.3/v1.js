/* */ 
var rng = require('./lib/rng-browser');
var bytesToUuid = require('./lib/bytesToUuid');
var _nodeId;
var _clockseq;
var _lastMSecs = 0;
var _lastNSecs = 0;
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];
  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }
    if (clockseq == null) {
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs) / 10000;
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }
  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;
  msecs += 12219292800000;
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;
  b[i++] = tmh >>> 24 & 0xf | 0x10;
  b[i++] = tmh >>> 16 & 0xff;
  b[i++] = clockseq >>> 8 | 0x80;
  b[i++] = clockseq & 0xff;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }
  return buf ? buf : bytesToUuid(b);
}
module.exports = v1;
