/*!
 * @nuxt/vue-app v2.14.7 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);

var dependencies = {
	"node-fetch": "^2.6.1",
	unfetch: "^4.2.0",
	vue: "^2.6.12",
	"vue-client-only": "^2.0.0",
	"vue-meta": "^2.4.0",
	"vue-no-ssr": "^1.1.1",
	"vue-router": "^3.4.6",
	"vue-template-compiler": "^2.6.12",
	vuex: "^3.5.1"
};

const template = {
  dependencies,
  dir: path__default['default'].join(__dirname, '..', 'template'),
  files: [
    'App.js',
    'client.js',
    'index.js',
    'jsonp.js',
    'router.js',
    'router.scrollBehavior.js',
    'routes.json',
    'server.js',
    'utils.js',
    'empty.js',
    'mixins/fetch.server.js',
    'mixins/fetch.client.js',
    'components/nuxt-error.vue',
    'components/nuxt-child.js',
    'components/nuxt-link.server.js',
    'components/nuxt-link.client.js',
    'components/nuxt.js',
    'views/app.template.html',
    'views/error.html'
  ]
};

exports.template = template;
