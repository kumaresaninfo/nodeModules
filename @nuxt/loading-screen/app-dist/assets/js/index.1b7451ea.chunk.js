(window.webpackJsonp=window.webpackJsonp||[]).push([[1],[,function(t,e,r){},function(t,e,r){},function(t,e,r){},,,,,function(t,e,r){t.exports=r(16)},,function(t,e,r){"use strict";var n=r(1);r.n(n).a},function(t,e,r){"use strict";var n=r(2);r.n(n).a},function(t,e,r){"use strict";var n=r(3);r.n(n).a},,,,function(t,e,r){"use strict";r.r(e);var n=r(7),o=r(0),s=r.n(o),a=r(5);function i(t,e){var r;if("undefined"===typeof Symbol||null==t[Symbol.iterator]){if(Array.isArray(t)||(r=function(t,e){if(!t)return;if("string"===typeof t)return c(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);"Object"===r&&t.constructor&&(r=t.constructor.name);if("Map"===r||"Set"===r)return Array.from(t);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return c(t,e)}(t))||e&&t&&"number"===typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,a=!0,i=!1;return{s:function(){r=t[Symbol.iterator]()},n:function(){var t=r.next();return a=t.done,t},e:function(t){i=!0,s=t},f:function(){try{a||null==r.return||r.return()}finally{if(i)throw s}}}}function c(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function l(t,e,r,n,o,s,a){try{var i=t[s](a),c=i.value}catch(l){return void r(l)}i.done?e(c):Promise.resolve(c).then(n,o)}function u(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var s=t.apply(e,r);function a(t){l(s,n,o,a,i,"next",t)}function i(t){l(s,n,o,a,i,"throw",t)}a(void 0)}))}}var h=function(t){return new Promise((function(e){return setTimeout(e,t)}))},d={el:"#nuxt_loading_screen",mixins:[{filters:{capitalize:function(t){return t?(t=t.toString()).charAt(0).toUpperCase()+t.slice(1):""}}},{methods:{log:function(){var t;(t=console).log.apply(t,arguments)},logError:function(){var t;(t=console).error.apply(t,arguments)},clearConsole:function(){"function"===typeof console.clear&&console.clear()}}},{methods:{logSse:function(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];this.log.apply(this,["[SSE]"].concat(e))},logSseError:function(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];this.logError.apply(this,["[SSE]"].concat(e))},sseConnect:function(t){var e=this;"undefined"!==typeof EventSource?(this.logSse("Connecting to ".concat(t,"...")),this.$sse=new EventSource(t),this.$sse.addEventListener("message",(function(t){return e.onSseMessage(t)}))):this.logSse("EventSource is not supported in current borwser!")},onSseMessage:function(t){var e=JSON.parse(t.data);e&&this.onSseData&&this.onSseData(e)},sseClose:function(){this.$sse&&(this.$sse.close(),delete this.$sse)}}},{methods:{createItemKey:function(t){return"".concat("__nuxt_loading_screen_").concat(t)},storeItem:function(t,e){try{sessionStorage.setItem(this.createItemKey(t),"".concat(e))}catch(r){console.error(r)}},retrieveItem:function(t){return sessionStorage.getItem(this.createItemKey(t))},removeItem:function(t){sessionStorage.removeItem(this.createItemKey(t))}}}],data:function(){return{error:!1,stack:!1,allDone:!1,hasErrors:!1,isFinished:!1,maxReloadCount:5,preventReload:!1,manualReload:!1,bundles:[],states:{},options:window.$OPTIONS||{}}},beforeMount:function(){this.canReload()||(this.preventReload=!0)},mounted:function(){this.preventReload||(this.onData(window.$STATE),this.sseConnect("".concat(this.options.baseURLAlt,"/sse")),this.setTimeout())},methods:{onSseData:function(t){this._reloading||(this.setTimeout(),this.onData(t))},fetchData:function(){var t=this;return u(s.a.mark((function e(){var r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!t._reloading){e.next=2;break}return e.abrupt("return");case 2:return t.clearTimeout(),e.prev=3,e.next=6,Object(a.a)("".concat(t.options.baseURL,"/json")).then((function(t){return t.json()}));case 6:r=e.sent,t.onData(r),e.next=13;break;case 10:e.prev=10,e.t0=e.catch(3),t.logError(e.t0);case 13:t.setTimeout();case 14:case"end":return e.stop()}}),e,null,[[3,10]])})))()},clearTimeout:function(t){function e(){return t.apply(this,arguments)}return e.toString=function(){return t.toString()},e}((function(){this._fetchTimeout&&clearTimeout(this._fetchTimeout)})),setTimeout:function(t){function e(){return t.apply(this,arguments)}return e.toString=function(){return t.toString()},e}((function(){var t=this;this._reloading||(this.clearTimeout(),this._fetchTimeout=setTimeout((function(){return t.fetchData()}),1e3))})),onData:function(t){if(t&&!this._reloading){var e=t.error,r=t.states,n=t.hasErrors,o=t.allDone;if(e){var s=e.description,a=e.stack;return this.errorDescription=s,this.errorStack=a,void(this.hasErrors=!0)}if(r&&r.length){this.bundles=r.map((function(t){return t.name.toLowerCase()}));var c,l=i(r);try{for(l.s();!(c=l.n()).done;){var u=c.value,h=u.name.toLowerCase();this.states[h]||(this.states[h]={}),this.states[h].progress=u.progress,this.states[h].status=u.details.length?u.details.slice(0,2).join(" "):"Done"}}catch(d){l.e(d)}finally{l.f()}n||!o||this.allDone||this.reload(),this.allDone=o,this.hasErrors=n}}},canReload:function(){this.reloadCount=parseInt(this.retrieveItem("reloadCount"))||0;var t=parseInt(this.retrieveItem("lastReloadTime"))||0;this.loadingTime=(new Date).getTime();var e=this.reloadCount<this.maxReloadCount,r=t&&this.loadingTime>1e3+t;return!(!e||r)||(this.removeItem("reloadCount"),this.removeItem("lastReloadTime"),this.reloadCount=0,e)},updateReloadItems:function(){this.storeItem("reloadCount",1+this.reloadCount),this.storeItem("lastReloadTime",this.loadingTime)},reload:function(){var t=this;return u(s.a.mark((function e(){return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!t._reloading){e.next=2;break}return e.abrupt("return");case 2:return t._reloading=!0,t.clearTimeout(),t.sseClose(),t.clearConsole(),e.next=8,h(500);case 8:t.updateReloadItems(),window.location.reload(!0);case 10:case"end":return e.stop()}}),e)})))()}}},f=(r(10),r(11),r(12),r(6)),p=Object(f.a)(d,(function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{staticClass:"loading-screen",class:{hide:t.allDone&&!t.preventReload}},[r("div",{staticClass:"row"},[r("transition",{attrs:{appear:""}},[t.options.image?[r("img",{staticStyle:{"max-width":"220px","max-height":"166px"},attrs:{src:t.options.image}})]:[r("svg",{staticClass:"logo",attrs:{width:"220",height:"166",xmlns:"http://www.w3.org/2000/svg"}},[r("g",{attrs:{transform:"translate(-18 -29)",fill:"none","fill-rule":"evenodd"}},[r("path",{attrs:{d:"M0 176h67.883a22.32 22.32 0 0 1 2.453-7.296L134 57.718 100.881 0 0 176zM218.694 176H250L167.823 32 153 58.152l62.967 110.579a21.559 21.559 0 0 1 2.727 7.269z"}}),t._v(" "),r("path",{attrs:{d:"M86.066 189.388a8.241 8.241 0 0 1-.443-.908 11.638 11.638 0 0 1-.792-6.566H31.976l78.55-138.174 33.05 58.932L154 94.882l-32.69-58.64C120.683 35.1 116.886 29 110.34 29c-2.959 0-7.198 1.28-10.646 7.335L20.12 176.185c-.676 1.211-3.96 7.568-.7 13.203C20.912 191.95 24.08 195 31.068 195h66.646c-6.942 0-10.156-3.004-11.647-5.612z",fill:"#00C58E"}}),t._v(" "),r("path",{attrs:{d:"M235.702 175.491L172.321 62.216c-.655-1.191-4.313-7.216-10.68-7.216-2.868 0-6.977 1.237-10.32 7.193L143 75.706v26.104l18.709-32.31 62.704 111.626h-23.845c.305 1.846.134 3.74-.496 5.498a7.06 7.06 0 0 1-.497 1.122l-.203.413c-3.207 5.543-10.139 5.841-11.494 5.841h37.302c1.378 0 8.287-.298 11.493-5.841 1.423-2.52 2.439-6.758-.97-12.668z",fill:"#108775"}}),t._v(" "),r("path",{attrs:{d:"M201.608 189.07l.21-.418c.206-.364.378-.745.515-1.139a10.94 10.94 0 0 0 .515-5.58 16.938 16.938 0 0 0-2.152-5.72l-49.733-87.006L143.5 76h-.136l-7.552 13.207-49.71 87.006a17.534 17.534 0 0 0-1.917 5.72c-.4 2.21-.148 4.486.725 6.557.13.31.278.613.444.906 1.497 2.558 4.677 5.604 11.691 5.604h92.592c1.473 0 8.651-.302 11.971-5.93zm-58.244-86.657l45.455 79.52H97.934l45.43-79.52z",fill:"#2F495E","fill-rule":"nonzero"}})])])]],2)],1),t._v(" "),t.bundles.length||t.hasErrors||t.preventReload?t.hasErrors&&!t.errorDescription?r("div",[r("h3",{staticClass:"hasErrors"},[t._v("\n      An error occured, please look at Nuxt.js terminal.\n    ")])]):t.hasErrors&&t.errorDescription?r("div",[r("h3",{staticClass:"hasErrors"},[t._v("\n      An error occured, please see below or look at Nuxt.js terminal for more info.\n    ")]),t._v(" "),r("div",{staticClass:"errorStack"},[r("p",{staticClass:"hasErrors"},[t._v("\n        "+t._s(t.errorDescription)+"\n      ")]),t._v(" "),t.errorStack?r("p",{staticClass:"pre"},[t._v("\n        "+t._s(t.errorStack)+"\n      ")]):t._e()]),t._v(" "),t._m(0)]):t.preventReload?r("div",{staticClass:"reload_prevented"},[r("h3",{staticClass:"hasErrors"},[t._v("\n      Failed to show Nuxt.js app after "+t._s(t.maxReloadCount)+" reloads\n    ")]),t._v(" "),r("p",[t._v("\n      Your Nuxt.js app could not be shown even though the webpack build appears to have finished.\n    ")]),t._v(" "),r("p",[t._v("\n      Try to reload the page manually, if this problem persists try to restart your Nuxt.js dev server.\n    ")])]):r("transition-group",t._l(t.bundles,(function(e){return r("div",{key:e,staticClass:"row"},[r("h3",[t._v(t._s(t._f("capitalize")(e))+" bundle")]),t._v(" "),r("div",{staticClass:"progress_bar_container"},[r("div",{staticClass:"progress_bar",class:e,style:{width:t.states[e].progress+"%",backgroundColor:""+t.options.colors[e]}})]),t._v(" "),r("h4",[t._v(t._s(t.states[e].status))])])})),0):r("div",{staticClass:"row placeholder"},[r("transition",{attrs:{appear:""}},[r("h3",[t._v("Loading...")])])],1)],1)}),[function(){var t=this.$createElement,e=this._self._c||t;return e("p",[e("span",{staticClass:"hasErrors"},[this._v("Note:")]),this._v(" A manual restart of the Nuxt.js dev server may be required")])}],!1,null,null,null).exports;window._nuxtLoadingScreen=new n.a(p)}],[[8,2,0]]]);