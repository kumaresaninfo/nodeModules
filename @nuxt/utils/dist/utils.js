/*!
 * @nuxt/utils v2.14.7 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const consola = require('consola');
const hash = require('hash-sum');
const fs = require('fs-extra');
const properlock = require('proper-lockfile');
const onExit = require('signal-exit');
const serialize = require('serialize-javascript');
const UAParser = require('ua-parser-js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
const hash__default = /*#__PURE__*/_interopDefaultLegacy(hash);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const properlock__default = /*#__PURE__*/_interopDefaultLegacy(properlock);
const onExit__default = /*#__PURE__*/_interopDefaultLegacy(onExit);
const serialize__default = /*#__PURE__*/_interopDefaultLegacy(serialize);
const UAParser__default = /*#__PURE__*/_interopDefaultLegacy(UAParser);

const TARGETS = {
  server: 'server',
  static: 'static'
};

const MODES = {
  universal: 'universal',
  spa: 'spa'
};

const getContext = function getContext (req, res) {
  return { req, res }
};

const determineGlobals = function determineGlobals (globalName, globals) {
  const _globals = {};
  for (const global in globals) {
    if (typeof globals[global] === 'function') {
      _globals[global] = globals[global](globalName);
    } else {
      _globals[global] = globals[global];
    }
  }
  return _globals
};

const isFullStatic = function (options) {
  return !options.dev && !options._legacyGenerate && options.target === TARGETS.static && options.render.ssr
};

const encodeHtml = function encodeHtml (str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
};

const isString = obj => typeof obj === 'string' || obj instanceof String;

const isNonEmptyString = obj => Boolean(obj && isString(obj));

const isPureObject = obj => !Array.isArray(obj) && typeof obj === 'object';

const isUrl = function isUrl (url) {
  return ['http', '//'].some(str => url.startsWith(str))
};

const urlJoin = function urlJoin () {
  return [].slice
    .call(arguments)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(':/', '://')
};

/**
 * Wraps value in array if it is not already an array
 *
 * @param  {any} value
 * @return {array}
 */
const wrapArray = value => Array.isArray(value) ? value : [value];

const WHITESPACE_REPLACEMENTS = [
  [/[ \t\f\r]+\n/g, '\n'], // strip empty indents
  [/{\n{2,}/g, '{\n'], // strip start padding from blocks
  [/\n{2,}([ \t\f\r]*})/g, '\n$1'], // strip end padding from blocks
  [/\n{3,}/g, '\n\n'], // strip multiple blank lines (1 allowed)
  [/\n{2,}$/g, '\n'] // strip blank lines EOF (0 allowed)
];

const stripWhitespace = function stripWhitespace (string) {
  WHITESPACE_REPLACEMENTS.forEach(([regex, newSubstr]) => {
    string = string.replace(regex, newSubstr);
  });
  return string
};

const lockPaths = new Set();

const defaultLockOptions = {
  stale: 30000,
  onCompromised: err => consola__default['default'].warn(err)
};

function getLockOptions (options) {
  return Object.assign({}, defaultLockOptions, options)
}

function createLockPath ({ id = 'nuxt', dir, root }) {
  const sum = hash__default['default'](`${root}-${dir}`);

  return path__default['default'].resolve(root, 'node_modules/.cache/nuxt', `${id}-lock-${sum}`)
}

async function getLockPath (config) {
  const lockPath = createLockPath(config);

  // the lock is created for the lockPath as ${lockPath}.lock
  // so the (temporary) lockPath needs to exist
  await fs__default['default'].ensureDir(lockPath);

  return lockPath
}

