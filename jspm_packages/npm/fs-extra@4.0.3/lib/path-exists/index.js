/* */ 
'use strict';
const u = require('universalify').fromPromise;
const fs = require('../fs/index');
function pathExists(path) {
  return fs.access(path).then(() => true).catch(() => false);
}
module.exports = {
  pathExists: u(pathExists),
  pathExistsSync: fs.existsSync
};
