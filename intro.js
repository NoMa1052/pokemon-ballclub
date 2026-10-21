/* Load-in animation. Runs on every load, tap to skip, skipped entirely for reduced motion. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduce||!Element.prototype.animate)return;
 const root=document.documentElement;root.classList.add('intro-on');
 const o=document.createElement('div');o.id='intro';o.setAttribute('aria-hidden','true');
 o.innerHTML='<div class="in-bg"></div><div class="in-flash"></div><div class="in-stage"><img class="in-logo" alt=""><div class="in-lamp l"></div><div class="in-lamp r"></div></div>';
 document.body.prepend(o);
 const q=s=>o.querySelector(s),logo=q('.in-logo'),lamps=[q('.in-lamp.l'),q('.in-lamp.r')],flash=q('.in-flash');
 let done=false;const anims=[];
 const A=(el,k,opt)=>{const a=el.animate(k,{fill:'forwards',...opt});anims.push(a);return a};
 const finish=()=>{if(done)return;done=true;anims.forEach(a=>a.cancel());root.classList.remove('intro-on');o.remove()};
 o.addEventListener('click',finish);
 const run=()=>{
  // 1. Lamps sputter: each bank flickers on its own rhythm, then holds.
  const flick=[0,1,.1,.9,0,0,.7,.15,1,1];
  lamps.forEach((l,i)=>A(l,flick.map(v=>({opacity:v,easing:'steps(1,end)'})),{duration:900,delay:250+i*140}));
  // The logo catches a little of each flicker before full power.
  A(logo,[.12,.3,.14,.38,.22,.45].map((v,i,a)=>({filter:`brightness(${v}) saturate(${v+.1})`,offset:[0,.2,.35,.6,.75,1][i],easing:'steps(1,end)'})),{duration:900,delay:250});
  // 2. Power up: the lamps flare, a soft flash, full color with a glow.
  lamps.forEach(l=>A(l,[{transform:'scale(1)'},{transform:'scale(1.9)',offset:.3},{transform:'scale(1.2)'}],{duration:900,delay:1150,easing:'ease-out',composite:'add'}));
  A(flash,[{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:700,delay:1180,easing:'ease-out'});
  A(logo,[{filter:'brightness(.45) saturate(.6)',transform:'scale(1)'},{filter:'brightness(1.35) saturate(1.1) drop-shadow(0 0 22px rgba(255,226,140,.55))',transform:'scale(1.04)',offset:.3},{filter:'brightness(1) saturate(1) drop-shadow(0 6px 14px rgba(0,0,0,.45))',transform:'scale(1)'}],{duration:800,delay:1150,easing:'cubic-bezier(.2,.7,.2,1)'});
  // 3. Settle: the logo flies to its spot in the header while the stadium fades out.
  setTimeout(()=>{
   if(done)return;
   const target=document.querySelector('.mark.logo img'),t=target?.getBoundingClientRect(),s=logo.getBoundingClientRect();
   lamps.forEach(el=>A(el,[{opacity:getComputedStyle(el).opacity},{opacity:0}],{duration:350,easing:'ease-in'}));
   A(q('.in-bg'),[{opacity:1},{opacity:0}],{duration:450,delay:250,easing:'ease-in'});
   if(t&&t.width){
    const dx=(t.left+t.width/2)-(s.left+s.width/2),dy=(t.top+t.height/2)-(s.top+s.height/2),k=t.width/s.width;
    A(logo,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:600,easing:'cubic-bezier(.6,0,.2,1)'}).finished.then(finish,()=>{});
   }else setTimeout(finish,600);
  },2150);
  setTimeout(finish,4500); // safety net
 };
 // Use the header's own logo source so it works wherever the page is hosted.
 const start=()=>{const h=document.querySelector('.mark.logo img');logo.src=h?.currentSrc||h?.src||'logo.webp';(logo.decode?logo.decode():Promise.resolve()).then(run,run)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
