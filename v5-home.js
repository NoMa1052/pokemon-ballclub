/* v5: main page polish. An item HUD under the pick counter so the page reads like a game screen. */
(() => {
 const prev=render;
 render=function(){
  const v=prev.apply(this,arguments);
  try{
   const bar=document.querySelector('#draft .pk-progress');
   if(bar&&!run.result&&!document.querySelector('#draft .pk-hud')){
    const img=k=>`<img src="${ITEM_ART[k]}" alt="">`;
    const chip=(k,n,label,use)=>{const inner=`<span class="ico">${img(k)}<b>${n}</b></span><small>${label}${use?'<i>Tap to use</i>':''}</small>`;return use?`<button type="button" class="use" id="hudCandy" aria-label="Use ${label}, ${n} left">${inner}</button>`:`<span class="chip${n?'':' out'}" role="img" aria-label="${label}, ${n} left">${inner}</span>`};
    const canCandy=!!document.querySelector('#itemTools .candy-control');
    bar.insertAdjacentHTML('afterend',`<div class="pk-hud" role="group" aria-label="Items left this run">${chip('super-rod',run.rerolls||0,'Super Rod')}${chip('master-ball',run.doubles||0,'Master Ball')}${chip('rare-candy',run.candies||0,'Rare Candy',canCandy)}</div>`);
    const hc=document.getElementById('hudCandy');if(hc)hc.onclick=()=>document.querySelector('#itemTools .candy-control')?.click();
   }
  }catch(e){}
  return v;
 };
 // Desktop: shrink the pack's cards so the whole pack fits beside the field without scrolling.
 function fitCards(){
  const c=document.querySelector('#draft .cands.cardrow');if(!c)return;
  c.style.zoom='';if(innerWidth<1000)return;
  const kids=[...c.querySelectorAll('.cand')],n=kids.length;if(!n)return;
  const k=kids[0].getBoundingClientRect(),cw=k.width,ch=k.height,W=c.clientWidth,top=c.getBoundingClientRect().top+scrollY,H=innerHeight-top-34;
  let best=0;for(let cols=2;cols<=Math.min(n,4);cols++){const rows=Math.ceil(n/cols),z=Math.min(1,(W-8*(cols-1))/(cols*cw),(H-10*(rows-1))/(rows*ch));if(z>best)best=z}
  if(best>0&&best<1)c.style.zoom=Math.max(.5,best).toFixed(3);
 }
 const prev2=render;render=function(){const v=prev2.apply(this,arguments);try{fitCards()}catch(e){}return v};
 addEventListener('resize',()=>{try{fitCards()}catch(e){}});
 render();
})();
