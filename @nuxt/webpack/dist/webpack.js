/*!
 * @nuxt/webpack v2.14.7 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const pify = require('pify');
const webpack = require('webpack');
const Glob = require('glob');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const consola = require('consola');
const utils = require('@nuxt/utils');
const MFS = require('memory-fs');
const querystring = require('querystring');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzer = require('webpack-bundle-analyzer');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('@nuxt/friendly-errors-webpack-plugin');
const EventEmitter = require('events');
const hash = require('hash-sum');
const TimeFixPlugin = require('time-fix-plugin');
const VueLoader = require('vue-loader');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const HardSourcePlugin = require('hard-source-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const WebpackBar = require('webpackbar');
const env = require('std-env');
const semver = require('semver');
const createRequire = require('create-require');
const threadLoader = require('thread-loader');
const fs = require('fs');
const createResolver = require('postcss-import-resolver');
const nodeExternals = require('webpack-node-externals');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const pify__default = /*#__PURE__*/_interopDefaultLegacy(pify);
const webpack__default = /*#__PURE__*/_interopDefaultLegacy(webpack);
const Glob__default = /*#__PURE__*/_interopDefaultLegacy(Glob);
const webpackDevMiddleware__default = /*#__PURE__*/_interopDefaultLegacy(webpackDevMiddleware);
const webpackHotMiddleware__default = /*#__PURE__*/_interopDefaultLegacy(webpackHotMiddleware);
const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
const MFS__default = /*#__PURE__*/_interopDefaultLegacy(MFS);
const querystring__default = /*#__PURE__*/_interopDefaultLegacy(querystring);
const HtmlWebpackPlugin__default = /*#__PURE__*/_interopDefaultLegacy(HtmlWebpackPlugin);
const BundleAnalyzer__default = /*#__PURE__*/_interopDefaultLegacy(BundleAnalyzer);
const OptimizeCSSAssetsPlugin__default = /*#__PURE__*/_interopDefaultLegacy(OptimizeCSSAssetsPlugin);
const FriendlyErrorsWebpackPlugin__default = /*#__PURE__*/_interopDefaultLegacy(FriendlyErrorsWebpackPlugin);
const EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
const hash__default = /*#__PURE__*/_interopDefaultLegacy(hash);
const TimeFixPlugin__default = /*#__PURE__*/_interopDefaultLegacy(TimeFixPlugin);
const VueLoader__default = /*#__PURE__*/_interopDefaultLegacy(VueLoader);
const ExtractCssChunksPlugin__default = /*#__PURE__*/_interopDefaultLegacy(ExtractCssChunksPlugin);
const HardSourcePlugin__default = /*#__PURE__*/_interopDefaultLegacy(HardSourcePlugin);
const TerserWebpackPlugin__default = /*#__PURE__*/_interopDefaultLegacy(TerserWebpackPlugin);
const WebpackBar__default = /*#__PURE__*/_interopDefaultLegacy(WebpackBar);
const env__default = /*#__PURE__*/_interopDefaultLegacy(env);
const semver__default = /*#__PURE__*/_interopDefaultLegacy(semver);
const createRequire__default = /*#__PURE__*/_interopDefaultLegacy(createRequire);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const createResolver__default = /*#__PURE__*/_interopDefaultLegacy(createResolver);
const nodeExternals__default = /*#__PURE__*/_interopDefaultLegacy(nodeExternals);

class AsyncMFS extends MFS__default['default'] {}

const syncRegex = /Sync$/;

const propsToPromisify = Object.getOwnPropertyNames(MFS__default['default'].prototype).filter(n => syncRegex.test(n));

for (const prop of propsToPromisify) {
  const asyncProp = prop.replace(syncRegex, '');
  const origAsync = AsyncMFS.prototype[asyncProp];

  AsyncMFS.prototype[asyncProp] = function (...args) {
    // Callback support for webpack
    if (origAsync && args.length && typeof args[args.length - 1] === 'function') {
      return origAsync.call(this, ...args)
    }

    try {
      return Promise.resolve(MFS__default['default'].prototype[prop].call(this, ...args))
    } catch (error) {
      return Promise.reject(error)
    }
  };
}

class CorsPlugin {
  constructor ({ crossorigin }) {
    this.crossorigin = crossorigin;
  }

  apply (compiler) {
    const ID = 'vue-cors-plugin';
    compiler.hooks.compilation.tap(ID, (compilation) => {
      HtmlWebpackPlugin__default['default'].getHooks(compilation).alterAssetTagGroups.tap(ID, (data) => {
        if (!this.crossorigin) {
          return
        }
        [...data.headTags, ...data.bodyTags].forEach((tag) => {
          if (['script', 'link'].includes(tag.tagName)) {
            if (tag.attributes) {
              tag.attributes.crossorigin = this.crossorigin;
            }
          }
        });
      });
    });
  }
}

/*
* This file is based on @vue/cli-service (MIT) ModernModePlugin
* https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/webpack/ModernModePlugin.js
*/

const legacyTemplateTags = {};
const legacyTemplateWatcher = new EventEmitter__default['default']();

class ModernModePlugin {
  constructor ({ targetDir, isModernBuild, noUnsafeInline }) {
    this.targetDir = targetDir;
    this.isModernBuild = isModernBuild;
    this.noUnsafeInline = noUnsafeInline;
  }

  apply (compiler) {
    if (!this.isModernBuild) {
      this.applyLegacy(compiler);
    } else {
      this.applyModern(compiler);
    }
  }

  getLegacyTemplateTags (name) {
    return new Promise((resolve) => {
      const tags = legacyTemplateTags[name];
      if (tags) {
        return resolve(tags)
      }
      return legacyTemplateWatcher.once(name, () => {
        const tags = legacyTemplateTags[name];
        return tags && resolve(tags)
      })
    })
  }

  applyLegacy (compiler) {
    const ID = 'nuxt-legacy-bundle';
    compiler.hooks.compilation.tap(ID, (compilation) => {
      HtmlWebpackPlugin__default['default'].getHooks(compilation).alterAssetTagGroups.tap(ID, (data) => {
        HtmlWebpackPlugin__default['default'].getHooks(compilation).afterEmit.tap(ID, ({ outputName }) => {
          // get stats, write to disk
          legacyTemplateTags[data.plugin.options.filename] = data.bodyTags;
          legacyTemplateWatcher.emit(outputName);
        });
        return data
      });
    });
  }

  applyModern (compiler) {
    const ID = 'nuxt-modern-bundle';
    compiler.hooks.compilation.tap(ID, (compilation) => {
      HtmlWebpackPlugin__default['default'].getHooks(compilation).alterAssetTagGroups.tapPromise(ID, async (data) => {
        // use <script type="module"> for modern assets
        data.bodyTags.forEach((tag) => {
          if (tag.tagName === 'script' && tag.attributes) {
            tag.attributes.type = 'module';
          }
        });

        // use <link rel="modulepreload"> instead of <link rel="preload">
        // for modern assets
        data.headTags.forEach((tag) => {
          if (tag.tagName === 'link' &&
              tag.attributes.rel === 'preload' &&
              tag.attributes.as === 'script') {
            tag.attributes.rel = 'modulepreload';
          }
        });

        // inject links for legacy assets as <script nomodule>
        const fileName = data.plugin.options.filename;
        const legacyScriptTags = (await this.getLegacyTemplateTags(fileName))
          .filter(a => a.tagName === 'script' && a.attributes);

        for (const a of legacyScriptTags) {
          a.attributes.nomodule = true;
          data.bodyTags.push(a);
        }

        if (this.noUnsafeInline) {
          // inject the fix as an external script
          const safariFixFilename = 'safari-nomodule-fix.js';
          const safariFixPath = legacyScriptTags[0].attributes.src
            .split('/')
            .slice(0, -1)
            .concat([safariFixFilename])
            .join('/');

          compilation.assets[safariFixFilename] = {
            source: () => Buffer.from(utils.safariNoModuleFix),
            size: () => Buffer.byteLength(utils.safariNoModuleFix)
          };
          data.bodyTags.push({
            tagName: 'script',
            closeTag: true,
            attributes: {
              src: safariFixPath
            }
          });
        } else {
          // inject Safari 10 nomodule fix
          data.bodyTags.push({
            tagName: 'script',
            closeTag: true,
            innerHTML: utils.safariNoModuleFix
          });
        }

        delete legacyTemplateTags[fileName];

        return data
      });
    });
  }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

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
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

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
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
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
var Map = _getNative(_root, 'Map');

var _Map = Map;

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

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED$2);
  return this;
}

var _setCacheAdd = setCacheAdd;

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

var _setCacheHas = setCacheHas;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new _MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
SetCache.prototype.has = _setCacheHas;

var _SetCache = SetCache;

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

var _baseFindIndex = baseFindIndex;

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

