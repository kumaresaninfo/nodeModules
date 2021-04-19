/*!
 * @nuxt/cli v2.14.7 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

const index = require('./cli-index.js');
const path = require('path');
const config = require('@nuxt/config');
require('exit');
const utils = require('@nuxt/utils');
require('chalk');
require('std-env');
require('wrap-ansi');
require('boxen');
const consola = require('consola');
require('minimist');
require('hable');
const fs = require('fs');
require('execa');
require('pretty-bytes');
const banner = require('./cli-banner.js');
const connect = require('connect');
const serveStatic = require('serve-static');
const compression = require('compression');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
const connect__default = /*#__PURE__*/_interopDefaultLegacy(connect);
const serveStatic__default = /*#__PURE__*/_interopDefaultLegacy(serveStatic);
const compression__default = /*#__PURE__*/_interopDefaultLegacy(compression);

async function serve (cmd) {
  const _config = await cmd.getNuxtConfig({ dev: false });

  // add default options
  const options = config.getNuxtConfig(_config);

  try {
    // overwrites with build config
    const buildConfig = require(path.join(options.buildDir, 'nuxt/config.json'));
    options.target = buildConfig.target;
  } catch (err) { }

  const distStat = await fs.promises.stat(options.generate.dir).catch(err => null); // eslint-disable-line handle-callback-err
  const distPath = path.join(options.generate.dir.replace(process.cwd() + path.sep, ''), path.sep);
  if (!distStat || !distStat.isDirectory()) {
    throw new Error('Output directory `' + distPath + '` does not exists, please use `nuxt generate` before `nuxt start` for static target.')
  }
  const app = connect__default['default']();
  app.use(compression__default['default']({ threshold: 0 }));
  app.use(
    options.router.base,
    serveStatic__default['default'](options.generate.dir, {
      extensions: ['html']
    })
  );
  if (options.generate.fallback) {
    const fallbackFile = await fs.promises.readFile(path.join(options.generate.dir, options.generate.fallback), 'utf-8');
    app.use((req, res, next) => {
      const ext = path.extname(req.url) || '.html';

      if (ext !== '.html') {
        return next()
      }
      res.writeHeader(200, {
        'Content-Type': 'text/html'
      });
      res.write(fallbackFile);
      res.end();
    });
  }

  const { port, host, socket, https } = options.server;
  const { Listener } = await index.server();
  const listener = new Listener({
    port,
    host,
    socket,
    https,
    app,
    dev: true, // try another port if taken
    baseURL: options.router.base
  });

  await listener.listen();

  const { Nuxt } = await index.core();

  banner.showBanner({
    constructor: Nuxt,
    options,
    server: {
      listeners: [listener]
    }
  }, false);

  consola__default['default'].info(`Serving static application from \`${distPath}\``);
}

const start = {
  name: 'start',
  description: 'Start the application in production mode (the application should be compiled with `nuxt build` first)',
  usage: 'start <dir>',
  options: {
    ...index.common,
    ...index.server$1
  },
  async run (cmd) {
    const config = await cmd.getNuxtConfig({ dev: false, _start: true });

    if (config.target === utils.TARGETS.static) {
      return serve(cmd)
    }

    const nuxt = await cmd.getNuxt(config);

    // Listen and show ready banner
    await nuxt.server.listen();
    banner.showBanner(nuxt);
  }
};

exports.default = start;
