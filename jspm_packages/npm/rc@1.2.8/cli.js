/* */ 
(function(process) {
  var rc = require('./index');
  console.log(JSON.stringify(rc(process.argv[2]), false, 2));
})(require('process'));
