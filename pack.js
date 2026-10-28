// Booster pack: printed foil front (pack art), tilt-to-catch-light, and the opening sequence.
// The rip itself still runs on .pk-cap / .pk-tear from ui.js; the card-by-card reveal is reveal.js.
{
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const rays=()=>[-62,-40,-20,0,20,40,62].map(a=>{const r=a*Math.PI/180,s=.09;const p=t=>`${100+Math.sin(r+t)*260} ${40+Math.cos(r+t)*260}`;return `<path d="M100 40 L${p(-s)} L${p(s)} Z"/>`}).join("");
const star=(cx,cy,R,r,n)=>{let p=[];for(let i=0;i<n*2;i++){const a=Math.PI*i/n-Math.PI/2,rr=i%2?r:R;p.push((cx+Math.cos(a)*rr).toFixed(1)+","+(cy+Math.sin(a)*rr).toFixed(1))}return p.join(" ")};
// Real pack shape: flat crimped seals top and bottom at full width, and a body that is gathered in
// where it meets the seals and puffs out in the middle, with short crimp wrinkles along each seal.
const BODY="M9 35 C2 80 0 118 0 148 C0 182 2 222 9 261 H191 C198 222 200 182 200 148 C200 118 198 80 191 35 Z";
const wrinkles=(y,dir)=>{let d1="",d2="";for(let i=0;i<44;i++){const x=6+i*4.4+((i*53)%7)/3,len=2.5+((i*37)%7)*.8,lean=(x-100)/100*3+((i*29)%5-2)*.4;
  const seg=`M${x.toFixed(1)} ${y} l${lean} ${len*dir} `;if(i%2)d1+=seg;else d2+=seg}return `<path d="${d1}" stroke="#fff" stroke-opacity=".09" stroke-width="1.4" stroke-linecap="round"/><path d="${d2}" stroke="#000" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>`};
let tornPackSource=null;
function packArt(opened=false){
 return '<svg class="pk-art"'+(opened?' style="clip-path:polygon(0 12.8%,100% 12.8%,100% 100%,0 100%)"':'')+' viewBox="0 0 922 1706" aria-hidden="true"><image href="pack-foil-v2.webp" width="922" height="1706" preserveAspectRatio="xMidYMid meet"/></svg>';
}

// Tilt: the pack leans toward your finger or cursor and a glare follows it.
function addTilt(pk){
  if(pk._tilt)return;pk._tilt=1;
  pk.insertAdjacentHTML("beforeend",'<span class="pk-glare" aria-hidden="true"></span>');
  pk.addEventListener("pointermove",e=>{if(pk.classList.contains("dragging")||pk.classList.contains("wobble"))return;
    const r=pk.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    pk.style.setProperty("--gx",(x+.5)*100+"%");pk.style.setProperty("--gy",(y+.5)*100+"%");
    pk.style.rotate=`${-y} ${x} 0 ${Math.min(10,Math.hypot(x,y)*18)}deg`;pk.classList.add("tilting")});
  const off=()=>{pk.style.rotate="";pk.classList.remove("tilting")};
  pk.addEventListener("pointerleave",off);pk.addEventListener("pointerdown",off);
}
// The actual photographed top of the wrapper peels away as the tear follows the finger.
function wireRip(pk){
 if(pk._ripWired)return;pk._ripWired=true;
 const art=pk.querySelector('.pk-art'),strip=art.cloneNode(true);
 strip.classList.replace('pk-art','pk-loose');strip.setAttribute('aria-hidden','true');pk.appendChild(strip);
 pk.insertAdjacentHTML('beforeend','<span class="pk-mouth" aria-hidden="true"></span><span class="pk-tracer" aria-hidden="true"><i></i></span><svg class="pk-cut" viewBox="0 0 100 185" aria-hidden="true"><path fill="none"/></svg>');
 const cut=pk.querySelector('.pk-cut path');
 const pieces=Array.from({length:18},(_,i)=>{const piece=art.cloneNode(true);piece.classList.replace('pk-art','pk-foil-piece');piece.setAttribute('aria-hidden','true');pk.appendChild(piece);return piece});
 const tip=document.createElement('span');tip.className='pk-tear-tip';pk.appendChild(tip);

 let start=null,r=0,direction=1,moved=false,opening=false,frame=0,dragFrame=0,pendingRip=0,lastPulse=0,suppressClick=false;
 const paint=p=>{
  r=p;pk.style.setProperty('--rip',p);const seam=12.8;
  if(p<=0){art.style.clipPath='';strip.style.opacity='0';pieces.forEach(piece=>piece.style.opacity='0');tip.style.opacity='0';cut.setAttribute('d','');return;}
  const edge=direction===1?3+97*p:97-97*p,jag=[];
  const lo=direction===1?0:edge,hi=direction===1?edge:100;
  for(let x=Math.ceil(lo/2.6)*2.6;x<hi;x+=2.6)jag.push([x,seam+((Math.round(x/2.6)%3)-1)*.28]);jag.push([hi,seam]);
  const pts=ps=>ps.map(([x,y])=>x.toFixed(2)+'% '+y.toFixed(2)+'%').join(',');
  art.style.clipPath=direction===1?'polygon('+pts([[0,seam],...jag,[edge,0],[100,0],[100,100],[0,100]])+')':'polygon('+pts([[0,0],[edge,0],...jag,[100,100],[0,100]])+')';
  strip.style.opacity='0';
  pieces.forEach((piece,i)=>{const left=i*100/18,right=(i+1)*100/18,from=Math.max(left,lo),to=Math.min(right,hi);if(to<=from){piece.style.opacity='0';return;}
    const center=(from+to)/2,trail=Math.abs(edge-center)/100,curl=Math.sin(Math.min(1,trail*1.35)*Math.PI/2);
    piece.style.opacity='1';piece.style.clipPath=`polygon(${from}% 0,${to+.15}% 0,${to+.15}% ${seam}%,${from}% ${seam}%)`;
    piece.style.transformOrigin=`${center}% ${seam}%`;
    piece.style.transform=`translate3d(${direction*curl*12}px,${-curl*38}px,0) skewY(${direction*curl*9}deg) rotateX(${curl*48}deg)`;
  });
  tip.style.left=edge+'%';tip.style.top=seam+'%';tip.style.opacity=p<.99?'1':'0';
  cut.setAttribute('d',jag.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+(y*1.85).toFixed(2)).join(' '));
 };
 const open=()=>{
  if(opening||spinning)return;cancelAnimationFrame(dragFrame);opening=true;start=null;suppressClick=true;pk.classList.add('rip-complete');pk.classList.remove('dragging');
  const origin=r,begin=performance.now(),duration=reduce()?0:(origin>.98?100:650);
  const finish=now=>{const t=duration?Math.min(1,(now-begin)/duration):1;paint(origin+(1-origin)*(1-(1-t)**3));if(t<1){frame=requestAnimationFrame(finish);return;}pk.classList.add('strip-off');try{navigator.vibrate?.([10,12,22])}catch(_){};setTimeout(()=>{if(pk.isConnected){tornPackSource={html:art.outerHTML,foil:pieces.map(piece=>piece.outerHTML).join(''),rect:pk.getBoundingClientRect()};doSpin()}},0);};
  cancelAnimationFrame(frame);frame=requestAnimationFrame(finish);
 };
 const reset=()=>{pk.classList.remove('dragging');pk.classList.add('rip-reset');const begin=performance.now(),origin=r;const tick=now=>{const t=reduce()?1:Math.min(1,(now-begin)/170);paint(origin*(1-t));if(t<1)frame=requestAnimationFrame(tick);else pk.classList.remove('rip-reset');};cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);};
 pk.addEventListener('pointerdown',e=>{if(e.button!==0||opening||spinning)return;cancelAnimationFrame(frame);start={x:e.clientX,y:e.clientY,rect:pk.getBoundingClientRect(),time:performance.now()};r=0;moved=false;suppressClick=false;lastPulse=0;pk.classList.remove('rip-reset');});
 pk.addEventListener('pointermove',e=>{
  if(!start||opening)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(!moved&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){start=null;suppressClick=true;reset();return;}
  if(!moved&&Math.abs(dx)>6){direction=start.x-start.rect.left<start.rect.width/2?1:-1;moved=true;pk.classList.add('dragging');try{pk.setPointerCapture(e.pointerId)}catch(_){};}
  if(!moved)return;e.preventDefault();const p=Math.max(0,Math.min(1,direction===1?(e.clientX-start.rect.left)/start.rect.width:(start.rect.right-e.clientX)/start.rect.width));pendingRip=p;if(!dragFrame)dragFrame=requestAnimationFrame(()=>{dragFrame=0;if(!opening)paint(pendingRip)});
  const step=Math.floor(p*5);if(step>lastPulse){try{navigator.vibrate?.(5)}catch(_){}lastPulse=step;}

 },{passive:false});
 pk.addEventListener('pointerup',()=>{if(!start||opening)return;cancelAnimationFrame(dragFrame);dragFrame=0;if(moved)paint(pendingRip);start=null;if(moved){suppressClick=true;if(r>=.985)open();else reset();}});
 pk.addEventListener('pointercancel',()=>{cancelAnimationFrame(dragFrame);dragFrame=0;start=null;suppressClick=true;if(!opening)reset();});
 pk.addEventListener('click',e=>{e.stopPropagation();if(suppressClick){suppressClick=false;return;}direction=1;open();});
 paint(0);
}
const decoratePack=()=>{const pk=document.getElementById('spinBtn');if(!pk||!pk.classList.contains('pack'))return;
 if(!pk.querySelector('.pk-art'))pk.insertAdjacentHTML('afterbegin',packArt());if(!reduce())addTilt(pk);wireRip(pk)};
{const base=render;render=function(){base();decoratePack()}}