var _baseIsNaN = baseIsNaN;

/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

var _strictIndexOf = strictIndexOf;

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? _strictIndexOf(array, value, fromIndex)
    : _baseFindIndex(array, _baseIsNaN, fromIndex);
}

var _baseIndexOf = baseIndexOf;

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && _baseIndexOf(array, value, 0) > -1;
}

var _arrayIncludes = arrayIncludes;

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

var _arrayIncludesWith = arrayIncludesWith;

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

var _cacheHas = cacheHas;

/* Built-in method references that are verified to be native. */
var Set$1 = _getNative(_root, 'Set');

var _Set = Set$1;

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

var noop_1 = noop;

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

var _setToArray = setToArray;

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY) ? noop_1 : function(values) {
  return new _Set(values);
};

var _createSet = createSet;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = _arrayIncludes,
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = _arrayIncludesWith;
  }
  else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : _createSet(array);
    if (set) {
      return _setToArray(set);
    }
    isCommon = false;
    includes = _cacheHas;
    seen = new _SetCache;
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

var _baseUniq = baseUniq;

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurrence of each element
 * is kept. The order of result values is determined by the order they occur
 * in the array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 */
function uniq(array) {
  return (array && array.length) ? _baseUniq(array) : [];
}

var uniq_1 = uniq;

/**
 * This file is based on Vue.js (MIT) webpack plugins
 * https://github.com/vuejs/vue/blob/dev/src/server/webpack-plugin/util.js
 */

const validate = (compiler) => {
  if (compiler.options.target !== 'node') {
    consola__default['default'].warn('webpack config `target` should be "node".');
  }

  if (compiler.options.output && compiler.options.output.libraryTarget !== 'commonjs2') {
    consola__default['default'].warn('webpack config `output.libraryTarget` should be "commonjs2".');
  }

  if (!compiler.options.externals) {
    consola__default['default'].info(
      'It is recommended to externalize dependencies in the server build for ' +
      'better build performance.'
    );
  }
};

const isJSRegExp = /\.js(\?[^.]+)?$/;

const isJS = file => isJSRegExp.test(file);

const extractQueryPartJS = file => isJSRegExp.exec(file)[1];

const isCSS = file => /\.css(\?[^.]+)?$/.test(file);

/**
 * This file is based on Vue.js (MIT) webpack plugins
 * https://github.com/vuejs/vue/blob/dev/src/server/webpack-plugin/client.js
 */

class VueSSRClientPlugin {
  constructor (options = {}) {
    this.options = Object.assign({
      filename: null
    }, options);
  }

  apply (compiler) {
    compiler.hooks.emit.tapAsync('vue-client-plugin', (compilation, cb) => {
      const stats = compilation.getStats().toJson();

      const allFiles = uniq_1(stats.assets
        .map(a => a.name));

      const initialFiles = uniq_1(Object.keys(stats.entrypoints)
        .map(name => stats.entrypoints[name].assets)
        .reduce((assets, all) => all.concat(assets), [])
        .filter(file => isJS(file) || isCSS(file)));

      const asyncFiles = allFiles
        .filter(file => isJS(file) || isCSS(file))
        .filter(file => !initialFiles.includes(file));

      const assetsMapping = {};
      stats.assets
        .filter(({ name }) => isJS(name))
        .forEach(({ name, chunkNames }) => {
          const componentHash = hash__default['default'](chunkNames.join('|'));
          if (!assetsMapping[componentHash]) {
            assetsMapping[componentHash] = [];
          }
          assetsMapping[componentHash].push(name);
        });

      const manifest = {
        publicPath: stats.publicPath,
        all: allFiles,
        initial: initialFiles,
        async: asyncFiles,
        modules: { /* [identifier: string]: Array<index: number> */ },
        assetsMapping
      };

      const { entrypoints, namedChunkGroups } = stats;
      const assetModules = stats.modules.filter(m => m.assets.length);
      const fileToIndex = file => manifest.all.indexOf(file);
      stats.modules.forEach((m) => {
        // Ignore modules duplicated in multiple chunks
        if (m.chunks.length === 1) {
          const [cid] = m.chunks;
          const chunk = stats.chunks.find(c => c.id === cid);
          if (!chunk || !chunk.files) {
            return
          }
          const id = m.identifier.replace(/\s\w+$/, ''); // remove appended hash
          const filesSet = new Set(chunk.files.map(fileToIndex));

          for (const chunkName of chunk.names) {
            if (!entrypoints[chunkName]) {
              const chunkGroup = namedChunkGroups[chunkName];
              if (chunkGroup) {
                for (const asset of chunkGroup.assets) {
                  filesSet.add(fileToIndex(asset));
                }
              }
            }
          }

          const files = Array.from(filesSet);
          manifest.modules[hash__default['default'](id)] = files;

          // In production mode, modules may be concatenated by scope hoisting
          // Include ConcatenatedModule for not losing module-component mapping
          if (Array.isArray(m.modules)) {
            for (const concatenatedModule of m.modules) {
              const id = hash__default['default'](concatenatedModule.identifier.replace(/\s\w+$/, ''));
              if (!manifest.modules[id]) {
                manifest.modules[id] = files;
              }
            }
          }

          // Find all asset modules associated with the same chunk
          assetModules.forEach((m) => {
            if (m.chunks.some(id => id === cid)) {
              files.push.apply(files, m.assets.map(fileToIndex));
            }
          });
        }
      });

      const src = JSON.stringify(manifest, null, 2);

      compilation.assets[this.options.filename] = {
        source: () => src,
        size: () => src.length
      };
      cb();
    });
  }
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new _ListCache;
  this.size = 0;
}

var _stackClear = stackClear;

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

var _stackDelete = stackDelete;

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

var _stackGet = stackGet;

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

var _stackHas = stackHas;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE$1 = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof _ListCache) {
    var pairs = data.__data__;
    if (!_Map || (pairs.length < LARGE_ARRAY_SIZE$1 - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new _MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

var _stackSet = stackSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new _ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = _stackClear;
Stack.prototype['delete'] = _stackDelete;
Stack.prototype.get = _stackGet;
Stack.prototype.has = _stackHas;
Stack.prototype.set = _stackSet;

var _Stack = Stack;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

var _arrayEach = arrayEach;

var defineProperty = (function() {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

var _defineProperty = defineProperty;

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && _defineProperty) {
    _defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

var _baseAssignValue = baseAssignValue;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$4.call(object, key) && eq_1(objValue, value)) ||
      (value === undefined && !(key in object))) {
    _baseAssignValue(object, key, value);
  }
}

var _assignValue = assignValue;

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      _baseAssignValue(object, key, newValue);
    } else {
      _assignValue(object, key, newValue);
    }
  }
  return object;
}

var _copyObject = copyObject;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

var _baseTimes = baseTimes;

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
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

var isArguments_1 = isArguments;

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

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

var _isIndex = isIndex;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

var isLength_1 = isLength;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$6.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           _isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && _copyObject(source, keys_1(source), object);
}

var _baseAssign = baseAssign;

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

var _nativeKeysIn = nativeKeysIn;

/** Used for built-in method references. */
var objectProto$a = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject_1(object)) {
    return _nativeKeysIn(object);
  }
  var isProto = _isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

var _baseKeysIn = baseKeysIn;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
}

var keysIn_1 = keysIn;

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && _copyObject(source, keysIn_1(source), object);
}

var _baseAssignIn = baseAssignIn;

var _cloneBuffer = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;
});

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

var _copyArray = copyArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

var _arrayFilter = arrayFilter;

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

var stubArray_1 = stubArray;

/** Used for built-in method references. */
var objectProto$b = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return _arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable$1.call(object, symbol);
  });
};

var _getSymbols = getSymbols;

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return _copyObject(source, _getSymbols(source), object);
}

var _copySymbols = copySymbols;

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

var _arrayPush = arrayPush;

/** Built-in value references. */
var getPrototype = _overArg(Object.getPrototypeOf, Object);

var _getPrototype = getPrototype;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
  var result = [];
  while (object) {
    _arrayPush(result, _getSymbols(object));
    object = _getPrototype(object);
  }
  return result;
};

var _getSymbolsIn = getSymbolsIn;

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return _copyObject(source, _getSymbolsIn(source), object);
}

var _copySymbolsIn = copySymbolsIn;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
}

var _baseGetAllKeys = baseGetAllKeys;

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return _baseGetAllKeys(object, keys_1, _getSymbols);
}

var _getAllKeys = getAllKeys;

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
}

var _getAllKeysIn = getAllKeysIn;

/* Built-in method references that are verified to be native. */
var DataView = _getNative(_root, 'DataView');

var _DataView = DataView;

/* Built-in method references that are verified to be native. */
var Promise$1 = _getNative(_root, 'Promise');

