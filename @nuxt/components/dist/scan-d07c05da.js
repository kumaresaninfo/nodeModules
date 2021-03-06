'use strict';

var path = require('path');
var globby = require('globby');
var lodash = require('lodash');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var globby__default = /*#__PURE__*/_interopDefaultLegacy(globby);

const LAZY_PREFIX = 'lazy';

const pascalCase = str => lodash.upperFirst(lodash.camelCase(str));

const isWindows = process.platform.startsWith('win');

function sortDirsByPathLength({
  path: pathA
}, {
  path: pathB
}) {
  return pathB.split(/[\\/]/).filter(Boolean).length - pathA.split(/[\\/]/).filter(Boolean).length;
}

function prefixComponent(prefix = '', {
  pascalName,
  kebabName,
  ...rest
}) {
  return {
    pascalName: pascalName.startsWith(prefix) ? pascalName : pascalCase(prefix) + pascalName,
    kebabName: kebabName.startsWith(prefix) ? kebabName : lodash.kebabCase(prefix) + '-' + kebabName,
    ...rest
  };
}

async function scanComponents(dirs, srcDir) {
  const components = [];
  const filePaths = new Set();
  const scannedPaths = [];

  for (const {
    path: path$1,
    pattern,
    ignore = [],
    prefix,
    extendComponent,
    global
  } of dirs.sort(sortDirsByPathLength)) {
    const resolvedNames = new Map();

    for (const _file of await globby__default['default'](pattern, {
      cwd: path$1,
      ignore
    })) {
      let filePath = path.join(path$1, _file);

      if (scannedPaths.find(d => filePath.startsWith(d))) {
        continue;
      }

      if (filePaths.has(filePath)) {
        continue;
      }

      filePaths.add(filePath);
      let fileName = path.basename(filePath, path.extname(filePath));

      if (fileName === 'index') {
        fileName = path.basename(path.dirname(filePath), path.extname(filePath));
      }

      if (resolvedNames.has(fileName)) {
        // eslint-disable-next-line no-console
        console.warn(`Two component files resolving to the same name \`${fileName}\`:\n` + `\n - ${filePath}` + `\n - ${resolvedNames.get(fileName)}`);
        continue;
      }

      resolvedNames.set(fileName, filePath);
      const pascalName = pascalCase(fileName);
      const kebabName = lodash.kebabCase(fileName);
      const shortPath = filePath.replace(srcDir, '').replace(/\\/g, '/').replace(/^\//, '');
      let chunkName = shortPath.replace(path.extname(shortPath), ''); // istanbul ignore if

      if (isWindows) {
        filePath = filePath.replace(/\\/g, '\\\\');
        chunkName = chunkName.replace('/', '_');
      }

      let _c = prefixComponent(prefix, {
        filePath,
        pascalName,
        kebabName,
        chunkName,
        shortPath,
        import: '',
        asyncImport: '',
        export: 'default',
        global: Boolean(global)
      });

      if (typeof extendComponent === 'function') {
        _c = (await extendComponent(_c)) || _c;
      }

      const _import = _c.import || `require('${_c.filePath}').${_c.export}`;

      const _asyncImport = _c.asyncImport || `function () { return import('${_c.filePath}' /* webpackChunkName: "${_c.chunkName}" */).then(function(m) { return m['${_c.export}'] || m }) }`;

      components.push({ ..._c,
        import: _import
      });
      components.push(prefixComponent(LAZY_PREFIX, { ..._c,
        async: true,
        import: _asyncImport
      }));
    }

    scannedPaths.push(path$1);
  }

  return components;
}
function matcher(tags, components) {
  return tags.reduce((matches, tag) => {
    const match = components.find(({
      pascalName,
      kebabName
    }) => [pascalName, kebabName].includes(tag));
    match && matches.push(match);
    return matches;
  }, []);
}

exports.matcher = matcher;
exports.scanComponents = scanComponents;
