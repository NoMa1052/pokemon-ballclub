(()=>{
'use strict';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let active=null;
function play(card,m){
 active?.();
 if(!card?.isConnected||reduced())return Promise.resolve();
 const tier=m.leg?'legend':m.shiny?'shiny':m.ovr>=90?'gold':'base';
 if(tier==='base')return Promise.resolve();
 return new Promise(resolve=>{
  const host=card.closest('.reveal')||document.body,r=card.getBoundingClientRect();
  const layer=document.createElement('div');layer.className='op-effect op-'+tier;layer.setAttribute('aria-hidden','true');
  layer.style.setProperty('--cx',(r.left+r.width/2)+'px');layer.style.setProperty('--cy',(r.top+r.height*.43)+'px');
  layer.style.setProperty('--cw',r.width+'px');layer.style.setProperty('--ch',r.height+'px');
  layer.innerHTML='<div class="op-dark"></div><div class="op-aura"></div><div class="op-ring"></div><div class="op-label">'+(tier==='gold'?'GOLD PULL':tier==='legend'?'LEGENDARY':'SHINY DISCOVERED')+'</div><div class="op-dust"></div>';
  host.append(layer);host.classList.add('op-playing');
  const particles=layer.querySelector('.op-dust');
  for(let i=0;i<(tier==='gold'?28:45);i++){const p=document.createElement('i'),a=Math.random()*Math.PI*2,d=90+Math.random()*180;p.style.setProperty('--x',Math.cos(a)*d+'px');p.style.setProperty('--y',Math.sin(a)*d+'px');p.style.setProperty('--delay',Math.random()*.18+'s');p.style.setProperty('--s',2+Math.random()*4+'px');p.style.setProperty('--hue',i*29+'deg');particles.append(p)}
  const inner=card.querySelector('.tc-in')||card;
  const delay=tier==='gold'?500:tier==='legend'?1050:800;
  const animations=[];
  // Animate only the content; preserve the game's swipe transforms on the card.
  animations.push(inner.animate([{opacity:0,filter:'brightness(.3)',transform:'scale(.97)'},{opacity:0,filter:'brightness(.3)',transform:'scale(.97)',offset:.55},{opacity:1,filter:'brightness(1.25)',transform:'scale(1.015)',offset:.83},{opacity:1,filter:'brightness(1)',transform:'scale(1)'}],{duration:delay+650,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'}));
  let finished=false,timer,bail,burstTimer;const end=()=>{if(finished)return;finished=true;clearTimeout(timer);clearTimeout(bail);clearTimeout(burstTimer);observer.disconnect();animations.forEach(a=>a.cancel());layer.remove();host.classList.remove('op-playing');if(active===end)active=null;resolve()};
  active=end;
  const observer=new MutationObserver(()=>{if(!card.isConnected||!layer.isConnected)end()});observer.observe(host,{childList:true,subtree:true});
  const sweep=document.createElement('div');sweep.className='op-sweep';Object.assign(sweep.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});layer.append(sweep);
  burstTimer=setTimeout(()=>{if(!card.isConnected){end();return}layer.classList.add('op-burst');try{navigator.vibrate?.(tier==='gold'?12:[12,35,22])}catch(_){}},delay);
  timer=setTimeout(end,delay+1700);bail=setTimeout(end,4000);
 });
}
window.PBCOpeningFX={play};
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
 demo.innerHTML='<div class="rv-top"><button class="btn op-close">Back to game</button><span class="rv-count">Effect preview</span><button class="btn op-replay">Replay</button></div><div class="rv-stage">'+tcardHTML(m)+'</div><p class="rv-hint">Your existing card · '+tier+' animation</p>';
 document.body.append(demo);document.body.classList.add('op-demo-open');
 demo.querySelector('.op-close').onclick=closeDemo;
 const replay=()=>play(demo.querySelector('.tcard'),m);
 demo.querySelector('.op-replay').onclick=replay;
 demo.querySelector('.op-close').focus();
 demo.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopImmediatePropagation();closeDemo()}if(e.key==='Tab'){const buttons=[...demo.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus()}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus()}}});
 requestAnimationFrame(replay);
}
dock.querySelectorAll('button').forEach(b=>b.onclick=()=>openDemo(b.dataset.effect));
})();