var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */
var WeakMap = _getNative(_root, 'WeakMap');

var _WeakMap = WeakMap;

/** `Object#toString` result references. */
var mapTag$1 = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$1 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]';

var dataViewTag$1 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = _baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
    (_Map && getTag(new _Map) != mapTag$1) ||
    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
    (_Set && getTag(new _Set) != setTag$1) ||
    (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$1;
        case mapCtorString: return mapTag$1;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$1;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var _getTag = getTag;

/** Used for built-in method references. */
var objectProto$c = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

var _initCloneArray = initCloneArray;

/** Built-in value references. */
var Uint8Array = _root.Uint8Array;

var _Uint8Array = Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
  return result;
}

var _cloneArrayBuffer = cloneArrayBuffer;

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

var _cloneDataView = cloneDataView;

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

var _cloneRegExp = cloneRegExp;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

var _cloneSymbol = cloneSymbol;

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

var _cloneTypedArray = cloneTypedArray;

/** `Object#toString` result references. */
var boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    mapTag$2 = '[object Map]',
    numberTag$1 = '[object Number]',
    regexpTag$1 = '[object RegExp]',
    setTag$2 = '[object Set]',
    stringTag$1 = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$2 = '[object DataView]',
    float32Tag$1 = '[object Float32Array]',
    float64Tag$1 = '[object Float64Array]',
    int8Tag$1 = '[object Int8Array]',
    int16Tag$1 = '[object Int16Array]',
    int32Tag$1 = '[object Int32Array]',
    uint8Tag$1 = '[object Uint8Array]',
    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
    uint16Tag$1 = '[object Uint16Array]',
    uint32Tag$1 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$1:
      return _cloneArrayBuffer(object);

    case boolTag$1:
    case dateTag$1:
      return new Ctor(+object);

    case dataViewTag$2:
      return _cloneDataView(object, isDeep);

    case float32Tag$1: case float64Tag$1:
    case int8Tag$1: case int16Tag$1: case int32Tag$1:
    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
      return _cloneTypedArray(object, isDeep);

    case mapTag$2:
      return new Ctor;

    case numberTag$1:
    case stringTag$1:
      return new Ctor(object);

    case regexpTag$1:
      return _cloneRegExp(object);

    case setTag$2:
      return new Ctor;

    case symbolTag:
      return _cloneSymbol(object);
  }
}

var _initCloneByTag = initCloneByTag;

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject_1(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

var _baseCreate = baseCreate;

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !_isPrototype(object))
    ? _baseCreate(_getPrototype(object))
    : {};
}

var _initCloneObject = initCloneObject;

/** `Object#toString` result references. */
var mapTag$3 = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike_1(value) && _getTag(value) == mapTag$3;
}

var _baseIsMap = baseIsMap;

/* Node.js helper references. */
var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

var isMap_1 = isMap;

/** `Object#toString` result references. */
var setTag$3 = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike_1(value) && _getTag(value) == setTag$3;
}

var _baseIsSet = baseIsSet;

/* Node.js helper references. */
var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

var isSet_1 = isSet;

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    boolTag$2 = '[object Boolean]',
    dateTag$2 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$2 = '[object Function]',
    genTag$1 = '[object GeneratorFunction]',
    mapTag$4 = '[object Map]',
    numberTag$2 = '[object Number]',
    objectTag$2 = '[object Object]',
    regexpTag$2 = '[object RegExp]',
    setTag$4 = '[object Set]',
    stringTag$2 = '[object String]',
    symbolTag$1 = '[object Symbol]',
    weakMapTag$2 = '[object WeakMap]';

var arrayBufferTag$2 = '[object ArrayBuffer]',
    dataViewTag$3 = '[object DataView]',
    float32Tag$2 = '[object Float32Array]',
    float64Tag$2 = '[object Float64Array]',
    int8Tag$2 = '[object Int8Array]',
    int16Tag$2 = '[object Int16Array]',
    int32Tag$2 = '[object Int32Array]',
    uint8Tag$2 = '[object Uint8Array]',
    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
    uint16Tag$2 = '[object Uint16Array]',
    uint32Tag$2 = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
cloneableTags[weakMapTag$2] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject_1(value)) {
    return value;
  }
  var isArr = isArray_1(value);
  if (isArr) {
    result = _initCloneArray(value);
    if (!isDeep) {
      return _copyArray(value, result);
    }
  } else {
    var tag = _getTag(value),
        isFunc = tag == funcTag$2 || tag == genTag$1;

    if (isBuffer_1(value)) {
      return _cloneBuffer(value, isDeep);
    }
    if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : _initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? _copySymbolsIn(value, _baseAssignIn(result, value))
          : _copySymbols(value, _baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = _initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new _Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet_1(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap_1(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
  }

  var keysFunc = isFull
    ? (isFlat ? _getAllKeysIn : _getAllKeys)
    : (isFlat ? keysIn_1 : keys_1);

  var props = isArr ? undefined : keysFunc(value);
  _arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

var _baseClone = baseClone;

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1 = 1,
    CLONE_SYMBOLS_FLAG$1 = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return _baseClone(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$1);
}

var cloneDeep_1 = cloneDeep;

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

/** `Object#toString` result references. */
var symbolTag$2 = '[object Symbol]';

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
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$2);
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

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
  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
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
var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar$1.source);

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
    ? string.replace(reRegExpChar$1, '\\$&')
    : string;
}

var escapeRegExp_1 = escapeRegExp;

// https://github.com/webpack-contrib/thread-loader
// https://github.com/webpack-contrib/cache-loader

class PerfLoader {
  constructor (name, buildContext) {
    this.name = name;
    this.buildContext = buildContext;
    this.workerPools = PerfLoader.defaultPools({ dev: buildContext.options.dev });
    return new Proxy(this, {
      get (target, name) {
        return target[name] ? target[name] : target.use.bind(target, name)
      }
    })
  }

  static defaultPools ({ dev }) {
    const poolTimeout = dev ? Infinity : 2000;
    return {
      js: { name: 'js', poolTimeout },
      css: { name: 'css', poolTimeout }
    }
  }

  static warmupAll ({ dev }) {
    const pools = PerfLoader.defaultPools({ dev });
    PerfLoader.warmup(pools.js, [
      require.resolve('babel-loader'),
      require.resolve('@babel/preset-env')
    ]);
    PerfLoader.warmup(pools.css, ['css-loader']);
  }

  static warmup (...args) {
    threadLoader.warmup(...args);
  }

  use (poolName) {
    const loaders = [];

    if (this.buildContext.buildOptions.cache) {
      loaders.push({
        loader: 'cache-loader',
        options: {
          cacheDirectory: path__default['default'].resolve(`node_modules/.cache/cache-loader/${this.name}`)
        }
      });
    }

    if (this.buildContext.buildOptions.parallel) {
      const pool = this.workerPools[poolName];
      if (pool) {
        loaders.push({
          loader: 'thread-loader',
          options: pool
        });
      }
    }

    return loaders
  }
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var identity_1 = identity;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

var _apply = apply;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

var _overRest = overRest;

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

var constant_1 = constant;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant_1(string),
    'writable': true
  });
};

var _baseSetToString = baseSetToString;

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

var _shortOut = shortOut;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = _shortOut(_baseSetToString);

var _setToString = setToString;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return _setToString(_overRest(func, start, identity_1), func + '');
}

var _baseRest = baseRest;

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject_1(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike_1(object) && _isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq_1(object[index], value);
  }
  return false;
}

var _isIterateeCall = isIterateeCall;

/** Used for built-in method references. */
var objectProto$d = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$a = objectProto$d.hasOwnProperty;

/**
 * Assigns own and inherited enumerable string keyed properties of source
 * objects to the destination object for all destination properties that
 * resolve to `undefined`. Source objects are applied from left to right.
 * Once a property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaultsDeep
 * @example
 *
 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var defaults = _baseRest(function(object, sources) {
  object = Object(object);

  var index = -1;
  var length = sources.length;
  var guard = length > 2 ? sources[2] : undefined;

  if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
    length = 1;
  }

  while (++index < length) {
    var source = sources[index];
    var props = keysIn_1(source);
    var propsIndex = -1;
    var propsLength = props.length;

    while (++propsIndex < propsLength) {
      var key = props[propsIndex];
      var value = object[key];

      if (value === undefined ||
          (eq_1(value, objectProto$d[key]) && !hasOwnProperty$a.call(object, key))) {
        object[key] = source[key];
      }
    }
  }

  return object;
});

var defaults_1 = defaults;

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq_1(object[key], value)) ||
      (value === undefined && !(key in object))) {
    _baseAssignValue(object, key, value);
  }
}

var _assignMergeValue = assignMergeValue;

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

var _createBaseFor = createBaseFor;

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = _createBaseFor();

var _baseFor = baseFor;

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike_1(value) && isArrayLike_1(value);
}

var isArrayLikeObject_1 = isArrayLikeObject;

/** `Object#toString` result references. */
var objectTag$3 = '[object Object]';

