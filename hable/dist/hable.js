"use strict";function flatHooks(o,s={},t){for(const e in o){const r=o[e],h=t?`${t}:${e}`:e;"object"==typeof r&&null!==r?flatHooks(r,s,h):s[h]=r}return s}function serial(o,s){return o.reduce((o,t)=>o.then(o=>s(t,o)),Promise.resolve(null))}class Hookable{constructor(o=console){this._logger=o,this._hooks={},this._deprecatedHooks={},this.hook=this.hook.bind(this),this.callHook=this.callHook.bind(this)}hook(o,s){if(!o||"function"!=typeof s)return;const t=o;let e;for(;this._deprecatedHooks[o];)"string"==typeof(e=this._deprecatedHooks[o])&&(e={to:e}),o=e.to;e&&(e.message?this._logger.warn(e.message):this._logger.warn(`${t} hook has been deprecated`+(e.to?`, please use ${e.to}`:""))),this._hooks[o]=this._hooks[o]||[],this._hooks[o].push(s)}deprecateHook(o,s){this._deprecatedHooks[o]=s}deprecateHooks(o){Object.assign(this._deprecatedHooks,o)}addHooks(o){const s=flatHooks(o);for(const o in s)this.hook(o,s[o])}async callHook(o,...s){if(this._hooks[o])try{await serial(this._hooks[o],o=>o(...s))}catch(s){"error"!==o&&await this.callHook("error",s),this._logger.fatal?this._logger.fatal(s):this._logger.error(s)}}clearHook(o){o&&delete this._hooks[o]}clearHooks(){this._hooks={}}}module.exports=Hookable;
//# sourceMappingURL=hable.js.map