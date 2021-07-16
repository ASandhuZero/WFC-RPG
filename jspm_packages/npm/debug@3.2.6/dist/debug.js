/* */ 
"format cjs";
(function(process) {
  "use strict";
  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }
    return _typeof(obj);
  }
  (function(f) {
    if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
      module.exports = f();
    } else if (typeof define === "function" && define.amd) {
      define([], f);
    } else {
      var g;
      if (typeof window !== "undefined") {
        g = window;
      } else if (typeof global !== "undefined") {
        g = global;
      } else if (typeof self !== "undefined") {
        g = self;
      } else {
        g = this;
      }
      g.debug = f();
    }
  })(function() {
    var define,
        module,
        exports;
    return function() {
      function r(e, n, t) {
        function o(i, f) {
          if (!n[i]) {
            if (!e[i]) {
              var c = "function" == typeof require && require;
              if (!f && c)
                return c(i, !0);
              if (u)
                return u(i, !0);
              var a = new Error("Cannot find module '" + i + "'");
              throw a.code = "MODULE_NOT_FOUND", a;
            }
            var p = n[i] = {exports: {}};
            e[i][0].call(p.exports, function(r) {
              var n = e[i][1][r];
              return o(n || r);
            }, p, p.exports, r, e, n, t);
          }
          return n[i].exports;
        }
        for (var u = "function" == typeof require && require,
            i = 0; i < t.length; i++) {
          o(t[i]);
        }
        return o;
      }
      return r;
    }()({
      1: [function(require, module, exports) {
        var s = 1000;
        var m = s * 60;
        var h = m * 60;
        var d = h * 24;
        var w = d * 7;
        var y = d * 365.25;
        module.exports = function(val, options) {
          options = options || {};
          var type = _typeof(val);
          if (type === 'string' && val.length > 0) {
            return parse(val);
          } else if (type === 'number' && isNaN(val) === false) {
            return options.long ? fmtLong(val) : fmtShort(val);
          }
          throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
        };
        function parse(str) {
          str = String(str);
          if (str.length > 100) {
            return;
          }
          var match = /^((?:\d+)?\-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
          if (!match) {
            return;
          }
          var n = parseFloat(match[1]);
          var type = (match[2] || 'ms').toLowerCase();
          switch (type) {
            case 'years':
            case 'year':
            case 'yrs':
            case 'yr':
            case 'y':
              return n * y;
            case 'weeks':
            case 'week':
            case 'w':
              return n * w;
            case 'days':
            case 'day':
            case 'd':
              return n * d;
            case 'hours':
            case 'hour':
            case 'hrs':
            case 'hr':
            case 'h':
              return n * h;
            case 'minutes':
            case 'minute':
            case 'mins':
            case 'min':
            case 'm':
              return n * m;
            case 'seconds':
            case 'second':
            case 'secs':
            case 'sec':
            case 's':
              return n * s;
            case 'milliseconds':
            case 'millisecond':
            case 'msecs':
            case 'msec':
            case 'ms':
              return n;
            default:
              return undefined;
          }
        }
        function fmtShort(ms) {
          var msAbs = Math.abs(ms);
          if (msAbs >= d) {
            return Math.round(ms / d) + 'd';
          }
          if (msAbs >= h) {
            return Math.round(ms / h) + 'h';
          }
          if (msAbs >= m) {
            return Math.round(ms / m) + 'm';
          }
          if (msAbs >= s) {
            return Math.round(ms / s) + 's';
          }
          return ms + 'ms';
        }
        function fmtLong(ms) {
          var msAbs = Math.abs(ms);
          if (msAbs >= d) {
            return plural(ms, msAbs, d, 'day');
          }
          if (msAbs >= h) {
            return plural(ms, msAbs, h, 'hour');
          }
          if (msAbs >= m) {
            return plural(ms, msAbs, m, 'minute');
          }
          if (msAbs >= s) {
            return plural(ms, msAbs, s, 'second');
          }
          return ms + ' ms';
        }
        function plural(ms, msAbs, n, name) {
          var isPlural = msAbs >= n * 1.5;
          return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
        }
      }, {}],
      2: [function(require, module, exports) {
        var process = module.exports = {};
        var cachedSetTimeout;
        var cachedClearTimeout;
        function defaultSetTimout() {
          throw new Error('setTimeout has not been defined');
        }
        function defaultClearTimeout() {
          throw new Error('clearTimeout has not been defined');
        }
        (function() {
          try {
            if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout;
            } else {
              cachedSetTimeout = defaultSetTimout;
            }
          } catch (e) {
            cachedSetTimeout = defaultSetTimout;
          }
          try {
            if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout;
            } else {
              cachedClearTimeout = defaultClearTimeout;
            }
          } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
          }
        })();
        function runTimeout(fun) {
          if (cachedSetTimeout === setTimeout) {
            return setTimeout(fun, 0);
          }
          if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
          }
          try {
            return cachedSetTimeout(fun, 0);
          } catch (e) {
            try {
              return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
              return cachedSetTimeout.call(this, fun, 0);
            }
          }
        }
        function runClearTimeout(marker) {
          if (cachedClearTimeout === clearTimeout) {
            return clearTimeout(marker);
          }
          if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
          }
          try {
            return cachedClearTimeout(marker);
          } catch (e) {
            try {
              return cachedClearTimeout.call(null, marker);
            } catch (e) {
              return cachedClearTimeout.call(this, marker);
            }
          }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;
        function cleanUpNextTick() {
          if (!draining || !currentQueue) {
            return;
          }
          draining = false;
          if (currentQueue.length) {
            queue = currentQueue.concat(queue);
          } else {
            queueIndex = -1;
          }
          if (queue.length) {
            drainQueue();
          }
        }
        function drainQueue() {
          if (draining) {
            return;
          }
          var timeout = runTimeout(cleanUpNextTick);
          draining = true;
          var len = queue.length;
          while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
              if (currentQueue) {
                currentQueue[queueIndex].run();
              }
            }
            queueIndex = -1;
            len = queue.length;
          }
          currentQueue = null;
          draining = false;
          runClearTimeout(timeout);
        }
        process.nextTick = function(fun) {
          var args = new Array(arguments.length - 1);
          if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
            }
          }
          queue.push(new Item(fun, args));
          if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
          }
        };
        function Item(fun, array) {
          this.fun = fun;
          this.array = array;
        }
        Item.prototype.run = function() {
          this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = '';
        process.versions = {};
        function noop() {}
        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;
        process.listeners = function(name) {
          return [];
        };
        process.binding = function(name) {
          throw new Error('process.binding is not supported');
        };
        process.cwd = function() {
          return '/';
        };
        process.chdir = function(dir) {
          throw new Error('process.chdir is not supported');
        };
        process.umask = function() {
          return 0;
        };
      }, {}],
      3: [function(require, module, exports) {
        function setup(env) {
          createDebug.debug = createDebug;
          createDebug.default = createDebug;
          createDebug.coerce = coerce;
          createDebug.disable = disable;
          createDebug.enable = enable;
          createDebug.enabled = enabled;
          createDebug.humanize = require('ms');
          Object.keys(env).forEach(function(key) {
            createDebug[key] = env[key];
          });
          createDebug.instances = [];
          createDebug.names = [];
          createDebug.skips = [];
          createDebug.formatters = {};
          function selectColor(namespace) {
            var hash = 0;
            for (var i = 0; i < namespace.length; i++) {
              hash = (hash << 5) - hash + namespace.charCodeAt(i);
              hash |= 0;
            }
            return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
          }
          createDebug.selectColor = selectColor;
          function createDebug(namespace) {
            var prevTime;
            function debug() {
              for (var _len = arguments.length,
                  args = new Array(_len),
                  _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }
              if (!debug.enabled) {
                return;
              }
              var self = debug;
              var curr = Number(new Date());
              var ms = curr - (prevTime || curr);
              self.diff = ms;
              self.prev = prevTime;
              self.curr = curr;
              prevTime = curr;
              args[0] = createDebug.coerce(args[0]);
              if (typeof args[0] !== 'string') {
                args.unshift('%O');
              }
              var index = 0;
              args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
                if (match === '%%') {
                  return match;
                }
                index++;
                var formatter = createDebug.formatters[format];
                if (typeof formatter === 'function') {
                  var val = args[index];
                  match = formatter.call(self, val);
                  args.splice(index, 1);
                  index--;
                }
                return match;
              });
              createDebug.formatArgs.call(self, args);
              var logFn = self.log || createDebug.log;
              logFn.apply(self, args);
            }
            debug.namespace = namespace;
            debug.enabled = createDebug.enabled(namespace);
            debug.useColors = createDebug.useColors();
            debug.color = selectColor(namespace);
            debug.destroy = destroy;
            debug.extend = extend;
            if (typeof createDebug.init === 'function') {
              createDebug.init(debug);
            }
            createDebug.instances.push(debug);
            return debug;
          }
          function destroy() {
            var index = createDebug.instances.indexOf(this);
            if (index !== -1) {
              createDebug.instances.splice(index, 1);
              return true;
            }
            return false;
          }
          function extend(namespace, delimiter) {
            return createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
          }
          function enable(namespaces) {
            createDebug.save(namespaces);
            createDebug.names = [];
            createDebug.skips = [];
            var i;
            var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
            var len = split.length;
            for (i = 0; i < len; i++) {
              if (!split[i]) {
                continue;
              }
              namespaces = split[i].replace(/\*/g, '.*?');
              if (namespaces[0] === '-') {
                createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
              } else {
                createDebug.names.push(new RegExp('^' + namespaces + '$'));
              }
            }
            for (i = 0; i < createDebug.instances.length; i++) {
              var instance = createDebug.instances[i];
              instance.enabled = createDebug.enabled(instance.namespace);
            }
          }
          function disable() {
            createDebug.enable('');
          }
          function enabled(name) {
            if (name[name.length - 1] === '*') {
              return true;
            }
            var i;
            var len;
            for (i = 0, len = createDebug.skips.length; i < len; i++) {
              if (createDebug.skips[i].test(name)) {
                return false;
              }
            }
            for (i = 0, len = createDebug.names.length; i < len; i++) {
              if (createDebug.names[i].test(name)) {
                return true;
              }
            }
            return false;
          }
          function coerce(val) {
            if (val instanceof Error) {
              return val.stack || val.message;
            }
            return val;
          }
          createDebug.enable(createDebug.load());
          return createDebug;
        }
        module.exports = setup;
      }, {"ms": 1}],
      4: [function(require, module, exports) {
        (function(process) {
          exports.log = log;
          exports.formatArgs = formatArgs;
          exports.save = save;
          exports.load = load;
          exports.useColors = useColors;
          exports.storage = localstorage();
          exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
          function useColors() {
            if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
              return true;
            }
            if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
              return false;
            }
            return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
          }
          function formatArgs(args) {
            args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);
            if (!this.useColors) {
              return;
            }
            var c = 'color: ' + this.color;
            args.splice(1, 0, c, 'color: inherit');
            var index = 0;
            var lastC = 0;
            args[0].replace(/%[a-zA-Z%]/g, function(match) {
              if (match === '%%') {
                return;
              }
              index++;
              if (match === '%c') {
                lastC = index;
              }
            });
            args.splice(lastC, 0, c);
          }
          function log() {
            var _console;
            return (typeof console === "undefined" ? "undefined" : _typeof(console)) === 'object' && console.log && (_console = console).log.apply(_console, arguments);
          }
          function save(namespaces) {
            try {
              if (namespaces) {
                exports.storage.setItem('debug', namespaces);
              } else {
                exports.storage.removeItem('debug');
              }
            } catch (error) {}
          }
          function load() {
            var r;
            try {
              r = exports.storage.getItem('debug');
            } catch (error) {}
            if (!r && typeof process !== 'undefined' && 'env' in process) {
              r = process.env.DEBUG;
            }
            return r;
          }
          function localstorage() {
            try {
              return localStorage;
            } catch (error) {}
          }
          module.exports = require('./common')(exports);
          var formatters = module.exports.formatters;
          formatters.j = function(v) {
            try {
              return JSON.stringify(v);
            } catch (error) {
              return '[UnexpectedJSONParseError]: ' + error.message;
            }
          };
        }).call(this, require('_process'));
      }, {
        "./common": 3,
        "_process": 2
      }]
    }, {}, [4])(4);
  });
})(require('process'));
