/* */ 
(function(process) {
  var mod_assertplus = require('assert-plus');
  var mod_util = require('util');
  var mod_extsprintf = require('extsprintf');
  var mod_isError = require('core-util-is').isError;
  var sprintf = mod_extsprintf.sprintf;
  module.exports = VError;
  VError.VError = VError;
  VError.SError = SError;
  VError.WError = WError;
  VError.MultiError = MultiError;
  function parseConstructorArguments(args) {
    var argv,
        options,
        sprintf_args,
        shortmessage,
        k;
    mod_assertplus.object(args, 'args');
    mod_assertplus.bool(args.strict, 'args.strict');
    mod_assertplus.array(args.argv, 'args.argv');
    argv = args.argv;
    if (argv.length === 0) {
      options = {};
      sprintf_args = [];
    } else if (mod_isError(argv[0])) {
      options = {'cause': argv[0]};
      sprintf_args = argv.slice(1);
    } else if (typeof(argv[0]) === 'object') {
      options = {};
      for (k in argv[0]) {
        options[k] = argv[0][k];
      }
      sprintf_args = argv.slice(1);
    } else {
      mod_assertplus.string(argv[0], 'first argument to VError, SError, or WError ' + 'constructor must be a string, object, or Error');
      options = {};
      sprintf_args = argv;
    }
    mod_assertplus.object(options);
    if (!options.strict && !args.strict) {
      sprintf_args = sprintf_args.map(function(a) {
        return (a === null ? 'null' : a === undefined ? 'undefined' : a);
      });
    }
    if (sprintf_args.length === 0) {
      shortmessage = '';
    } else {
      shortmessage = sprintf.apply(null, sprintf_args);
    }
    return ({
      'options': options,
      'shortmessage': shortmessage
    });
  }
  function VError() {
    var args,
        obj,
        parsed,
        cause,
        ctor,
        message,
        k;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof VError)) {
      obj = Object.create(VError.prototype);
      VError.apply(obj, arguments);
      return (obj);
    }
    parsed = parseConstructorArguments({
      'argv': args,
      'strict': false
    });
    if (parsed.options.name) {
      mod_assertplus.string(parsed.options.name, 'error\'s "name" must be a string');
      this.name = parsed.options.name;
    }
    this.jse_shortmsg = parsed.shortmessage;
    message = parsed.shortmessage;
    cause = parsed.options.cause;
    if (cause) {
      mod_assertplus.ok(mod_isError(cause), 'cause is not an Error');
      this.jse_cause = cause;
      if (!parsed.options.skipCauseMessage) {
        message += ': ' + cause.message;
      }
    }
    this.jse_info = {};
    if (parsed.options.info) {
      for (k in parsed.options.info) {
        this.jse_info[k] = parsed.options.info[k];
      }
    }
    this.message = message;
    Error.call(this, message);
    if (Error.captureStackTrace) {
      ctor = parsed.options.constructorOpt || this.constructor;
      Error.captureStackTrace(this, ctor);
    }
    return (this);
  }
  mod_util.inherits(VError, Error);
  VError.prototype.name = 'VError';
  VError.prototype.toString = function ve_toString() {
    var str = (this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name);
    if (this.message)
      str += ': ' + this.message;
    return (str);
  };
  VError.prototype.cause = function ve_cause() {
    var cause = VError.cause(this);
    return (cause === null ? undefined : cause);
  };
  VError.cause = function(err) {
    mod_assertplus.ok(mod_isError(err), 'err must be an Error');
    return (mod_isError(err.jse_cause) ? err.jse_cause : null);
  };
  VError.info = function(err) {
    var rv,
        cause,
        k;
    mod_assertplus.ok(mod_isError(err), 'err must be an Error');
    cause = VError.cause(err);
    if (cause !== null) {
      rv = VError.info(cause);
    } else {
      rv = {};
    }
    if (typeof(err.jse_info) == 'object' && err.jse_info !== null) {
      for (k in err.jse_info) {
        rv[k] = err.jse_info[k];
      }
    }
    return (rv);
  };
  VError.findCauseByName = function(err, name) {
    var cause;
    mod_assertplus.ok(mod_isError(err), 'err must be an Error');
    mod_assertplus.string(name, 'name');
    mod_assertplus.ok(name.length > 0, 'name cannot be empty');
    for (cause = err; cause !== null; cause = VError.cause(cause)) {
      mod_assertplus.ok(mod_isError(cause));
      if (cause.name == name) {
        return (cause);
      }
    }
    return (null);
  };
  VError.hasCauseWithName = function(err, name) {
    return (VError.findCauseByName(err, name) !== null);
  };
  VError.fullStack = function(err) {
    mod_assertplus.ok(mod_isError(err), 'err must be an Error');
    var cause = VError.cause(err);
    if (cause) {
      return (err.stack + '\ncaused by: ' + VError.fullStack(cause));
    }
    return (err.stack);
  };
  VError.errorFromList = function(errors) {
    mod_assertplus.arrayOfObject(errors, 'errors');
    if (errors.length === 0) {
      return (null);
    }
    errors.forEach(function(e) {
      mod_assertplus.ok(mod_isError(e));
    });
    if (errors.length == 1) {
      return (errors[0]);
    }
    return (new MultiError(errors));
  };
  VError.errorForEach = function(err, func) {
    mod_assertplus.ok(mod_isError(err), 'err must be an Error');
    mod_assertplus.func(func, 'func');
    if (err instanceof MultiError) {
      err.errors().forEach(function iterError(e) {
        func(e);
      });
    } else {
      func(err);
    }
  };
  function SError() {
    var args,
        obj,
        parsed,
        options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof SError)) {
      obj = Object.create(SError.prototype);
      SError.apply(obj, arguments);
      return (obj);
    }
    parsed = parseConstructorArguments({
      'argv': args,
      'strict': true
    });
    options = parsed.options;
    VError.call(this, options, '%s', parsed.shortmessage);
    return (this);
  }
  mod_util.inherits(SError, VError);
  function MultiError(errors) {
    mod_assertplus.array(errors, 'list of errors');
    mod_assertplus.ok(errors.length > 0, 'must be at least one error');
    this.ase_errors = errors;
    VError.call(this, {'cause': errors[0]}, 'first of %d error%s', errors.length, errors.length == 1 ? '' : 's');
  }
  mod_util.inherits(MultiError, VError);
  MultiError.prototype.name = 'MultiError';
  MultiError.prototype.errors = function me_errors() {
    return (this.ase_errors.slice(0));
  };
  function WError() {
    var args,
        obj,
        parsed,
        options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof WError)) {
      obj = Object.create(WError.prototype);
      WError.apply(obj, args);
      return (obj);
    }
    parsed = parseConstructorArguments({
      'argv': args,
      'strict': false
    });
    options = parsed.options;
    options['skipCauseMessage'] = true;
    VError.call(this, options, '%s', parsed.shortmessage);
    return (this);
  }
  mod_util.inherits(WError, VError);
  WError.prototype.name = 'WError';
  WError.prototype.toString = function we_toString() {
    var str = (this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name);
    if (this.message)
      str += ': ' + this.message;
    if (this.jse_cause && this.jse_cause.message)
      str += '; caused by ' + this.jse_cause.toString();
    return (str);
  };
  WError.prototype.cause = function we_cause(c) {
    if (mod_isError(c))
      this.jse_cause = c;
    return (this.jse_cause);
  };
})(require('process'));
