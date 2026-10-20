var e=e=>({animationDuration:e,animationFillMode:`both`}),t=(t,n,r,i,a=!1)=>{let o=a?`&`:``;return{[`
      ${o}${t}-enter,
      ${o}${t}-appear
    `]:{...e(i),animationPlayState:`paused`},[`${o}${t}-leave`]:{...e(i),animationPlayState:`paused`},[`
      ${o}${t}-enter${t}-enter-active,
      ${o}${t}-appear${t}-appear-active
    `]:{animationName:n,animationPlayState:`running`},[`${o}${t}-leave${t}-leave-active`]:{animationName:r,animationPlayState:`running`,pointerEvents:`none`}}};export{t};