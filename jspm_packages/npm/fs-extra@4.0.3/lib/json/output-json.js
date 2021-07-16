/* */ 
'use strict';
const path = require('path');
const mkdir = require('../mkdirs/index');
const pathExists = require('../path-exists/index').pathExists;
const jsonFile = require('./jsonfile');
function outputJson(file, data, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const dir = path.dirname(file);
  pathExists(dir, (err, itDoes) => {
    if (err)
      return callback(err);
    if (itDoes)
      return jsonFile.writeJson(file, data, options, callback);
    mkdir.mkdirs(dir, (err) => {
      if (err)
        return callback(err);
      jsonFile.writeJson(file, data, options, callback);
    });
  });
}
module.exports = outputJson;
