// Scroll guard.
// 1) Placing a new Pokémon returns the page to the next pack or spin (see tapSlot below).
// 2) iOS Safari can silently drop a smooth programmatic scroll. Every smooth scrollIntoView
//    still runs as before; shortly after, if the target is not on screen and the player
//    hasn't scrolled or tapped in the meantime, jump there instantly.
(function(){
  const base=Element.prototype.scrollIntoView;
  let lastUser=0,pending=0;
  const mark=()=>{lastUser=performance.now()};
  ['touchstart','wheel','keydown'].forEach(t=>addEventListener(t,mark,{passive:true,capture:true}));

  const onScreen=el=>{
    if(!el.isConnected||!el.getClientRects().length)return true; // gone or hidden: nothing to fix
    const r=el.getBoundingClientRect(),vh=(window.visualViewport&&visualViewport.height)||innerHeight;
    if(r.height>=vh-4)return r.top<=vh*0.25&&r.bottom>=vh*0.75; // taller than the screen: mostly in view
    return r.top>=-2&&r.bottom<=vh+2;
  };

  Element.prototype.scrollIntoView=function(opts){
    const out=base.apply(this,arguments);
    const smooth=opts&&typeof opts==='object'&&opts.behavior==='smooth';
    // On wide desktop layouts desktop-fit.js deliberately blocks some scrolls; leave those alone.
    if(!smooth||document.documentElement.classList.contains('desk-fit'))return out;
    const el=this,t0=performance.now(),id=++pending,fallback={...opts,behavior:'auto'};
    const check=(delay,tries)=>setTimeout(()=>{
      if(id!==pending||lastUser>t0)return; // a newer scroll or the player took over
      if(document.body.classList.contains('rv-open')||document.body.style.position==='fixed'){if(tries<8)check(250,tries+1);return} // page locked behind a sheet
      if(!onScreen(el))base.call(el,fallback);
    },delay);
    check(650,0);
    return out;
  };

  // After a new Pokémon is placed, go back up to the next pack or spin.
  // ux.js did this by wrapping place(), but placing now goes through tapSlot -> handPlace
  // (field-flow.js), which never calls place(), so the page stayed down at the field.
  if(typeof tapSlot==='function'){
    const baseTap=tapSlot;
    tapSlot=function(s){
      const before=run.picks.length;
      const r=baseTap.apply(this,arguments);
      if(run.picks.length>before&&run.picks.length<run.size&&!run.result&&!run.hand){
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const t=run.second?document.getElementById('cands'):document.getElementById('throwBox');
          if(t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
        }));
      }
      return r;
    };
  }
})();