/** Used for built-in method references. */
var funcProto$2 = Function.prototype,
    objectProto$e = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2 = funcProto$2.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$b = objectProto$e.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString$2.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag$3) {
    return false;
  }
  var proto = _getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$b.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString$2.call(Ctor) == objectCtorString;
}

var isPlainObject_1 = isPlainObject;

/**
 * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key === 'constructor' && typeof object[key] === 'function') {
    return;
  }

  if (key == '__proto__') {
    return;
  }

  return object[key];
}

var _safeGet = safeGet;

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return _copyObject(value, keysIn_1(value));
}

var toPlainObject_1 = toPlainObject;

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = _safeGet(object, key),
      srcValue = _safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    _assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray_1(srcValue),
        isBuff = !isArr && isBuffer_1(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray_1(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray_1(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject_1(objValue)) {
        newValue = _copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = _cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = _cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject_1(srcValue) || isArguments_1(srcValue)) {
      newValue = objValue;
      if (isArguments_1(objValue)) {
        newValue = toPlainObject_1(objValue);
      }
      else if (!isObject_1(objValue) || isFunction_1(objValue)) {
        newValue = _initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  _assignMergeValue(object, key, newValue);
}

var _baseMergeDeep = baseMergeDeep;

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  _baseFor(source, function(srcValue, key) {
    stack || (stack = new _Stack);
    if (isObject_1(srcValue)) {
      _baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(_safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      _assignMergeValue(object, key, newValue);
    }
  }, keysIn_1);
}

var _baseMerge = baseMerge;

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return _baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

var _createAssigner = createAssigner;

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = _createAssigner(function(object, source, srcIndex) {
  _baseMerge(object, source, srcIndex);
});

var merge_1 = merge;

const orderPresets = {
  cssnanoLast (names) {
    const nanoIndex = names.indexOf('cssnano');
    if (nanoIndex !== names.length - 1) {
      names.push(names.splice(nanoIndex, 1)[0]);
    }
    return names
  },
  presetEnvLast (names) {
    const nanoIndex = names.indexOf('postcss-preset-env');
    if (nanoIndex !== names.length - 1) {
      names.push(names.splice(nanoIndex, 1)[0]);
    }
    return names
  },
  presetEnvAndCssnanoLast (names) {
    return orderPresets.cssnanoLast(orderPresets.presetEnvLast(names))
  }
};

function postcssConfigFileWarning () {
  if (postcssConfigFileWarning.executed) {
    return
  }
  consola__default['default'].warn('Please use `build.postcss` in your nuxt.config.js instead of an external config file. Support for such files will be removed in Nuxt 3 as they remove all defaults set by Nuxt and can cause severe problems with features like alias resolving inside your CSS.');
  postcssConfigFileWarning.executed = true;
}

class PostcssConfig {
  constructor (buildContext) {
    this.buildContext = buildContext;
  }

  get postcssOptions () {
    return this.buildContext.buildOptions.postcss
  }

  get postcssImportAlias () {
    const alias = { ...this.buildContext.options.alias };

    for (const key in alias) {
      if (key.startsWith('~')) {
        continue
      }
      const newKey = '~' + key;
      if (!alias[newKey]) {
        alias[newKey] = alias[key];
      }
    }

    return alias
  }

  get defaultConfig () {
    const { dev, srcDir, rootDir, modulesDir } = this.buildContext.options;
    return {
      sourceMap: this.buildContext.buildOptions.cssSourceMap,
      plugins: {
        // https://github.com/postcss/postcss-import
        'postcss-import': {
          resolve: createResolver__default['default']({
            alias: this.postcssImportAlias,
            modules: [srcDir, rootDir, ...modulesDir]
          })
        },

        // https://github.com/postcss/postcss-url
        'postcss-url': {},

        // https://github.com/csstools/postcss-preset-env
        'postcss-preset-env': this.preset || {},
        cssnano: dev ? false : {
          preset: ['default', {
            // Keep quotes in font values to prevent from HEX conversion
            // https://github.com/nuxt/nuxt.js/issues/6306
            minifyFontValues: { removeQuotes: false }
          }]
        }
      },
      // Array, String or Function
      order: 'presetEnvAndCssnanoLast'
    }
  }

  searchConfigFile () {
    // Search for postCSS config file and use it if exists
    // https://github.com/michael-ciniawsky/postcss-load-config
    // TODO: Remove in Nuxt 3
    const { srcDir, rootDir } = this.buildContext.options;
    for (const dir of [srcDir, rootDir]) {
      for (const file of [
        'postcss.config.js',
        '.postcssrc.js',
        '.postcssrc',
        '.postcssrc.json',
        '.postcssrc.yaml'
      ]) {
        const configFile = path__default['default'].resolve(dir, file);
        if (fs__default['default'].existsSync(configFile)) {
          postcssConfigFileWarning();
          return configFile
        }
      }
    }
  }

  configFromFile () {
    const loaderConfig = (this.postcssOptions && this.postcssOptions.config) || {};
    loaderConfig.path = loaderConfig.path || this.searchConfigFile();

    if (loaderConfig.path) {
      return {
        sourceMap: this.buildContext.buildOptions.cssSourceMap,
        config: loaderConfig
      }
    }
  }

  normalize (config) {
    // TODO: Remove in Nuxt 3
    if (Array.isArray(config)) {
      consola__default['default'].warn('Using an Array as `build.postcss` will be deprecated in Nuxt 3. Please switch to the object' +
        ' declaration');
      config = { plugins: config };
    }
    return config
  }

  sortPlugins ({ plugins, order }) {
    const names = Object.keys(plugins);
    if (typeof order === 'string') {
      order = orderPresets[order];
    }
    return typeof order === 'function' ? order(names, orderPresets) : (order || names)
  }

  loadPlugins (config) {
    const { plugins } = config;
    if (utils.isPureObject(plugins)) {
      // Map postcss plugins into instances on object mode once
      config.plugins = this.sortPlugins(config)
        .map((p) => {
          const plugin = this.buildContext.nuxt.resolver.requireModule(p);
          const opts = plugins[p];
          if (opts === false) {
            return // Disabled
          }
          return plugin(opts)
        })
        .filter(Boolean);
    }
  }

  config () {
    /* istanbul ignore if */
    if (!this.postcssOptions) {
      return false
    }

    let config = this.configFromFile();
    if (config) {
      return config
    }

    config = this.normalize(cloneDeep_1(this.postcssOptions));

    // Apply default plugins
    if (utils.isPureObject(config)) {
      if (config.preset) {
        this.preset = config.preset;
        delete config.preset;
      }
      if (Array.isArray(config.plugins)) {
        defaults_1(config, this.defaultConfig);
      } else {
        // Keep the order of default plugins
        config = merge_1({}, this.defaultConfig, config);
        this.loadPlugins(config);
      }
      return config
    }
  }
}

class StyleLoader {
  constructor (buildContext, { isServer, perfLoader }) {
    this.buildContext = buildContext;
    this.isServer = isServer;
    this.perfLoader = perfLoader;

    if (buildContext.options.build.postcss) {
      this.postcssConfig = new PostcssConfig(buildContext);
    }
  }

  get extractCSS () {
    return this.buildContext.buildOptions.extractCSS
  }

  get onlyLocals () {
    return Boolean(this.isServer && this.extractCSS)
  }

  normalize (loaders) {
    loaders = utils.wrapArray(loaders);
    return loaders.map(loader => (typeof loader === 'string' ? { loader } : loader))
  }

  styleResource (ext) {
    const { buildOptions: { styleResources }, options: { rootDir } } = this.buildContext;
    const extResource = styleResources[ext];
    // style-resources-loader
    // https://github.com/yenshih/style-resources-loader
    if (!extResource) {
      return
    }
    const patterns = utils.wrapArray(extResource).map(p => path__default['default'].resolve(rootDir, p));

    return {
      loader: 'style-resources-loader',
      options: Object.assign(
        { patterns },
        styleResources.options || {}
      )
    }
  }

  postcss () {
    // postcss-loader
    // https://github.com/postcss/postcss-loader
    if (!this.postcssConfig) {
      return
    }

    const config = this.postcssConfig.config();

    if (!config) {
      return
    }

    return {
      loader: 'postcss-loader',
      options: Object.assign({ sourceMap: this.buildContext.buildOptions.cssSourceMap }, config)
    }
  }

  css (options) {
    options.onlyLocals = this.onlyLocals;
    const cssLoader = { loader: 'css-loader', options };

    if (options.onlyLocals) {
      return [cssLoader]
    }

    return [this.styleLoader(), cssLoader]
  }

