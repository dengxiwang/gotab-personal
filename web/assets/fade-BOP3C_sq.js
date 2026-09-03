import{k as e}from"./reactNode-BhcmQ-Sn.js";import"./useToken-DT2ZN5F0.js";import{E as t}from"./ContextIsolator-D8Fw_e6K.js";var n=new e(`antFadeIn`,{"0%":{opacity:0},"100%":{opacity:1}}),r=new e(`antFadeOut`,{"0%":{opacity:1},"100%":{opacity:0}}),i=(e,i=!1)=>{let{antCls:a}=e,o=`${a}-fade`,s=i?`&`:``;return[t(o,n,r,e.motionDurationMid,i),{[`
        ${s}${o}-enter,
        ${s}${o}-appear
      `]:{opacity:0,animationTimingFunction:`linear`},[`${s}${o}-leave`]:{animationTimingFunction:`linear`}}]};export{i as t};