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
let tornPackSource=null,burstPendingSpin=null,openingBurstTier="bronze";
function packArt(opened=false){
 return '<svg class="pk-art"'+(opened?' style="clip-path:polygon(0 12.8%,100% 12.8%,100% 100%,0 100%)"':'')+' viewBox="0 0 922 1706" aria-hidden="true"><image href="pack-foil-v6.webp" width="922" height="1706" preserveAspectRatio="xMidYMid meet"/></svg>';
}

// Tilt: the pack leans toward your finger or cursor and a glare follows it.
function addTilt(pk){
  if(pk._tilt)return;pk._tilt=1;
  pk.insertAdjacentHTML("beforeend",'<span class="pk-glare" aria-hidden="true"></span>');
  pk.addEventListener("pointermove",e=>{if(e.pointerType==='touch'||pk.matches('.dragging,.rip-complete,.wobble'))return;
    const r=pk.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    pk.style.setProperty("--gx",(x+.5)*100+"%");pk.style.setProperty("--gy",(y+.5)*100+"%");
    pk.style.rotate=`${-y} ${x} 0 ${Math.min(10,Math.hypot(x,y)*18)}deg`;pk.classList.add("tilting")});
  const off=()=>{pk.style.rotate="";pk.classList.remove("tilting")};
  pk.addEventListener("pointerleave",off);pk.addEventListener("pointerdown",off);
}
// The actual photographed top of the wrapper peels away as the tear follows the finger.
function wireRip(pk){
 if(pk._ripWired)return;pk._ripWired=true;
 const art=pk.querySelector('.pk-art'),strip=document.createElement('canvas');
 pk.insertAdjacentHTML('beforeend','<span class="physical-rip-light" aria-hidden="true"></span><span class="pack-seam-flash" aria-hidden="true"></span><span class="pack-tier-burst" aria-hidden="true"><i></i></span>');
 strip.className='pk-loose';strip.setAttribute('aria-hidden','true');pk.appendChild(strip);
 const foilImage=new Image();foilImage.src=art.querySelector('image').getAttribute('href');
 const cw=600,ch=Math.round(600*1706/922),pad=180;strip.width=cw+pad*2;strip.height=ch+pad*2;
 Object.assign(strip.style,{left:'-30%',top:(-pad/ch*100)+'%',width:'160%',height:((ch+pad*2)/ch*100)+'%',right:'auto',bottom:'auto'});
 const foil=strip.getContext('2d');
 const drawFoil=(p,flight=0)=>{
  if(!foilImage.complete||!foilImage.naturalWidth)return false;
  foil.clearRect(0,0,strip.width,strip.height);
  const seal=ch*.128,front=p*cw,step=3;
  foil.save();
  // The detached seal moves as a single piece, keeping the printed foil intact.
  foil.translate(pad+cw/2+direction*flight*cw*.08,pad+seal/2-flight*cw*.2);
  foil.rotate(direction*flight*.16);
  foil.translate(-cw/2,-seal/2);
  for(let u=cw-step;u>=0;u-=step){
   const t=Math.max(0,front-u)/cw,flex=t*t*(3-2*t);
   const x=direction===1?u:cw-u-step;
   const lift=cw*.055*flex*(1-flight);
   const roll=.65*flex+.35*Math.sin(flight*Math.PI),h=seal*Math.cos(roll);
   const w=Math.min(step+.6,cw-x);
   foil.drawImage(foilImage,x/cw*foilImage.naturalWidth,0,w/cw*foilImage.naturalWidth,
    foilImage.naturalHeight*.128,x,seal-lift-h,w,h);
   if(t>0){
    // Keep highlights and the silver fold inside the photographed foil alpha.
    // The source artwork has transparent margins, especially along this seam.
    foil.save();foil.globalCompositeOperation='source-atop';
    const sheen=foil.createLinearGradient(0,seal-lift-h,0,seal-lift);
    sheen.addColorStop(0,'rgba(0,5,18,'+(.14*flex)+')');
    sheen.addColorStop(.38,'rgba(255,255,255,0)');
    sheen.addColorStop(.7,'rgba(255,255,255,'+(.32*Math.sin(roll))+')');
    sheen.addColorStop(1,'rgba(0,0,0,'+(.32*flex)+')');
    foil.fillStyle=sheen;foil.fillRect(x,seal-lift-h,w,h);
    // A narrow folded lip exposes the silver backing without turning the
    // whole seal into a broad, untextured sheet.
    const lip=seal*.075*Math.sin(roll),y=seal-lift;
    if(lip>.2){
     const metal=foil.createLinearGradient(0,y-lip,0,y+lip*.2);
     metal.addColorStop(0,'#46566c');metal.addColorStop(.28,'#b4c4d3');
     metal.addColorStop(.62,'#f2f8fa');metal.addColorStop(1,'#7d8d9e');
     foil.fillStyle=metal;foil.fillRect(x,y-lip,w,lip*1.2);
    }
    foil.restore();
   }
  }
  foil.restore();return true;
 };
 foilImage.onload=()=>{if(r>0)paint(r)};
 pk.insertAdjacentHTML('beforeend','<span class="pk-mouth" aria-hidden="true"></span><span class="pk-tracer" aria-hidden="true"><i></i></span><svg class="pk-cut" viewBox="0 0 100 185" aria-hidden="true"><path fill="none"/></svg>');
 const cut=pk.querySelector('.pk-cut path');
 const pieces=Array.from({length:0},(_,i)=>{const piece=art.cloneNode(true);piece.classList.replace('pk-art','pk-foil-piece');piece.setAttribute('aria-hidden','true');pk.appendChild(piece);return piece});
 const tip=document.createElement('span');tip.className='pk-tear-tip';pk.appendChild(tip);

 let start=null,r=0,direction=1,moved=false,opening=false,frame=0,dragFrame=0,pendingRip=0,lastPulse=0,suppressClick=false,committed=0,scrolling=false,lastY=0;
 // How far a swipe has to travel, as a share of the pack's width, to tear it fully.
 const SWIPE=.62;
 const paint=p=>{
  r=p;pk.style.setProperty('--rip',p);const seam=12.8;
  if(p<=0){art.style.clipPath='';strip.style.opacity='0';pieces.forEach(piece=>piece.style.opacity='0');tip.style.opacity='0';cut.setAttribute('d','');return;}
  const edge=direction===1?100*p:100*(1-p),jag=[];
  const lo=direction===1?0:edge,hi=direction===1?edge:100;
  const edgeY=x=>seam+Math.sin(x*1.71)*.13+Math.sin(x*4.37)*.09;
  jag.push([lo,edgeY(lo)]);for(let x=Math.ceil(lo);x<hi;x++)jag.push([x,edgeY(x)]);jag.push([hi,edgeY(hi)]);
  const pts=ps=>ps.map(([x,y])=>x.toFixed(2)+'% '+y.toFixed(2)+'%').join(',');
  const full=[];for(let x=0;x<=100;x++)full.push([x,edgeY(x)]);
  if(drawFoil(p)){
   art.style.clipPath='polygon('+pts([...full,[100,100],[0,100]])+')';
   strip.style.opacity='1';strip.style.clipPath='none';
   strip.style.transformOrigin='50% 12.8%';strip.style.transform='translate3d(0,0,0)';
  }
  tip.style.left=edge+'%';tip.style.top=seam+'%';tip.style.opacity=p<.99?'1':'0';
  cut.style.opacity=p>=1?'0':'1';
  cut.setAttribute('d',jag.filter(([x])=>x>=3.5&&x<=96.5).map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+(y*1.85).toFixed(2)).join(' '));
 };
 const open=()=>{
  if(opening||spinning)return;
  // Choose the pack once; the opening light reflects those exact cards.
  burstPendingSpin=run.unrevealed?run.spin:drawNext();
  pk.dataset.burst=bestTier(burstPendingSpin);openingBurstTier=pk.dataset.burst;
  cancelAnimationFrame(dragFrame);opening=true;start=null;suppressClick=true;pk.style.setProperty('--tear-dir',direction);pk.classList.add('rip-complete');pk.classList.remove('dragging');
  const origin=r,begin=performance.now(),duration=reduce()?0:Math.max(140,Math.round((1-origin)*520));
  const finish=now=>{const t=duration?Math.min(1,(now-begin)/duration):1;paint(origin+(1-origin)*(1-(1-t)**2));if(t<1){frame=requestAnimationFrame(finish);return;}try{navigator.vibrate?.(18)}catch(_){};
   if(reduce()){doSpin();return}
   // Keep the live foil canvas, wrapper and light together across the draft rerender.
   const rect=art.getBoundingClientRect();
   const layer=document.createElement('div');
   layer.className='direct-opening physical-intro continuous-opening';
   layer.setAttribute('aria-hidden','true');
   const packet=document.createElement('div');
   packet.className='pack rip-complete foil-releasing';
   packet.dataset.burst=pk.dataset.burst;
   Object.assign(packet.style,{left:rect.left+'px',top:rect.top+'px'});
   packet.style.setProperty('width',rect.width+'px','important');
   packet.style.setProperty('height',rect.height+'px','important');
   packet.append(art,strip,...pk.querySelectorAll('.physical-rip-light,.pack-tier-burst,.pack-seam-flash'));
   layer.append(packet);document.body.append(layer);
   pk.style.visibility='hidden';
   const releasedAt=performance.now();
   const floatAway=now=>{
    if(!pk.isConnected){layer.remove();return;}
    const t=Math.min(1,(now-releasedAt)/460),e=1-(1-t)**2;
    drawFoil(1,e);strip.style.opacity=String(1-Math.max(0,(t-.55)/.45));
    if(t<1){frame=requestAnimationFrame(floatAway);return}
    tornPackSource={rect,layer,art};doSpin();
    if(tornPackSource?.layer===layer){tornPackSource=null;layer.remove()}
   };
   frame=requestAnimationFrame(floatAway);};

  cancelAnimationFrame(frame);frame=requestAnimationFrame(finish);
 };
 const reset=()=>{if(r>0){committed=r;pk.classList.remove('dragging');return}pk.classList.remove('dragging');pk.classList.add('rip-reset');const begin=performance.now(),origin=r;const tick=now=>{const t=reduce()?1:Math.min(1,(now-begin)/170);paint(origin*(1-t));if(t<1)frame=requestAnimationFrame(tick);else pk.classList.remove('rip-reset');};cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);};
 pk.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||opening||spinning)return;cancelAnimationFrame(frame);try{pk.setPointerCapture(e.pointerId)}catch(_){}start={id:e.pointerId,x:e.clientX,y:e.clientY,rect:pk.getBoundingClientRect(),time:performance.now(),progress:r};committed=r;pendingRip=r;moved=false;scrolling=false;lastY=e.clientY;suppressClick=false;lastPulse=0;pk.classList.remove('rip-reset');});
 pk.addEventListener('pointermove',e=>{
  if(!start||start.id!==e.pointerId||opening)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;
  // Clearly vertical: scroll the page like a normal drag. Diagonal thumb swipes still tear.
  if(scrolling){window.scrollBy(0,lastY-e.clientY);lastY=e.clientY;return;}
  if(!moved&&Math.abs(dy)>14&&Math.abs(dy)>Math.abs(dx)*1.8){scrolling=true;suppressClick=true;reset();window.scrollBy(0,lastY-e.clientY);lastY=e.clientY;return;}
  lastY=e.clientY;
  if(!moved&&Math.abs(dx)>6&&Math.abs(dx)>=Math.abs(dy)*.55){if(committed===0)direction=dx>0?1:-1;moved=true;pk.classList.add('dragging');try{pk.setPointerCapture(e.pointerId)}catch(_){};}
  if(!moved)return;e.preventDefault();const p=Math.max(r,Math.min(1,start.progress+direction*dx/(start.rect.width*SWIPE)));pendingRip=Math.max(pendingRip,p);if(!dragFrame){let last=performance.now();const follow=now=>{dragFrame=0;if(opening)return;const dt=Math.min(40,now-last);last=now;const next=r+(pendingRip-r)*(1-Math.exp(-dt/16));paint(pendingRip-next<.001?pendingRip:next);if(r>=.985){open();return}if(pendingRip-r>.001)dragFrame=requestAnimationFrame(follow)};dragFrame=requestAnimationFrame(follow)};
  const step=Math.floor(p*5);if(step>lastPulse){try{navigator.vibrate?.(5)}catch(_){}lastPulse=step;}

 },{passive:false});
 pk.addEventListener('pointerup',e=>{
  if(!start||start.id!==e.pointerId||opening)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y,ms=Math.max(1,performance.now()-start.time);
  if(scrolling){start=null;scrolling=false;return;}
  if(Math.abs(dx)>6&&Math.abs(dx)>=Math.abs(dy)*.55){
   if(!moved&&start.progress===0)direction=dx>0?1:-1;
   moved=true;
   pendingRip=Math.max(pendingRip,Math.min(1,start.progress+direction*dx/(start.rect.width*SWIPE)));
  }
  // A quick flick across the seam opens it even if it was short.
  const flick=moved&&Math.abs(dx)>=40&&Math.abs(dx)/ms>=.45&&Math.sign(dx)===direction;
  start=null;
  if(!moved)return;
  suppressClick=true;cancelAnimationFrame(dragFrame);dragFrame=0;
  if(pendingRip>=.5||flick){open();return}
  paint(pendingRip);reset();
 });
 pk.addEventListener('pointercancel',e=>{if(!start||start.id!==e.pointerId)return;cancelAnimationFrame(dragFrame);dragFrame=0;start=null;suppressClick=true;if(!opening)reset();});
 pk.addEventListener('click',e=>{e.stopPropagation();if(suppressClick){suppressClick=false;return;}if(r===0)direction=1;open();});
 paint(0);
}
const decoratePack=()=>{const pk=document.getElementById('spinBtn');if(!pk||!pk.classList.contains('pack'))return;
 if(!pk.querySelector('.pk-art'))pk.insertAdjacentHTML('afterbegin',packArt());if(!reduce())addTilt(pk);wireRip(pk)};
{const base=render;render=function(){base();decoratePack()}}

