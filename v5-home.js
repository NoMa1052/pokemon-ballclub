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
 let fitting=false;
 function fitCards(){
  if(fitting)return;const c=document.querySelector('#draft .cands.cardrow');if(!c)return;
  fitting=true;
  try{
   c.style.removeProperty('zoom');if(innerWidth<1000)return;
   const kids=[...c.querySelectorAll('.cand')];if(!kids.length)return;
   const left=document.querySelector('.grid>section'),floor=()=>Math.min(innerHeight-scrollY,left?left.getBoundingClientRect().bottom:innerHeight)-22;
   const over=()=>Math.max(...kids.map(k=>k.getBoundingClientRect().bottom))>floor();
   // Measure the real layout at each step: card sizes follow the window, so arithmetic alone gets it wrong.
   const z0=parseFloat(getComputedStyle(c).zoom)||1;for(let z=z0;z>=.4&&over();z-=.03)c.style.setProperty('zoom',z.toFixed(2),'important');
  }finally{fitting=false}
 }
 const prev2=render;render=function(){const v=prev2.apply(this,arguments);try{fitCards()}catch(e){}return v};
 new MutationObserver(()=>{try{fitCards()}catch(e){}}).observe(document.getElementById('draft'),{childList:true,subtree:true});
 addEventListener('resize',()=>{try{fitCards()}catch(e){}});
 render();
})();
