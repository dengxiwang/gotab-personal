import{b7 as e,e as t,C as o,v as a,u as n,f as r,aO as s,I as l,x as c,ab as i,j as m,B as f,ao as p,ac as d,at as h,ah as y}from"./requestIdleCallbackPolyfill-BoNiFUcB.js";import{S as u,u as b,L as x,b as j,R as g,a as S,M as O}from"./MailOutlined-CDrHGAZ9.js";import{G as _}from"./iconBase-CtOf60lZ.js";import{T as v}from"./index-BgL6SJFT.js";import{a as w}from"./assets-CmvcfQKP.js";import{F as C}from"./fullSpin-CVWdFtpk.js";import{u as N,a as k,O as P}from"./main-UtFjy664.js";import{D as L,G as R,I as M,L as E,M as T,a as H,N as I,P as $,R as F}from"./RestOutlined-kkaLJZUy.js";import{I as A}from"./index-B1-yPQsO.js";import{R as B,a as G,b as Z,c as q,d as D,e as U,S as W}from"./spinLoading-Cs0HX0yv.js";import{R as K}from"./UserOutlined-DTLJiztK.js";import{R as Q}from"./MoneyCollectOutlined-DB94RllH.js";import{N as z}from"./noPermissions-BC4yvCY1.js";import"./Overflow-Czf6qX4S.js";import"./mediaQueryUtil-DPPPwwPM.js";import"./index-Dy0ZQ-9_.js";import"./LeftOutlined-D9Sp279J.js";import"./MoneyCollectOutlined-4QlEwa2l.js";import"./StepBackwardOutlined-DpwJRxU8.js";var J=function(e,t){var o={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(o[a]=e[a]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var n=0;for(a=Object.getOwnPropertySymbols(e);n<a.length;n++)t.indexOf(a[n])<0&&Object.prototype.propertyIsEnumerable.call(e,a[n])&&(o[a[n]]=e[a[n]])}return o};function V({suffixCls:e,tagName:o,displayName:a}){return a=>t.forwardRef(((n,r)=>t.createElement(a,Object.assign({ref:r,suffixCls:e,tagName:o},n))))}const X=t.forwardRef(((e,a)=>{const{prefixCls:n,suffixCls:s,className:l,tagName:c}=e,i=J(e,["prefixCls","suffixCls","className","tagName"]),{getPrefixCls:m}=t.useContext(o),f=m("layout",n),[p,d,h]=b(f),y=s?`${f}-${s}`:f;return p(t.createElement(c,Object.assign({className:r(n||y,l,d,h),ref:a},i)))})),Y=t.forwardRef(((l,c)=>{const{direction:i}=t.useContext(o),[m,f]=t.useState([]),{prefixCls:p,className:d,rootClassName:h,children:y,hasSider:j,tagName:g,style:S}=l,O=J(l,["prefixCls","className","rootClassName","children","hasSider","tagName","style"]),_=a(O,["suffixCls"]),{getPrefixCls:v,className:w,style:C}=n("layout"),N=v("layout",p),k=function(t,o,a){return"boolean"==typeof a?a:!!t.length||e(o).some((e=>e.type===u))}(m,y,j),[P,L,R]=b(N),M=r(N,{[`${N}-has-sider`]:k,[`${N}-rtl`]:"rtl"===i},w,d,h,L,R),E=t.useMemo((()=>({siderHook:{addSider:e=>{f((t=>[].concat(s(t),[e])))},removeSider:e=>{f((t=>t.filter((t=>t!==e))))}}})),[]);return P(t.createElement(x.Provider,{value:E},t.createElement(g,Object.assign({ref:c,className:M,style:Object.assign(Object.assign({},C),S)},_),y)))})),ee=V({tagName:"div",displayName:"Layout"})(Y),te=V({suffixCls:"header",tagName:"header",displayName:"Header"})(X),oe=V({suffixCls:"footer",tagName:"footer",displayName:"Footer"})(X),ae=V({suffixCls:"content",tagName:"main",displayName:"Content"})(X),ne=ee;function re(){return re=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},re.apply(this,arguments)}ne.Header=te,ne.Footer=oe,ne.Content=ae,ne.Sider=u,ne._InternalSiderContext=j;const se=(e,o)=>t.createElement(l,re({},e,{ref:o,icon:L})),le=t.forwardRef(se);function ce(){return ce=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},ce.apply(this,arguments)}const ie=(e,o)=>t.createElement(l,ce({},e,{ref:o,icon:R})),me=t.forwardRef(ie);function fe(){return fe=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},fe.apply(this,arguments)}const pe=(e,o)=>t.createElement(l,fe({},e,{ref:o,icon:M})),de=t.forwardRef(pe);function he(){return he=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},he.apply(this,arguments)}const ye=(e,o)=>t.createElement(l,he({},e,{ref:o,icon:E})),ue=t.forwardRef(ye);function be(){return be=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},be.apply(this,arguments)}const xe=(e,o)=>t.createElement(l,be({},e,{ref:o,icon:T})),je=t.forwardRef(xe);function ge(){return ge=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},ge.apply(this,arguments)}const Se=(e,o)=>t.createElement(l,ge({},e,{ref:o,icon:H})),Oe=t.forwardRef(Se);function _e(){return _e=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},_e.apply(this,arguments)}const ve=(e,o)=>t.createElement(l,_e({},e,{ref:o,icon:I})),we=t.forwardRef(ve);function Ce(){return Ce=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},Ce.apply(this,arguments)}const Ne=(e,o)=>t.createElement(l,Ce({},e,{ref:o,icon:$})),ke=t.forwardRef(Ne);function Pe(){return Pe=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)Object.prototype.hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},Pe.apply(this,arguments)}const Le=(e,o)=>t.createElement(l,Pe({},e,{ref:o,icon:F})),Re=t.forwardRef(Le);function Me(e){return _({attr:{viewBox:"0 0 15 15",fill:"none"},child:[{tag:"path",attr:{fillRule:"evenodd",clipRule:"evenodd",d:"M10.5 4C8.567 4 7 5.567 7 7.5C7 9.433 8.567 11 10.5 11C12.433 11 14 9.433 14 7.5C14 5.567 12.433 4 10.5 4ZM7.67133 11C6.65183 10.175 6 8.91363 6 7.5C6 6.08637 6.65183 4.82498 7.67133 4H4.5C2.567 4 1 5.567 1 7.5C1 9.433 2.567 11 4.5 11H7.67133ZM0 7.5C0 5.01472 2.01472 3 4.5 3H10.5C12.9853 3 15 5.01472 15 7.5C15 9.98528 12.9853 12 10.5 12H4.5C2.01472 12 0 9.98528 0 7.5Z",fill:"currentColor"},child:[]}]})(e)}function Ee(){const e=c.c(85),{token:o}=i.useToken(),a=N(),n=k(),[r,s]=t.useState(),[l,d]=t.useState(window.innerWidth<768);let h,y,b,x,j,_,L,R,M,E,T,H,I,$,F,W,z,J,V,X,Y,ee,oe,re,se,ce,ie,fe,pe,he,ye,be,xe,ge,Se,_e,ve,Ce,Ne,Pe,Le,Ee,He,Ie,$e,Fe,Ae,Be,Ge,Ze,qe,De;return e[0]!==n.pathname?(h=()=>{s([n.pathname.slice(1)])},y=[n.pathname],e[0]=n.pathname,e[1]=h,e[2]=y):(h=e[1],y=e[2]),t.useLayoutEffect(h,y),e[3]!==o.colorPrimary?(b={background:o.colorPrimary},e[3]=o.colorPrimary,e[4]=b):b=e[4],e[5]!==o.colorTextLightSolid?(x={color:o.colorTextLightSolid},e[5]=o.colorTextLightSolid,e[6]=x):x=e[6],e[7]!==l?(j=()=>{d(!l)},_=l?m.jsx(Oe,{}):m.jsx(je,{}),e[7]=l,e[8]=j,e[9]=_):(j=e[8],_=e[9]),e[10]!==x||e[11]!==j||e[12]!==_?(L=m.jsx(f,{type:"text",className:"flex gap-3 px-2 items-center text-lg",style:x,onClick:j,icon:_}),e[10]=x,e[11]=j,e[12]=_,e[13]=L):L=e[13],e[14]!==a?(R=()=>{a("/console")},e[14]=a,e[15]=R):R=e[15],e[16]===Symbol.for("react.memo_cache_sentinel")?(M=m.jsx(A,{preview:!1,src:w,width:24,height:24}),e[16]=M):M=e[16],e[17]!==o.colorTextLightSolid?(E=m.jsx("h2",{className:"font-medium text-left overflow-hidden transition-all",style:{width:"auto",color:o.colorTextLightSolid},children:"管理后台"}),e[17]=o.colorTextLightSolid,e[18]=E):E=e[18],e[19]!==R||e[20]!==E?(T=m.jsx(f,{type:"text",className:"flex w-full px-2 items-center",onClick:R,icon:M,children:E}),e[19]=R,e[20]=E,e[21]=T):T=e[21],e[22]!==T||e[23]!==L?(H=m.jsxs("div",{className:"flex items-center",children:[L,T]}),e[22]=T,e[23]=L,e[24]=H):H=e[24],e[25]===Symbol.for("react.memo_cache_sentinel")?(I=m.jsx(me,{className:"text-lg"}),e[25]=I):I=e[25],e[26]!==o.colorTextLightSolid?($=m.jsx(f,{icon:I,type:"text",className:"font-medium",style:{color:o.colorTextLightSolid},onClick:Te,children:"项目地址"}),e[26]=o.colorTextLightSolid,e[27]=$):$=e[27],e[28]===Symbol.for("react.memo_cache_sentinel")?(F=m.jsx(p,{className:"border-white m-0 h-1/3 mt-[2px] border-l-2",type:"vertical"}),e[28]=F):F=e[28],e[29]===Symbol.for("react.memo_cache_sentinel")?(W=m.jsx(B,{}),e[29]=W):W=e[29],e[30]!==o.colorTextLightSolid?(z={color:o.colorTextLightSolid},e[30]=o.colorTextLightSolid,e[31]=z):z=e[31],e[32]!==a?(J=()=>{a("/")},e[32]=a,e[33]=J):J=e[33],e[34]!==z||e[35]!==J?(V=m.jsx(f,{className:"font-medium",icon:W,type:"text",style:z,onClick:J,children:"返回主页"}),e[34]=z,e[35]=J,e[36]=V):V=e[36],e[37]!==$||e[38]!==V?(X=m.jsxs("div",{className:"flex items-center h-full",children:[$,F,V]}),e[37]=$,e[38]=V,e[39]=X):X=e[39],e[40]!==H||e[41]!==X||e[42]!==b?(Y=m.jsxs(te,{className:"flex items-center justify-between h-12 px-3",style:b,children:[H,X]}),e[40]=H,e[41]=X,e[42]=b,e[43]=Y):Y=e[43],e[44]!==a?(ee=e=>{const t=e.keyPath.reverse().join("/");s(e.keyPath),a(`/${t}`)},e[44]=a,e[45]=ee):ee=e[45],e[46]===Symbol.for("react.memo_cache_sentinel")?(oe={key:"console/dashboard",label:"仪表盘",icon:m.jsx(le,{})},re={label:"审核中心",type:"group"},e[46]=oe,e[47]=re):(oe=e[46],re=e[47]),e[48]===Symbol.for("react.memo_cache_sentinel")?(se={key:"console/approve/userAppellation",label:"用户称号",icon:m.jsx(v,{})},e[48]=se):se=e[48],e[49]===Symbol.for("react.memo_cache_sentinel")?(ce={key:"console/approve/recommendApp",label:"应用推荐",icon:m.jsx(G,{})},e[49]=ce):ce=e[49],e[50]===Symbol.for("react.memo_cache_sentinel")?(ie={key:"console/approve/websiteSource",label:"网站收录",icon:m.jsx(Z,{})},e[50]=ie):ie=e[50],e[51]===Symbol.for("react.memo_cache_sentinel")?(fe={key:"console/approve/sharePage",label:"分享页",icon:m.jsx(q,{})},pe={label:"数据运维",type:"group"},e[51]=fe,e[52]=pe):(fe=e[51],pe=e[52]),e[53]===Symbol.for("react.memo_cache_sentinel")?(he={key:"console/userManage",label:"用户管理",icon:m.jsx(K,{})},e[53]=he):he=e[53],e[54]===Symbol.for("react.memo_cache_sentinel")?(ye={key:"console/recommendAppManage",label:"推荐管理",icon:m.jsx(G,{})},e[54]=ye):ye=e[54],e[55]===Symbol.for("react.memo_cache_sentinel")?(be={key:"console/websiteCategoryManage",label:"收录分类",icon:m.jsx(ke,{})},e[55]=be):be=e[55],e[56]===Symbol.for("react.memo_cache_sentinel")?(xe={key:"console/websiteSourceManage",label:"收录管理",icon:m.jsx(Z,{})},e[56]=xe):xe=e[56],e[57]===Symbol.for("react.memo_cache_sentinel")?(ge={key:"console/shareManage",label:"分享管理",icon:m.jsx(q,{})},e[57]=ge):ge=e[57],e[58]===Symbol.for("react.memo_cache_sentinel")?(Se={key:"console/dataManage/uploadSrc",label:"附件管理",icon:m.jsx(D,{})},e[58]=Se):Se=e[58],e[59]===Symbol.for("react.memo_cache_sentinel")?(_e={key:"console/defaultDataManage",label:"默认主页数据",icon:m.jsx(ue,{})},e[59]=_e):_e=e[59],e[60]===Symbol.for("react.memo_cache_sentinel")?(ve={key:"console/notificationManage",label:"公告管理",icon:m.jsx(we,{})},Ce={label:"配置",type:"group"},e[60]=ve,e[61]=Ce):(ve=e[60],Ce=e[61]),e[62]===Symbol.for("react.memo_cache_sentinel")?(Ne={key:"console/baseInfoSet",label:"基础信息",icon:m.jsx(de,{})},e[62]=Ne):Ne=e[62],e[63]===Symbol.for("react.memo_cache_sentinel")?(Pe={key:"console/functionSwitch",label:"功能开关",icon:m.jsx(Me,{})},e[63]=Pe):Pe=e[63],e[64]===Symbol.for("react.memo_cache_sentinel")?(Le={key:"console/markdownPage",label:"自定义页面",icon:m.jsx(U,{})},e[64]=Le):Le=e[64],e[65]===Symbol.for("react.memo_cache_sentinel")?(Ee={key:"console/bottomLinks",label:"底部链接",icon:m.jsx(g,{})},e[65]=Ee):Ee=e[65],e[66]===Symbol.for("react.memo_cache_sentinel")?(He={key:"console/emailSet",label:"邮件服务",icon:m.jsx(S,{})},e[66]=He):He=e[66],e[67]===Symbol.for("react.memo_cache_sentinel")?(Ie={key:"console/donate",label:"打赏捐赠",icon:m.jsx(Q,{})},e[67]=Ie):Ie=e[67],e[68]===Symbol.for("react.memo_cache_sentinel")?($e=[oe,re,se,ce,ie,fe,pe,he,ye,be,xe,ge,Se,_e,ve,Ce,Ne,Pe,Le,Ee,He,Ie,{key:"console/dataClean",label:"数据清理",icon:m.jsx(Re,{}),danger:!0}],e[68]=$e):$e=e[68],e[69]!==r||e[70]!==ee?(Fe=m.jsx(O,{mode:"inline",selectedKeys:r,className:"p-1 min-h-full",onClick:ee,items:$e}),e[69]=r,e[70]=ee,e[71]=Fe):Fe=e[71],e[72]!==l||e[73]!==Fe?(Ae=m.jsx(u,{collapsed:l,width:220,collapsedWidth:60,theme:"light",className:"overflow-scroll",children:Fe}),e[72]=l,e[73]=Fe,e[74]=Ae):Ae=e[74],e[75]===Symbol.for("react.memo_cache_sentinel")?(Be=m.jsx(C,{}),e[75]=Be):Be=e[75],e[76]===Symbol.for("react.memo_cache_sentinel")?(Ge=m.jsx(P,{}),e[76]=Ge):Ge=e[76],e[77]!==n.pathname?(Ze=m.jsx(ne,{children:m.jsx(ae,{className:"flex flex-col",children:m.jsx(t.Suspense,{fallback:Be,children:Ge},n.pathname)})}),e[77]=n.pathname,e[78]=Ze):Ze=e[78],e[79]!==Ae||e[80]!==Ze?(qe=m.jsxs(ne,{className:"flex-1 overflow-hidden",children:[Ae,Ze]}),e[79]=Ae,e[80]=Ze,e[81]=qe):qe=e[81],e[82]!==Y||e[83]!==qe?(De=m.jsx(m.Fragment,{children:m.jsxs(ne,{className:"console-layout",children:[Y,qe]})}),e[82]=Y,e[83]=qe,e[84]=De):De=e[84],De}function Te(){window.open("https://github.com/dengxiwang/gotab-personal","_blank")}function He(){const e=c.c(10),[o,a]=t.useState(!0),[n,r]=t.useState(!1),s=d(Ie);let l;e[0]!==s?(l=function(){h({url:y.isAdmin,token:s}).then((e=>{200===e.code&&(r(!0),a(!1))})).catch((()=>{r(!1),a(!1)}))},e[0]=s,e[1]=l):l=e[1];const i=l;let f,p,u;return e[2]!==s||e[3]!==i?(f=()=>(s?i():(a(!1),r(!1)),()=>{r(!1),a(!0)}),e[2]=s,e[3]=i,e[4]=f):f=e[4],e[5]===Symbol.for("react.memo_cache_sentinel")?(p=[],e[5]=p):p=e[5],t.useLayoutEffect(f,p),e[6]!==n||e[7]!==o||e[8]!==s?(u=m.jsx("div",{className:"w-screen h-screen flex",children:o?m.jsx(W,{text:"验证中..."}):m.jsx(m.Fragment,{children:n&&s?m.jsx(Ee,{}):m.jsx(z,{})})}),e[6]=n,e[7]=o,e[8]=s,e[9]=u):u=e[9],u}function Ie(e){return e.user.token}export{He as default};