// Opening sequence, before the card-by-card reveal. Like the big card games, the light behind
// the pack hints at the best card inside: muted for bronze or silver, gold for a 90+, rainbow for
// a shiny, purple and gold for a legend. Then it shakes, flashes, and the cards burst out.
function bestTier(sp){
  if(sp.god)return "god";
  let best="bronze";const rank={bronze:0,silver:1,gold:2,shiny:3,leg:4};
  for(const id of sp.ids){const m=BYID.get(id);if(!m)continue;setOverall(m);
    const t=m.leg?"leg":m.shiny?"shiny":m.ovr>=90?"gold":m.ovr>=65?"silver":"bronze";if(rank[t]>rank[best])best=t}
  return best;
}
const TIER={bronze:["#e0a872","#9c6533"],silver:["#bfe0ff","#5e8fe6"],gold:["#ffd84a","#fff1b0"],shiny:["#ff9ad5","#8fe3ff"],leg:["#b07cff","#ffcb05"],god:["#ffcb05","#fff6c4"]};
function playIntro(sp,done){
 const source=tornPackSource;tornPackSource=null;done();
 const reveal=document.querySelector('.reveal'),stack=reveal?.querySelector('.physical-stack');
 if(!stack||reduce()){source?.layer.remove();return}
 const target=stack.getBoundingClientRect(),origin=source?.rect||{left:innerWidth/2-111,top:innerHeight/2-205,width:222,height:410};
 const scale=Math.min(1,origin.width*.80/target.width,origin.height*.78/target.height);
 const dx=origin.left+(origin.width-target.width*scale)/2-target.left;
 const seam=origin.top+origin.height*.128;
 const dy=seam+3-target.top;
 const lift=Math.min(origin.height*.20,target.height*scale*.31);
 const pose=(x,y,size)=>`translate3d(${x}px,${y}px,0) scale(${size})`;
 const el=source?.layer||document.createElement('div');
 let wrapper=source?.art;
 if(!wrapper){
  el.className='direct-opening physical-intro';
  el.setAttribute('aria-hidden','true');
  el.innerHTML='<div class="direct-wrapper">'+packArt(true)+'</div>';
  document.body.append(el);
  wrapper=el.firstElementChild;
  Object.assign(wrapper.style,{left:origin.left+'px',top:origin.top+'px',width:origin.width+'px',height:origin.height+'px'});
 }else{
  el.classList.add('cards-emerging');
 }
 reveal.classList.add('intro-running');
 // At pack scale the first card is opaque and fits inside the foil. Expose
 // its printed edge before the deck grows, so the two poses share a silhouette.
 const previousOrigin=stack.style.transformOrigin;
 stack.style.transformOrigin='0 0';
 const duration=920;
 const cardMotion=stack.animate([
  {transform:pose(dx,dy,scale),offset:0,easing:'ease-out'},
  {transform:pose(dx,dy-lift,scale),offset:.30,easing:'cubic-bezier(.35,0,.22,1)'},
  {transform:pose(0,0,1),offset:1}
 ],{duration,fill:'both'});
 wrapper.animate([
  {transform:'translateY(0)',opacity:1,offset:0,easing:'ease-in'},
  {transform:`translateY(${origin.height*.08}px)`,opacity:1,offset:.30,easing:'ease-in'},
  {transform:`translateY(${origin.height*.72}px)`,opacity:1,offset:.64,easing:'ease-out'},
  {transform:`translateY(${Math.max(origin.height,innerHeight-origin.top+20)}px)`,opacity:0,offset:1}
 ],{duration,fill:'both'});
 let finished=false,timer;
 const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);cardMotion.cancel();stack.style.transformOrigin=previousOrigin;el.remove();reveal.classList.remove('intro-running');reveal.querySelector('.tcard.physical-front')?._physicalEntrance?.()};
 timer=setTimeout(finish,duration+200);cardMotion.finished.then(finish).catch(finish);
 el.onclick=()=>{cardMotion.finish();finish()};
}

