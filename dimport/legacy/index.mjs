var t=/(^|;|\s+)import\s*['"]([^'"]+)['"](?=($|;|\s))/gi,e=/(^|[;\s]+)?import\s*(\*\s*as)?\s*(\w*?)\s*,?\s*(?:\{([\s\S]*?)\})?\s*from\s*['"]([^'"]+)['"];?/gi;function r(t,e){for(var r=[];t.length;)r.push(t.shift().trim().replace(/ as /g,":"));return"const { "+r.join(", ")+" } = "+e+";"}var n={};function o(n,o){window.dimport=i;var s,p=[],u=[],a={exports:{}},c=function(n,o){return n.replace(t,"$1"+(o=o||"require")+"('$2')").replace(e,function(t,e,n,i,s,p){return(e||"")+function(t,e,n,o){return e=o+"('"+e+"')",t.length&&!n?r(t,e):"const "+n+" = "+e+";"+(t.length?"\n"+r(t,n):"")}(s?s.split(","):[],p,i,o)})}(o.replace(/(^|\s|;)(import\s*)(\(|.*from\s*|)['"]([^'"]+)['"];?/gi,function(t,e,r,o,i){return i="'"+new URL(i,n).href+"'",e+r+o+("("==o?i:"'$dimport["+(u.push(i)-1)+"]';")}).replace(/(^|\s|;)(import)(?=\()/g,"$1window.dimport").replace(/export default/,"module.exports =").replace(/export\s+(const|function|class|let|var)\s+(.+?)(?=(\(|\s|=))/gi,function(t,e,r){return p.push(r)&&e+" "+r}).replace(/export\s*\{([\s\S]*?)\}/gi,function(t,e){for(var r,n="",o=e.split(",");r=o.shift();)n+="exports."+((r=r.trim().split(" as "))[1]||r[0])+" = "+r[0]+";\n";return n}),"eval");for(p.sort();s=p.shift();)c+="\nexports."+s+" = "+s+";";return Promise.resolve(new Function("module","exports",u.length?"return Promise.all(["+u.join()+"].map(window.dimport)).then(function($dimport){"+c+"});":c)(a,a.exports)).then(function(){return a.exports.default=a.exports.default||a.exports,a.exports})}function i(t){t=function(t,e,r,n){return/^https?:\/\//.test(t)?t:((r=document.createElement("a")).href=e,"/"==t[0]||"/"===r.pathname?r.origin+"/"+t:(n=r.pathname.split("/"),e=t.split("../"),r.origin+n.slice(0,n.length-Math.max(e.length-1,1)).concat(e.pop()).join("/")))}(t,location.href);try{return new Function("return import('"+t+"')").call()}catch(e){return n[t]?Promise.resolve(n[t]):new Promise(function(e,r,i){(i=new XMLHttpRequest).onerror=r,i.open("GET",t,!0),i.onload=function(){i.status>=400?r(new TypeError("Failed to fetch dynamically imported module: "+t)):o(t,i.responseText).then(function(r){return e(n[t]=r)})},i.send()})}}var s=void 0!==document&&document.querySelector("script[data-main]");s&&(s.text?o(location.href,s.text):(s=s.getAttribute("data-main"))&&i(s));export default i;