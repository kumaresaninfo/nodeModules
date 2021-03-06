# fault

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

Functional errors with formatted output.

## Install

[npm][]:

```sh
npm install fault
```

## Use

```js
var fault = require('fault')

throw fault('Hello %s!', 'Eric')
```

Yields:

```text
Error: Hello Eric!
    at FormattedError (~/node_modules/fault/index.js:30:12)
    at Object.<anonymous> (~/example.js:3:7)
    β¦
```

Or, format a float in a type error:

```js
var fault = require('fault')

throw fault.type('Who doesnβt like %f? \uD83C\uDF70', Math.PI)
```

Yields:

```text
TypeError: Who doesnβt like 3.141593? π°
    at Function.FormattedError [as type] (~/node_modules/fault/index.js:30:12)
    at Object.<anonymous> (~/example.js:3:7)
```

## API

### `fault(format?[, values...])`

Create an error with a printf-like formatted message.

###### Parameters

*   `format` (`string`, optional)
*   `values` (`*`, optional)

###### Formatters

*   `%s` β String
*   `%b` β Binary
*   `%c` β Character
*   `%d` β Decimal
*   `%f` β Floating point
*   `%o` β Octal
*   `%x` β Lowercase hexadecimal
*   `%X` β Uppercase hexadecimal
*   `%` followed by any other character, prints that character

See [`samsonjs/format`][fmt] for argument parsing.

###### Returns

An instance of [`Error`][error].

###### Other errors

*   `fault.eval(format?[, values...])` β [EvalError][]
*   `fault.range(format?[, values...])` β [RangeError][]
*   `fault.reference(format?[, values...])` β [ReferenceError][]
*   `fault.syntax(format?[, values...])` β [SyntaxError][]
*   `fault.type(format?[, values...])` β [TypeError][]
*   `fault.uri(format?[, values...])` β [URIError][]

#### `fault.create(Constructor)`

Factory to create instances of `ErrorConstructor` with support for formatting.
Used internally to wrap the global error constructors, exposed for custom
errors.
Returns a function just like `fault`.

## License

[MIT][license] Β© [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/fault.svg

[build]: https://travis-ci.org/wooorm/fault

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/fault.svg

[coverage]: https://codecov.io/github/wooorm/fault

[downloads-badge]: https://img.shields.io/npm/dm/fault.svg

[downloads]: https://www.npmjs.com/package/fault

[size-badge]: https://img.shields.io/bundlephobia/minzip/fault.svg

[size]: https://bundlephobia.com/result?p=fault

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[fmt]: https://github.com/samsonjs/format

[error]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/Error

[evalerror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/EvalError

[rangeerror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/RangeError

[referenceerror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/ReferenceError

[syntaxerror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/SyntaxError

[typeerror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/TypeError

[urierror]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/URIError.
