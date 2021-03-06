// Deprecated.
// Use `libphonenumber-js/min` or `libphonenumber-js/max` or `libphonenumber-js/core` instead.

// Importing from `.json.js` a workaround for a bug in web browsers' "native"
// ES6 importing system which is uncapable of importing "*.json" files.
// https://github.com/catamphetamine/libphonenumber-js/issues/239
import metadata from './metadata.min.json.js'

import parsePhoneNumberWithErrorCustom from './es6/parsePhoneNumber'
import parsePhoneNumberFromStringCustom from './es6/parsePhoneNumberFromString'

import parseNumberCustom from './es6/parse'
import formatNumberCustom from './es6/format'
import getNumberTypeCustom from './es6/getNumberType'
import getExampleNumberCustom from './es6/getExampleNumber'
import isPossibleNumberCustom from './es6/isPossibleNumber'
import isValidNumberCustom from './es6/validate'
import isValidNumberForRegionCustom from './es6/isValidNumberForRegion'

// Deprecated
import findPhoneNumbersCustom, { searchPhoneNumbers as searchPhoneNumbersCustom } from './es6/findPhoneNumbers'
import { PhoneNumberSearch as PhoneNumberSearchCustom } from './es6/findPhoneNumbers_'

import findNumbersCustom from './es6/findNumbers'
import searchNumbersCustom from './es6/searchNumbers'
import findPhoneNumbersInTextCustom from './es6/findPhoneNumbersInText'
import searchPhoneNumbersInTextCustom from './es6/searchPhoneNumbersInText'
import PhoneNumberMatcherCustom from './es6/PhoneNumberMatcher'

import AsYouTypeCustom from './es6/AsYouType'

import getCountryCallingCodeCustom from './es6/getCountryCallingCode'
import getCountriesCustom from './es6/getCountries'
export { default as Metadata } from './es6/metadata'
import { getExtPrefix as getExtPrefixCustom, isSupportedCountry as isSupportedCountryCustom } from './es6/metadata'
import { parseRFC3966 as parseRFC3966Custom, formatRFC3966 as formatRFC3966Custom } from './es6/RFC3966'
import formatIncompletePhoneNumberCustom from './es6/formatIncompletePhoneNumber'
export { default as parseIncompletePhoneNumber, parsePhoneNumberCharacter } from './es6/parseIncompletePhoneNumber'
// Deprecated: remove DIGITS export in 2.0.0.
// (it was used in `react-phone-number-input`)
export { DIGITS, default as parseDigits } from './es6/parseDigits'
export { default as ParseError } from './es6/ParseError'

export function parsePhoneNumberWithError()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return parsePhoneNumberWithErrorCustom.apply(this, parameters)
}

// `parsePhoneNumber()` named export has been renamed to `parsePhoneNumberWithError()`.
export var parsePhoneNumber = parsePhoneNumberWithError

// `parsePhoneNumberFromString()` named export is now considered legacy:
// it has been promoted to a default export due to being too verbose.
export function parsePhoneNumberFromString()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return parsePhoneNumberFromStringCustom.apply(this, parameters)
}

export default parsePhoneNumberFromString

export function parseNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return parseNumberCustom.apply(this, parameters)
}

// Deprecated: remove `parse()` export in 2.0.0.
// (renamed to `parseNumber()`)
export function parse()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return parseNumberCustom.apply(this, parameters)
}

export function formatNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return formatNumberCustom.apply(this, parameters)
}

// Deprecated: remove `format()` export in 2.0.0.
// (renamed to `formatNumber()`)
export function format()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return formatNumberCustom.apply(this, parameters)
}

export function getNumberType()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return getNumberTypeCustom.apply(this, parameters)
}

export function getExampleNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return getExampleNumberCustom.apply(this, parameters)
}

export function isPossibleNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return isPossibleNumberCustom.apply(this, parameters)
}

export function isValidNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return isValidNumberCustom.apply(this, parameters)
}

export function isValidNumberForRegion()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return isValidNumberForRegionCustom.apply(this, parameters)
}

// Deprecated.
export function findPhoneNumbers()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return findPhoneNumbersCustom.apply(this, parameters)
}

// Deprecated.
export function searchPhoneNumbers()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return searchPhoneNumbersCustom.apply(this, parameters)
}

// Deprecated.
export function PhoneNumberSearch(text, options)
{
	PhoneNumberSearchCustom.call(this, text, options, metadata)
}

// Deprecated.
PhoneNumberSearch.prototype = Object.create(PhoneNumberSearchCustom.prototype, {})
PhoneNumberSearch.prototype.constructor = PhoneNumberSearch

export function findNumbers()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return findNumbersCustom.apply(this, parameters)
}

export function searchNumbers()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return searchNumbersCustom.apply(this, parameters)
}

export function findPhoneNumbersInText()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return findPhoneNumbersInTextCustom.apply(this, parameters)
}

export function searchPhoneNumbersInText()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return searchPhoneNumbersInTextCustom.apply(this, parameters)
}

export function PhoneNumberMatcher(text, options)
{
	PhoneNumberMatcherCustom.call(this, text, options, metadata)
}

PhoneNumberMatcher.prototype = Object.create(PhoneNumberMatcherCustom.prototype, {})
PhoneNumberMatcher.prototype.constructor = PhoneNumberMatcher

export function AsYouType(country)
{
	AsYouTypeCustom.call(this, country, metadata)
}

AsYouType.prototype = Object.create(AsYouTypeCustom.prototype, {})
AsYouType.prototype.constructor = AsYouType

export function isSupportedCountry()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return isSupportedCountryCustom.apply(this, parameters)
}

export function getExtPrefix()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return getExtPrefixCustom.apply(this, parameters)
}

export function parseRFC3966()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return parseRFC3966Custom.apply(this, parameters)
}

export function formatRFC3966()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return formatRFC3966Custom.apply(this, parameters)
}

export function formatIncompletePhoneNumber()
{
	var parameters = Array.prototype.slice.call(arguments)
	parameters.push(metadata)
	return formatIncompletePhoneNumberCustom.apply(this, parameters)
}

// Deprecated: remove this in 2.0.0 and make `custom.js` in ES6
// (the old `custom.js` becomes `custom.commonjs.js`).
export { default as parseCustom } from './es6/parse'
export { default as formatCustom } from './es6/format'
export { default as isValidNumberCustom } from './es6/validate'
export { default as findPhoneNumbersCustom } from './es6/findPhoneNumbers'
export { searchPhoneNumbers as searchPhoneNumbersCustom } from './es6/findPhoneNumbers'
export { PhoneNumberSearch as PhoneNumberSearchCustom } from './es6/findPhoneNumbers_'
export { default as getNumberTypeCustom } from './es6/getNumberType'
export { default as getCountryCallingCodeCustom } from './es6/getCountryCallingCode'

export
{
	default as AsYouTypeCustom,
	// Deprecated: `DIGIT_PLACEHOLDER` was used by `react-phone-number-input`.
	// Seems to be not used anymore.
	DIGIT_PLACEHOLDER
}
from './es6/AsYouType'

export function getCountries()
{
	return getCountriesCustom(metadata)
}

export function getCountryCallingCode(country)
{
	return getCountryCallingCodeCustom(country, metadata)
}

// `getPhoneCode` name is deprecated, use `getCountryCallingCode` instead.
export function getPhoneCode(country)
{
	return getCountryCallingCode(country)
}

// `getPhoneCodeCustom` name is deprecated, use `getCountryCallingCodeCustom` instead.
export function getPhoneCodeCustom(country, metadata)
{
	return getCountryCallingCodeCustom(country, metadata)
}