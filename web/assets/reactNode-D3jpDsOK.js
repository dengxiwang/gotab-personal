import{a as e}from"./rolldown-runtime-B0Z9INg1.js";import{n as t}from"./jsx-runtime-Ciaf_P-h.js";import{X as n,i as r,m as i,p as a,r as o}from"./pickAttrs-DIkXfajW.js";import{B as s,Dt as c,Et as l,Ft as u,H as d,J as f,Mt as p,Nt as m,Ot as h,Pt as g,R as _,Tt as v,c as y,h as b,j as x,jt as S,kt as C,n as w,q as T,r as ee,z as E}from"./es-DrXbpWFj.js";import{n as te,t as ne}from"./useToken-Cf3kGqi1.js";var D=e(n());u(),m(),h(),l(),f(),s(),E(),b();var O=e(t()),k=(0,O.createContext)({}),A=`anticon`,re=[`outlined`,`borderless`,`filled`,`underlined`],j=O.createContext({getPrefixCls:(e,t)=>t||(e?`ant-${e}`:`ant`),iconPrefixCls:A}),{Consumer:ie}=j,M={};function ae(e){let t=O.useContext(j),{getPrefixCls:n,direction:r,getPopupContainer:i}=t,a=t[e];return Object.assign(Object.assign({classNames:M,styles:M},a),{getPrefixCls:n,direction:r,getPopupContainer:i})}a();var oe={overflow:`hidden`,whiteSpace:`nowrap`,textOverflow:`ellipsis`},se=(e,t=!1)=>({boxSizing:`border-box`,margin:0,padding:0,color:e.colorText,fontSize:e.fontSize,lineHeight:e.lineHeight,listStyle:`none`,fontFamily:t?`inherit`:e.fontFamily}),N=()=>({display:`inline-flex`,alignItems:`center`,color:`inherit`,fontStyle:`normal`,lineHeight:0,textAlign:`center`,textTransform:`none`,verticalAlign:`-0.125em`,textRendering:`optimizeLegibility`,"-webkit-font-smoothing":`antialiased`,"-moz-osx-font-smoothing":`grayscale`,"> *":{lineHeight:1},svg:{display:`inline-block`}}),ce=()=>({"&::before":{display:`table`,content:`""`},"&::after":{display:`table`,clear:`both`,content:`""`}}),le=e=>({a:{color:e.colorLink,textDecoration:e.linkDecoration,backgroundColor:`transparent`,outline:`none`,cursor:`pointer`,transition:`color ${e.motionDurationSlow}`,"-webkit-text-decoration-skip":`objects`,"&:hover":{color:e.colorLinkHover},"&:active":{color:e.colorLinkActive},"&:active, &:hover":{textDecoration:e.linkHoverDecoration,outline:0},"&:focus":{textDecoration:e.linkFocusDecoration,outline:0},"&[disabled]":{color:e.colorTextDisabled,cursor:`not-allowed`}}}),ue=(e,t,n,r)=>{let i=`[class^="${t}"], [class*=" ${t}"]`,a=n?`.${n}`:i,o={boxSizing:`border-box`,"&::before, &::after":{boxSizing:`border-box`}},s={};return r!==!1&&(s={fontFamily:e.fontFamily,fontSize:e.fontSize}),{[a]:Object.assign(Object.assign(Object.assign({},s),o),{[i]:o})}},P=(e,t)=>({outline:`${x(e.lineWidthFocus)} solid ${e.colorPrimaryBorder}`,outlineOffset:t??1,transition:`outline-offset 0s, outline 0s`}),F=(e,t)=>({"&:focus-visible":P(e,t)}),I=e=>({[`.${e}`]:Object.assign(Object.assign({},N()),{[`.${e} .${e}-icon`]:{display:`block`}})}),L=e=>Object.assign(Object.assign({color:e.colorLink,textDecoration:e.linkDecoration,outline:`none`,cursor:`pointer`,transition:`all ${e.motionDurationSlow}`,border:0,padding:0,background:`none`,userSelect:`none`},F(e)),{"&:hover":{color:e.colorLinkHover,textDecoration:e.linkHoverDecoration},"&:focus":{color:e.colorLinkHover,textDecoration:e.linkFocusDecoration},"&:active":{color:e.colorLinkActive,textDecoration:e.linkHoverDecoration}}),{genStyleHooks:R,genComponentStyleHook:z,genSubStyleComponent:B}=i({usePrefix:()=>{let{getPrefixCls:e,iconPrefixCls:t}=(0,O.useContext)(j);return{rootPrefixCls:e(),iconPrefixCls:t}},useToken:()=>{let[e,t,n,r,i]=te();return{theme:e,realToken:t,hashId:n,token:r,cssVar:i}},useCSP:()=>{let{csp:e}=(0,O.useContext)(j);return e??{}},getResetStyles:(e,t)=>{let n=le(e);return[n,{"&":n},I(t?.prefix.iconPrefixCls??A)]},getCommonStyle:ue,getCompUnitless:()=>ne});w(),r(),C();function V(e){return e.replace(/-(.)/g,function(e,t){return t.toUpperCase()})}function H(e,t){S(e,`[@ant-design/icons] ${t}`)}function U(e){return p(e)===`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(p(e.icon)===`object`||typeof e.icon==`function`)}function W(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return Object.keys(e).reduce(function(t,n){var r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[V(n)]=r}return t},{})}function G(e,t,n){return n?O.createElement(e.tag,v(v({key:t},W(e.attrs)),n),(e.children||[]).map(function(n,r){return G(n,`${t}-${e.tag}-${r}`)})):O.createElement(e.tag,v({key:t},W(e.attrs)),(e.children||[]).map(function(n,r){return G(n,`${t}-${e.tag}-${r}`)}))}function K(e){return y(e)[0]}function q(e){return e?Array.isArray(e)?e:[e]:[]}var de=`
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

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
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
`,fe=function(e){var t=(0,O.useContext)(k),n=t.csp,r=t.prefixCls,i=t.layer,a=de;r&&(a=a.replace(/anticon/g,r)),i&&(a=`@layer ${i} {
${a}
}`),(0,O.useEffect)(function(){var t=e.current,r=o(t);d(a,`@ant-design-icons`,{prepend:!i,csp:n,attachTo:r})},[])};l();var pe=[`icon`,`className`,`onClick`,`style`,`primaryColor`,`secondaryColor`],J={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1};function me(e){var t=e.primaryColor,n=e.secondaryColor;J.primaryColor=t,J.secondaryColor=n||K(t),J.calculated=!!n}function he(){return v({},J)}var Y=function(e){var t=e.icon,n=e.className,r=e.onClick,i=e.style,a=e.primaryColor,o=e.secondaryColor,s=_(e,pe),c=O.useRef(),l=J;if(a&&(l={primaryColor:a,secondaryColor:o||K(a)}),fe(c),H(U(t),`icon should be icon definiton, but got ${t}`),!U(t))return null;var u=t;return u&&typeof u.icon==`function`&&(u=v(v({},u),{},{icon:u.icon(l.primaryColor,l.secondaryColor)})),G(u.icon,`svg-${u.name}`,v(v({className:n,onClick:r,style:i,"data-icon":u.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`},s),{},{ref:c}))};Y.displayName=`IconReact`,Y.getTwoToneColors=he,Y.setTwoToneColors=me;function X(e){var t=q(e),n=T(t,2),r=n[0],i=n[1];return Y.setTwoToneColors({primaryColor:r,secondaryColor:i})}function Z(){var e=Y.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}f(),E(),w();var ge=[`className`,`icon`,`spin`,`rotate`,`tabIndex`,`onClick`,`twoToneColor`];X(ee.primary);var Q=O.forwardRef(function(e,t){var n=e.className,r=e.icon,i=e.spin,a=e.rotate,o=e.tabIndex,s=e.onClick,l=e.twoToneColor,u=_(e,ge),d=O.useContext(k),f=d.prefixCls,p=f===void 0?`anticon`:f,m=d.rootClassName,h=(0,D.default)(m,p,c(c({},`${p}-${r.name}`,!!r.name),`${p}-spin`,!!i||r.name===`loading`),n),v=o;v===void 0&&s&&(v=-1);var y=a?{msTransform:`rotate(${a}deg)`,transform:`rotate(${a}deg)`}:void 0,b=q(l),x=T(b,2),S=x[0],C=x[1];return O.createElement(`span`,g({role:`img`,"aria-label":r.name},u,{ref:t,tabIndex:v,onClick:s,className:h}),O.createElement(Y,{icon:r,primaryColor:S,secondaryColor:C,style:y}))});Q.displayName=`AntdIcon`,Q.getTwoToneColor=Z,Q.setTwoToneColor=X;var _e={icon:{tag:`svg`,attrs:{"fill-rule":`evenodd`,viewBox:`64 64 896 896`,focusable:`false`},children:[{tag:`path`,attrs:{d:`M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z`}}]},name:`close-circle`,theme:`filled`};u();var ve=O.forwardRef(function(e,t){return O.createElement(Q,g({},e,{ref:t,icon:_e}))});function ye(e){return e&&O.isValidElement(e)&&e.type===O.Fragment}var $=(e,t,n)=>O.isValidElement(e)?O.cloneElement(e,typeof n==`function`?n(e.props||{}):n):t;function be(e,t){return $(e,e,t)}export{j as _,Q as a,ae as b,B as c,F as d,I as f,oe as g,N as h,ve as i,ce as l,se as m,ye as n,z as o,L as p,$ as r,R as s,be as t,P as u,re as v,k as x,A as y};