{const base=openReveal;openReveal=function(sp,chooseAll=false){if(chooseAll)return base(sp,true);if(reduce()||!sp||!sp.ids||!sp.ids.length)return base(sp);playIntro(sp,()=>base(sp))}}
// Packs skip the spinning-names wait: the rip goes straight into the opening sequence.
{const base=doSpin;doSpin=function(keep){
  if(!isPack()||keep||spinning)return base(keep);
  const sp=burstPendingSpin||(run.unrevealed?run.spin:drawNext());burstPendingSpin=null;
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
// Cards rated 90+ are 10% more likely to land in a pack than other cards. The weekly challenge picks this up
// from BOOST_WEEK, so every player in a given week still opens the same packs.
const TOP_CARD_BOOST=1.10,BOOST_WEEK='2026-W49',TOP_CARD=new Map();
const boostOn=r=>!(r&&r.week&&r.week<BOOST_WEEK);
const cardWeight=m=>{let t=TOP_CARD.get(m.id);if(t===undefined){setOverall(m);t=m.ovr>=90;TOP_CARD.set(m.id,t)}return t?TOP_CARD_BOOST:1};
const rollPack=function(run,taken){
  const t=taken||[],free=m=>!t.includes(m.num);
  const pick=(arr,n)=>{const a=arr.slice(),out=[];while(out.length<n&&a.length)out.push(a.splice(Math.floor(rand(run)*a.length),1)[0]);return out};
  run.packs=(run.packs||0)+1;
  if(rand(run)<rollPack.godOdds){
    const good=m=>{setOverall(m);return m.ovr>=90&&free(m)};
    const legs=LEGENDS.filter(m=>inPool(run,m)).filter(good),shin=BASE.filter(m=>inPool(run,m)).map(m=>BYID.get(m.id+SHINY_ID)).filter(Boolean).filter(good);
    if(legs.length&&shin.length&&legs.length+shin.length>=PACK_SIZE){
      const first=[...pick(legs,1),...pick(shin,1)],ids=[...first,...pick([...legs,...shin].filter(m=>!first.includes(m)),PACK_SIZE-2)].map(m=>m.id);
      for(let i=ids.length-1;i>0;i--){const j=Math.floor(rand(run)*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
      return{pack:true,legend:false,god:true,shiny:true,shinies:ids.filter(id=>id>=SHINY_ID).length,bonus:null,bonuses:0,n:run.packs,ids};
    }
  }
  const wpick=(arr,n)=>{const a=arr.slice(),out=[];while(out.length<n&&a.length){let tot=0;for(const m of a)tot+=cardWeight(m);let x=rand(run)*tot,j=0;for(;j<a.length-1;j++){x-=cardWeight(a[j]);if(x<0)break}out.push(a.splice(j,1)[0])}return out};
  const src=BASE.filter(m=>inPool(run,m));
  const ids=(boostOn(run)?wpick(src,PACK_SIZE):pick(src,PACK_SIZE)).map(m=>rand(run)<SHINY_PER_CARD?m.id+SHINY_ID:m.id);
  const shinies=ids.filter(id=>id>=SHINY_ID).length,legPool=LEGENDS.filter(m=>inPool(run,m)).filter(free),bonus=[];
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

