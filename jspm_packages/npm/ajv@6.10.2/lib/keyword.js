/* */ 
'use strict';
var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;
var customRuleCode = require('./dotjs/custom');
var definitionSchema = require('./definition_schema');
module.exports = {
  add: addKeyword,
  get: getKeyword,
  remove: removeKeyword,
  validate: validateKeyword
};
function addKeyword(keyword, definition) {
  var RULES = this.RULES;
  if (RULES.keywords[keyword])
    throw new Error('Keyword ' + keyword + ' is already defined');
  if (!IDENTIFIER.test(keyword))
    throw new Error('Keyword ' + keyword + ' is not a valid identifier');
  if (definition) {
    this.validateKeyword(definition, true);
    var dataType = definition.type;
    if (Array.isArray(dataType)) {
      for (var i = 0; i < dataType.length; i++)
        _addRule(keyword, dataType[i], definition);
    } else {
      _addRule(keyword, dataType, definition);
    }
    var metaSchema = definition.metaSchema;
    if (metaSchema) {
      if (definition.$data && this._opts.$data) {
        metaSchema = {anyOf: [metaSchema, {'$ref': 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/data.json#'}]};
      }
      definition.validateSchema = this.compile(metaSchema, true);
    }
  }
  RULES.keywords[keyword] = RULES.all[keyword] = true;
  function _addRule(keyword, dataType, definition) {
    var ruleGroup;
    for (var i = 0; i < RULES.length; i++) {
      var rg = RULES[i];
      if (rg.type == dataType) {
        ruleGroup = rg;
        break;
      }
    }
    if (!ruleGroup) {
      ruleGroup = {
        type: dataType,
        rules: []
      };
      RULES.push(ruleGroup);
    }
    var rule = {
      keyword: keyword,
      definition: definition,
      custom: true,
      code: customRuleCode,
      implements: definition.implements
    };
    ruleGroup.rules.push(rule);
    RULES.custom[keyword] = rule;
  }
  return this;
}
function getKeyword(keyword) {
  var rule = this.RULES.custom[keyword];
  return rule ? rule.definition : this.RULES.keywords[keyword] || false;
}
function removeKeyword(keyword) {
  var RULES = this.RULES;
  delete RULES.keywords[keyword];
  delete RULES.all[keyword];
  delete RULES.custom[keyword];
  for (var i = 0; i < RULES.length; i++) {
    var rules = RULES[i].rules;
    for (var j = 0; j < rules.length; j++) {
      if (rules[j].keyword == keyword) {
        rules.splice(j, 1);
        break;
      }
    }
  }
  return this;
}
function validateKeyword(definition, throwError) {
  validateKeyword.errors = null;
  var v = this._validateKeyword = this._validateKeyword || this.compile(definitionSchema, true);
  if (v(definition))
    return true;
  validateKeyword.errors = v.errors;
  if (throwError)
    throw new Error('custom keyword definition is invalid: ' + this.errorsText(v.errors));
  else
    return false;
}
