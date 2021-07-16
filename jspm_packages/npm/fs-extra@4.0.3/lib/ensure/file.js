/* */ 
'use strict';
const u = require('universalify').fromCallback;
const path = require('path');
const fs = require('graceful-fs');
const mkdir = require('../mkdirs/index');
const pathExists = require('../path-exists/index').pathExists;
function createFile(file, callback) {
  function makeFile() {
    fs.writeFile(file, '', (err) => {
      if (err)
        return callback(err);
      callback();
    });
  }
  fs.stat(file, (err, stats) => {
    if (!err && stats.isFile())
      return callback();
    const dir = path.dirname(file);
    pathExists(dir, (err, dirExists) => {
      if (err)
        return callback(err);
      if (dirExists)
        return makeFile();
      mkdir.mkdirs(dir, (err) => {
        if (err)
          return callback(err);
        makeFile();
      });
    });
  });
}
function createFileSync(file) {
  let stats;
  try {
    stats = fs.statSync(file);
  } catch (e) {}
  if (stats && stats.isFile())
    return;
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir);
  }
  fs.writeFileSync(file, '');
}
module.exports = {
  createFile: u(createFile),
  createFileSync
};
