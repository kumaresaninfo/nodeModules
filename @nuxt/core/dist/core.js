/*!
 * @nuxt/core v2.14.7 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const fs = require('fs');
const hash = require('hash-sum');
const consola = require('consola');
const utils = require('@nuxt/utils');
const Hookable = require('hable');
const config = require('@nuxt/config');
const server = require('@nuxt/server');
const fs$1 = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const hash__default = /*#__PURE__*/_interopDefaultLegacy(hash);
const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
const Hookable__default = /*#__PURE__*/_interopDefaultLegacy(Hookable);
const fs__default$1 = /*#__PURE__*/_interopDefaultLegacy(fs$1);

class ModuleContainer {
  constructor (nuxt) {
    this.nuxt = nuxt;
    this.options = nuxt.options;
    this.requiredModules = {};

    // Self bind to allow destructre from container
    for (const method of Object.getOwnPropertyNames(ModuleContainer.prototype)) {
      if (typeof this[method] === 'function') {
        this[method] = this[method].bind(this);
      }
    }
  }

  async ready () {
    // Call before hook
    await this.nuxt.callHook('modules:before', this, this.options.modules);

    if (this.options.buildModules && !this.options._start) {
      // Load every devModule in sequence
      await utils.sequence(this.options.buildModules, this.addModule);
    }

    // Load every module in sequence
    await utils.sequence(this.options.modules, this.addModule);

    // Load ah-hoc modules last
    await utils.sequence(this.options._modules, this.addModule);

    // Call done hook
    await this.nuxt.callHook('modules:done', this);
  }

  addVendor () {
    consola__default['default'].warn('addVendor has been deprecated due to webpack4 optimization');
  }

  addTemplate (template) {
    if (!template) {
      throw new Error('Invalid template: ' + JSON.stringify(template))
    }

    // Validate & parse source
    const src = template.src || template;
    const srcPath = path__default['default'].parse(src);

    if (typeof src !== 'string' || !fs__default['default'].existsSync(src)) {
      throw new Error('Template src not found: ' + src)
    }

    // Mostly for DX, some people prefers `filename` vs `fileName`
    const fileName = template.fileName || template.filename;
    // Generate unique and human readable dst filename if not provided
    const dst = fileName || `${path__default['default'].basename(srcPath.dir)}.${srcPath.name}.${hash__default['default'](src)}${srcPath.ext}`;
    // Add to templates list
    const templateObj = {
      src,
      dst,
      options: template.options
    };

    this.options.build.templates.push(templateObj);

    return templateObj
  }

  addPlugin (template) {
    const { dst } = this.addTemplate(template);

    // Add to nuxt plugins
    this.options.plugins.unshift({
      src: path__default['default'].join(this.options.buildDir, dst),
      // TODO: remove deprecated option in Nuxt 3
      ssr: template.ssr,
      mode: template.mode
    });
  }

  addLayout (template, name) {
    const { dst, src } = this.addTemplate(template);
    const layoutName = name || path__default['default'].parse(src).name;
    const layout = this.options.layouts[layoutName];

    if (layout) {
      consola__default['default'].warn(`Duplicate layout registration, "${layoutName}" has been registered as "${layout}"`);
    }

    // Add to nuxt layouts
    this.options.layouts[layoutName] = `./${dst}`;

    // If error layout, set ErrorPage
    if (name === 'error') {
      this.addErrorLayout(dst);
    }
  }

  addErrorLayout (dst) {
    const relativeBuildDir = path__default['default'].relative(this.options.rootDir, this.options.buildDir);
    this.options.ErrorPage = `~/${relativeBuildDir}/${dst}`;
  }

  addServerMiddleware (middleware) {
    this.options.serverMiddleware.push(middleware);
  }

  extendBuild (fn) {
    this.options.build.extend = utils.chainFn(this.options.build.extend, fn);
  }

  extendRoutes (fn) {
    this.options.router.extendRoutes = utils.chainFn(
      this.options.router.extendRoutes,
      fn
    );
  }

