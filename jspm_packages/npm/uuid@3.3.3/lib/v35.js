/* */ 
var bytesToUuid = require('./bytesToUuid');
function uuidToBytes(uuid) {
  var bytes = [];
  uuid.replace(/[a-fA-F0-9]{2}/g, function(hex) {
    bytes.push(parseInt(hex, 16));
  });
  return bytes;
}
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  var bytes = new Array(str.length);
  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
module.exports = function(name, version, hashfunc) {
  var generateUUID = function(value, namespace, buf, offset) {
    var off = buf && offset || 0;
    if (typeof(value) == 'string')
      value = stringToBytes(value);
    if (typeof(namespace) == 'string')
      namespace = uuidToBytes(namespace);
    if (!Array.isArray(value))
      throw TypeError('value must be an array of bytes');
    if (!Array.isArray(namespace) || namespace.length !== 16)
      throw TypeError('namespace must be uuid string or an Array of 16 byte values');
    var bytes = hashfunc(namespace.concat(value));
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    if (buf) {
      for (var idx = 0; idx < 16; ++idx) {
        buf[off + idx] = bytes[idx];
      }
    }
    return buf || bytesToUuid(bytes);
  };
  try {
    generateUUID.name = name;
  } catch (err) {}
  generateUUID.DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  generateUUID.URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
  return generateUUID;
};