async function lock ({ id, dir, root, options }) {
  const lockPath = await getLockPath({ id, dir, root });

  try {
    const locked = await properlock__default['default'].check(lockPath);
    if (locked) {
      consola__default['default'].fatal(`A lock with id '${id}' already exists on ${dir}`);
    }
  } catch (e) {
    consola__default['default'].debug(`Check for an existing lock with id '${id}' on ${dir} failed`, e);
  }

  let lockWasCompromised = false;
  let release;

  try {
    options = getLockOptions(options);

    const onCompromised = options.onCompromised;
    options.onCompromised = (err) => {
      onCompromised(err);
      lockWasCompromised = true;
    };

    release = await properlock__default['default'].lock(lockPath, options);
  } catch (e) {}

  if (!release) {
    consola__default['default'].warn(`Unable to get a lock with id '${id}' on ${dir} (but will continue)`);
    return false
  }

  if (!lockPaths.size) {
    // make sure to always cleanup our temporary lockPaths
    onExit__default['default'](() => {
      for (const lockPath of lockPaths) {
        fs__default['default'].removeSync(lockPath);
      }
    });
  }

  lockPaths.add(lockPath);

  return async function lockRelease () {
    try {
      await fs__default['default'].remove(lockPath);
      lockPaths.delete(lockPath);

      // release as last so the lockPath is still removed
      // when it fails on a compromised lock
      await release();
    } catch (e) {
      if (!lockWasCompromised || !e.message.includes('already released')) {
        consola__default['default'].debug(e);
        return
      }

      // proper-lockfile doesnt remove lockDir when lock is compromised
      // removing it here could cause the 'other' process to throw an error
      // as well, but in our case its much more likely the lock was
      // compromised due to mtime update timeouts
      const lockDir = `${lockPath}.lock`;
      if (await fs__default['default'].exists(lockDir)) {
        await fs__default['default'].remove(lockDir);
      }
    }
  }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol = _root.Symbol;

var _Symbol = Symbol;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

var _arrayMap = arrayMap;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag);
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray_1(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return _arrayMap(value, baseToString) + '';
  }
  if (isSymbol_1(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

var _baseToString = baseToString;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : _baseToString(value);
}

var toString_1 = toString;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
function escapeRegExp(string) {
  string = toString_1(string);
  return (string && reHasRegExpChar.test(string))
    ? string.replace(reRegExpChar, '\\$&')
    : string;
}

var escapeRegExp_1 = escapeRegExp;

const startsWithAlias = aliasArray => str => aliasArray.some(c => str.startsWith(c));

const startsWithSrcAlias = startsWithAlias(['@', '~']);

const startsWithRootAlias = startsWithAlias(['@@', '~~']);

const isWindows = process.platform.startsWith('win');

const wp = function wp (p = '') {
  if (isWindows) {
    return p.replace(/\\/g, '\\\\')
  }
  return p
};

// Kept for backward compat (modules may use it from template context)
const wChunk = function wChunk (p = '') {
  return p
};

const reqSep = /\//g;
const sysSep = escapeRegExp_1(path__default['default'].sep);
const normalize = string => string.replace(reqSep, sysSep);

const r = function r (...args) {
  const lastArg = args[args.length - 1];

  if (startsWithSrcAlias(lastArg)) {
    return wp(lastArg)
  }

  return wp(path__default['default'].resolve(...args.map(normalize)))
};

const relativeTo = function relativeTo (...args) {
  const dir = args.shift();

  // Keep webpack inline loader intact
  if (args[0].includes('!')) {
    const loaders = args.shift().split('!');

    return loaders.concat(relativeTo(dir, loaders.pop(), ...args)).join('!')
  }

  // Resolve path
  const resolvedPath = r(...args);

  // Check if path is an alias
  if (startsWithSrcAlias(resolvedPath)) {
    return resolvedPath
  }

  // Make correct relative path
  let rp = path__default['default'].relative(dir, resolvedPath);
  if (rp[0] !== '.') {
    rp = '.' + path__default['default'].sep + rp;
  }

  return wp(rp)
};

function defineAlias (src, target, prop, opts = {}) {
  const { bind = true, warn = false } = opts;

  if (Array.isArray(prop)) {
    for (const p of prop) {
      defineAlias(src, target, p, opts);
    }
    return
  }

  let targetVal = target[prop];
  if (bind && typeof targetVal === 'function') {
    targetVal = targetVal.bind(target);
  }

  let warned = false;

  Object.defineProperty(src, prop, {
    get: () => {
      if (warn && !warned) {
        warned = true;
        consola__default['default'].warn({
          message: `'${prop}' is deprecated'`,
          additional: new Error().stack.split('\n').splice(2).join('\n')
        });
      }
      return targetVal
    }
  });
}

const isIndex = s => /(.*)\/index\.[^/]+$/.test(s);

function isIndexFileAndFolder (pluginFiles) {
  // Return early in case the matching file count exceeds 2 (index.js + folder)
  if (pluginFiles.length !== 2) {
    return false
  }
  return pluginFiles.some(isIndex)
}

const getMainModule = () => {
  return require.main || (module && module.main) || module
};

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray_1(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol_1(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

var _isKey = isKey;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar$1, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */
var nativeCreate = _getNative(Object, 'create');

var _nativeCreate = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

var _hashClear = hashClear;

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

var _hashDelete = hashDelete;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

var _hashGet = hashGet;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
}

var _hashHas = hashHas;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

var _hashSet = hashSet;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;

var _Hash = Hash;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

var _listCacheClear = listCacheClear;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

var eq_1 = eq;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

var _assocIndexOf = assocIndexOf;

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

var _listCacheDelete = listCacheDelete;

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

var _listCacheGet = listCacheGet;

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

var _listCacheHas = listCacheHas;

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

var _listCacheSet = listCacheSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;

var _ListCache = ListCache;

/* Built-in method references that are verified to be native. */
var Map$1 = _getNative(_root, 'Map');

var _Map = Map$1;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash,
    'map': new (_Map || _ListCache),
    'string': new _Hash
  };
}