// Opening sequence, before the card-by-card reveal. Like the big card games, the light behind
// the pack hints at the best card inside: muted for a normal pack, gold for a 90+, rainbow for
// a shiny, purple and gold for a legend. Then it shakes, flashes, and the cards burst out.
function bestTier(sp){
  if(sp.god)return "god";
  let best="base";const rank={base:0,silver:1,gold:2,shiny:3,leg:4};
  for(const id of sp.ids){const m=BYID.get(id);if(!m)continue;setOverall(m);
    const t=m.leg?"leg":m.shiny?"shiny":m.ovr>=90?"gold":m.ovr>=80?"silver":"base";if(rank[t]>rank[best])best=t}
  return best;
}
const TIER={base:["#c9b98f","#7d8aa3"],silver:["#bfe0ff","#5e8fe6"],gold:["#ffd84a","#fff1b0"],shiny:["#ff9ad5","#8fe3ff"],leg:["#b07cff","#ffcb05"],god:["#ffcb05","#fff6c4"]};
function playIntro(sp,done){
  const source=tornPackSource;tornPackSource=null;
  // Reveal the real first card once, then animate that same DOM into place.
  done();
  const reveal=document.querySelector('.reveal'),card=reveal?.querySelector('.rv-stage .tcard');
  if(!card||reduce())return;
  card.style.animation='none';card.style.transform='';
  const target=card.getBoundingClientRect(),origin=source?.rect||{left:innerWidth/2-111,top:innerHeight/2-205,width:222,height:410};
  const tier=bestTier(sp),[c1,c2]=TIER[tier];
  const el=document.createElement('div');el.className='direct-opening';el.setAttribute('aria-hidden','true');el.style.setProperty('--c1',c1);el.style.setProperty('--c2',c2);
  el.innerHTML=`<div class="direct-rays"></div><div class="direct-aura"></div><div class="direct-stack">${sp.ids.map((_,i)=>`<div class="direct-back" data-stack="${i}"><span class="opening-back-ball"></span></div>`).join('')}</div><div class="direct-seam"></div><div class="direct-wrapper">${source?.html||packArt(true)}</div><div class="direct-foil">${source?.foil||''}</div>`;
  document.body.appendChild(el);
  const wrapper=el.querySelector('.direct-wrapper'),foil=el.querySelector('.direct-foil'),seam=el.querySelector('.direct-seam');
  for(const layer of [wrapper,foil])Object.assign(layer.style,{left:origin.left+'px',top:origin.top+'px',width:origin.width+'px',height:origin.height+'px'});
  Object.assign(seam.style,{left:origin.left+origin.width/2+'px',top:origin.top+origin.height*.128+'px',width:origin.width+'px'});
  card.style.animation='none';
  const scale=origin.width*.84/target.width,dx=origin.left+origin.width/2-target.left-target.width/2,dy=origin.top+origin.height*.35-target.top-target.height/2;
  const back=el.querySelector('.direct-stack');
  const backs=[...back.querySelectorAll('.direct-back')];
  backs.forEach((node,i)=>{node.style.zIndex=backs.length-i;});
  Object.assign(back.style,{left:target.left+'px',top:target.top+'px',width:target.width+'px',height:target.height+'px'});
  const backMotion=back.animate([
    {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale}) rotateY(0deg)`,offset:0},
    {transform:`translate3d(${dx}px,${dy-75}px,0) scale(${scale}) rotateY(0deg)`,offset:.35},
    {transform:`translate3d(0,0,0) scale(${scale}) rotateY(0deg)`,offset:.6},
    {transform:'translate3d(0,0,0) scale(1) rotateY(0deg)',offset:.82},
    {transform:'translate3d(0,0,0) scale(1) rotateY(0deg)',offset:1}
  ],{duration:1400,easing:'cubic-bezier(.25,.65,.3,1)',fill:'both'});
  const fanMotions=backs.map((node,i)=>{
    if(i===0)return node.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],{duration:280,delay:1200,easing:'ease-in',fill:'forwards'});
    const side=i%2?1:-1,rank=Math.ceil(i/2),x=side*rank*18,angle=side*rank*5;
    return node.animate([
      {transform:`translate3d(${side*2}px,${i*2}px,0) rotate(0deg)`,opacity:1,offset:0},
      {transform:`translate3d(${side*2}px,${i*2}px,0) rotate(0deg)`,opacity:1,offset:.32},
      {transform:`translate3d(${x}px,${rank*4}px,0) rotate(${angle}deg)`,opacity:1,offset:.65},
      {transform:`translate3d(${x}px,${rank*4}px,0) rotate(${angle}deg)`,opacity:1,offset:.84},
      {transform:'translate3d(0,10px,0) rotate(0deg)',opacity:0,offset:1}
    ],{duration:1480,easing:'cubic-bezier(.25,.65,.3,1)',fill:'both'});
  });
  const motion=card.animate([
    {transform:'rotateY(-90deg)',opacity:0},
    {transform:'rotateY(-90deg)',opacity:1,offset:.01},
    {transform:'rotateY(0deg)',opacity:1}
  ],{duration:300,delay:1480,easing:'cubic-bezier(.2,.65,.3,1)',fill:'both'});
  reveal.style.setProperty('--opening-color',c1);
  reveal.classList.add('rarity-lit');

  wrapper.animate([{transform:'translate3d(0,0,0)',opacity:1},{transform:'translate3d(0,65px,0)',opacity:1,offset:.35},{transform:`translate3d(0,${innerHeight-origin.top+100}px,0) rotate(3deg)`,opacity:0}],{duration:760,delay:100,easing:'cubic-bezier(.35,0,.55,1)',fill:'forwards'});
  foil.animate([{transform:'translate3d(0,0,0)',opacity:1},{transform:'translate3d(65px,-190px,0) rotate(18deg)',opacity:0}],{duration:520,easing:'cubic-bezier(.15,.7,.3,1)',fill:'forwards'});
  seam.animate([{transform:'translate(-50%,-50%) scaleX(.8)',opacity:0},{transform:'translate(-50%,-50%) scaleX(1.2)',opacity:.9,offset:.22},{transform:'translate(-50%,-50%) scaleX(1.6)',opacity:0}],{duration:700,fill:'forwards'});
  reveal.querySelectorAll('.rv-top,.rv-hint').forEach(node=>node.animate([{opacity:0},{opacity:1}],{duration:250,delay:1550,fill:'both'}));
  const stage=reveal.querySelector('.rv-stage');stage.style.pointerEvents='none';
  reveal.classList.add('intro-running');
  let settled=false,cleanupTimer=null;
  const finish=()=>{if(settled)return;settled=true;clearTimeout(cleanupTimer);motion.cancel();stage.style.pointerEvents='';reveal.classList.remove('intro-running');el.remove();};
  // Ensure a throttled animation cannot leave the input-blocking layer behind.
  cleanupTimer=setTimeout(finish,1900);
  motion.finished.then(finish).catch(finish);
  el.onclick=()=>{backMotion.finish();fanMotions.forEach(a=>a.finish());motion.finish();finish();};
}

{const base=openReveal;openReveal=function(sp,chooseAll=false){if(chooseAll)return base(sp,true);if(reduce()||!sp||!sp.ids||!sp.ids.length)return base(sp);playIntro(sp,()=>base(sp))}}
// Packs skip the spinning-names wait: the rip goes straight into the opening sequence.
{const base=doSpin;doSpin=function(keep){
  if(!isPack()||keep||spinning)return base(keep);
  const sp=run.unrevealed?run.spin:drawNext();
  run.justRipped=true;run.spin=sp;run.unrevealed=false;run.selected=null;saveRun();render();
}}
// Re-rip puts a fresh sealed pack back on the table to swipe open, instead of opening it for you.
document.addEventListener("click",e=>{
  const b=e.target.closest("#rvRerip,#rerollBtn");if(!b||!isPack()||!run.spin||!run.spin.pack)return;
  e.stopImmediatePropagation();e.preventDefault();
  if(b.disabled||!run.rerolls||run.second)return;
  run.rerolls--;run.spin=null;run.selected=null;run.doubleArmed=false;run.justRipped=false;saveRun();
  // A fast second click (or a mouse double-click) could land on whatever renders under the cursor; ignore clicks briefly.
  window.__rerippedAt=performance.now();
  closeReveal();render();
  const t=document.getElementById("throwBox");if(t)t.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"center"});
},true);
// Pack contents. Every roll is independent, so nothing is capped per pack or per run:
// - each of the 5 cards has its own shiny chance (about 1 pack in 250 has one, two in one pack is very rare)
// - each pack has a 1.5% chance of a bonus legendary card, and every bonus rolls again for another
// - about 1 pack in 750 is a god pack: five cards that are all legends or shinies rated 90+,
//   with at least one of each. It looks like any other pack until you rip it; the opening goes gold.
const SHINY_PER_CARD=.0008,LEGEND_PER_PACK=.015;
const rollPack=function(run,taken){
  const t=taken||[],free=m=>!t.includes(m.num);
  const pick=(arr,n)=>{const a=arr.slice(),out=[];while(out.length<n&&a.length)out.push(a.splice(Math.floor(rand(run)*a.length),1)[0]);return out};
  run.packs=(run.packs||0)+1;
  if(rand(run)<rollPack.godOdds){
    const good=m=>{setOverall(m);return m.ovr>=90&&free(m)};
    const legs=LEGENDS.filter(good),shin=BASE.map(m=>BYID.get(m.id+SHINY_ID)).filter(Boolean).filter(good);
    if(legs.length&&shin.length&&legs.length+shin.length>=PACK_SIZE){
      const first=[...pick(legs,1),...pick(shin,1)],ids=[...first,...pick([...legs,...shin].filter(m=>!first.includes(m)),PACK_SIZE-2)].map(m=>m.id);
      for(let i=ids.length-1;i>0;i--){const j=Math.floor(rand(run)*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
      return{pack:true,legend:false,god:true,shiny:true,shinies:ids.filter(id=>id>=SHINY_ID).length,bonus:null,bonuses:0,n:run.packs,ids};
    }
  }
  const ids=pick(BASE,PACK_SIZE).map(m=>rand(run)<SHINY_PER_CARD?m.id+SHINY_ID:m.id);
  const shinies=ids.filter(id=>id>=SHINY_ID).length,legPool=LEGENDS.filter(free),bonus=[];
  while(legPool.length&&rand(run)<LEGEND_PER_PACK)bonus.push(legPool.splice(Math.floor(rand(run)*legPool.length),1)[0].id);
  return{pack:true,legend:false,shiny:shinies>0,shinies,bonus:bonus[0]||null,bonuses:bonus.length,n:run.packs,ids:shuffle([...ids,...bonus],()=>rand(run))};
};
rollPack.godOdds=1/750;packSpin=rollPack;
// Pool screen notes: count multiples, and a god pack needs no note at all.
{const base=render;render=function(){base();
  const d=document.getElementById("draft"),sp=run&&run.spin;if(!d||!sp||!sp.pack)return;
  if(sp.god){d.querySelectorAll(".shinynote").forEach(n=>n.remove());return}
  const leg=d.querySelector(".shinynote.legnote");if(leg&&sp.bonuses>1)leg.innerHTML=`<b>🌟 ${sp.bonuses} bonus legendary cards!</b> This pack came with ${sp.ids.length} cards.`;
  const sh=[...d.querySelectorAll(".shinynote")].find(n=>!n.classList.contains("legnote"));if(sh&&sp.shinies>1)sh.innerHTML=`<b>✨ ${sp.shinies} shinies appeared!</b> Shinies have every stat boosted.`;
}}
decoratePack();
}

// Swallow clicks for a moment after a Re-rip so a double-click can't pick or place a card by accident.
document.addEventListener("click",e=>{if(window.__rerippedAt&&performance.now()-window.__rerippedAt<450&&!e.target.closest('#rerollBtn,#rvRerip')){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener("dblclick",e=>{if(e.target.closest('#draft,#field,#pen,.reveal')){e.preventDefault()}},true);
