// Pack reveal: after a pack is ripped, its Pokémon pop up one at a time as trading cards.
// Tap through them in shuffled pack order, then pick one from the spread. "Full stats" drops to the regular list.
// Type chips: white or navy text, whichever reads better on that type's color.
const typeInk=h=>{const L=[1,3,5].map(i=>{const c=parseInt(h.substr(i,2),16)/255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);return 1.05/(L+.05)>=(L+.05)/.0665?"#fff":"#14233a"};
// Type orbs: the round type icon from PokéAPI's Scarlet/Violet labels (linked like the card art), cropped to a
// circle with a glossy finish. They're set into the top edge of the picture frame, ringed in the card's tier color.
// If an icon fails to load, the orb keeps the plain type color.
const TYPE_ID={normal:1,fighting:2,flying:3,poison:4,ground:5,rock:6,bug:7,ghost:8,steel:9,fire:10,water:11,grass:12,electric:13,psychic:14,ice:15,dragon:16,dark:17,fairy:18};
// Rock uses the Sword/Shield symbol (a boulder): the Scarlet/Violet one is a plain white octagon that reads as a blank orb.
const TYPE_ICON=t=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/${t==="rock"?"generation-viii/sword-shield":"generation-ix/scarlet-violet"}/${TYPE_ID[t]}.png`;
// Orb fill = the label's own color, so the area around the shrunken symbol blends with the image.
const TYPE_ORB={normal:"#9fa19f",fighting:"#ff8000",flying:"#81b9ef",poison:"#9040cc",ground:"#915121",rock:"#c5b78c",bug:"#91a119",ghost:"#704170",steel:"#60a1b8",fire:"#e62829",water:"#2980ef",grass:"#3fa129",electric:"#fac000",psychic:"#ef4179",ice:"#3fd8ff",dragon:"#5061e1",dark:"#50413f",fairy:"#ef71ef"};
const typeChips=m=>`<span class="tc-types" role="img" aria-label="${m.types.map(cap).join(" and ")} type">${m.types.map(t=>`<span class="tc-type${t==="rock"?" swsh":""}" title="${cap(t)}" style="--tb:${TYPE_ORB[t]||TYPE_COLORS[t]||"#777"}">${TYPE_ID[t]?`<img src="${TYPE_ICON(t)}" alt="" decoding="async" onerror="this.remove()">`:""}</span>`).join("")}</span>`;
const ART_URL=(n,shiny)=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny?"shiny/":""}${n}.png`;
function tcardHTML(m,mini){
  setOverall(m);
  const c1=TYPE_COLORS[m.types[0]]||"#777",c2=TYPE_COLORS[m.types[1]]||c1;
  const tier=m.leg?"leg":m.shiny?"shiny":m.ovr>=90?"gold":m.ovr>=65?"silver":"bronze";
  const img=`<img src="${ART_URL(m.num,m.shiny)}" data-num="${m.num}" data-shiny="${m.shiny?1:0}" data-art="1" alt="" decoding="async" onload="pokemonImageLoaded(this)" onerror="pokemonImageError(this)">`;
  const tag=m.leg?'<span class="tc-tag">Legend</span>':m.shiny?'<span class="tc-tag">Shiny</span>':"";
  const best=`<span class="tc-best ${ovCls(m.ovr)}"><b>${m.ovr}</b><small>${m.hspot}</small></span>`;
  if(mini)return `<div class="tcard mini ${tier}" style="--c1:${c1};--c2:${c2}"><div class="tc-in"><b class="tc-name">${esc(m.name)}</b><div class="tc-art">${img}${typeChips(m)}</div>${best}${tag}</div></div>`;
  const bars=KEY.map(([k,f,,g])=>{const v=m.r[f];return `<div class="tc-bar"><i style="color:var(--${g})">${k}</i><span><b style="width:${Math.max(4,(v-40)/59*100)}%;background:var(--${g})"></b></span><em>${v}</em></div>`}).join("");
  return `<div class="tcard ${tier}" style="--c1:${c1};--c2:${c2}"><div class="tc-in">
    <div class="tc-top"><b class="tc-name">${esc(m.name)}</b>${best}</div>
    <div class="tc-art">${img}${typeChips(m)}${tag}</div>
    <div class="tc-meta">#${dex(m.num)} · ${m.types.map(cap).join("/")} · ${m.body} · ${ftin(m.ht)}, ${lbs(m.wt)} lb</div>
    <div class="tc-boxes"><span><b class="${ovCls(m.off)}">${m.off}</b><i>OFF</i></span><span><b class="${ovCls(m.def)}">${m.def}</b><i>DEF ${m.dspot}</i></span><span><b class="${ovCls(m.pit)}">${m.pit}</b><i>${m.pspot}</i></span></div>
    <div class="tc-bars">${bars}</div></div></div>`;
}
let revealEl=null,revealScroll=null;
function unlockRevealScroll(){
  document.querySelector('.wrap')?.removeAttribute('inert');
  document.body.classList.remove('rv-open');document.documentElement.classList.remove('rv-root');document.body.style.removeProperty('--reveal-scroll');
  if(revealScroll!==null){const y=revealScroll;revealScroll=null;window.scrollTo(0,y)}
}
function closeReveal(){if(revealEl){revealEl.remove();revealEl=null}unlockRevealScroll()}
// Rebuild the pack row when leaving the reveal. This refreshes card artwork as well as
// the options UI, instead of uncovering potentially stale card elements underneath.
// iPhone Safari can leave card pictures blank when they were created while the page behind the pack
// was hidden. Once the page is showing again, give every card a brand-new image that is decoded
// before it is put on the page, then nudge the row so Safari draws it.
function repaintCardArt(){
  const swap=()=>document.querySelectorAll(".cardrow img, #cands img").forEach(old=>{
    const src=old.currentSrc||old.src;if(!src)return;
    const fresh=new Image();fresh.decoding="sync";fresh.alt=old.alt||"";fresh.className=old.className;
    if(old.getAttribute("onerror"))fresh.setAttribute("onerror",old.getAttribute("onerror"));
    if(old.getAttribute("onload"))fresh.setAttribute("onload",old.getAttribute("onload"));
    const put=()=>{if(old.isConnected)old.replaceWith(fresh)};
    fresh.src=src;(fresh.decode?fresh.decode():Promise.resolve()).then(put,put);
  });
  requestAnimationFrame(()=>requestAnimationFrame(()=>{swap();
    const row=document.querySelector(".cardrow");if(row){row.style.transform="translateZ(0)";void row.offsetHeight;requestAnimationFrame(()=>row.style.removeProperty("transform"))}}));
}
function returnToField(){
  const row=document.querySelector(".cardrow"),scrollLeft=row?.scrollLeft||0;
  if(run.doubleArmed){run.doubleArmed=false;saveRun();renderBoard()}
  closeReveal();
  if(run?.spin?.pack&&!run.unrevealed&&!run.locked){
    packPoolUI();
    const refreshed=document.querySelector(".cardrow");
    if(refreshed)refreshed.scrollLeft=scrollLeft;
    repaintCardArt();
  }
}


function openReveal(sp,chooseAll=false){
  closeReveal();
  const taken=takenNums();
  // Preserve the randomized draw order. Any reveal can be the exciting one.
  const ms=sp.ids.map(id=>BYID.get(id)).filter(m=>m&&!sp.usedIds?.includes(m.id));
  ms.forEach(setOverall);
  if(!ms.length)return;
  const el=revealEl=document.createElement("div");el.className="reveal";el.setAttribute("role","dialog");el.setAttribute("aria-label","Pack opening");
  revealScroll=window.scrollY;document.body.style.setProperty('--reveal-scroll',-revealScroll+'px');document.querySelector('.wrap')?.setAttribute('inert','');document.documentElement.classList.add('rv-root');document.body.classList.add('rv-open');document.body.appendChild(el);
  let i=0,busy=false,selected=[],pendingAdvance=null,masterWarn=false;
  const pick=id=>{closeReveal();run.selected=id;render();const pl=document.getElementById("place");if(pl)pl.scrollIntoView({behavior:"smooth",block:"center"})};
  const spread=()=>{
    el.innerHTML=`<div class="rv-top"><span class="rv-count">${run.doubleArmed?`Choose 2 cards · ${selected.length}/2`:"Your pack"}</span><button class="btn rv-btn" id="rvList">Back to field</button></div>
      <div class="rv-grid">${ms.map(m=>`<button class="rv-mini${selected.includes(m.id)?' master-selected':''}" data-id="${m.id}" aria-pressed="${selected.includes(m.id)}" aria-label="${run.doubleArmed?'Select':'Pick'} ${esc(m.name)}">${tcardHTML(m,true)}${selected.includes(m.id)?`<span class="master-order">${selected.indexOf(m.id)+1}</span>`:""}</button>`).join("")}</div>
      <div class="rv-opts">
        <button class="btn rv-opt" id="rvRerip" ${run.rerolls&&!run.second?"":"disabled"}>Super Rod<small>New pack · ${run.rerolls} left</small></button>
        <button class="btn rv-opt${run.doubleArmed?" armed":""}" id="rvTake2" aria-pressed="${!!run.doubleArmed}" ${masterCanArm()?"":"disabled"}>${run.doubleArmed?"Master Ball ready":"Master Ball"}<small>Keep 2 cards · ${run.doubles} left</small></button>
      </div>
      ${run.doubleArmed?`<div class="master-confirm"><p${masterWarn?' class="master-warn"':''}>${masterTight()?"One spot left: one of your two cards has to evolve, train or add friendship to a teammate.":"Choose two cards, then place them one at a time."}</p><button class="btn primary" id="masterConfirm" ${selected.length===2&&(!masterTight()||selected.some(cardCanDevelop))?"":"disabled"}>Keep these 2 cards</button></div>`:`<p class="rv-hint">Tap a card to pick it</p>`}`;
    el.querySelectorAll(".rv-mini").forEach(b=>b.onclick=()=>{const id=+b.dataset.id;if(!run.doubleArmed){pick(id);return}if(takenNums().includes(BYID.get(id).num)&&!developmentOptions(BYID.get(id)).length)return;masterWarn=false;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<2){if(selected.length===1&&masterTight()&&!cardCanDevelop(id)&&!cardCanDevelop(selected[0])){masterWarn=true;spread();return}selected.push(id)}spread()});
    const confirm=el.querySelector('#masterConfirm');if(confirm)confirm.onclick=()=>{if(selected.length!==2)return;const ids=[...selected];closeReveal();document.dispatchEvent(new CustomEvent('pbc-master-picks',{detail:ids}))};
    // Not feeling this pack? Super Rod swaps it for a fresh one (and opens it). Master Ball keeps two cards from this one.
    el.querySelector("#rvRerip").onclick=()=>{if(!run.rerolls||run.second)return;run.rerolls--;run.selected=null;run.doubleArmed=false;run.spin=drawNext();run.justRipped=true;saveRun();closeReveal();render()};
    el.querySelector("#rvTake2").onclick=()=>{if(!run.doubles||run.second||(!run.doubleArmed&&!masterCanArm()))return;run.doubleArmed=!run.doubleArmed;selected=[];saveRun();renderBoard();spread()};
    el.querySelector("#rvList").onclick=returnToField;
  };
  let stage=null,stack=null,cards=[],gesture=null,suppressClick=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parked=d=>`translate3d(${Math.min(d,4)*5}px,${Math.min(d,4)*3}px,0) scale(${1-Math.min(d,4)*.012})`;
  const stopBurst=()=>{
    const glow=stage?.querySelector('.physical-reveal-glow');
    if(glow){glow.getAnimations().forEach(a=>a.cancel());delete glow.dataset.tier}
  };
  // Rare cards get one full twirl after reaching the front, before another
  // swipe can dismiss them. The stack itself keeps its normal dimensions.
  const twirlRare=card=>{
    if(reduced||card._twirlDone||!card.matches('.leg,.shiny'))return;
    card._twirlDone=true;busy=true;gesture=null;
    const previousOrigin=card.style.transformOrigin;
    card.style.transformOrigin='50% 50%';
    card.classList.add('physical-twirling');
    const motion=card.animate([
      {transform:'translate3d(0,0,0) rotateY(-360deg) scale(.94)'},
      {transform:'translate3d(0,0,0) rotateY(0deg) scale(1)'}
    ],{duration:780,easing:'cubic-bezier(.2,.55,.25,1)',fill:'both'});
    let complete=false,timer;
    const finish=()=>{
      if(complete)return;complete=true;clearTimeout(timer);
      motion.cancel();card.classList.remove('physical-twirling');card.style.transformOrigin=previousOrigin;
      if(revealEl!==el||!card.isConnected||!stack?.isConnected)return;
      busy=false;
      const queued=pendingAdvance;pendingAdvance=null;
      if(queued)advance(queued.step,queued.dir);
    };
    timer=setTimeout(finish,1000);
    motion.finished.then(finish).catch(finish);
  };
  const entrance=card=>{
    if(reduced||!card?.isConnected)return;
    const tier=card.classList.contains('leg')?'legend':card.classList.contains('shiny')?'shiny':card.classList.contains('gold')?'gold':null;
    card.classList.remove('physical-catchlight');
    if(!tier){stopBurst();return}
    const bounds=card.getBoundingClientRect(),host=stage.getBoundingClientRect();
    twirlRare(card);
    const flare=stage?.querySelector('.physical-reveal-glow');
    if(flare){
      flare.getAnimations().forEach(a=>a.cancel());
      flare.dataset.tier=tier;
      Object.assign(flare.style,{
        left:(bounds.left-host.left+bounds.width/2-stage.clientLeft)+'px',
        top:(bounds.top-host.top+bounds.height/2-stage.clientTop)+'px',
        width:bounds.width+'px',height:bounds.height+'px',
        borderRadius:getComputedStyle(card).borderRadius
      });
      const expand=px=>'scale('+((bounds.width+px*2)/bounds.width)+','+((bounds.height+px*2)/bounds.height)+')';
      flare.animate([
        {opacity:0,transform:expand(0)},
        {opacity:tier==='gold'?.95:1,transform:expand(tier==='gold'?5:10),offset:.14},
        {opacity:tier==='gold'?.5:.8,transform:expand(tier==='gold'?18:35),offset:.5},
        {opacity:0,transform:expand(tier==='gold'?40:70)}
      ],{duration:tier==='gold'?900:1300,easing:'cubic-bezier(.2,.6,.3,1)'});
    }
    requestAnimationFrame(()=>{if(card.isConnected)card.classList.add('physical-catchlight')});
  };
  const position=()=>{
    cards.forEach((card,n)=>{
      const depth=n-i;
      card.hidden=depth<0;card.style.zIndex=String(ms.length-n);
      card.style.transform=depth===0?'translate3d(0,0,0)':parked(depth);
      card.style.opacity=depth>=0?'1':'0';card.style.transition='none';
      card.classList.toggle('physical-front',depth===0);
      card.setAttribute('aria-hidden',depth===0?'false':'true');
    });
    el.querySelector('.rv-count').textContent=(i+1)+' / '+ms.length;
    el.querySelector('.rv-hint').textContent=i===ms.length-1?'Swipe or tap to see your pack':'Swipe either way or tap to continue';
  };
  const settle=()=>{if(!cards[i])return;const c=cards[i];c.style.transition=reduced?'none':'transform 240ms cubic-bezier(.22,.61,.36,1)';c.style.transform='translate3d(0,0,0)'};
  const advance=(step=1,dir=-1)=>{
    if(revealEl!==el||el.classList.contains('intro-running'))return;
    if(busy){pendingAdvance={step,dir};return}
    if(i+step<0){settle();return}
    busy=true;gesture=null;
    const old=cards[i],next=cards[i+step],animations=[];
    let finished=false,timer;
    const finish=()=>{
      if(finished)return;finished=true;clearTimeout(timer);
      if(revealEl!==el||!stack?.isConnected){animations.forEach(a=>a.cancel());return}
      i+=step;
      if(i>=ms.length){animations.forEach(a=>a.cancel());pendingAdvance=null;busy=false;spread();stage=null;return}
      position();animations.forEach(a=>a.cancel());busy=false;entrance(cards[i]);
      if(!busy){const queued=pendingAdvance;pendingAdvance=null;if(queued)advance(queued.step,queued.dir);}
    };
    if(reduced){finish();return}
    old.classList.remove('physical-catchlight');stopBurst();
    if(step>0){
      const start=getComputedStyle(old).transform;
      animations.push(old.animate([{transform:start,opacity:1},{transform:`translate3d(${dir*Math.max(old.offsetWidth*1.25,innerWidth*.7)}px,-12px,0) rotateY(${-dir*12}deg) rotate(${dir*5}deg)`,opacity:0}],{duration:next?420:300,easing:'cubic-bezier(.32,0,.3,1)',fill:'forwards'}));
      if(next){
        // Move every remaining layer together so the card edges do not snap
        // into their new positions when the front card finishes leaving.
        for(let n=i+1;n<cards.length;n++){
          const depth=n-i;
          animations.push(cards[n].animate(
            [{transform:parked(depth)},{transform:depth===1?'translate3d(0,0,0)':parked(depth-1)}],
            {duration:420,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}
          ));
        }
      }
    }else{
      next.hidden=false;next.style.opacity='1';
      animations.push(next.animate([{transform:'translate3d(-110%,0,0) rotate(-5deg)',opacity:0},{transform:'translate3d(0,0,0)',opacity:1}],{duration:420,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}));
      animations.push(old.animate([{transform:getComputedStyle(old).transform},{transform:parked(1)}],{duration:420,fill:'forwards'}));
    }
    animations[0].finished.then(finish).catch(finish);timer=setTimeout(finish,next?650:500);
  };
  const show=()=>{
    if(revealEl!==el)return;
    if(i>=ms.length){spread();return}
    el.innerHTML=`<div class="rv-top"><button class="btn rv-close" id="rvClose">Back to field</button><span class="rv-count"></span><button class="btn rv-btn" id="rvSkip">Show all cards</button></div>
    <button class="rv-stage physical-stage" id="rvStage" aria-label="Next card" data-autofocus><span class="physical-reveal-glow" aria-hidden="true"></span><span class="physical-stack">${ms.map(m=>tcardHTML(m)).join('')}</span></button><p class="rv-hint"></p>`;
    stage=el.querySelector('#rvStage');stack=stage.querySelector('.physical-stack');cards=[...stack.children];
    cards.forEach(card=>{
      card.style.animation='none';
      const shine=document.createElement('span');shine.className='physical-sheen';shine.setAttribute('aria-hidden','true');card.append(shine);
      const back=document.createElement('span');back.className='physical-twirl-back';back.setAttribute('aria-hidden','true');card.append(back);
      card._physicalEntrance=()=>entrance(card);
    });
    position();
    el.querySelector('#rvClose').onclick=returnToField;
    el.querySelector('#rvSkip').onclick=e=>{e.stopPropagation();pendingAdvance=null;busy=false;i=ms.length;spread();stage=null};
    stage.onclick=()=>{if(suppressClick){suppressClick=false;return}advance()};
    stage.addEventListener('pointerdown',e=>{
      if(e.button!==0||busy||el.classList.contains('intro-running'))return;
      gesture={x:e.clientX,y:e.clientY,dx:0,dragging:false};suppressClick=false;cards[i].style.transition='none';
    });
    stage.addEventListener('pointermove',e=>{
      if(!gesture)return;
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!gesture.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){gesture=null;return}
      if(!gesture.dragging&&Math.abs(dx)>8){gesture.dragging=true;stage.setPointerCapture(e.pointerId)}
      if(!gesture.dragging)return;e.preventDefault();gesture.dx=dx;
      cards[i].style.transform=`translate3d(${dx}px,${-Math.min(8,Math.abs(dx)*.025)}px,0) rotate(${dx/65}deg) rotateY(${-dx/35}deg)`;
    },{passive:false});
    stage.addEventListener('pointerup',()=>{
      if(!gesture)return;const {dx,dragging}=gesture;gesture=null;if(!dragging)return;
      suppressClick=true;if(Math.abs(dx)>=Math.min(70,cards[i].offsetWidth*.2))advance(1,dx<0?-1:1);else settle();
    });
    stage.addEventListener('pointercancel',()=>{gesture=null;suppressClick=true;settle()});
    requestAnimationFrame(()=>{if(!el.classList.contains('intro-running'))entrance(cards[i])});
  };
  if(chooseAll)i=ms.length;show();
}
// Packs pool screen: the pack stays as a swipeable row of full cards, and placing uses a mini diamond
// that shows the picked card's rating at every open spot. The game's own click handlers do the rest:
// cards keep class "cand" + data-id, and spots keep data-slot.
const DIAMOND={C:[50,93],"1B":[83,58],"2B":[65,33],SS:[35,33],"3B":[17,58],LF:[13,14],CF:[50,3],RF:[87,14],SP:[50,61]};
function packPoolUI(){
  const d=document.getElementById("draft"),cands=document.getElementById("cands"),place=document.getElementById("place");
  if(!cands||!place)return;
  d.classList.add("packpool");
  const taken=takenNums(),ms=run.spin.ids.map(id=>BYID.get(id)).filter(Boolean);ms.forEach(setOverall);
  ms.sort((a,b)=>(taken.includes(a.num)?1:0)-(taken.includes(b.num)?1:0)||b.ovr-a.ovr);
  cands.className="cands cardrow";
  const ctl=d.querySelector(".packctl");if(ctl){const hint=ctl.nextElementSibling;cands.parentNode.insertBefore(ctl,cands);if(hint&&hint.classList.contains("hint"))ctl.after(hint)}
  cands.innerHTML=ms.map(m=>{const on=run.spin.usedIds?.includes(m.id)||(taken.includes(m.num)&&!developmentOptions(m).length);return `<button class="cand pcard" data-id="${m.id}" aria-pressed="${run.selected===m.id}" ${on?"disabled":""} aria-label="${esc(m.name)}">${tcardHTML(m)}${on?'<span class="pc-flag">On team</span>':run.selected===m.id?'<span class="pc-flag sel">Picked</span>':""}</button>`}).join("");
  const sel=run.selected&&BYID.get(run.selected);
  place.innerHTML=sel?positionPickerHTML(sel):`<p class="hint" style="margin:6px 0 0;text-align:center">Swipe the cards, tap one to pick it.</p>`;
}
// Shared by both draft modes so ratings and availability always agree.
function positionPickerHTML(sel){
  // Placing: every open spot on a diamond with this card's rating there, best spot glowing.

  if(!sel)return `<p class="hint">Tap a Pokémon to choose its position.</p>`;
  const role=s=>s.startsWith("SP")?"SP":s.startsWith("RP")?"RP":s;
  const open=slotList().filter(s=>!run.slots[s]).filter((s,i,a)=>a.findIndex(x=>role(x)===role(s))===i);
  const best=open.reduce((a,s)=>posOvr(sel,s)>posOvr(sel,a)?s:a,open[0]);
  const chip=(s,xy)=>{const v=posOvr(sel,s),r=role(s);return `<button class="dchip ${ovCls(v)}${s===best?" best":""}" data-slot="${s}" ${xy?`style="left:${xy[0]}%;top:${xy[1]}%"`:""}><i>${r==="RP"?"RP":r}</i><b>${v}</b>${s===best?"<em>Best</em>":""}</button>`};
  const filled=s=>{const xy=DIAMOND[s];return xy?`<span class="dchip done" style="left:${xy[0]}%;top:${xy[1]}%"><i>${s}</i><b>✓</b></span>`:""};
  const onField=FIELD_SLOTS.filter(s=>s!=="DH");
  const fieldChips=onField.map(s=>open.includes(s)?chip(s,DIAMOND[s]):filled(s)).join("")+(open.find(s=>role(s)==="SP")?chip(open.find(s=>role(s)==="SP"),DIAMOND.SP):"");
  const extra=["DH",open.find(s=>role(s)==="RP")].filter(s=>s&&open.includes(s)).map(s=>chip(s)).join("");
  return `<div class="dpick"><div class="label">Where should ${esc(sel.name)} play?</div>
    ${best?`<p class="best-available">Best available: <b>${lbl(best)} · ${posOvr(sel,best)}</b></p>`:""}<div class="diamond"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 94 L1 45 A49.5 49.5 0 0 1 99 45 Z" fill="rgba(79,154,58,.22)" stroke="rgba(95,211,141,.35)" stroke-width=".8"/><path d="M50 92 L83 59 L50 26 L17 59 Z" fill="rgba(194,120,74,.4)" stroke="rgba(244,238,220,.45)" stroke-width=".8"/></svg>${fieldChips}</div>
    ${extra?`<div class="dextra">${extra}</div>`:""}</div>`;
}
// Hook into the game's render: a freshly ripped pack opens the reveal right after the pool is drawn,
// and any Packs pool screen gets the card row and diamond picker.
{const baseRender=render;let lastSel=null;render=function(){
  const ripped=run&&run.justRipped&&run.spin&&run.spin.pack&&!run.unrevealed;
  const row=document.querySelector(".cardrow"),sl=row?row.scrollLeft:0;
  baseRender();
  const d=document.getElementById("draft");if(d)d.classList.remove("packpool");
  if(run&&run.spin&&run.spin.pack&&!run.unrevealed&&!run.locked){packPoolUI();const r2=document.querySelector(".cardrow");if(r2&&!ripped)r2.scrollLeft=sl;
    if(run.selected&&run.selected!==lastSel){const pl=document.querySelector(".dpick");if(pl)pl.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"})}}
  lastSel=run&&run.selected;
  if(ripped)openReveal(run.spin)}}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&revealEl)returnToField()});
