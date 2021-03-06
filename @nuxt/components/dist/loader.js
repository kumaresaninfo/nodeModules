'use strict';

require('path');
var fs = require('fs');
require('globby');
require('lodash');
var scan = require('./scan-d07c05da.js');
var loaderUtils = require('loader-utils');
var vueTemplateCompiler = require('vue-template-compiler');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var loaderUtils__default = /*#__PURE__*/_interopDefaultLegacy(loaderUtils);

async function extractTags(resourcePath) {
  const tags = new Set();
  const file = (await fs.readFileSync(resourcePath)).toString('utf8');
  const component = vueTemplateCompiler.parseComponent(file);

  if (component.template) {
    if (component.template.lang === 'pug') {
      try {
        const pug = require('pug');

        component.template.content = pug.render(component.template.content, {
          filename: resourcePath
        });
      } catch (err) {
        /* Ignore compilation errors, they'll be picked up by other loaders */
      }
    }

    vueTemplateCompiler.compile(component.template.content, {
      modules: [{
        postTransformNode: el => {
          tags.add(el.tag);
        }
      }]
    });
  }

  return [...tags];
}

function install(content, components) {
  const imports = '{' + components.map(c => `${c.pascalName}: ${c.import}`).join(',') + '}';
  let newContent = '/* nuxt-component-imports */\n';
  newContent += `installComponents(component, ${imports})\n`; // Insert our modification before the HMR code

  const hotReload = content.indexOf('/* hot reload */');

  if (hotReload > -1) {
    content = content.slice(0, hotReload) + newContent + '\n\n' + content.slice(hotReload);
  } else {
    content += '\n\n' + newContent;
  }

  return content;
}

async function loader(content) {
  this.async();
  this.cacheable();

  if (!this.resourceQuery) {
    this.addDependency(this.resourcePath);
    const {
      dependencies,
      getComponents
    } = {
      dependencies: [],
      getComponents: () => [],
      ...loaderUtils__default['default'].getOptions(this)
    };

    for (const dependency of dependencies) {
      this.addDependency(dependency);
    }

    const tags = await extractTags(this.resourcePath);
    const matchedComponents = scan.matcher(tags, getComponents());

    if (matchedComponents.length) {
      content = install.call(this, content, matchedComponents);
    }
  }

  this.callback(null, content);
}

module.exports = loader;