  cssModules (options) {
    return this.css(options)
  }

  extract () {
    if (this.extractCSS) {
      const isDev = this.buildContext.options.dev;
      return {
        loader: ExtractCssChunksPlugin__default['default'].loader,
        options: {
          // TODO: https://github.com/faceyspacey/extract-css-chunks-webpack-plugin/issues/132
          // https://github.com/faceyspacey/extract-css-chunks-webpack-plugin/issues/161#issuecomment-500162574
          reloadAll: isDev,
          hot: isDev
        }
      }
    }
  }

  styleLoader () {
    return this.extract() || {
      loader: 'vue-style-loader',
      options: this.buildContext.buildOptions.loaders.vueStyle
    }
  }

  apply (ext, loaders = []) {
    const { css, cssModules } = this.buildContext.buildOptions.loaders;

    const customLoaders = [].concat(
      this.postcss(),
      this.normalize(loaders),
      this.styleResource(ext)
    ).filter(Boolean);

    css.importLoaders = cssModules.importLoaders = customLoaders.length;

    return [
      // This matches <style module>
      {
        resourceQuery: /module/,
        use: this.perfLoader.css().concat(
          this.cssModules(cssModules),
          customLoaders
        )
      },
      // This matches plain <style> or <style scoped>
      {
        use: this.perfLoader.css().concat(
          this.css(css),
          customLoaders
        )
      }
    ]
  }
}

class WarningIgnorePlugin {
  constructor (filter) {
    this.filter = filter;
  }

  apply (compiler) /* istanbul ignore next */ {
    compiler.hooks.done.tap('warnfix-plugin', (stats) => {
      stats.compilation.warnings = stats.compilation.warnings.filter(this.filter);
    });
  }
}

const reservedVueTags = [
  // HTML tags
  'html', 'body', 'base', 'head', 'link', 'meta', 'style', 'title', 'address',
  'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hgroup', 'nav', 'section', 'div', 'dd', 'dl', 'dt', 'figcaption', 'figure',
  'picture', 'hr', 'img', 'li', 'main', 'ol', 'p', 'pre', 'ul', 'a', 'b', 'abbr',
  'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark',
  'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub',
  'sup', 'time', 'u', 'var', 'wbr', 'area', 'audio', 'map', 'track', 'video',
  'embed', 'object', 'param', 'source', 'canvas', 'script', 'noscript', 'del',
  'ins', 'caption', 'col', 'colgroup', 'table', 'thead', 'tbody', 'td', 'th', 'tr',
  'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter',
  'optgroup', 'option', 'output', 'progress', 'select', 'textarea', 'details',
  'dialog', 'menu', 'menuitem', 'summary', 'content', 'element', 'shadow', 'template',
  'blockquote', 'iframe', 'tfoot',
  // SVG tags
  'svg', 'animate', 'circle', 'clippath', 'cursor', 'defs', 'desc', 'ellipse', 'filter',
  'font-face', 'foreignObject', 'g', 'glyph', 'image', 'line', 'marker', 'mask',
  'missing-glyph', 'path', 'pattern', 'polygon', 'polyline', 'rect', 'switch', 'symbol',
  'text', 'textpath', 'tspan', 'use', 'view',
  // Vue built-in tags
  'slot', 'component'
];

class WebpackBaseConfig {
  constructor (builder) {
    this.builder = builder;
    this.buildContext = builder.buildContext;
  }

  get colors () {
    return {
      client: 'green',
      server: 'orange',
      modern: 'blue'
    }
  }

  get nuxtEnv () {
    return {
      isDev: this.dev,
      isServer: this.isServer,
      isClient: !this.isServer,
      isModern: Boolean(this.isModern),
      isLegacy: Boolean(!this.isModern)
    }
  }

  get mode () {
    return this.dev ? 'development' : 'production'
  }

  get target () {
    return this.buildContext.target
  }

  get dev () {
    return this.buildContext.options.dev
  }

  get loaders () {
    if (!this._loaders) {
      this._loaders = cloneDeep_1(this.buildContext.buildOptions.loaders);
      // sass-loader<8 support (#6460)
      const sassLoaderPKG = utils.getPKG('sass-loader');
      if (sassLoaderPKG && semver__default['default'].lt(sassLoaderPKG.version, '8.0.0')) {
        const { sass } = this._loaders;
        sass.indentedSyntax = sass.sassOptions.indentedSyntax;
        delete sass.sassOptions.indentedSyntax;
      }
    }
    return this._loaders
  }

  get modulesToTranspile () {
    return [
      /\.vue\.js/i, // include SFCs in node_modules
      /consola\/src/,
      ...this.normalizeTranspile({ pathNormalize: true })
    ]
  }

  normalizeTranspile ({ pathNormalize = false } = {}) {
    const transpile = [];
    for (let pattern of this.buildContext.buildOptions.transpile) {
      if (typeof pattern === 'function') {
        pattern = pattern(this.nuxtEnv);
      }
      if (pattern instanceof RegExp) {
        transpile.push(pattern);
      } else if (typeof pattern === 'string') {
        const posixModule = pattern.replace(/\\/g, '/');
        transpile.push(new RegExp(escapeRegExp_1(
          pathNormalize ? path__default['default'].normalize(posixModule) : posixModule
        )));
      }
    }
    return transpile
  }

  getBabelOptions () {
    const envName = this.name;
    const { buildOptions: { corejs }, options: { rootDir } } = this.buildContext;
    const options = {
      ...this.buildContext.buildOptions.babel,
      envName
    };

    if (options.configFile || options.babelrc) {
      return options
    }

    if (typeof options.plugins === 'function') {
      options.plugins = options.plugins(
        {
          envName,
          ...this.nuxtEnv
        }
      );
    }

    // Auto detect corejs version
    let corejsVersion = corejs;
    if (corejsVersion === 'auto') {
      try {
        corejsVersion = Number.parseInt(createRequire__default['default'](rootDir)('core-js/package.json').version.split('.')[0]);
      } catch (_err) {
        corejsVersion = 2;
      }
    } else {
      corejsVersion = Number.parseInt(corejsVersion);
    }

    if (![2, 3].includes(corejsVersion)) {
      consola__default['default'].warn(`Invalid corejs version ${corejsVersion}! Please set "build.corejs" to either "auto", 2 or 3.`);
      corejsVersion = 2;
    }

    const defaultPreset = [require.resolve('@nuxt/babel-preset-app'), {
      corejs: {
        version: corejsVersion
      }
    }];

    if (typeof options.presets === 'function') {
      options.presets = options.presets(
        {
          envName,
          ...this.nuxtEnv
        },
        defaultPreset
      );
    }

    if (!options.presets) {
      options.presets = [defaultPreset];
    }

    return options
  }

  getFileName (key) {
    let fileName = this.buildContext.buildOptions.filenames[key];
    if (typeof fileName === 'function') {
      fileName = fileName(this.nuxtEnv);
    }
    if (this.dev) {
      const hash = /\[(chunkhash|contenthash|hash)(?::(\d+))?]/.exec(fileName);
      if (hash) {
        consola__default['default'].warn(`Notice: Please do not use ${hash[1]} in dev mode to prevent memory leak`);
      }
    }
    if (this.buildContext.buildOptions.analyze && !fileName.includes('[name]')) {
      fileName = '[name].' + fileName;
    }
    return fileName
  }

  env () {
    const env = {
      'process.env.NODE_ENV': JSON.stringify(this.mode),
      'process.mode': JSON.stringify(this.mode),
      'process.dev': this.dev,
      'process.static': this.target === utils.TARGETS.static,
      'process.target': JSON.stringify(this.target)
    };
    if (this.buildContext.buildOptions.aggressiveCodeRemoval) {
      env['typeof process'] = JSON.stringify(this.isServer ? 'object' : 'undefined');
      env['typeof window'] = JSON.stringify(!this.isServer ? 'object' : 'undefined');
      env['typeof document'] = JSON.stringify(!this.isServer ? 'object' : 'undefined');
    }

    Object.entries(this.buildContext.options.env).forEach(([key, value]) => {
      env['process.env.' + key] =
        ['boolean', 'number'].includes(typeof value)
          ? value
          : JSON.stringify(value);
    });
    return env
  }

  output () {
    const {
      options: { buildDir, router },
      buildOptions: { publicPath }
    } = this.buildContext;
    return {
      path: path__default['default'].resolve(buildDir, 'dist', this.isServer ? 'server' : 'client'),
      filename: this.getFileName('app'),
      futureEmitAssets: true, // TODO: Remove when using webpack 5
      chunkFilename: this.getFileName('chunk'),
      publicPath: utils.isUrl(publicPath) ? publicPath : utils.urlJoin(router.base, publicPath)
    }
  }

