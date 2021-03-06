Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@sentry/utils");
/**
 * Express integration
 *
 * Provides an request and error handler for Express framework
 * as well as tracing capabilities
 */
var Express = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function Express(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = Express.id;
        this._app = options.app;
        this._methods = options.methods;
    }
    /**
     * @inheritDoc
     */
    Express.prototype.setupOnce = function () {
        if (!this._app) {
            utils_1.logger.error('ExpressIntegration is missing an Express instance');
            return;
        }
        instrumentMiddlewares(this._app);
        routeMiddlewares(this._app, this._methods);
    };
    /**
     * @inheritDoc
     */
    Express.id = 'Express';
    return Express;
}());
exports.Express = Express;
/**
 * Wraps original middleware function in a tracing call, which stores the info about the call as a span,
 * and finishes it once the middleware is done invoking.
 *
 * Express middlewares have 3 various forms, thus we have to take care of all of them:
 * // sync
 * app.use(function (req, res) { ... })
 * // async
 * app.use(function (req, res, next) { ... })
 * // error handler
 * app.use(function (err, req, res, next) { ... })
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function wrap(fn) {
    var arity = fn.length;
    switch (arity) {
        case 2: {
            return function (_req, res) {
                var transaction = res.__sentry_transaction;
                if (transaction) {
                    var span_1 = transaction.startChild({
                        description: fn.name,
                        op: 'middleware',
                    });
                    res.once('finish', function () {
                        span_1.finish();
                    });
                }
                // eslint-disable-next-line prefer-rest-params
                return fn.apply(this, arguments);
            };
        }
        case 3: {
            return function (req, res, next) {
                var transaction = res.__sentry_transaction;
                var span = transaction &&
                    transaction.startChild({
                        description: fn.name,
                        op: 'middleware',
                    });
                fn.call(this, req, res, function () {
                    if (span) {
                        span.finish();
                    }
                    // eslint-disable-next-line prefer-rest-params
                    return next.apply(this, arguments);
                });
            };
        }
        case 4: {
            return function (err, req, res, next) {
                var transaction = res.__sentry_transaction;
                var span = transaction &&
                    transaction.startChild({
                        description: fn.name,
                        op: 'middleware',
                    });
                fn.call(this, err, req, res, function () {
                    if (span) {
                        span.finish();
                    }
                    // eslint-disable-next-line prefer-rest-params
                    return next.apply(this, arguments);
                });
            };
        }
        default: {
            throw new Error("Express middleware takes 2-4 arguments. Got: " + arity);
        }
    }
}
/**
 * Takes all the function arguments passed to the original `app.use` call
 * and wraps every function, as well as array of functions with a call to our `wrap` method.
 * We have to take care of the arrays as well as iterate over all of the arguments,
 * as `app.use` can accept middlewares in few various forms.
 *
 * app.use([<path>], <fn>)
 * app.use([<path>], <fn>, ...<fn>)
 * app.use([<path>], ...<fn>[])
 */
function wrapUseArgs(args) {
    return Array.from(args).map(function (arg) {
        if (typeof arg === 'function') {
            return wrap(arg);
        }
        if (Array.isArray(arg)) {
            return arg.map(function (a) {
                if (typeof a === 'function') {
                    return wrap(a);
                }
                return a;
            });
        }
        return arg;
    });
}
/**
 * Patches original App to utilize our tracing functionality
 */
function patchMiddleware(app, method) {
    var originalAppCallback = app[method];
    app[method] = function () {
        // eslint-disable-next-line prefer-rest-params
        return originalAppCallback.apply(this, wrapUseArgs(arguments));
    };
    return app;
}
/**
 * Patches original app.use
 */
function instrumentMiddlewares(app) {
    patchMiddleware(app, 'use');
}
/**
 * Patches original app.METHOD
 */
function routeMiddlewares(app, methods) {
    if (methods === void 0) { methods = []; }
    methods.forEach(function (method) {
        patchMiddleware(app, method);
    });
}
//# sourceMappingURL=express.js.map