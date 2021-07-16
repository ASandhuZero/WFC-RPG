/* */ 
'use strict';
var MissingRefError = require('./error_classes').MissingRef;
module.exports = compileAsync;
function compileAsync(schema, meta, callback) {
  var self = this;
  if (typeof this._opts.loadSchema != 'function')
    throw new Error('options.loadSchema should be a function');
  if (typeof meta == 'function') {
    callback = meta;
    meta = undefined;
  }
  var p = loadMetaSchemaOf(schema).then(function() {
    var schemaObj = self._addSchema(schema, undefined, meta);
    return schemaObj.validate || _compileAsync(schemaObj);
  });
  if (callback) {
    p.then(function(v) {
      callback(null, v);
    }, callback);
  }
  return p;
  function loadMetaSchemaOf(sch) {
    var $schema = sch.$schema;
    return $schema && !self.getSchema($schema) ? compileAsync.call(self, {$ref: $schema}, true) : Promise.resolve();
  }
  function _compileAsync(schemaObj) {
    try {
      return self._compile(schemaObj);
    } catch (e) {
      if (e instanceof MissingRefError)
        return loadMissingSchema(e);
      throw e;
    }
    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (added(ref))
        throw new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved');
      var schemaPromise = self._loadingSchemas[ref];
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
        schemaPromise.then(removePromise, removePromise);
      }
      return schemaPromise.then(function(sch) {
        if (!added(ref)) {
          return loadMetaSchemaOf(sch).then(function() {
            if (!added(ref))
              self.addSchema(sch, ref, undefined, meta);
          });
        }
      }).then(function() {
        return _compileAsync(schemaObj);
      });
      function removePromise() {
        delete self._loadingSchemas[ref];
      }
      function added(ref) {
        return self._refs[ref] || self._schemas[ref];
      }
    }
  }
}
