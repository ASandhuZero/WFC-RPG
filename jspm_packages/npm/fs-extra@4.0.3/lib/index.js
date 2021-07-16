/* */ 
'use strict';
const assign = require('./util/assign');
const fs = {};
assign(fs, require('./fs/index'));
assign(fs, require('./copy/index'));
assign(fs, require('./copy-sync/index'));
assign(fs, require('./mkdirs/index'));
assign(fs, require('./remove/index'));
assign(fs, require('./json/index'));
assign(fs, require('./move/index'));
assign(fs, require('./move-sync/index'));
assign(fs, require('./empty/index'));
assign(fs, require('./ensure/index'));
assign(fs, require('./output/index'));
assign(fs, require('./path-exists/index'));
module.exports = fs;
