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
 render();
})();
