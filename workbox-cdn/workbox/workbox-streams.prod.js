this.workbox=this.workbox||{},this.workbox.streams=function(e,n,t){"use strict";try{self["workbox:streams:5.1.3"]&&_()}catch(e){}function s(e){const t=e.map(e=>Promise.resolve(e).then(e=>function(e){return e instanceof Response?e.body.getReader():e instanceof ReadableStream?e.getReader():new Response(e).body.getReader()}(e))),s=new n.Deferred;let r=0;const o=new ReadableStream({pull(e){return t[r].then(e=>e.read()).then(n=>{if(n.done)return r++,r>=t.length?(e.close(),void s.resolve()):this.pull(e);e.enqueue(n.value)}).catch(e=>{throw s.reject(e),e})},cancel(){s.resolve()}});return{done:s.promise,stream:o}}function r(e={}){const n=new Headers(e);return n.has("content-type")||n.set("content-type","text/html"),n}function o(e,n){const{done:t,stream:o}=s(e),c=r(n);return{done:t,response:new Response(o,{headers:c})}}function c(){return t.canConstructReadableStream()}return e.concatenate=s,e.concatenateToResponse=o,e.isSupported=c,e.strategy=function(e,n){return async({event:t,request:s,url:a,params:u})=>{const i=e.map(e=>Promise.resolve(e({event:t,request:s,url:a,params:u})));if(c()){const{done:e,response:s}=o(i,n);return t&&t.waitUntil(e),s}const f=i.map(async e=>{const n=await e;return n instanceof Response?n.blob():new Response(n).blob()}),p=await Promise.all(f),w=r(n);return new Response(new Blob(p),{headers:w})}},e}({},workbox.core._private,workbox.core._private);