  optimization () {
    const optimization = cloneDeep_1(this.buildContext.buildOptions.optimization);

    if (optimization.minimize && optimization.minimizer === undefined) {
      optimization.minimizer = this.minimizer();
    }

    return optimization
  }

  resolve () {
    // Prioritize nested node_modules in webpack search path (#2558)
    const webpackModulesDir = ['node_modules'].concat(this.buildContext.options.modulesDir);

    return {
      resolve: {
        extensions: ['.wasm', '.mjs', '.js', '.json', '.vue', '.jsx'],
        alias: this.alias(),
        modules: webpackModulesDir
      },
      resolveLoader: {
        modules: [
          path__default['default'].resolve(__dirname, '../node_modules'),
          ...webpackModulesDir
        ]
      }
    }
  }

  minimizer () {
    const minimizer = [];
    const { terser, cache } = this.buildContext.buildOptions;

    // https://github.com/webpack-contrib/terser-webpack-plugin
    if (terser) {
      minimizer.push(
        new TerserWebpackPlugin__default['default'](Object.assign({
          cache,
          extractComments: {
            condition: 'some',
            filename: 'LICENSES'
          },
          terserOptions: {
            compress: {
              ecma: this.isModern ? 6 : undefined
            },
            mangle: {
              reserved: reservedVueTags
            }
          }
        }, terser))
      );
    }

    return minimizer
  }

  alias () {
    return {
      ...this.buildContext.options.alias,
      'vue-meta': require.resolve(`vue-meta${this.isServer ? '' : '/dist/vue-meta.esm.browser.js'}`)
    }
  }

  rules () {
    const perfLoader = new PerfLoader(this.name, this.buildContext);
    const styleLoader = new StyleLoader(
      this.buildContext,
      { isServer: this.isServer, perfLoader }
    );

    const babelLoader = {
      loader: require.resolve('babel-loader'),
      options: this.getBabelOptions()
    };

    return [
      {
        test: /\.vue$/i,
        loader: 'vue-loader',
        options: this.loaders.vue
      },
      {
        test: /\.pug$/i,
        oneOf: [
          {
            resourceQuery: /^\?vue/i,
            use: [{
              loader: 'pug-plain-loader',
              options: this.loaders.pugPlain
            }]
          },
          {
            use: [
              'raw-loader',
              {
                loader: 'pug-plain-loader',
                options: this.loaders.pugPlain
              }
            ]
          }
        ]
      },
      {
        test: /\.m?jsx?$/i,
        exclude: (file) => {
          file = file.split('node_modules', 2)[1];

          // not exclude files outside node_modules
          if (!file) {
            return false
          }

          // item in transpile can be string or regex object
          return !this.modulesToTranspile.some(module => module.test(file))
        },
        use: perfLoader.js().concat(babelLoader)
      },
      {
        test: /\.css$/i,
        oneOf: styleLoader.apply('css')
      },
      {
        test: /\.p(ost)?css$/i,
        oneOf: styleLoader.apply('postcss')
      },
      {
        test: /\.less$/i,
        oneOf: styleLoader.apply('less', {
          loader: 'less-loader',
          options: this.loaders.less
        })
      },
      {
        test: /\.sass$/i,
        oneOf: styleLoader.apply('sass', {
          loader: 'sass-loader',
          options: this.loaders.sass
        })
      },
      {
        test: /\.scss$/i,
        oneOf: styleLoader.apply('scss', {
          loader: 'sass-loader',
          options: this.loaders.scss
        })
      },
      {
        test: /\.styl(us)?$/i,
        oneOf: styleLoader.apply('stylus', {
          loader: 'stylus-loader',
          options: this.loaders.stylus
        })
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        use: [{
          loader: 'url-loader',
          options: Object.assign(
            this.loaders.imgUrl,
            { name: this.getFileName('img') }
          )
        }]
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        use: [{
          loader: 'url-loader',
          options: Object.assign(
            this.loaders.fontUrl,
            { name: this.getFileName('font') }
          )
        }]
      },
      {
        test: /\.(webm|mp4|ogv)$/i,
        use: [{
          loader: 'file-loader',
          options: Object.assign(
            this.loaders.file,
            { name: this.getFileName('video') }
          )
        }]
      }
    ]
  }

  plugins () {
    const plugins = [];
    const { nuxt, buildOptions } = this.buildContext;

    // Add timefix-plugin before others plugins
    if (this.dev) {
      plugins.push(new TimeFixPlugin__default['default']());
    }

    // CSS extraction)
    if (buildOptions.extractCSS) {
      plugins.push(new ExtractCssChunksPlugin__default['default'](Object.assign({
        filename: this.getFileName('css'),
        chunkFilename: this.getFileName('css')
      }, buildOptions.extractCSS)));
    }

    plugins.push(new VueLoader__default['default'].VueLoaderPlugin());

    plugins.push(...(buildOptions.plugins || []));

    plugins.push(new WarningIgnorePlugin(this.warningIgnoreFilter()));

    // Build progress indicator
    plugins.push(new WebpackBar__default['default']({
      name: this.name,
      color: this.colors[this.name],
      reporters: [
        'basic',
        'fancy',
        'profile',
        'stats'
      ],
      basic: !buildOptions.quiet && env__default['default'].minimalCLI,
      fancy: !buildOptions.quiet && !env__default['default'].minimalCLI,
      profile: !buildOptions.quiet && buildOptions.profile,
      stats: !buildOptions.quiet && !this.dev && buildOptions.stats,
      reporter: {
        change: (_, { shortPath }) => {
          if (!this.isServer) {
            nuxt.callHook('bundler:change', shortPath);
          }
        },
        done: (buildContext) => {
          if (buildContext.hasErrors) {
            nuxt.callHook('bundler:error');
          }
        },
        allDone: () => {
          nuxt.callHook('bundler:done');
        },
        progress ({ statesArray }) {
          nuxt.callHook('bundler:progress', statesArray);
        }
      }
    }));

    if (buildOptions.hardSource) {
      // https://github.com/mzgoddard/hard-source-webpack-plugin
      plugins.push(new HardSourcePlugin__default['default']({
        info: {
          level: 'warn'
        },
        ...buildOptions.hardSource
      }));
    }

    return plugins
  }

  warningIgnoreFilter () {
    const filters = [
      // Hide warnings about plugins without a default export (#1179)
      warn => warn.name === 'ModuleDependencyWarning' &&
        warn.message.includes('export \'default\'') &&
        warn.message.includes('nuxt_plugin_'),
      ...(this.buildContext.buildOptions.warningIgnoreFilters || [])
    ];

    return warn => !filters.some(ignoreFilter => ignoreFilter(warn))
  }

  extendConfig (config) {
    const { extend } = this.buildContext.buildOptions;
    if (typeof extend === 'function') {
      const extendedConfig = extend.call(
        this.builder, config, { loaders: this.loaders, ...this.nuxtEnv }
      ) || config;

      const pragma = /@|#/;
      const { devtool } = extendedConfig;
      if (typeof devtool === 'string' && pragma.test(devtool)) {
        extendedConfig.devtool = devtool.replace(pragma, '');
        consola__default['default'].warn(`devtool has been normalized to ${extendedConfig.devtool} as webpack documented value`);
      }

      return extendedConfig
    }
    return config
  }

  config () {
    const config = {
      name: this.name,
      mode: this.mode,
      devtool: this.devtool,
      optimization: this.optimization(),
      output: this.output(),
      performance: {
        maxEntrypointSize: 1000 * 1024,
        hints: this.dev ? false : 'warning'
      },
      module: {
        rules: this.rules()
      },
      plugins: this.plugins(),
      ...this.resolve()
    };

    // Clone deep avoid leaking config between Client and Server
    const extendedConfig = cloneDeep_1(this.extendConfig(config));

    return extendedConfig
  }
}

class WebpackClientConfig extends WebpackBaseConfig {
  constructor (builder) {
    super(builder);
    this.name = 'client';
    this.isServer = false;
    this.isModern = false;
  }

  get devtool () {
    if (!this.dev) {
      return false
    }
    const scriptPolicy = this.getCspScriptPolicy();
    const noUnsafeEval = scriptPolicy && !scriptPolicy.includes('\'unsafe-eval\'');
    return noUnsafeEval
      ? 'cheap-module-source-map'
      : 'cheap-module-eval-source-map'
  }

  getCspScriptPolicy () {
    const { csp } = this.buildContext.options.render;
    if (csp) {
      const { policies = {} } = csp;
      return policies['script-src'] || policies['default-src'] || []
    }
  }

  env () {
    return Object.assign(
      super.env(),
      {
        'process.env.VUE_ENV': JSON.stringify('client'),
        'process.browser': true,
        'process.client': true,
        'process.server': false,
        'process.modern': false
      }
    )
  }

