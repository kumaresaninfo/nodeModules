(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global['vue-lazy-hydration'] = {}));
}(this, (function (exports) { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var observers = new Map();
  function createObserver(options) {
    if (typeof IntersectionObserver === "undefined") return null;
    var optionKey = JSON.stringify(options);
    if (observers.has(optionKey)) return observers.get(optionKey);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Use `intersectionRatio` because of Edge 15's
        // lack of support for `isIntersecting`.
        // See: https://github.com/w3c/IntersectionObserver/issues/211
        var isIntersecting = entry.isIntersecting || entry.intersectionRatio > 0;
        if (!isIntersecting || !entry.target.hydrate) return;
        entry.target.hydrate();
      });
    }, options);
    observers.set(optionKey, observer);
    return observer;
  }
  function loadingComponentFactory(resolvableComponent, options) {
    return _objectSpread2({
      render: function render(h) {
        var tag = this.$el ? this.$el.tagName : "div"; // eslint-disable-next-line no-underscore-dangle

        if (!this.$el) resolvableComponent._resolve();
        return h(tag);
      }
    }, options);
  }
  function resolvableComponentFactory(component) {
    var resolve;
    var promise = new Promise(function (newResolve) {
      resolve = newResolve;
    }); // eslint-disable-next-line no-underscore-dangle

    promise._resolve = function () {
      resolve(typeof component === "function" ? component() : component);
    };

    return promise;
  }

  var isServer = typeof window === "undefined";
  function hydrateWhenIdle(component) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        ignoredProps = _ref.ignoredProps;

    if (isServer) return component;
    var resolvableComponent = resolvableComponentFactory(component);
    var loading = loadingComponentFactory(resolvableComponent, {
      props: ignoredProps,
      mounted: function mounted() {
        // If `requestIdleCallback()` or `requestAnimationFrame()`
        // is not supported, hydrate immediately.
        if (!("requestIdleCallback" in window) || !("requestAnimationFrame" in window)) {
          // eslint-disable-next-line no-underscore-dangle
          resolvableComponent._resolve();

          return;
        }

        var id = requestIdleCallback(function () {
          // eslint-disable-next-line no-underscore-dangle
          requestAnimationFrame(resolvableComponent._resolve);
        }, {
          timeout: this.idleTimeout
        });

        var cleanup = function cleanup() {
          return cancelIdleCallback(id);
        };

        resolvableComponent.then(cleanup);
      }
    });
    return function () {
      return {
        component: resolvableComponent,
        delay: 0,
        loading: loading
      };
    };
  }
  function hydrateWhenVisible(component) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        ignoredProps = _ref2.ignoredProps,
        observerOptions = _ref2.observerOptions;

    if (isServer) return component;
    var resolvableComponent = resolvableComponentFactory(component);
    var observer = createObserver(observerOptions);
    var loading = loadingComponentFactory(resolvableComponent, {
      props: ignoredProps,
      mounted: function mounted() {
        var _this = this;

        // If Intersection Observer API is not supported, hydrate immediately.
        if (!observer) {
          // eslint-disable-next-line no-underscore-dangle
          resolvableComponent._resolve();

          return;
        } // eslint-disable-next-line no-underscore-dangle


        this.$el.hydrate = resolvableComponent._resolve;

        var cleanup = function cleanup() {
          return observer.unobserve(_this.$el);
        };

        resolvableComponent.then(cleanup);
        observer.observe(this.$el);
      }
    });
    return function () {
      return {
        component: resolvableComponent,
        delay: 0,
        loading: loading
      };
    };
  }
  function hydrateSsrOnly(component) {
    if (isServer) return component;
    var resolvableComponent = resolvableComponentFactory(component);
    var loading = loadingComponentFactory(resolvableComponent);
    return function () {
      return {
        component: resolvableComponent,
        delay: 0,
        loading: loading
      };
    };
  }
  function hydrateOnInteraction(component) {
    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref3$event = _ref3.event,
        event = _ref3$event === void 0 ? "focus" : _ref3$event,
        ignoredProps = _ref3.ignoredProps;

    if (isServer) return component;
    var resolvableComponent = resolvableComponentFactory(component);
    var events = Array.isArray(event) ? event : [event];
    var loading = loadingComponentFactory(resolvableComponent, {
      props: ignoredProps,
      mounted: function mounted() {
        var _this2 = this;

        events.forEach(function (eventName) {
          // eslint-disable-next-line no-underscore-dangle
          _this2.$el.addEventListener(eventName, resolvableComponent._resolve, {
            capture: true,
            once: true,
            passive: true
          });
        });
      }
    });
    return function () {
      return {
        component: resolvableComponent,
        delay: 0,
        loading: loading
      };
    };
  }
  var LazyHydrate = {
    props: {
      idleTimeout: {
        default: 2000,
        type: Number
      },
      onInteraction: {
        type: [Array, Boolean, String]
      },
      ssrOnly: {
        type: Boolean
      },
      triggerHydration: {
        default: false,
        type: Boolean
      },
      whenIdle: {
        type: Boolean
      },
      whenVisible: {
        type: [Boolean, Object]
      }
    },
    data: function data() {
      return {
        hydrated: isServer
      };
    },
    watch: {
      triggerHydration: {
        immediate: true,
        handler: function handler(hydrate) {
          if (hydrate) this.hydrate();
        }
      }
    },
    computed: {
      interactionEvents: function interactionEvents() {
        if (!this.onInteraction) return [];
        if (this.onInteraction === true) return ["focus"];
        return Array.isArray(this.onInteraction) ? this.onInteraction : [this.onInteraction];
      }
    },
    mounted: function mounted() {
      var _this3 = this;

      if (this.$el.childElementCount === 0) {
        // No SSR rendered content, hydrate immediately.
        this.hydrate();
        return;
      }

      if (this.ssrOnly) return;
      this.interactionEvents.forEach(function (eventName) {
        _this3.$el.addEventListener(eventName, _this3.hydrate, {
          capture: true,
          once: true,
          passive: true
        });
      });

      if (this.interactionEvents.length) {
        this.interaction = function () {
          _this3.interactionEvents.forEach(function (eventName) {
            return _this3.$el.removeEventListener(eventName, _this3.hydrate);
          });
        };
      }

      if (this.whenIdle) {
        // If `requestIdleCallback()` or `requestAnimationFrame()`
        // is not supported, hydrate immediately.
        if (!("requestIdleCallback" in window) || !("requestAnimationFrame" in window)) {
          this.hydrate();
          return;
        }

        var id = requestIdleCallback(function () {
          requestAnimationFrame(function () {
            _this3.hydrate();
          });
        }, {
          timeout: this.idleTimeout
        });

        this.idle = function () {
          return cancelIdleCallback(id);
        };
      }

      if (this.whenVisible) {
        var options = this.whenVisible === true ? {} : this.whenVisible;
        var observer = createObserver(options); // If Intersection Observer API is not supported, hydrate immediately.

        if (!observer) {
          this.hydrate();
          return;
        }

        this.$el.hydrate = this.hydrate;
        observer.observe(this.$el);

        this.visible = function () {
          observer.unobserve(_this3.$el);
          delete _this3.$el.hydrate;
        };
      }
    },
    beforeDestroy: function beforeDestroy() {
      this.cleanup();
    },
    methods: {
      cleanup: function cleanup() {
        var _this4 = this;

        var handlers = ["idle", "interaction", "visible"];
        handlers.forEach(function (handler) {
          if (handler in _this4) {
            _this4[handler]();

            delete _this4[handler];
          }
        });
      },
      hydrate: function hydrate() {
        this.hydrated = true;
        this.cleanup();
      }
    },
    render: function render(h) {
      if (!this.$scopedSlots.default && !this.$slots.default) return null;
      var child = this.$scopedSlots.default ? this.$scopedSlots.default({
        hydrated: this.hydrated
      }) : this.$slots.default[0];
      if (this.hydrated) return child;
      var tag = this.$el ? this.$el.tagName : "div";
      var vnode = h(tag); // Special thanks to Rahul Kadyan for the following lines of code.
      // https://github.com/znck

      vnode.asyncFactory = {};
      vnode.isComment = true;
      return vnode;
    }
  };

  exports.default = LazyHydrate;
  exports.hydrateOnInteraction = hydrateOnInteraction;
  exports.hydrateSsrOnly = hydrateSsrOnly;
  exports.hydrateWhenIdle = hydrateWhenIdle;
  exports.hydrateWhenVisible = hydrateWhenVisible;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