var _mapCacheClear = mapCacheClear;

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

var _isKeyable = isKeyable;

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

var _getMapData = getMapData;

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

var _mapCacheDelete = mapCacheDelete;

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

var _mapCacheGet = mapCacheGet;

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

var _mapCacheHas = mapCacheHas;

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

var _mapCacheSet = mapCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;

var _MapCache = MapCache;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || _MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = _MapCache;

var memoize_1 = memoize;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize_1(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

var _memoizeCapped = memoizeCapped;

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = _memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

var _stringToPath = stringToPath;

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray_1(value)) {
    return value;
  }
  return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
}

var _castPath = castPath;

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol_1(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
}

var _toKey = toKey;

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = _castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[_toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

var _baseGet = baseGet;

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : _baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

var get_1 = get;

const routeChildren = function (route) {
  const hasChildWithEmptyPath = route.children.some(child => child.path === '');
  if (hasChildWithEmptyPath) {
    return route.children
  }
  return [
    // Add default child to render parent page
    {
      ...route,
      children: undefined
    },
    ...route.children
  ]
};

const flatRoutes = function flatRoutes (router, fileName = '', routes = []) {
  router.forEach((r) => {
    if ([':', '*'].some(c => r.path.includes(c))) {
      return
    }
    const route = `${fileName}${r.path}/`.replace(/\/+/g, '/');
    if (r.children) {
      return flatRoutes(routeChildren(r), route, routes)
    }

    // if child path is already absolute, do not make any concatenations
    if (r.path && r.path.startsWith('/')) {
      routes.push(r.path);
    } else if (route !== '/' && route[route.length - 1] === '/') {
      routes.push(route.slice(0, -1));
    } else {
      routes.push(route);
    }
  });
  return routes
};

function cleanChildrenRoutes (routes, isChild = false, routeNameSplitter = '-', trailingSlash, parentRouteName) {
  const regExpIndex = new RegExp(`${routeNameSplitter}index$`);
  const regExpParentRouteName = new RegExp(`^${parentRouteName}${routeNameSplitter}`);
  const routesIndex = [];
  routes.forEach((route) => {
    if (regExpIndex.test(route.name) || route.name === 'index') {
      const res = route.name.replace(regExpParentRouteName, '').split(routeNameSplitter);
      routesIndex.push(res);
    }
  });
  routes.forEach((route) => {
    route.path = isChild ? route.path.replace('/', '') : route.path;
    if (route.path.includes('?')) {
      if (route.name.endsWith(`${routeNameSplitter}index`)) {
        route.path = route.path.replace(/\?$/, '');
      }
      const names = route.name.replace(regExpParentRouteName, '').split(routeNameSplitter);
      const paths = route.path.split('/');
      if (!isChild) {
        paths.shift();
      } // clean first / for parents
      routesIndex.forEach((r) => {
        const i = r.indexOf('index');
        if (i < paths.length) {
          for (let a = 0; a <= i; a++) {
            if (a === i) {
              paths[a] = paths[a].replace('?', '');
            }
            if (a < i && names[a] !== r[a]) {
              break
            }
          }
        }
      });
      route.path = (isChild ? '' : '/') + paths.join('/');
    }
    route.name = route.name.replace(regExpIndex, '');
    if (route.children) {
      const indexRoutePath = trailingSlash === false ? '/' : '';
      const defaultChildRoute = route.children.find(child => child.path === indexRoutePath);
      const routeName = route.name;
      if (defaultChildRoute) {
        if (trailingSlash === false) {
          defaultChildRoute.name = route.name;
        }
        delete route.name;
      }
      route.children = cleanChildrenRoutes(route.children, true, routeNameSplitter, trailingSlash, routeName);
    }
  });
  return routes
}

const DYNAMIC_ROUTE_REGEX = /^\/([:*])/;

const sortRoutes = function sortRoutes (routes) {
  routes.sort((a, b) => {
    if (!a.path.length) {
      return -1
    }
    if (!b.path.length) {
      return 1
    }
    // Order: /static, /index, /:dynamic
    // Match exact route before index: /login before /index/_slug
    if (a.path === '/') {
      return DYNAMIC_ROUTE_REGEX.test(b.path) ? -1 : 1
    }
    if (b.path === '/') {
      return DYNAMIC_ROUTE_REGEX.test(a.path) ? 1 : -1
    }

    let i;
    let res = 0;
    let y = 0;
    let z = 0;
    const _a = a.path.split('/');
    const _b = b.path.split('/');
    for (i = 0; i < _a.length; i++) {
      if (res !== 0) {
        break
      }
      y = _a[i] === '*' ? 2 : _a[i].includes(':') ? 1 : 0;
      z = _b[i] === '*' ? 2 : _b[i].includes(':') ? 1 : 0;
      res = y - z;
      // If a.length >= b.length
      if (i === _b.length - 1 && res === 0) {
        // unless * found sort by level, then alphabetically
        res = _a[i] === '*' ? -1 : (
          _a.length === _b.length ? a.path.localeCompare(b.path) : (_a.length - _b.length)
        );
      }
    }

    if (res === 0) {
      // unless * found sort by level, then alphabetically
      res = _a[i - 1] === '*' && _b[i] ? 1 : (
        _a.length === _b.length ? a.path.localeCompare(b.path) : (_a.length - _b.length)
      );
    }
    return res
  });

  routes.forEach((route) => {
    if (route.children) {
      sortRoutes(route.children);
    }
  });

  return routes
};

const createRoutes = function createRoutes ({
  files,
  srcDir,
  pagesDir = '',
  routeNameSplitter = '-',
  supportedExtensions = ['vue', 'js'],
  trailingSlash
}) {
  const routes = [];
  files.forEach((file) => {
    const keys = file
      .replace(new RegExp(`^${pagesDir}`), '')
      .replace(new RegExp(`\\.(${supportedExtensions.join('|')})$`), '')
      .replace(/\/{2,}/g, '/')
      .split('/')
      .slice(1);
    const route = { name: '', path: '', component: r(srcDir, file) };
    let parent = routes;
    keys.forEach((key, i) => {
      // remove underscore only, if its the prefix
      const sanitizedKey = key.startsWith('_') ? key.substr(1) : key;

      route.name = route.name
        ? route.name + routeNameSplitter + sanitizedKey
        : sanitizedKey;
      route.name += key === '_' ? 'all' : '';
      route.chunkName = file.replace(new RegExp(`\\.(${supportedExtensions.join('|')})$`), '');
      const child = parent.find(parentRoute => parentRoute.name === route.name);

      if (child) {
        child.children = child.children || [];
        parent = child.children;
        route.path = '';
      } else if (key === 'index' && i + 1 === keys.length) {
        route.path += i > 0 ? '' : '/';
      } else {
        route.path += '/' + getRoutePathExtension(key);

        if (key.startsWith('_') && key.length > 1) {
          route.path += '?';
        }
      }
    });
    if (trailingSlash !== undefined) {
      route.pathToRegexpOptions = { ...route.pathToRegexpOptions, strict: true };
      route.path = route.path.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || '/';
    }

    parent.push(route);
  });

  sortRoutes(routes);
  return cleanChildrenRoutes(routes, false, routeNameSplitter, trailingSlash)
};

// Guard dir1 from dir2 which can be indiscriminately removed
const guardDir = function guardDir (options, key1, key2) {
  const dir1 = get_1(options, key1, false);
  const dir2 = get_1(options, key2, false);

  if (
    dir1 &&
    dir2 &&
    (
      dir1 === dir2 ||
      (
        dir1.startsWith(dir2) &&
        !path__default['default'].basename(dir1).startsWith(path__default['default'].basename(dir2))
      )
    )
  ) {
    const errorMessage = `options.${key2} cannot be a parent of or same as ${key1}`;
    consola__default['default'].fatal(errorMessage);
    throw new Error(errorMessage)
  }
};

const getRoutePathExtension = (key) => {
  if (key === '_') {
    return '*'
  }

  if (key.startsWith('_')) {
    return `:${key.substr(1)}`
  }

  return key
};

const promisifyRoute = function promisifyRoute (fn, ...args) {
  // If routes is an array
  if (Array.isArray(fn)) {
    return Promise.resolve(fn)
  }
  // If routes is a function expecting a callback
  if (fn.length === arguments.length) {
    return new Promise((resolve, reject) => {
      fn((err, routeParams) => {
        if (err) {
          reject(err);
        }
        resolve(routeParams);
      }, ...args);
    })
  }
  let promise = fn(...args);
  if (
    !promise ||
    (!(promise instanceof Promise) && typeof promise.then !== 'function')
  ) {
    promise = Promise.resolve(promise);
  }
  return promise
};

function normalizeFunctions (obj) {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
    return obj
  }
  for (const key in obj) {
    if (key === '__proto__' || key === 'constructor') {
      continue
    }
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(obj)) {
      obj[key] = normalizeFunctions(val);
    }
    if (typeof obj[key] === 'function') {
      const asString = obj[key].toString();
      const match = asString.match(/^([^{(]+)=>\s*([\0-\uFFFF]*)/);
      if (match) {
        const fullFunctionBody = match[2].match(/^{?(\s*return\s+)?([\0-\uFFFF]*?)}?$/);
        let functionBody = fullFunctionBody[2].trim();
        if (fullFunctionBody[1] || !match[2].trim().match(/^\s*{/)) {
          functionBody = `return ${functionBody}`;
        }
        // eslint-disable-next-line no-new-func
        obj[key] = new Function(...match[1].split(',').map(arg => arg.trim()), functionBody);
      }
    }
  }
  return obj
}

function serializeFunction (func) {
  let open = false;
  func = normalizeFunctions(func);
  return serialize__default['default'](func)
    .replace(serializeFunction.assignmentRE, (_, spaces) => {
      return `${spaces}: function (`
    })
    .replace(serializeFunction.internalFunctionRE, (_, spaces, name, args) => {
      if (open) {
        return `${spaces}${name}: function (${args}) {`
      } else {
        open = true;
        return _
      }
    })
    .replace(`${func.name || 'function'}(`, 'function (')
    .replace('function function', 'function')
}

serializeFunction.internalFunctionRE = /^(\s*)(?!(?:if)|(?:for)|(?:while)|(?:switch)|(?:catch))(\w+)\s*\((.*?)\)\s*\{/gm;
serializeFunction.assignmentRE = /^(\s*):(\w+)\(/gm;

const sequence = function sequence (tasks, fn) {
  return tasks.reduce(
    (promise, task) => promise.then(() => fn(task)),
    Promise.resolve()
  )
};

const parallel = function parallel (tasks, fn) {
  return Promise.all(tasks.map(fn))
};

const chainFn = function chainFn (base, fn) {
  if (typeof fn !== 'function') {
    return base
  }

  if (typeof base !== 'function') {
    return fn
  }

  return function (arg0, ...args) {
    const next = (previous = arg0) => {
      const fnResult = fn.call(this, previous, ...args);

      if (fnResult && typeof fnResult.then === 'function') {
        return fnResult.then(res => res || previous)
      }

      return fnResult || previous
    };

    const baseResult = base.call(this, arg0, ...args);

    if (baseResult && typeof baseResult.then === 'function') {
      return baseResult.then(res => next(res))
    }

    return next(baseResult)
  }
};

async function promiseFinally (fn, finalFn) {
  let result;
  try {
    if (typeof fn === 'function') {
      result = await fn();
    } else {
      result = await fn;
    }
  } finally {
    finalFn();
  }
  return result
}

const timeout = function timeout (fn, ms, msg) {
  let timerId;
  const warpPromise = promiseFinally(fn, () => clearTimeout(timerId));
  const timerPromise = new Promise((resolve, reject) => {
    timerId = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([warpPromise, timerPromise])
};

const waitFor = function waitFor (ms) {
  return new Promise(resolve => setTimeout(resolve, ms || 0))
};
class Timer {
  constructor () {
    this._times = new Map();
  }

  start (name, description) {
    const time = {
      name,
      description,
      start: this.hrtime()
    };
    this._times.set(name, time);
    return time
  }

  end (name) {
    if (this._times.has(name)) {
      const time = this._times.get(name);
      time.duration = this.hrtime(time.start);
      this._times.delete(name);
      return time
    }
  }

  hrtime (start) {
    const useBigInt = typeof process.hrtime.bigint === 'function';
    if (start) {
      const end = useBigInt ? process.hrtime.bigint() : process.hrtime(start);
      return useBigInt
        ? (end - start) / BigInt(1000000)
        : (end[0] * 1e3) + (end[1] * 1e-6)
    }
    return useBigInt ? process.hrtime.bigint() : process.hrtime()
  }

  clear () {
    this._times.clear();
  }
}

function isHMRCompatible (id) {
  return !/[/\\]mongoose[/\\/]/.test(id)
}

function isExternalDependency (id) {
  return /[/\\]node_modules[/\\]/.test(id)
}

function clearRequireCache (id) {
  if (isExternalDependency(id) && isHMRCompatible(id)) {
    return
  }

  const entry = getRequireCacheItem(id);

  if (!entry) {
    delete require.cache[id];
    return
  }

  if (entry.parent) {
    entry.parent.children = entry.parent.children.filter(e => e.id !== id);
  }

  // Needs to be cleared before children, to protect against circular deps (#7966)
  delete require.cache[id];

  for (const child of entry.children) {
    clearRequireCache(child.id);
  }
}

function scanRequireTree (id, files = new Set()) {
  if (isExternalDependency(id) || files.has(id)) {
    return files
  }

  const entry = getRequireCacheItem(id);

  if (!entry) {
    files.add(id);
    return files
  }

  files.add(entry.id);

  for (const child of entry.children) {
    scanRequireTree(child.id, files);
  }

  return files
}

function getRequireCacheItem (id) {
  try {
    return require.cache[id]
  } catch (e) {
  }
}

function tryRequire (id) {
  try {
    return require(id)
  } catch (e) {
  }
}

function getPKG (id) {
  return tryRequire(path.join(id, 'package.json'))
}

const ModernBrowsers = {
  Edge: '16',
  Firefox: '60',
  Chrome: '61',
  'Chrome Headless': '61',
  Chromium: '61',
  Iron: '61',
  Safari: '10.1',
  Opera: '48',
  Yandex: '18',
  Vivaldi: '1.14',
  'Mobile Safari': '10.3'
};

let semver;
let __modernBrowsers;

const getModernBrowsers = () => {
  if (__modernBrowsers) {
    return __modernBrowsers
  }

  __modernBrowsers = Object.keys(ModernBrowsers)
    .reduce((allBrowsers, browser) => {
      allBrowsers[browser] = semver.coerce(ModernBrowsers[browser]);
      return allBrowsers
    }, {});
  return __modernBrowsers
};

const isModernBrowser = (ua) => {
  if (!ua) {
    return false
  }
  if (!semver) {
    semver = require('semver');
  }
  const { browser } = UAParser__default['default'](ua);
  const browserVersion = semver.coerce(browser.version);
  if (!browserVersion) {
    return false
  }
  const modernBrowsers = getModernBrowsers();
  return Boolean(modernBrowsers[browser.name] && semver.gte(browserVersion, modernBrowsers[browser.name]))
};

const isModernRequest = (req, modernMode = false) => {
  if (modernMode === false) {
    return false
  }

  const { socket = {}, headers } = req;
  if (socket._modern === undefined) {
    const ua = headers && headers['user-agent'];
    socket._modern = isModernBrowser(ua);
  }

  return socket._modern
};

// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
const safariNoModuleFix = '!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();';

exports.MODES = MODES;
exports.ModernBrowsers = ModernBrowsers;
exports.TARGETS = TARGETS;
exports.Timer = Timer;
exports.chainFn = chainFn;
exports.clearRequireCache = clearRequireCache;
exports.createLockPath = createLockPath;
exports.createRoutes = createRoutes;
exports.defaultLockOptions = defaultLockOptions;
exports.defineAlias = defineAlias;
exports.determineGlobals = determineGlobals;
exports.encodeHtml = encodeHtml;
exports.flatRoutes = flatRoutes;
exports.getContext = getContext;
exports.getLockOptions = getLockOptions;
exports.getLockPath = getLockPath;
exports.getMainModule = getMainModule;
exports.getPKG = getPKG;
exports.getRequireCacheItem = getRequireCacheItem;
exports.guardDir = guardDir;
exports.isExternalDependency = isExternalDependency;
exports.isFullStatic = isFullStatic;
exports.isHMRCompatible = isHMRCompatible;
exports.isIndexFileAndFolder = isIndexFileAndFolder;
exports.isModernBrowser = isModernBrowser;
exports.isModernRequest = isModernRequest;
exports.isNonEmptyString = isNonEmptyString;
exports.isPureObject = isPureObject;
exports.isString = isString;
exports.isUrl = isUrl;
exports.isWindows = isWindows;
exports.lock = lock;
exports.lockPaths = lockPaths;
exports.normalizeFunctions = normalizeFunctions;
exports.parallel = parallel;
exports.promisifyRoute = promisifyRoute;
exports.r = r;
exports.relativeTo = relativeTo;
exports.safariNoModuleFix = safariNoModuleFix;
exports.scanRequireTree = scanRequireTree;
exports.sequence = sequence;
exports.serializeFunction = serializeFunction;
exports.sortRoutes = sortRoutes;
exports.startsWithAlias = startsWithAlias;
exports.startsWithRootAlias = startsWithRootAlias;
exports.startsWithSrcAlias = startsWithSrcAlias;
exports.stripWhitespace = stripWhitespace;
exports.timeout = timeout;
exports.tryRequire = tryRequire;
exports.urlJoin = urlJoin;
exports.wChunk = wChunk;
exports.waitFor = waitFor;
exports.wp = wp;
exports.wrapArray = wrapArray;
