(()=>{
'use strict';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let active=null;
function play(card,m){
 active?.();
 if(!card?.isConnected||reduced())return;
 const tier=m.leg?'legend':m.shiny?'shiny':m.ovr>=90?'gold':'base';
 if(tier==='base')return;
 const host=card.closest('.reveal')||document.body;
 // Paint the gradient once. Only transform and opacity change during playback.
 const halo=document.createElement('div');halo.className='op-halo op-'+tier;
 const foil=document.createElement('div');foil.className='op-foil op-'+tier;
 halo.setAttribute('aria-hidden','true');foil.setAttribute('aria-hidden','true');
 foil.innerHTML='<i class="op-reflection"></i>';
 const sparkles=document.createElement('div');sparkles.className='op-sparkles';
 sparkles.setAttribute('aria-hidden','true');
 // Fixed edge locations keep the effect composed and predictable.
 const points=tier==='shiny'?[[8,20],[94,37],[12,78],[82,91],[70,4],[99,66]]:tier==='legend'?[[6,29],[97,57],[25,96],[80,6]]:[];
 points.forEach(([x,y],i)=>{const p=document.createElement('i');p.style.left=x+'%';p.style.top=y+'%';p.style.setProperty('--delay',(160+i*95)+'ms');sparkles.append(p)});
 card.append(halo,foil,sparkles);card.classList.add('op-card-active');
 let ended=false,timer;
 const end=()=>{
   if(ended)return;ended=true;clearTimeout(timer);observer.disconnect();
   halo.remove();foil.remove();sparkles.remove();card.classList.remove('op-card-active');
   if(active===end)active=null;
 };
 const observer=new MutationObserver(()=>{if(!card.isConnected)end()});
 observer.observe(host,{childList:true,subtree:true});
 active=end;timer=setTimeout(end,tier==='gold'?1450:1900);
}
window.PBCOpeningFX={play,cancel:()=>active?.()};
const dock=document.createElement('details');dock.className='op-preview-controls';
dock.innerHTML='<summary>Preview effects</summary><small>Actual game cards · no roster changes</small><div><button data-effect="gold">Gold</button><button data-effect="legend">Legend</button><button data-effect="shiny">Shiny</button></div>';
document.body.append(dock);
let demo=null,previous=null;
function closeDemo(){active?.();demo?.remove();demo=null;document.body.classList.remove('op-demo-open');if(previous?.isConnected)previous.focus()}
function openDemo(tier){
 if(document.querySelector('.reveal:not(.op-demo)')){closeReveal();document.querySelector('.direct-opening')?.remove()}
 closeDemo();dock.open=false;previous=document.activeElement;
 const all=[...BYID.values()];all.forEach(setOverall);
 const candidates=all.filter(m=>tier==='legend'?m.leg&&!m.shiny:tier==='shiny'?m.shiny&&!m.leg:!m.leg&&!m.shiny&&m.ovr>=90);
 const m=candidates.find(m=>m.num===(tier==='legend'?150:tier==='shiny'?6:149))||candidates[0];
 if(!m)return;
 demo=document.createElement('div');demo.className='reveal op-demo';demo.setAttribute('role','dialog');demo.setAttribute('aria-modal','true');demo.setAttribute('aria-label','Preview '+tier+' reveal');
 demo.innerHTML='<div class="rv-top"><button class="btn op-close">Back to game</button><span class="rv-count">Effect preview</span><button class="btn op-replay">Replay</button></div><div class="rv-stage">'+tcardHTML(m)+'</div><p class="rv-hint">Tap Replay to watch again</p>';
 document.body.append(demo);document.body.classList.add('op-demo-open');
 demo.querySelector('.op-close').onclick=closeDemo;
 const replay=()=>{const card=demo.querySelector('.tcard');play(card,m);};
 demo.querySelector('.op-replay').onclick=replay;
 demo.querySelector('.op-close').focus();
 demo.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopImmediatePropagation();closeDemo()}if(e.key==='Tab'){const buttons=[...demo.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus()}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus()}}});
 requestAnimationFrame(replay);
}
dock.querySelectorAll('button').forEach(b=>b.onclick=()=>openDemo(b.dataset.effect));
})();