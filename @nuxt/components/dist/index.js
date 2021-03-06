'use strict';

var path = require('path');
var fs = require('fs');
var chokidar = require('chokidar');
var RuleSet = require('webpack/lib/RuleSet');
var chalk = require('chalk');
var semver = require('semver');
require('globby');
require('lodash');
var scan = require('./scan-d07c05da.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chokidar__default = /*#__PURE__*/_interopDefaultLegacy(chokidar);
var RuleSet__default = /*#__PURE__*/_interopDefaultLegacy(RuleSet);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var semver__default = /*#__PURE__*/_interopDefaultLegacy(semver);

function requireNuxtVersion(currentVersion, requiredVersion) {
  const pkgName = require('../package.json').name;

  if (!currentVersion || !requireNuxtVersion) {
    return;
  }

  const _currentVersion = semver__default['default'].coerce(currentVersion);

  const _requiredVersion = semver__default['default'].coerce(requiredVersion);

  if (semver__default['default'].lt(_currentVersion, _requiredVersion)) {
    throw new Error(`\n
      ${chalk__default['default'].cyan(pkgName)} is not compatible with your current Nuxt version : ${chalk__default['default'].yellow('v' + currentVersion)}\n
      Required: ${chalk__default['default'].green('v' + requiredVersion)} or ${chalk__default['default'].cyan('higher')}
    `);
  }
}

const isPureObjectOrString = val => !Array.isArray(val) && typeof val === 'object' || typeof val === 'string';

const getDir = p => fs__default['default'].statSync(p).isDirectory() ? p : path__default['default'].dirname(p);

const componentsModule = function () {
  var _nuxt$constructor;

  const {
    nuxt
  } = this;
  const {
    components
  } = nuxt.options;

  if (!components) {
    return;
  }

  requireNuxtVersion(nuxt === null || nuxt === void 0 ? void 0 : (_nuxt$constructor = nuxt.constructor) === null || _nuxt$constructor === void 0 ? void 0 : _nuxt$constructor.version, '2.10');
  const options = {
    dirs: ['~/components'],
    ...(Array.isArray(components) ? {
      dirs: components
    } : components)
  };
  nuxt.hook('build:before', async builder => {
    const nuxtIgnorePatterns = builder.ignore.ignore ? builder.ignore.ignore._rules.map(rule => rule.pattern) :
    /* istanbul ignore next */
    [];
    await nuxt.callHook('components:dirs', options.dirs);
    const componentDirs = options.dirs.filter(isPureObjectOrString).map(dir => {
      const dirOptions = typeof dir === 'object' ? dir : {
        path: dir
      };
      let dirPath = dirOptions.path;

      try {
        dirPath = getDir(nuxt.resolver.resolvePath(dirOptions.path));
      } catch (err) {}

      const transpile = typeof dirOptions.transpile === 'boolean' ? dirOptions.transpile : 'auto'; // Normalize global option

      if (dirOptions.global === 'dev') {
        dirOptions.global = nuxt.options.dev;
      }

      const enabled = fs__default['default'].existsSync(dirPath);

      if (!enabled && dirOptions.path !== '~/components') {
        // eslint-disable-next-line no-console
        console.warn('Components directory not found: `' + dirPath + '`');
      }

      const extensions = dirOptions.extensions || builder.supportedExtensions;
      return { ...dirOptions,
        enabled,
        path: dirPath,
        extensions,
        pattern: dirOptions.pattern || `**/*.{${extensions.join(',')},}`,
        ignore: ['**/*.stories.js', ...nuxtIgnorePatterns, ...(dirOptions.ignore || [])],
        transpile: transpile === 'auto' ? dirPath.includes('node_modules') : transpile
      };
    }).filter(d => d.enabled);
    nuxt.options.build.transpile.push(...componentDirs.filter(dir => dir.transpile).map(dir => dir.path));
    let components = await scan.scanComponents(componentDirs, nuxt.options.srcDir);
    await nuxt.callHook('components:extend', components); // Add loader for tree shaking

    if (componentDirs.some(dir => !dir.global)) {
      this.extendBuild(config => {
        const {
          rules
        } = new RuleSet__default['default'](config.module.rules);
        const vueRule = rules.find(rule => rule.use && rule.use.find(use => use.loader === 'vue-loader'));
        vueRule.use.unshift({
          loader: require.resolve('./loader'),
          options: {
            dependencies: nuxt.options.dev ? componentDirs.filter(dir => !dir.global).map(dir => dir.path) :
            /* istanbul ignore next */
            [],
            getComponents: () => components
          }
        });
        config.module.rules = rules;
      }); // Add Webpack entry for runtime installComponents function

      nuxt.hook('webpack:config', configs => {
        for (const config of configs.filter(c => ['client', 'modern', 'server'].includes(c.name))) {
          config.entry.app.unshift(path__default['default'].resolve(__dirname, '../lib/installComponents.js'));
        }
      });
    } // Watch
    // istanbul ignore else


    if (nuxt.options.dev && componentDirs.some(dir => dir.watch !== false)) {
      const watcher = chokidar__default['default'].watch(componentDirs.filter(dir => dir.watch !== false).map(dir => dir.path), nuxt.options.watchers.chokidar);
      watcher.on('all', async eventName => {
        if (!['add', 'unlink'].includes(eventName)) {
          return;
        }

        components = await scan.scanComponents(componentDirs, nuxt.options.srcDir);
        await nuxt.callHook('components:extend', components);
        await builder.generateRoutesAndFiles();
      }); // Close watcher on nuxt close

      nuxt.hook('close', () => {
        watcher.close();
      });
    } // Global components
    // Add templates


    const getComponents = () => components;

    const templates = ['components/index.js', 'components/plugin.js', 'vetur/tags.json'];

    for (const t of templates) {
      this[t.includes('plugin') ? 'addPlugin' : 'addTemplate']({
        src: path__default['default'].resolve(__dirname, '../templates', t),
        fileName: t,
        options: {
          getComponents
        }
      });
    }
  });
}; // @ts-ignore


componentsModule.meta = {
  name: '@nuxt/components'
};

module.exports = componentsModule;
