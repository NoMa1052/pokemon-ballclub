/* v5: main page polish. An item HUD under the pick counter so the page reads like a game screen. */
(() => {
 const prev=render;
 render=function(){
  const v=prev.apply(this,arguments);
  try{
   const bar=document.querySelector('#draft .pk-progress');
   if(bar&&!run.result&&!document.querySelector('#draft .pk-hud')){
    const chip=(icon,n,label)=>`<span class="${n?'':'out'}">${icon}<b>${n}</b><small>${label}</small></span>`;
    const img=k=>`<img src="${ITEM_ART[k]}" alt="">`;
    const canCandy=!!document.querySelector('#itemTools .candy-control');
    const candy=canCandy?`<button type="button" class="use" id="hudCandy" aria-label="Use Rare Candy, ${run.candies||0} left">${img('rare-candy')}<b>${run.candies||0}</b><small>Rare Candy<i>Tap to use</i></small></button>`:chip(img('rare-candy'),run.candies||0,'Rare Candy');
    bar.insertAdjacentHTML('afterend',`<div class="pk-hud" role="group" aria-label="Items left this run">${chip('<img class="pk" src="pack-foil-v3.webp" alt="">',run.rerolls||0,'Re-rip')}${chip(img('master-ball'),run.doubles||0,'Master Ball')}${candy}</div>`);
    const hc=document.getElementById('hudCandy');if(hc)hc.onclick=()=>document.querySelector('#itemTools .candy-control')?.click();
   }
  }catch(e){}
  return v;
 };
 render();
})();
