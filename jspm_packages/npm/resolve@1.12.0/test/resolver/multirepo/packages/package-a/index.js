/* */ 
'use strict';
var assert = require('assert');
var path = require('path');
var resolve = require('../../../../../index');
var basedir = __dirname + '/node_modules/@my-scope/package-b';
var expected = path.join(__dirname, '../../node_modules/jquery/dist/jquery.js');
assert.equal(resolve.sync('jquery', {
  basedir: basedir,
  preserveSymlinks: false
}), expected);
assert.equal(resolve.sync('../../node_modules/jquery', {
  basedir: basedir,
  preserveSymlinks: false
}), expected);
assert.equal(resolve.sync('jquery', {
  basedir: basedir,
  preserveSymlinks: true
}), expected);
assert.equal(resolve.sync('../../../../../node_modules/jquery', {
  basedir: basedir,
  preserveSymlinks: true
}), expected);
console.log(' * all monorepo paths successfully resolved through symlinks');
