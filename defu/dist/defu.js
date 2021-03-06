'use strict';

function isObject(val) {
  return val !== null && typeof val === 'object';
} // Base function to apply defaults


function _defu(baseObj, defaults, merger) {
  if (!isObject(defaults)) {
    return _defu(baseObj, {}, merger);
  }

  var obj = Object.assign({}, defaults);

  for (var key in baseObj) {
    if (key === '__proto__' || key === 'constructor') {
      continue;
    }

    var val = baseObj[key];

    if (val === null) {
      continue;
    }

    if (merger && merger(obj, key, val)) {
      continue;
    }

    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = obj[key].concat(val);
    } else if (isObject(val) && isObject(obj[key])) {
      obj[key] = _defu(val, obj[key], merger);
    } else {
      obj[key] = val;
    }
  }

  return obj;
} // Create defu wrapper with optional merger and multi arg support


function extend(merger) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return args.reduce(function (p, c) {
      return _defu(p, c, merger);
    }, {});
  };
} // Basic version


var defu = extend(); // Custom version with function merge support

defu.fn = extend(function (obj, key, currentValue) {
  if (typeof obj[key] !== 'undefined' && typeof currentValue === 'function') {
    obj[key] = currentValue(obj[key]);
    return true;
  }
}); // Custom version with function merge support only for defined arrays

defu.arrayFn = extend(function (obj, key, currentValue) {
  if (Array.isArray(obj[key]) && typeof currentValue === 'function') {
    obj[key] = currentValue(obj[key]);
    return true;
  }
}); // Support user extending

defu.extend = extend;

module.exports = defu;
