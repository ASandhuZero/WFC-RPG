/* */ 
(function(Buffer) {
  var fs = require('fs');
  var zlib = require('zlib');
  var fd_slicer = require('fd-slicer');
  var util = require('util');
  var EventEmitter = require('events').EventEmitter;
  var Transform = require('stream').Transform;
  var PassThrough = require('stream').PassThrough;
  var Writable = require('stream').Writable;
  exports.open = open;
  exports.fromFd = fromFd;
  exports.fromBuffer = fromBuffer;
  exports.fromRandomAccessReader = fromRandomAccessReader;
  exports.dosDateTimeToDate = dosDateTimeToDate;
  exports.ZipFile = ZipFile;
  exports.Entry = Entry;
  exports.RandomAccessReader = RandomAccessReader;
  function open(path, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    if (options == null)
      options = {};
    if (options.autoClose == null)
      options.autoClose = true;
    if (options.lazyEntries == null)
      options.lazyEntries = false;
    if (callback == null)
      callback = defaultCallback;
    fs.open(path, "r", function(err, fd) {
      if (err)
        return callback(err);
      fromFd(fd, options, function(err, zipfile) {
        if (err)
          fs.close(fd, defaultCallback);
        callback(err, zipfile);
      });
    });
  }
  function fromFd(fd, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    if (options == null)
      options = {};
    if (options.autoClose == null)
      options.autoClose = false;
    if (options.lazyEntries == null)
      options.lazyEntries = false;
    if (callback == null)
      callback = defaultCallback;
    fs.fstat(fd, function(err, stats) {
      if (err)
        return callback(err);
      var reader = fd_slicer.createFromFd(fd, {autoClose: true});
      fromRandomAccessReader(reader, stats.size, options, callback);
    });
  }
  function fromBuffer(buffer, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    if (options == null)
      options = {};
    options.autoClose = false;
    if (options.lazyEntries == null)
      options.lazyEntries = false;
    var reader = fd_slicer.createFromBuffer(buffer);
    fromRandomAccessReader(reader, buffer.length, options, callback);
  }
  function fromRandomAccessReader(reader, totalSize, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    if (options == null)
      options = {};
    if (options.autoClose == null)
      options.autoClose = true;
    if (options.lazyEntries == null)
      options.lazyEntries = false;
    if (callback == null)
      callback = defaultCallback;
    if (typeof totalSize !== "number")
      throw new Error("expected totalSize parameter to be a number");
    if (totalSize > Number.MAX_SAFE_INTEGER) {
      throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
    }
    reader.ref();
    var eocdrWithoutCommentSize = 22;
    var maxCommentSize = 0x10000;
    var bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, totalSize);
    var buffer = new Buffer(bufferSize);
    var bufferReadStart = totalSize - buffer.length;
    readAndAssertNoEof(reader, buffer, 0, bufferSize, bufferReadStart, function(err) {
      if (err)
        return callback(err);
      for (var i = bufferSize - eocdrWithoutCommentSize; i >= 0; i -= 1) {
        if (buffer.readUInt32LE(i) !== 0x06054b50)
          continue;
        var eocdrBuffer = buffer.slice(i);
        var diskNumber = eocdrBuffer.readUInt16LE(4);
        if (diskNumber !== 0)
          return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
        var entryCount = eocdrBuffer.readUInt16LE(10);
        var centralDirectoryOffset = eocdrBuffer.readUInt32LE(16);
        var commentLength = eocdrBuffer.readUInt16LE(20);
        var expectedCommentLength = eocdrBuffer.length - eocdrWithoutCommentSize;
        if (commentLength !== expectedCommentLength) {
          return callback(new Error("invalid comment length. expected: " + expectedCommentLength + ". found: " + commentLength));
        }
        var comment = bufferToString(eocdrBuffer, 22, eocdrBuffer.length, false);
        if (!(entryCount === 0xffff || centralDirectoryOffset === 0xffffffff)) {
          return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries));
        }
        var zip64EocdlBuffer = new Buffer(20);
        var zip64EocdlOffset = bufferReadStart + i - zip64EocdlBuffer.length;
        readAndAssertNoEof(reader, zip64EocdlBuffer, 0, zip64EocdlBuffer.length, zip64EocdlOffset, function(err) {
          if (err)
            return callback(err);
          if (zip64EocdlBuffer.readUInt32LE(0) !== 0x07064b50) {
            return callback(new Error("invalid ZIP64 End of Central Directory Locator signature"));
          }
          var zip64EocdrOffset = readUInt64LE(zip64EocdlBuffer, 8);
          var zip64EocdrBuffer = new Buffer(56);
          readAndAssertNoEof(reader, zip64EocdrBuffer, 0, zip64EocdrBuffer.length, zip64EocdrOffset, function(err) {
            if (err)
              return callback(err);
            if (zip64EocdrBuffer.readUInt32LE(0) !== 0x06064b50)
              return callback(new Error("invalid ZIP64 end of central directory record signature"));
            entryCount = readUInt64LE(zip64EocdrBuffer, 32);
            centralDirectoryOffset = readUInt64LE(zip64EocdrBuffer, 48);
            return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries));
          });
        });
        return;
      }
      callback(new Error("end of central directory record signature not found"));
    });
  }
  util.inherits(ZipFile, EventEmitter);
  function ZipFile(reader, centralDirectoryOffset, fileSize, entryCount, comment, autoClose, lazyEntries) {
    var self = this;
    EventEmitter.call(self);
    self.reader = reader;
    self.reader.on("error", function(err) {
      emitError(self, err);
    });
    self.reader.once("close", function() {
      self.emit("close");
    });
    self.readEntryCursor = centralDirectoryOffset;
    self.fileSize = fileSize;
    self.entryCount = entryCount;
    self.comment = comment;
    self.entriesRead = 0;
    self.autoClose = !!autoClose;
    self.lazyEntries = !!lazyEntries;
    self.isOpen = true;
    self.emittedError = false;
    if (!self.lazyEntries)
      self.readEntry();
  }
  ZipFile.prototype.close = function() {
    if (!this.isOpen)
      return;
    this.isOpen = false;
    this.reader.unref();
  };
  function emitErrorAndAutoClose(self, err) {
    if (self.autoClose)
      self.close();
    emitError(self, err);
  }
  function emitError(self, err) {
    if (self.emittedError)
      return;
    self.emittedError = true;
    self.emit("error", err);
  }
  ZipFile.prototype.readEntry = function() {
    var self = this;
    if (self.entryCount === self.entriesRead) {
      setImmediate(function() {
        if (self.autoClose)
          self.close();
        if (self.emittedError)
          return;
        self.emit("end");
      });
      return;
    }
    if (self.emittedError)
      return;
    var buffer = new Buffer(46);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
      if (err)
        return emitErrorAndAutoClose(self, err);
      if (self.emittedError)
        return;
      var entry = new Entry();
      var signature = buffer.readUInt32LE(0);
      if (signature !== 0x02014b50)
        return emitErrorAndAutoClose(self, new Error("invalid central directory file header signature: 0x" + signature.toString(16)));
      entry.versionMadeBy = buffer.readUInt16LE(4);
      entry.versionNeededToExtract = buffer.readUInt16LE(6);
      entry.generalPurposeBitFlag = buffer.readUInt16LE(8);
      entry.compressionMethod = buffer.readUInt16LE(10);
      entry.lastModFileTime = buffer.readUInt16LE(12);
      entry.lastModFileDate = buffer.readUInt16LE(14);
      entry.crc32 = buffer.readUInt32LE(16);
      entry.compressedSize = buffer.readUInt32LE(20);
      entry.uncompressedSize = buffer.readUInt32LE(24);
      entry.fileNameLength = buffer.readUInt16LE(28);
      entry.extraFieldLength = buffer.readUInt16LE(30);
      entry.fileCommentLength = buffer.readUInt16LE(32);
      entry.internalFileAttributes = buffer.readUInt16LE(36);
      entry.externalFileAttributes = buffer.readUInt32LE(38);
      entry.relativeOffsetOfLocalHeader = buffer.readUInt32LE(42);
      self.readEntryCursor += 46;
      buffer = new Buffer(entry.fileNameLength + entry.extraFieldLength + entry.fileCommentLength);
      readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
        if (err)
          return emitErrorAndAutoClose(self, err);
        if (self.emittedError)
          return;
        var isUtf8 = entry.generalPurposeBitFlag & 0x800;
        try {
          entry.fileName = bufferToString(buffer, 0, entry.fileNameLength, isUtf8);
        } catch (e) {
          return emitErrorAndAutoClose(self, e);
        }
        var fileCommentStart = entry.fileNameLength + entry.extraFieldLength;
        var extraFieldBuffer = buffer.slice(entry.fileNameLength, fileCommentStart);
        entry.extraFields = [];
        var i = 0;
        while (i < extraFieldBuffer.length) {
          var headerId = extraFieldBuffer.readUInt16LE(i + 0);
          var dataSize = extraFieldBuffer.readUInt16LE(i + 2);
          var dataStart = i + 4;
          var dataEnd = dataStart + dataSize;
          var dataBuffer = new Buffer(dataSize);
          extraFieldBuffer.copy(dataBuffer, 0, dataStart, dataEnd);
          entry.extraFields.push({
            id: headerId,
            data: dataBuffer
          });
          i = dataEnd;
        }
        try {
          entry.fileComment = bufferToString(buffer, fileCommentStart, fileCommentStart + entry.fileCommentLength, isUtf8);
        } catch (e) {
          return emitErrorAndAutoClose(self, e);
        }
        self.readEntryCursor += buffer.length;
        self.entriesRead += 1;
        if (entry.uncompressedSize === 0xffffffff || entry.compressedSize === 0xffffffff || entry.relativeOffsetOfLocalHeader === 0xffffffff) {
          var zip64EiefBuffer = null;
          for (var i = 0; i < entry.extraFields.length; i++) {
            var extraField = entry.extraFields[i];
            if (extraField.id === 0x0001) {
              zip64EiefBuffer = extraField.data;
              break;
            }
          }
          if (zip64EiefBuffer == null)
            return emitErrorAndAutoClose(self, new Error("expected Zip64 Extended Information Extra Field"));
          var index = 0;
          if (entry.uncompressedSize === 0xffffffff) {
            if (index + 8 > zip64EiefBuffer.length)
              return emitErrorAndAutoClose(self, new Error("Zip64 Extended Information Extra Field does not include Original Size"));
            entry.uncompressedSize = readUInt64LE(zip64EiefBuffer, index);
            index += 8;
          }
          if (entry.compressedSize === 0xffffffff) {
            if (index + 8 > zip64EiefBuffer.length)
              return emitErrorAndAutoClose(self, new Error("Zip64 Extended Information Extra Field does not include Compressed Size"));
            entry.compressedSize = readUInt64LE(zip64EiefBuffer, index);
            index += 8;
          }
          if (entry.relativeOffsetOfLocalHeader === 0xffffffff) {
            if (index + 8 > zip64EiefBuffer.length)
              return emitErrorAndAutoClose(self, new Error("Zip64 Extended Information Extra Field does not include Relative Header Offset"));
            entry.relativeOffsetOfLocalHeader = readUInt64LE(zip64EiefBuffer, index);
            index += 8;
          }
        }
        if (entry.compressionMethod === 0) {
          if (entry.compressedSize !== entry.uncompressedSize) {
            var msg = "compressed/uncompressed size mismatch for stored file: " + entry.compressedSize + " != " + entry.uncompressedSize;
            return emitErrorAndAutoClose(self, new Error(msg));
          }
        }
        if (entry.fileName.indexOf("\\") !== -1)
          return emitErrorAndAutoClose(self, new Error("invalid characters in fileName: " + entry.fileName));
        if (/^[a-zA-Z]:/.test(entry.fileName) || /^\//.test(entry.fileName))
          return emitErrorAndAutoClose(self, new Error("absolute path: " + entry.fileName));
        if (entry.fileName.split("/").indexOf("..") !== -1)
          return emitErrorAndAutoClose(self, new Error("invalid relative path: " + entry.fileName));
        self.emit("entry", entry);
        if (!self.lazyEntries)
          self.readEntry();
      });
    });
  };
  ZipFile.prototype.openReadStream = function(entry, callback) {
    var self = this;
    if (!self.isOpen)
      return callback(new Error("closed"));
    self.reader.ref();
    var buffer = new Buffer(30);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader, function(err) {
      try {
        if (err)
          return callback(err);
        var signature = buffer.readUInt32LE(0);
        if (signature !== 0x04034b50)
          return callback(new Error("invalid local file header signature: 0x" + signature.toString(16)));
        var fileNameLength = buffer.readUInt16LE(26);
        var extraFieldLength = buffer.readUInt16LE(28);
        var localFileHeaderEnd = entry.relativeOffsetOfLocalHeader + buffer.length + fileNameLength + extraFieldLength;
        var compressed;
        if (entry.compressionMethod === 0) {
          compressed = false;
        } else if (entry.compressionMethod === 8) {
          compressed = true;
        } else {
          return callback(new Error("unsupported compression method: " + entry.compressionMethod));
        }
        var fileDataStart = localFileHeaderEnd;
        var fileDataEnd = fileDataStart + entry.compressedSize;
        if (entry.compressedSize !== 0) {
          if (fileDataEnd > self.fileSize) {
            return callback(new Error("file data overflows file bounds: " + fileDataStart + " + " + entry.compressedSize + " > " + self.fileSize));
          }
        }
        var readStream = self.reader.createReadStream({
          start: fileDataStart,
          end: fileDataEnd
        });
        var endpointStream = readStream;
        if (compressed) {
          var destroyed = false;
          var inflateFilter = zlib.createInflateRaw();
          readStream.on("error", function(err) {
            setImmediate(function() {
              if (!destroyed)
                inflateFilter.emit("error", err);
            });
          });
          var checkerStream = new AssertByteCountStream(entry.uncompressedSize);
          inflateFilter.on("error", function(err) {
            setImmediate(function() {
              if (!destroyed)
                checkerStream.emit("error", err);
            });
          });
          checkerStream.destroy = function() {
            destroyed = true;
            inflateFilter.unpipe(checkerStream);
            readStream.unpipe(inflateFilter);
            readStream.destroy();
          };
          endpointStream = readStream.pipe(inflateFilter).pipe(checkerStream);
        }
        callback(null, endpointStream);
      } finally {
        self.reader.unref();
      }
    });
  };
  function Entry() {}
  Entry.prototype.getLastModDate = function() {
    return dosDateTimeToDate(this.lastModFileDate, this.lastModFileTime);
  };
  function dosDateTimeToDate(date, time) {
    var day = date & 0x1f;
    var month = (date >> 5 & 0xf) - 1;
    var year = (date >> 9 & 0x7f) + 1980;
    var millisecond = 0;
    var second = (time & 0x1f) * 2;
    var minute = time >> 5 & 0x3f;
    var hour = time >> 11 & 0x1f;
    return new Date(year, month, day, hour, minute, second, millisecond);
  }
  function readAndAssertNoEof(reader, buffer, offset, length, position, callback) {
    if (length === 0) {
      return setImmediate(function() {
        callback(null, new Buffer(0));
      });
    }
    reader.read(buffer, offset, length, position, function(err, bytesRead) {
      if (err)
        return callback(err);
      if (bytesRead < length)
        return callback(new Error("unexpected EOF"));
      callback();
    });
  }
  util.inherits(AssertByteCountStream, Transform);
  function AssertByteCountStream(byteCount) {
    Transform.call(this);
    this.actualByteCount = 0;
    this.expectedByteCount = byteCount;
  }
  AssertByteCountStream.prototype._transform = function(chunk, encoding, cb) {
    this.actualByteCount += chunk.length;
    if (this.actualByteCount > this.expectedByteCount) {
      var msg = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
      return cb(new Error(msg));
    }
    cb(null, chunk);
  };
  AssertByteCountStream.prototype._flush = function(cb) {
    if (this.actualByteCount < this.expectedByteCount) {
      var msg = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
      return cb(new Error(msg));
    }
    cb();
  };
  util.inherits(RandomAccessReader, EventEmitter);
  function RandomAccessReader() {
    EventEmitter.call(this);
    this.refCount = 0;
  }
  RandomAccessReader.prototype.ref = function() {
    this.refCount += 1;
  };
  RandomAccessReader.prototype.unref = function() {
    var self = this;
    self.refCount -= 1;
    if (self.refCount > 0)
      return;
    if (self.refCount < 0)
      throw new Error("invalid unref");
    self.close(onCloseDone);
    function onCloseDone(err) {
      if (err)
        return self.emit('error', err);
      self.emit('close');
    }
  };
  RandomAccessReader.prototype.createReadStream = function(options) {
    var start = options.start;
    var end = options.end;
    if (start === end) {
      var emptyStream = new PassThrough();
      setImmediate(function() {
        emptyStream.end();
      });
      return emptyStream;
    }
    var stream = this._readStreamForRange(start, end);
    var destroyed = false;
    var refUnrefFilter = new RefUnrefFilter(this);
    stream.on("error", function(err) {
      setImmediate(function() {
        if (!destroyed)
          refUnrefFilter.emit("error", err);
      });
    });
    refUnrefFilter.destroy = function() {
      stream.unpipe(refUnrefFilter);
      refUnrefFilter.unref();
      stream.destroy();
    };
    var byteCounter = new AssertByteCountStream(end - start);
    refUnrefFilter.on("error", function(err) {
      setImmediate(function() {
        if (!destroyed)
          byteCounter.emit("error", err);
      });
    });
    byteCounter.destroy = function() {
      destroyed = true;
      refUnrefFilter.unpipe(byteCounter);
      refUnrefFilter.destroy();
    };
    return stream.pipe(refUnrefFilter).pipe(byteCounter);
  };
  RandomAccessReader.prototype._readStreamForRange = function(start, end) {
    throw new Error("not implemented");
  };
  RandomAccessReader.prototype.read = function(buffer, offset, length, position, callback) {
    var readStream = this.createReadStream({
      start: position,
      end: position + length
    });
    var writeStream = new Writable();
    var written = 0;
    writeStream._write = function(chunk, encoding, cb) {
      chunk.copy(buffer, offset + written, 0, chunk.length);
      written += chunk.length;
      cb();
    };
    writeStream.on("finish", callback);
    readStream.on("error", function(error) {
      callback(error);
    });
    readStream.pipe(writeStream);
  };
  RandomAccessReader.prototype.close = function(callback) {
    setImmediate(callback);
  };
  util.inherits(RefUnrefFilter, PassThrough);
  function RefUnrefFilter(context) {
    PassThrough.call(this);
    this.context = context;
    this.context.ref();
    this.unreffedYet = false;
  }
  RefUnrefFilter.prototype._flush = function(cb) {
    this.unref();
    cb();
  };
  RefUnrefFilter.prototype.unref = function(cb) {
    if (this.unreffedYet)
      return;
    this.unreffedYet = true;
    this.context.unref();
  };
  var cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
  function bufferToString(buffer, start, end, isUtf8) {
    if (isUtf8) {
      return buffer.toString("utf8", start, end);
    } else {
      var result = "";
      for (var i = start; i < end; i++) {
        result += cp437[buffer[i]];
      }
      return result;
    }
  }
  function readUInt64LE(buffer, offset) {
    var lower32 = buffer.readUInt32LE(offset);
    var upper32 = buffer.readUInt32LE(offset + 4);
    return upper32 * 0x100000000 + lower32;
  }
  function defaultCallback(err) {
    if (err)
      throw err;
  }
})(require('buffer').Buffer);