  optimization () {
    const optimization = super.optimization();
    const { splitChunks } = optimization;
    const { cacheGroups } = splitChunks;

    // Small, known and common modules which are usually used project-wise
    // Sum of them may not be more than 244 KiB
    if (
      this.buildContext.buildOptions.splitChunks.commons === true &&
      cacheGroups.commons === undefined
    ) {
      cacheGroups.commons = {
        test: /node_modules[\\/](vue|vue-loader|vue-router|vuex|vue-meta|core-js|@babel\/runtime|axios|webpack|setimmediate|timers-browserify|process|regenerator-runtime|cookie|js-cookie|is-buffer|dotprop|nuxt\.js)[\\/]/,
        chunks: 'all',
        name: true,
        priority: 10
      };
    }

    return optimization
  }

  minimizer () {
    const minimizer = super.minimizer();
    const { optimizeCSS } = this.buildContext.buildOptions;

    // https://github.com/NMFR/optimize-css-assets-webpack-plugin
    // https://github.com/webpack-contrib/mini-css-extract-plugin#minimizing-for-production
    // TODO: Remove OptimizeCSSAssetsPlugin when upgrading to webpack 5
    if (optimizeCSS) {
      minimizer.push(new OptimizeCSSAssetsPlugin__default['default'](Object.assign({}, optimizeCSS)));
    }

    return minimizer
  }

  alias () {
    const aliases = super.alias();

    for (const p of this.buildContext.plugins) {
      if (!aliases[p.name]) {
        // Do not load server-side plugins on client-side
        aliases[p.name] = p.mode === 'server' ? './empty.js' : p.src;
      }
    }

    return aliases
  }

  plugins () {
    const plugins = super.plugins();
    const { buildOptions, options: { appTemplatePath, buildDir, modern, render } } = this.buildContext;

    // Generate output HTML for SSR
    if (buildOptions.ssr) {
      plugins.push(
        new HtmlWebpackPlugin__default['default']({
          filename: '../server/index.ssr.html',
          template: appTemplatePath,
          minify: buildOptions.html.minify,
          inject: false // Resources will be injected using bundleRenderer
        })
      );
    }

    plugins.push(
      new HtmlWebpackPlugin__default['default']({
        filename: '../server/index.spa.html',
        template: appTemplatePath,
        minify: buildOptions.html.minify,
        inject: true
      }),
      new VueSSRClientPlugin({
        filename: `../server/${this.name}.manifest.json`
      }),
      new webpack__default['default'].DefinePlugin(this.env())
    );

    if (this.dev) {
      // TODO: webpackHotUpdate is not defined: https://github.com/webpack/webpack/issues/6693
      plugins.push(new webpack__default['default'].HotModuleReplacementPlugin());
    }

    // Webpack Bundle Analyzer
    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    if (!this.dev && buildOptions.analyze) {
      const statsDir = path__default['default'].resolve(buildDir, 'stats');

      plugins.push(new BundleAnalyzer__default['default'].BundleAnalyzerPlugin(Object.assign({
        analyzerMode: 'static',
        defaultSizes: 'gzip',
        generateStatsFile: true,
        openAnalyzer: !buildOptions.quiet,
        reportFilename: path__default['default'].resolve(statsDir, `${this.name}.html`),
        statsFilename: path__default['default'].resolve(statsDir, `${this.name}.json`)
      }, buildOptions.analyze)));
    }

    if (modern) {
      const scriptPolicy = this.getCspScriptPolicy();
      const noUnsafeInline = scriptPolicy && !scriptPolicy.includes('\'unsafe-inline\'');
      plugins.push(new ModernModePlugin({
        targetDir: path__default['default'].resolve(buildDir, 'dist', 'client'),
        isModernBuild: this.isModern,
        noUnsafeInline
      }));
    }

    if (render.crossorigin) {
      plugins.push(new CorsPlugin({
        crossorigin: render.crossorigin
      }));
    }

    return plugins
  }

  config () {
    const config = super.config();
    const {
      options: { router, buildDir },
      buildOptions: { hotMiddleware, quiet, friendlyErrors }
    } = this.buildContext;

    const { client = {} } = hotMiddleware || {};
    const { ansiColors, overlayStyles, ...options } = client;

    const hotMiddlewareClientOptions = {
      reload: true,
      timeout: 30000,
      ansiColors: JSON.stringify(ansiColors),
      overlayStyles: JSON.stringify(overlayStyles),
      path: `${router.base}/__webpack_hmr/${this.name}`.replace(/\/\//g, '/'),
      ...options,
      name: this.name
    };

    const hotMiddlewareClientOptionsStr = querystring__default['default'].stringify(hotMiddlewareClientOptions);

    // Entry points
    config.entry = Object.assign({}, config.entry, {
      app: [path__default['default'].resolve(buildDir, 'client.js')]
    });

    // Add HMR support
    if (this.dev) {
      config.entry.app.unshift(
        // https://github.com/webpack-contrib/webpack-hot-middleware/issues/53#issuecomment-162823945
        'eventsource-polyfill',
        // https://github.com/glenjamin/webpack-hot-middleware#config
        `webpack-hot-middleware/client?${hotMiddlewareClientOptionsStr}`
      );
    }

    // Add friendly error plugin
    if (this.dev && !quiet && friendlyErrors) {
      config.plugins.push(
        new FriendlyErrorsWebpackPlugin__default['default']({
          clearConsole: false,
          reporter: 'consola',
          logLevel: 'WARNING'
        })
      );
    }

    return config
  }
}

class WebpackModernConfig extends WebpackClientConfig {
  constructor (...args) {
    super(...args);
    this.name = 'modern';
    this.isModern = true;
  }

  env () {
    return Object.assign(super.env(), {
      'process.modern': true
    })
  }
}

class VueSSRServerPlugin {
  constructor (options = {}) {
    this.options = Object.assign({
      filename: null
    }, options);
  }

  apply (compiler) {
    validate(compiler);

    compiler.hooks.emit.tapAsync('vue-server-plugin', (compilation, cb) => {
      const stats = compilation.getStats().toJson();
      const [entryName] = Object.keys(stats.entrypoints);
      const entryInfo = stats.entrypoints[entryName];

      if (!entryInfo) {
        // #5553
        return cb()
      }

      const entryAssets = entryInfo.assets.filter(isJS);

      if (entryAssets.length > 1) {
        throw new Error(
          'Server-side bundle should have one single entry file. ' +
          'Avoid using CommonsChunkPlugin in the server config.'
        )
      }

      const [entry] = entryAssets;
      if (!entry || typeof entry !== 'string') {
        throw new Error(
          `Entry "${entryName}" not found. Did you specify the correct entry option?`
        )
      }

      const bundle = {
        entry,
        files: {},
        maps: {}
      };

      stats.assets.forEach((asset) => {
        if (isJS(asset.name)) {
          const queryPart = extractQueryPartJS(asset.name);
          if (queryPart !== undefined) {
            bundle.files[asset.name] = asset.name.replace(queryPart, '');
          } else {
            bundle.files[asset.name] = asset.name;
          }
        } else if (asset.name.match(/\.js\.map$/)) {
          bundle.maps[asset.name.replace(/\.map$/, '')] = asset.name;
        } else {
          // Do not emit non-js assets for server
          delete compilation.assets[asset.name];
        }
      });

      const src = JSON.stringify(bundle, null, 2);

      compilation.assets[this.options.filename] = {
        source: () => src,
        size: () => src.length
      };

      cb();
    });
  }
}

const nativeFileExtensions = [
  '.json',
  '.js'
];

class WebpackServerConfig extends WebpackBaseConfig {
  constructor (...args) {
    super(...args);
    this.name = 'server';
    this.isServer = true;
  }

  get devtool () {
    return 'cheap-module-source-map'
  }

  get externalsAllowlist () {
    return [
      this.isNonNativeImport.bind(this),
      ...this.normalizeTranspile()
    ]
  }

  /**
   * files *not* ending on js|json should be processed by webpack
   *
   * this might generate false-positives for imports like
   * - "someFile.umd" (actually requiring someFile.umd.js)
   * - "some.folder" (some.folder being a directory containing a package.json)
   */
  isNonNativeImport (modulePath) {
    const extname = path__default['default'].extname(modulePath);
    return extname !== '' && !nativeFileExtensions.includes(extname)
  }

  env () {
    return Object.assign(
      super.env(),
      {
        'process.env.VUE_ENV': JSON.stringify('server'),
        'process.browser': false,
        'process.client': false,
        'process.server': true,
        'process.modern': false
      }
    )
  }

  optimization () {
    const { _minifyServer } = this.buildContext.buildOptions;

    return {
      splitChunks: false,
      minimizer: _minifyServer ? this.minimizer() : []
    }
  }

