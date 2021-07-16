/* */ 
'use strict';
const fs = require('graceful-fs');
const path = require('path');
const mkdir = require('../mkdirs/index');
const jsonFile = require('./jsonfile');
function outputJsonSync(file, data, options) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir);
  }
  jsonFile.writeJsonSync(file, data, options);
}
module.exports = outputJsonSync;