  requireModule (moduleOpts) {
    return this.addModule(moduleOpts)
  }

  async addModule (moduleOpts) {
    let src;
    let options;
    let handler;

    // Type 1: String or Function
    if (typeof moduleOpts === 'string' || typeof moduleOpts === 'function') {
      src = moduleOpts;
    } else if (Array.isArray(moduleOpts)) {
      // Type 2: Babel style array
      [src, options] = moduleOpts;
    } else if (typeof moduleOpts === 'object') {
      // Type 3: Pure object
      ({ src, options, handler } = moduleOpts);
    }

    // Define handler if src is a function
    if (typeof src === 'function') {
      handler = src;
    }

    // Prevent adding buildModules-listed entries in production
    if (this.options.buildModules.includes(handler) && this.options._start) {
      return
    }

    // Resolve handler
    if (!handler) {
      try {
        handler = this.nuxt.resolver.requireModule(src, { useESM: true });
      } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') {
          throw error
        }

        // Hint only if entrypoint is not found and src is not local alias or path
        if (error.message.includes(src) && !/^[~.]|^@\//.test(src)) {
          let message = 'Module `{name}` not found.';

          if (this.options.buildModules.includes(src)) {
            message += ' Please ensure `{name}` is in `devDependencies` and installed. HINT: During build step, for npm/yarn, `NODE_ENV=production` or `--production` should NOT be used.'.replace('{name}', src);
          } else if (this.options.modules.includes(src)) {
            message += ' Please ensure `{name}` is in `dependencies` and installed.';
          }

          message = message.replace(/{name}/g, src);

          consola__default['default'].warn(message);
        }

        if (this.options._cli) {
          throw error
        } else {
          // TODO: Remove in next major version
          consola__default['default'].warn('Silently ignoring module as programatic usage detected.');
          return
        }
      }
    }

    // Validate handler
    if (typeof handler !== 'function') {
      throw new TypeError('Module should export a function: ' + src)
    }

    // Ensure module is required once
    const metaKey = handler.meta && handler.meta.name;
    const key = metaKey || src;
    if (typeof key === 'string') {
      if (this.requiredModules[key]) {
        if (!metaKey) {
          // TODO: Skip with nuxt3
          consola__default['default'].warn('Modules should be only specified once:', key);
        } else {
          return
        }
      }
      this.requiredModules[key] = { src, options, handler };
    }

    // Default module options to empty object
    if (options === undefined) {
      options = {};
    }
    const result = await handler.call(this, options);
    return result
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

/** Built-in value references. */
var getPrototype = _overArg(Object.getPrototypeOf, Object);

var _getPrototype = getPrototype;

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
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

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
  if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = _getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$1.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

var isPlainObject_1 = isPlainObject;

var version = "2.14.7";

class Resolver {
  constructor (nuxt) {
    this.nuxt = nuxt;
    this.options = this.nuxt.options;

    // Binds
    this.resolvePath = this.resolvePath.bind(this);
    this.resolveAlias = this.resolveAlias.bind(this);
    this.resolveModule = this.resolveModule.bind(this);
    this.requireModule = this.requireModule.bind(this);

    const { createRequire } = this.options;
    this._require = createRequire ? createRequire(module) : module.require;

    this._resolve = require.resolve;
  }