  resolve () {
    const resolveConfig = super.resolve();

    resolveConfig.resolve.mainFields = ['main', 'module'];

    return resolveConfig
  }

  alias () {
    const aliases = super.alias();

    for (const p of this.buildContext.plugins) {
      if (!aliases[p.name]) {
        // Do not load client-side plugins on server-side
        aliases[p.name] = p.mode === 'client' ? './empty.js' : p.src;
      }
    }

    return aliases
  }

  plugins () {
    const plugins = super.plugins();
    plugins.push(
      new VueSSRServerPlugin({ filename: `${this.name}.manifest.json` }),
      new webpack.DefinePlugin(this.env())
    );

    const { serverURLPolyfill } = this.buildContext.options.build;

    if (serverURLPolyfill) {
      plugins.push(new webpack.ProvidePlugin({
        URL: [serverURLPolyfill, 'URL'],
        URLSearchParams: [serverURLPolyfill, 'URLSearchParams']
      }));
    }

    return plugins
  }

  config () {
    const config = super.config();

    Object.assign(config, {
      target: 'node',
      node: false,
      entry: Object.assign({}, config.entry, {
        app: [path__default['default'].resolve(this.buildContext.options.buildDir, 'server.js')]
      }),
      output: Object.assign({}, config.output, {
        filename: 'server.js',
        chunkFilename: '[name].js',
        libraryTarget: 'commonjs2'
      }),
      performance: {
        hints: false,
        maxEntrypointSize: Infinity,
        maxAssetSize: Infinity
      },
      externals: [].concat(config.externals || [])
    });

    // https://webpack.js.org/configuration/externals/#externals
    // https://github.com/liady/webpack-node-externals
    // https://vue-loader.vuejs.org/migrating.html#ssr-externals
    if (!this.buildContext.buildOptions.standalone) {
      this.buildContext.options.modulesDir.forEach((dir) => {
        if (fs__default['default'].existsSync(dir)) {
          config.externals.push(
            nodeExternals__default['default']({
              allowlist: this.externalsAllowlist,
              modulesDir: dir
            })
          );
        }
      });
    }

    return config
  }
}

const WebpackConfigs = /*#__PURE__*/Object.freeze({
  __proto__: null,
  client: WebpackClientConfig,
  modern: WebpackModernConfig,
  server: WebpackServerConfig
});

const glob = pify__default['default'](Glob__default['default']);

class WebpackBundler {
  constructor (buildContext) {
    this.buildContext = buildContext;

    // Class fields
    this.compilers = [];
    this.compilersWatching = [];
    this.devMiddleware = {};
    this.hotMiddleware = {};

    // Bind middleware to self
    this.middleware = this.middleware.bind(this);

    // Initialize shared MFS for dev
    if (this.buildContext.options.dev) {
      this.mfs = new AsyncMFS();
    }
  }

  getWebpackConfig (name) {
    const Config = WebpackConfigs[name.toLowerCase()]; // eslint-disable-line import/namespace
    if (!Config) {
      throw new Error(`Unsupported webpack config ${name}`)
    }
    const config = new Config(this);
    return config.config()
  }

  async build () {
    const { options } = this.buildContext;

    const webpackConfigs = [
      this.getWebpackConfig('Client')
    ];

    if (options.modern) {
      webpackConfigs.push(this.getWebpackConfig('Modern'));
    }

    if (options.build.ssr) {
      webpackConfigs.push(this.getWebpackConfig('Server'));
    }

    await this.buildContext.nuxt.callHook('webpack:config', webpackConfigs);

    // Check styleResource existence
    const { styleResources } = this.buildContext.options.build;
    if (styleResources && Object.keys(styleResources).length) {
      consola__default['default'].warn(
        'Using styleResources without the @nuxtjs/style-resources is not suggested and can lead to severe performance issues.',
        'Please use https://github.com/nuxt-community/style-resources-module'
      );
      for (const ext of Object.keys(styleResources)) {
        await Promise.all(utils.wrapArray(styleResources[ext]).map(async (p) => {
          const styleResourceFiles = await glob(path__default['default'].resolve(this.buildContext.options.rootDir, p));

          if (!styleResourceFiles || styleResourceFiles.length === 0) {
            throw new Error(`Style Resource not found: ${p}`)
          }
        }));
      }
    }

    // Configure compilers
    this.compilers = webpackConfigs.map((config) => {
      const compiler = webpack__default['default'](config);

      // In dev, write files in memory FS
      if (options.dev) {
        compiler.outputFileSystem = this.mfs;
      }

      return compiler
    });

    // Warm up perfLoader before build
    if (options.build.parallel) {
      consola__default['default'].info('Warming up worker pools');
      PerfLoader.warmupAll({ dev: options.dev });
      consola__default['default'].success('Worker pools ready');
    }

    // Start Builds
    const runner = options.dev ? utils.parallel : utils.sequence;

    await runner(this.compilers, compiler => this.webpackCompile(compiler));
  }

  async webpackCompile (compiler) {
    const { name } = compiler.options;
    const { nuxt, options } = this.buildContext;

    await nuxt.callHook('build:compile', { name, compiler });

    // Load renderer resources after build
    compiler.hooks.done.tap('load-resources', async (stats) => {
      await nuxt.callHook('build:compiled', {
        name,
        compiler,
        stats
      });

      // Reload renderer
      await nuxt.callHook('build:resources', this.mfs);
    });

    // --- Dev Build ---
    if (options.dev) {
      // Client Build, watch is started by dev-middleware
      if (['client', 'modern'].includes(name)) {
        return new Promise((resolve, reject) => {
          compiler.hooks.done.tap('nuxt-dev', () => resolve());
          return this.webpackDev(compiler)
        })
      }

      // Server, build and watch for changes
      return new Promise((resolve, reject) => {
        const watching = compiler.watch(options.watchers.webpack, (err) => {
          if (err) {
            return reject(err)
          }
          resolve();
        });

        watching.close = pify__default['default'](watching.close);
        this.compilersWatching.push(watching);
      })
    }

    // --- Production Build ---
    compiler.run = pify__default['default'](compiler.run);
    const stats = await compiler.run();

    if (stats.hasErrors()) {
      // non-quiet mode: errors will be printed by webpack itself
      const error = new Error('Nuxt build error');
      if (options.build.quiet === true) {
        error.stack = stats.toString('errors-only');
      }
      throw error
    }

    // Await for renderer to load resources (programmatic, tests and generate)
    await nuxt.callHook('build:resources');
  }

  async webpackDev (compiler) {
    consola__default['default'].debug('Creating webpack middleware...');

    const { name } = compiler.options;
    const buildOptions = this.buildContext.options.build;
    const { client, ...hotMiddlewareOptions } = buildOptions.hotMiddleware || {};

    // Create webpack dev middleware
    this.devMiddleware[name] = pify__default['default'](
      webpackDevMiddleware__default['default'](
        compiler, {
          publicPath: buildOptions.publicPath,
          stats: false,
          logLevel: 'silent',
          watchOptions: this.buildContext.options.watchers.webpack,
          fs: compiler.outputFileSystem,
          ...buildOptions.devMiddleware
        })
    );

    this.devMiddleware[name].close = pify__default['default'](this.devMiddleware[name].close);

    this.compilersWatching.push(this.devMiddleware[name].context.watching);

    this.hotMiddleware[name] = pify__default['default'](
      webpackHotMiddleware__default['default'](
        compiler, {
          log: false,
          heartbeat: 10000,
          path: `/__webpack_hmr/${name}`,
          ...hotMiddlewareOptions
        })
    );

    // Register devMiddleware on server
    await this.buildContext.nuxt.callHook('server:devMiddleware', this.middleware);
  }

  async middleware (req, res, next) {
    const name = utils.isModernRequest(req, this.buildContext.options.modern) ? 'modern' : 'client';

    if (this.devMiddleware && this.devMiddleware[name]) {
      await this.devMiddleware[name](req, res);
    }

    if (this.hotMiddleware && this.hotMiddleware[name]) {
      await this.hotMiddleware[name](req, res);
    }

    next();
  }

  async unwatch () {
    await Promise.all(this.compilersWatching.map(watching => watching.close()));
  }

  async close () {
    if (this.__closed) {
      return
    }
    this.__closed = true;

    // Unwatch
    await this.unwatch();

    // Stop webpack middleware
    for (const devMiddleware of Object.values(this.devMiddleware)) {
      await devMiddleware.close();
    }

    // Cleanup MFS
    if (this.mfs) {
      delete this.mfs.data;
      delete this.mfs;
    }

    // Cleanup more resources
    delete this.compilers;
    delete this.compilersWatching;
    delete this.devMiddleware;
    delete this.hotMiddleware;
  }

  forGenerate () {
    this.buildContext.target = utils.TARGETS.static;
  }
}

exports.BundleBuilder = WebpackBundler;
