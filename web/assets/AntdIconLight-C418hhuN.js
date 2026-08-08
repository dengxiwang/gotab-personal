import{a as e}from"./rolldown-runtime-B0Z9INg1.js";import{n as t}from"./jsx-runtime-Ciaf_P-h.js";var n=e(t()),r=(0,n.createContext)({});function i(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`)if(Array.isArray(e)){var a=e.length;for(t=0;t<a;t++)e[t]&&(n=i(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n);return r}function a(){for(var e,t,n=0,r=``,a=arguments.length;n<a;n++)(e=arguments[n])&&(t=i(e))&&(r&&(r+=` `),r+=t);return r}var o=`data-rc-order`,s=`data-rc-priority`,c=`rc-util-key`,l=new Map;function u(){return!!(typeof window<`u`&&window.document&&window.document.createElement)}function d(e,t){if(!e||!t)return!1;if(e.contains)return e.contains(t);let n=t;for(;n;){if(n===e)return!0;n=n.parentNode}return!1}function f({mark:e}={}){return e?e.startsWith(`data-`)?e:`data-${e}`:c}function p(e){return e.attachTo?e.attachTo:document.querySelector(`head`)||document.body}function m(e){return e===`queue`?`prependQueue`:e?`prepend`:`append`}function h(e){return Array.from((l.get(e)||e).children).filter(e=>e.tagName===`STYLE`)}function g(e,t={}){if(!u())return null;let{csp:n,prepend:r,priority:i=0}=t,a=m(r),c=a===`prependQueue`,l=document.createElement(`style`);l.setAttribute(o,a),c&&i&&l.setAttribute(s,`${i}`),n?.nonce&&(l.nonce=n.nonce),l.innerHTML=e;let d=p(t),{firstChild:f}=d;if(r){if(c){let e=(t.styles||h(d)).filter(e=>{if(![`prepend`,`prependQueue`].includes(e.getAttribute(o)))return!1;let t=Number(e.getAttribute(s)||0);return i>=t});if(e.length)return d.insertBefore(l,e[e.length-1].nextSibling),l}d.insertBefore(l,f)}else d.appendChild(l);return l}function _(e,t={}){let{styles:n}=t;return n||=h(p(t)),n.find(n=>n.getAttribute(f(t))===e)}function v(e,t){let n=l.get(e);if(!n||!d(document,n)){let n=g(``,t);if(!n)return;let{parentNode:r}=n;l.set(e,r),e.removeChild(n)}}function y(e,t,n={}){if(!u())return null;let r=p(n),i=h(r),a={...n,styles:i};v(r,a);let o=_(t,a);if(o)return a.csp?.nonce&&o.nonce!==a.csp.nonce&&(o.nonce=a.csp.nonce),o.innerHTML!==e&&(o.innerHTML=e),o;let s=g(e,a);return s?.setAttribute(f(a),t),s}function b(e){return e?.getRootNode?.()}function x(e){let t=b(e);return typeof ShadowRoot<`u`&&t instanceof ShadowRoot?t:null}var S={};function C(e,t){e||S[t]||(S[t]=!0)}function w(e){return e.replace(/-(.)/g,(e,t)=>t.toUpperCase())}function T(e,t){C(e,`[@ant-design/icons] ${t}`)}function E(e){return typeof e==`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(typeof e.icon==`object`||typeof e.icon==`function`)}function D(e={}){return Object.keys(e).reduce((t,n)=>{let r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[w(n)]=r}return t},{})}function O(e,t,r){return r?n.createElement(e.tag,{key:t,...D(e.attrs),...r},(e.children||[]).map((n,r)=>O(n,`${t}-${e.tag}-${r}`))):n.createElement(e.tag,{key:t,...D(e.attrs)},(e.children||[]).map((n,r)=>O(n,`${t}-${e.tag}-${r}`)))}var k=`
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
  vertical-align: inherit;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin {
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`,A=e=>{let{csp:t,prefixCls:i,layer:a,zeroRuntime:o}=(0,n.useContext)(r),s=k;i&&(s=s.replace(/anticon/g,i)),a&&(s=`@layer ${a} {\n${s}\n}`),(0,n.useEffect)(()=>{if(o)return;let n=e.current,r=x(n);y(s,`@ant-design-icons`,{prepend:!a,csp:t,attachTo:r})},[])},j=e=>{let{icon:t,className:r,onClick:i,style:a,primaryColor:o,secondaryColor:s,...c}=e,l=n.useRef(null);if(A(l),T(E(t),`icon should be icon definiton, but got ${t}`),!E(t))return null;let u=t;return O(u.icon,`svg-${u.name}`,{className:r,onClick:i,style:a,"data-icon":u.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`,...c,ref:l})};j.displayName=`IconReact`;function M(){return M=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},M.apply(this,arguments)}var N=n.forwardRef((e,t)=>{let{className:i,icon:o,spin:s,rotate:c,tabIndex:l,onClick:u,twoToneColor:d,...f}=e,{prefixCls:p=`anticon`,rootClassName:m}=n.useContext(r),h=a(m,p,{[`${p}-${o.name}`]:!!o.name,[`${p}-spin`]:!!s||o.name===`loading`},i),g=l;g===void 0&&u&&(g=-1);let _=c?{msTransform:`rotate(${c}deg)`,transform:`rotate(${c}deg)`}:void 0;return n.createElement(`span`,M({role:`img`,"aria-label":o.name},f,{ref:t,tabIndex:g,onClick:u,className:h}),n.createElement(j,{icon:o,style:_}))});export{T as a,A as i,O as n,a as o,E as r,r as s,N as t};