  resolveModule (path) {
    try {
      return this._resolve(path, {
        paths: this.options.modulesDir
      })
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        // TODO: remove after https://github.com/facebook/jest/pull/8487 released
        if (process.env.NODE_ENV === 'test' && error.message.startsWith('Cannot resolve module')) {
          return
        }
        throw error
      }
    }
  }

  resolveAlias (path$1) {
    if (utils.startsWithRootAlias(path$1)) {
      return path.join(this.options.rootDir, path$1.substr(2))
    }

    if (utils.startsWithSrcAlias(path$1)) {
      return path.join(this.options.srcDir, path$1.substr(1))
    }

    return path.resolve(this.options.srcDir, path$1)
  }

  resolvePath (path$1, { alias, isAlias = alias, module, isModule = module, isStyle } = {}) {
    // TODO: Remove in Nuxt 3
    if (alias) {
      consola__default['default'].warn('Using alias is deprecated and will be removed in Nuxt 3. Use `isAlias` instead.');
    }
    if (module) {
      consola__default['default'].warn('Using module is deprecated and will be removed in Nuxt 3. Use `isModule` instead.');
    }

    // Fast return in case of path exists
    if (fs__default$1['default'].existsSync(path$1)) {
      return path$1
    }

    let resolvedPath;

    // Try to resolve it as a regular module
    if (isModule !== false) {
      resolvedPath = this.resolveModule(path$1);
    }

    // Try to resolve alias
    if (!resolvedPath && isAlias !== false) {
      resolvedPath = this.resolveAlias(path$1);
    }

    // Use path for resolvedPath
    if (!resolvedPath) {
      resolvedPath = path$1;
    }

    let isDirectory;

    // Check if resolvedPath exits and is not a directory
    if (fs__default$1['default'].existsSync(resolvedPath)) {
      isDirectory = fs__default$1['default'].lstatSync(resolvedPath).isDirectory();

      if (!isDirectory) {
        return resolvedPath
      }
    }

    const extensions = isStyle ? this.options.styleExtensions : this.options.extensions;

    // Check if any resolvedPath.[ext] or resolvedPath/index.[ext] exists
    for (const ext of extensions) {
      if (!isDirectory && fs__default$1['default'].existsSync(resolvedPath + '.' + ext)) {
        return resolvedPath + '.' + ext
      }

      const resolvedPathwithIndex = path.join(resolvedPath, 'index.' + ext);
      if (isDirectory && fs__default$1['default'].existsSync(resolvedPathwithIndex)) {
        return resolvedPathwithIndex
      }
    }

    // If there's no index.[ext] we just return the directory path
    if (isDirectory) {
      return resolvedPath
    }

    // Give up
    throw new Error(`Cannot resolve "${path$1}" from "${resolvedPath}"`)
  }

  requireModule (path, { esm, useESM = esm, alias, isAlias = alias, intropDefault, interopDefault = intropDefault } = {}) {
    let resolvedPath = path;
    let requiredModule;

    // TODO: Remove in Nuxt 3
    if (intropDefault) {
      consola__default['default'].warn('Using intropDefault is deprecated and will be removed in Nuxt 3. Use `interopDefault` instead.');
    }
    if (alias) {
      consola__default['default'].warn('Using alias is deprecated and will be removed in Nuxt 3. Use `isAlias` instead.');
    }
    if (esm) {
      consola__default['default'].warn('Using esm is deprecated and will be removed in Nuxt 3. Use `useESM` instead.');
    }

    let lastError;

    // Try to resolve path
    try {
      resolvedPath = this.resolvePath(path, { isAlias });
    } catch (e) {
      lastError = e;
    }

    const isExternal = utils.isExternalDependency(resolvedPath);

    // in dev mode make sure to clear the require cache so after
    // a dev server restart any changed file is reloaded
    if (this.options.dev && !isExternal) {
      utils.clearRequireCache(resolvedPath);
    }

    // By default use esm only for js,mjs files outside of node_modules
    if (useESM === undefined) {
      useESM = !isExternal && /.(js|mjs)$/.test(resolvedPath);
    }

    // Try to require
    try {
      if (useESM) {
        requiredModule = this._require(resolvedPath);
      } else {
        requiredModule = require(resolvedPath);
      }
    } catch (e) {
      lastError = e;
    }

    // Interop default
    if (interopDefault !== false && requiredModule && requiredModule.default) {
      requiredModule = requiredModule.default;
    }

    // Throw error if failed to require
    if (requiredModule === undefined && lastError) {
      throw lastError
    }

    return requiredModule
  }
}

