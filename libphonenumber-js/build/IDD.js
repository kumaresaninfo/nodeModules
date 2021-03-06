"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIDDPrefix = getIDDPrefix;
exports.stripIDDPrefix = stripIDDPrefix;

var _metadata = _interopRequireDefault(require("./metadata"));

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var CAPTURING_DIGIT_PATTERN = new RegExp('([' + _constants.VALID_DIGITS + '])');
/**
 * Pattern that makes it easy to distinguish whether a region has a single
 * international dialing prefix or not. If a region has a single international
 * prefix (e.g. 011 in USA), it will be represented as a string that contains
 * a sequence of ASCII digits, and possibly a tilde, which signals waiting for
 * the tone. If there are multiple available international prefixes in a
 * region, they will be represented as a regex string that always contains one
 * or more characters that are not ASCII digits or a tilde.
 */

var SINGLE_IDD_PREFIX = /^[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?$/; // For regions that have multiple IDD prefixes
// a preferred IDD prefix is returned.

function getIDDPrefix(country, callingCode, metadata) {
  var countryMetadata = new _metadata["default"](metadata);
  countryMetadata.selectNumberingPlan(country, callingCode);

  if (SINGLE_IDD_PREFIX.test(countryMetadata.IDDPrefix())) {
    return countryMetadata.IDDPrefix();
  }

  return countryMetadata.defaultIDDPrefix();
}

function stripIDDPrefix(number, country, callingCode, metadata) {
  if (!country) {
    return;
  } // Check if the number is IDD-prefixed.


  var countryMetadata = new _metadata["default"](metadata);
  countryMetadata.selectNumberingPlan(country, callingCode);
  var IDDPrefixPattern = new RegExp(countryMetadata.IDDPrefix());

  if (number.search(IDDPrefixPattern) !== 0) {
    return;
  } // Strip IDD prefix.


  number = number.slice(number.match(IDDPrefixPattern)[0].length); // Some kind of a weird edge case.
  // No explanation from Google given.

  var matchedGroups = number.match(CAPTURING_DIGIT_PATTERN);
  /* istanbul ignore next */

  if (matchedGroups && matchedGroups[1] != null && matchedGroups[1].length > 0) {
    if (matchedGroups[1] === '0') {
      return;
    }
  }

  return number;
}
//# sourceMappingURL=IDD.js.map