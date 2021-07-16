/* */ 
var abort = require('./abort'),
    async = require('./async');
;
module.exports = terminator;
function terminator(callback) {
  if (!Object.keys(this.jobs).length) {
    return;
  }
  this.index = this.size;
  abort(this);
  async(callback)(null, this.results);
}