class Nuxt extends Hookable__default['default'] {
  constructor (options = {}) {
    super(consola__default['default']);

    // Assign options and apply defaults
    this.options = config.getNuxtConfig(options);

    // Create instance of core components
    this.resolver = new Resolver(this);
    this.moduleContainer = new ModuleContainer(this);

    // Deprecated hooks
    this.deprecateHooks({
      // #3294 - 7514db73b25c23b8c14ebdafbb4e129ac282aabd
      'render:context': {
        to: '_render:context',
        message: '`render:context(nuxt)` is deprecated, Please use `vue-renderer:ssr:context(context)`'
      },
      // #3773
      'render:routeContext': {
        to: '_render:context',
        message: '`render:routeContext(nuxt)` is deprecated, Please use `vue-renderer:ssr:context(context)`'
      },
      showReady: 'webpack:done',
      // Introduced in 2.13
      'export:done': 'generate:done',
      'export:before': 'generate:before',
      'export:extendRoutes': 'generate:extendRoutes',
      'export:distRemoved': 'generate:distRemoved',
      'export:distCopied': 'generate:distCopied',
      'export:route': 'generate:route',
      'export:routeFailed': 'generate:routeFailed',
      'export:page': 'generate:page',
      'export:routeCreated': 'generate:routeCreated'
    });

    // Add Legacy aliases
    utils.defineAlias(this, this.resolver, ['resolveAlias', 'resolvePath']);
    this.showReady = () => { this.callHook('webpack:done'); };

    // Init server
    if (this.options.server !== false) {
      this._initServer();
    }

    // Call ready
    if (this.options._ready !== false) {
      this.ready().catch((err) => {
        consola__default['default'].fatal(err);
      });
    }
  }

  static get version () {
    return `v${version}` + (global.__NUXT_DEV__ ? '-development' : '')
  }

  ready () {
    if (!this._ready) {
      this._ready = this._init();
    }
    return this._ready
  }

  async _init () {
    if (this._initCalled) {
      return this
    }
    this._initCalled = true;

    // Add hooks
    if (isPlainObject_1(this.options.hooks)) {
      this.addHooks(this.options.hooks);
    } else if (typeof this.options.hooks === 'function') {
      this.options.hooks(this.hook);
    }

    // Await for modules
    await this.moduleContainer.ready();

    // Await for server to be ready
    if (this.server) {
      await this.server.ready();
    }

    // Call ready hook
    await this.callHook('ready', this);

    return this
  }

  _initServer () {
    if (this.server) {
      return
    }
    this.server = new server.Server(this);
    this.renderer = this.server;
    this.render = this.server.app;
    utils.defineAlias(this, this.server, ['renderRoute', 'renderAndGetWindow', 'listen']);
  }

  async close (callback) {
    await this.callHook('close', this);

    if (typeof callback === 'function') {
      await callback();
    }

    this.clearHooks();
  }
}

const OVERRIDES = {
  dry: { dev: false, server: false },
  dev: { dev: true, _build: true },
  build: { dev: false, server: false, _build: true },
  start: { dev: false, _start: true }
};

async function loadNuxt (loadOptions) {
  // Normalize loadOptions
  if (typeof loadOptions === 'string') {
    loadOptions = { for: loadOptions };
  }
  const { ready = true } = loadOptions;
  const _for = loadOptions.for || 'dry';

  // Get overrides
  const override = OVERRIDES[_for];

  // Unsupported purpose
  if (!override) {
    throw new Error('Unsupported for: ' + _for)
  }

  // Load Config
  const config$1 = await config.loadNuxtConfig(loadOptions);

  // Apply config overrides
  Object.assign(config$1, override);

  // Initiate Nuxt
  const nuxt = new Nuxt(config$1);
  if (ready) {
    await nuxt.ready();
  }

  return nuxt
}

Object.defineProperty(exports, 'loadNuxtConfig', {
  enumerable: true,
  get: function () {
    return config.loadNuxtConfig;
  }
});
exports.Module = ModuleContainer;
exports.Nuxt = Nuxt;
exports.Resolver = Resolver;
exports.loadNuxt = loadNuxt;
