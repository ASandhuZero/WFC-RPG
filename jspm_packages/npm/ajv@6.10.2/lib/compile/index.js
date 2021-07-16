/* */ 
'use strict';
var resolve = require('./resolve'),
    util = require('./util'),
    errorClasses = require('./error_classes'),
    stableStringify = require('fast-json-stable-stringify');
var validateGenerator = require('../dotjs/validate');
var ucs2length = util.ucs2length;
var equal = require('fast-deep-equal');
var ValidationError = errorClasses.Validation;
module.exports = compile;
function compile(schema, root, localRefs, baseId) {
  var self = this,
      opts = this._opts,
      refVal = [undefined],
      refs = {},
      patterns = [],
      patternsHash = {},
      defaults = [],
      defaultsHash = {},
      customRules = [];
  root = root || {
    schema: schema,
    refVal: refVal,
    refs: refs
  };
  var c = checkCompiling.call(this, schema, root, baseId);
  var compilation = this._compilations[c.index];
  if (c.compiling)
    return (compilation.callValidate = callValidate);
  var formats = this._formats;
  var RULES = this.RULES;
  try {
    var v = localCompile(schema, root, localRefs, baseId);
    compilation.validate = v;
    var cv = compilation.callValidate;
    if (cv) {
      cv.schema = v.schema;
      cv.errors = null;
      cv.refs = v.refs;
      cv.refVal = v.refVal;
      cv.root = v.root;
      cv.$async = v.$async;
      if (opts.sourceCode)
        cv.source = v.source;
    }
    return v;
  } finally {
    endCompiling.call(this, schema, root, baseId);
  }
  function callValidate() {
    var validate = compilation.validate;
    var result = validate.apply(this, arguments);
    callValidate.errors = validate.errors;
    return result;
  }
  function localCompile(_schema, _root, localRefs, baseId) {
    var isRoot = !_root || (_root && _root.schema == _schema);
    if (_root.schema != root.schema)
      return compile.call(self, _schema, _root, localRefs, baseId);
    var $async = _schema.$async === true;
    var sourceCode = validateGenerator({
      isTop: true,
      schema: _schema,
      isRoot: isRoot,
      baseId: baseId,
      root: _root,
      schemaPath: '',
      errSchemaPath: '#',
      errorPath: '""',
      MissingRefError: errorClasses.MissingRef,
      RULES: RULES,
      validate: validateGenerator,
      util: util,
      resolve: resolve,
      resolveRef: resolveRef,
      usePattern: usePattern,
      useDefault: useDefault,
      useCustomRule: useCustomRule,
      opts: opts,
      formats: formats,
      logger: self.logger,
      self: self
    });
    sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode) + vars(defaults, defaultCode) + vars(customRules, customRuleCode) + sourceCode;
    if (opts.processCode)
      sourceCode = opts.processCode(sourceCode);
    var validate;
    try {
      var makeValidate = new Function('self', 'RULES', 'formats', 'root', 'refVal', 'defaults', 'customRules', 'equal', 'ucs2length', 'ValidationError', sourceCode);
      validate = makeValidate(self, RULES, formats, root, refVal, defaults, customRules, equal, ucs2length, ValidationError);
      refVal[0] = validate;
    } catch (e) {
      self.logger.error('Error compiling schema, function code:', sourceCode);
      throw e;
    }
    validate.schema = _schema;
    validate.errors = null;
    validate.refs = refs;
    validate.refVal = refVal;
    validate.root = isRoot ? validate : _root;
    if ($async)
      validate.$async = true;
    if (opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        patterns: patterns,
        defaults: defaults
      };
    }
    return validate;
  }
  function resolveRef(baseId, ref, isRoot) {
    ref = resolve.url(baseId, ref);
    var refIndex = refs[ref];
    var _refVal,
        refCode;
    if (refIndex !== undefined) {
      _refVal = refVal[refIndex];
      refCode = 'refVal[' + refIndex + ']';
      return resolvedRef(_refVal, refCode);
    }
    if (!isRoot && root.refs) {
      var rootRefId = root.refs[ref];
      if (rootRefId !== undefined) {
        _refVal = root.refVal[rootRefId];
        refCode = addLocalRef(ref, _refVal);
        return resolvedRef(_refVal, refCode);
      }
    }
    refCode = addLocalRef(ref);
    var v = resolve.call(self, localCompile, root, ref);
    if (v === undefined) {
      var localSchema = localRefs && localRefs[ref];
      if (localSchema) {
        v = resolve.inlineRef(localSchema, opts.inlineRefs) ? localSchema : compile.call(self, localSchema, root, localRefs, baseId);
      }
    }
    if (v === undefined) {
      removeLocalRef(ref);
    } else {
      replaceLocalRef(ref, v);
      return resolvedRef(v, refCode);
    }
  }
  function addLocalRef(ref, v) {
    var refId = refVal.length;
    refVal[refId] = v;
    refs[ref] = refId;
    return 'refVal' + refId;
  }
  function removeLocalRef(ref) {
    delete refs[ref];
  }
  function replaceLocalRef(ref, v) {
    var refId = refs[ref];
    refVal[refId] = v;
  }
  function resolvedRef(refVal, code) {
    return typeof refVal == 'object' || typeof refVal == 'boolean' ? {
      code: code,
      schema: refVal,
      inline: true
    } : {
      code: code,
      $async: refVal && !!refVal.$async
    };
  }
  function usePattern(regexStr) {
    var index = patternsHash[regexStr];
    if (index === undefined) {
      index = patternsHash[regexStr] = patterns.length;
      patterns[index] = regexStr;
    }
    return 'pattern' + index;
  }
  function useDefault(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return '' + value;
      case 'string':
        return util.toQuotedString(value);
      case 'object':
        if (value === null)
          return 'null';
        var valueStr = stableStringify(value);
        var index = defaultsHash[valueStr];
        if (index === undefined) {
          index = defaultsHash[valueStr] = defaults.length;
          defaults[index] = value;
        }
        return 'default' + index;
    }
  }
  function useCustomRule(rule, schema, parentSchema, it) {
    if (self._opts.validateSchema !== false) {
      var deps = rule.definition.dependencies;
      if (deps && !deps.every(function(keyword) {
        return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
      }))
        throw new Error('parent schema must have all required keywords: ' + deps.join(','));
      var validateSchema = rule.definition.validateSchema;
      if (validateSchema) {
        var valid = validateSchema(schema);
        if (!valid) {
          var message = 'keyword schema is invalid: ' + self.errorsText(validateSchema.errors);
          if (self._opts.validateSchema == 'log')
            self.logger.error(message);
          else
            throw new Error(message);
        }
      }
    }
    var compile = rule.definition.compile,
        inline = rule.definition.inline,
        macro = rule.definition.macro;
    var validate;
    if (compile) {
      validate = compile.call(self, schema, parentSchema, it);
    } else if (macro) {
      validate = macro.call(self, schema, parentSchema, it);
      if (opts.validateSchema !== false)
        self.validateSchema(validate, true);
    } else if (inline) {
      validate = inline.call(self, it, rule.keyword, schema, parentSchema);
    } else {
      validate = rule.definition.validate;
      if (!validate)
        return;
    }
    if (validate === undefined)
      throw new Error('custom keyword "' + rule.keyword + '"failed to compile');
    var index = customRules.length;
    customRules[index] = validate;
    return {
      code: 'customRule' + index,
      validate: validate
    };
  }
}
function checkCompiling(schema, root, baseId) {
  var index = compIndex.call(this, schema, root, baseId);
  if (index >= 0)
    return {
      index: index,
      compiling: true
    };
  index = this._compilations.length;
  this._compilations[index] = {
    schema: schema,
    root: root,
    baseId: baseId
  };
  return {
    index: index,
    compiling: false
  };
}
function endCompiling(schema, root, baseId) {
  var i = compIndex.call(this, schema, root, baseId);
  if (i >= 0)
    this._compilations.splice(i, 1);
}
function compIndex(schema, root, baseId) {
  for (var i = 0; i < this._compilations.length; i++) {
    var c = this._compilations[i];
    if (c.schema == schema && c.root == root && c.baseId == baseId)
      return i;
  }
  return -1;
}
function patternCode(i, patterns) {
  return 'var pattern' + i + ' = new RegExp(' + util.toQuotedString(patterns[i]) + ');';
}
function defaultCode(i) {
  return 'var default' + i + ' = defaults[' + i + '];';
}
function refValCode(i, refVal) {
  return refVal[i] === undefined ? '' : 'var refVal' + i + ' = refVal[' + i + '];';
}
function customRuleCode(i) {
  return 'var customRule' + i + ' = customRules[' + i + '];';
}
function vars(arr, statement) {
  if (!arr.length)
    return '';
  var code = '';
  for (var i = 0; i < arr.length; i++)
    code += statement(i, arr);
  return code;
}
