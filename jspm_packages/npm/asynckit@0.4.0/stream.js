/* */ 
var inherits = require('util').inherits,
    Readable = require('stream').Readable,
    ReadableAsyncKit = require('./lib/readable_asynckit'),
    ReadableParallel = require('./lib/readable_parallel'),
    ReadableSerial = require('./lib/readable_serial'),
    ReadableSerialOrdered = require('./lib/readable_serial_ordered');
;
module.exports = {
  parallel: ReadableParallel,
  serial: ReadableSerial,
  serialOrdered: ReadableSerialOrdered
};
inherits(ReadableAsyncKit, Readable);
inherits(ReadableParallel, ReadableAsyncKit);
inherits(ReadableSerial, ReadableAsyncKit);
inherits(ReadableSerialOrdered, ReadableAsyncKit);
