import{k as e}from"./reactNode-B7LLEgU0.js";import"./useToken-CThEd4DX.js";import{E as t}from"./ContextIsolator-D8l445x_.js";var n=new e(`antFadeIn`,{"0%":{opacity:0},"100%":{opacity:1}}),r=new e(`antFadeOut`,{"0%":{opacity:1},"100%":{opacity:0}}),i=(e,i=!1)=>{let{antCls:a}=e,o=`${a}-fade`,s=i?`&`:``;return[t(o,n,r,e.motionDurationMid,i),{[`
        ${s}${o}-enter,
        ${s}${o}-appear
      `]:{opacity:0,animationTimingFunction:`linear`},[`${s}${o}-leave`]:{animationTimingFunction:`linear`}}]};export{i as t};