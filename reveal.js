// Pack reveal: after a pack is ripped, its Pokémon pop up one at a time as trading cards.
// Tap through them in shuffled pack order, then pick one from the spread. "Full stats" drops to the regular list.
const ART_URL=(n,shiny)=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny?"shiny/":""}${n}.png`;
function tcardHTML(m,mini){
  setOverall(m);
  const c1=TYPE_COLORS[m.types[0]]||"#777",c2=TYPE_COLORS[m.types[1]]||c1;
  const tier=m.leg?"leg":m.shiny?"shiny":m.ovr>=90?"gold":m.ovr>=80?"silver":"base";
  const img=`<img src="${ART_URL(m.num,m.shiny)}" alt="" decoding="async" onerror="this.onerror=null;this.src='${SPRITE_URL(m.num,m.shiny)}';this.classList.add('px')">`;
  const tag=m.leg?'<span class="tc-tag">Legend</span>':m.shiny?'<span class="tc-tag">Shiny</span>':"";
  const best=`<span class="tc-best ${ovCls(m.ovr)}"><b>${m.ovr}</b><small>${m.hspot}</small></span>`;
  if(mini)return `<div class="tcard mini ${tier}" style="--c1:${c1};--c2:${c2}"><div class="tc-in"><b class="tc-name">${esc(m.name)}</b><div class="tc-art">${img}</div>${best}${tag}</div></div>`;
  const bars=KEY.map(([k,f,,g])=>{const v=m.r[f];return `<div class="tc-bar"><i style="color:var(--${g})">${k}</i><span><b style="width:${Math.max(4,(v-40)/59*100)}%;background:var(--${g})"></b></span><em>${v}</em></div>`}).join("");
  return `<div class="tcard ${tier}" style="--c1:${c1};--c2:${c2}"><div class="tc-in">
    <div class="tc-top"><b class="tc-name">${esc(m.name)}</b>${best}</div>
    ${tag}<div class="tc-art">${img}</div>
    <div class="tc-meta">#${dex(m.num)} · ${m.types.map(cap).join("/")} · ${m.body} · ${ftin(m.ht)}, ${lbs(m.wt)} lb</div>
    <div class="tc-boxes"><span><b class="${ovCls(m.off)}">${m.off}</b><i>OFF</i></span><span><b class="${ovCls(m.def)}">${m.def}</b><i>DEF ${m.dspot}</i></span><span><b class="${ovCls(m.pit)}">${m.pit}</b><i>${m.pspot}</i></span></div>
    <div class="tc-bars">${bars}</div></div></div>`;
}
let revealEl=null,revealScroll=null;
function unlockRevealScroll(){
  document.body.classList.remove('rv-open');document.documentElement.classList.remove('rv-root');document.body.style.removeProperty('--reveal-scroll');
  if(revealScroll!==null){const y=revealScroll;revealScroll=null;window.scrollTo(0,y)}
}
function closeReveal(){if(revealEl){revealEl.remove();revealEl=null}unlockRevealScroll()}


function openReveal(sp,chooseAll=false){
  closeReveal();
  const taken=takenNums();
  // Preserve the randomized draw order. Any reveal can be the exciting one.
  const ms=sp.ids.map(id=>BYID.get(id)).filter(m=>m&&!sp.usedIds?.includes(m.id));
  ms.forEach(setOverall);
  if(!ms.length)return;
  const el=revealEl=document.createElement("div");el.className="reveal";el.setAttribute("role","dialog");el.setAttribute("aria-label","Pack opening");
  revealScroll=window.scrollY;document.body.style.setProperty('--reveal-scroll',-revealScroll+'px');document.documentElement.classList.add('rv-root');document.body.classList.add('rv-open');document.body.appendChild(el);
  let i=0,busy=false,selected=[];
  const pick=id=>{closeReveal();run.selected=id;render();const pl=document.getElementById("place");if(pl)pl.scrollIntoView({behavior:"smooth",block:"center"})};
  const spread=()=>{
    el.innerHTML=`<div class="rv-top"><span class="rv-count">${run.doubleArmed?`Choose 2 cards · ${selected.length}/2`:"Your pack"}</span><button class="btn rv-btn" id="rvList">Back to field</button></div>
      <div class="rv-grid">${ms.map(m=>`<button class="rv-mini${selected.includes(m.id)?' master-selected':''}" data-id="${m.id}" aria-pressed="${selected.includes(m.id)}" aria-label="${run.doubleArmed?'Select':'Pick'} ${esc(m.name)}">${tcardHTML(m,true)}${selected.includes(m.id)?`<span class="master-order">${selected.indexOf(m.id)+1}</span>`:""}</button>`).join("")}</div>
      <div class="rv-opts">
        <button class="btn rv-opt" id="rvRerip" ${run.rerolls&&!run.second?"":"disabled"}>Re-rip<small>${run.rerolls} left</small></button>
        <button class="btn rv-opt${run.doubleArmed?" armed":""}" id="rvTake2" aria-pressed="${!!run.doubleArmed}" ${run.doubles&&!run.second&&run.picks.length<run.size-1?"":"disabled"}>${run.doubleArmed?"Master Ball ready":"Master Ball"}<small>${run.doubles} left</small></button>
      </div>
      ${run.doubleArmed?`<div class="master-confirm"><p>Choose two cards, then place them one at a time.</p><button class="btn primary" id="masterConfirm" ${selected.length===2?"":"disabled"}>Keep these 2 cards</button></div>`:`<p class="rv-hint">Tap a card to pick it</p>`}`;
    el.querySelectorAll(".rv-mini").forEach(b=>b.onclick=()=>{const id=+b.dataset.id;if(!run.doubleArmed){pick(id);return}if(takenNums().includes(BYID.get(id).num)&&!developmentOptions(BYID.get(id)).length)return;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<2)selected.push(id);spread()});
    const confirm=el.querySelector('#masterConfirm');if(confirm)confirm.onclick=()=>{if(selected.length!==2)return;const ids=[...selected];closeReveal();document.dispatchEvent(new CustomEvent('pbc-master-picks',{detail:ids}))};
    // Not feeling this pack? Re-rip swaps it for a fresh one (and opens it). Master Ball keeps two cards from this one.
    el.querySelector("#rvRerip").onclick=()=>{if(!run.rerolls||run.second)return;run.rerolls--;run.selected=null;run.doubleArmed=false;run.spin=drawNext();run.justRipped=true;saveRun();closeReveal();render()};
    el.querySelector("#rvTake2").onclick=()=>{if(!run.doubles||run.second)return;run.doubleArmed=!run.doubleArmed;selected=[];saveRun();renderBoard();spread()};
    el.querySelector("#rvList").onclick=()=>{if(run.doubleArmed){run.doubleArmed=false;saveRun();render()}closeReveal()};
  };
  const show=(entryDirection=0)=>{
    if(revealEl!==el)return;
    if(i>=ms.length){spread();return}
    const last=i===ms.length-1;
    el.innerHTML=`<div class="rv-top"><button class="btn rv-close" id="rvClose">Back to field</button><span class="rv-count">${i+1} / ${ms.length}</span><button class="btn rv-btn" id="rvSkip">Show all cards</button></div>
      <button class="rv-stage" id="rvStage" aria-label="Next card" data-autofocus>${tcardHTML(ms[i])}</button>
      <p class="rv-hint">${last?"Swipe or tap to see your pack":"Swipe left or tap to continue"}</p>`;
    el.querySelector("#rvClose").onclick=closeReveal;
    el.querySelector("#rvSkip").onclick=e=>{e.stopPropagation();i=ms.length;show()};
    const stage=el.querySelector('#rvStage'),card=stage.querySelector('.tcard');let gesture=null,suppressClick=false;
    // The old cardpop animation filled forwards and masked inline swipe transforms.
    // Own the transform here for every card, including tap and keyboard advances.
    card.style.animation='none';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(entryDirection&&!reduced){
      busy=true;
      const arrival=card.animate([
        {transform:`translate3d(${-entryDirection*70}px,0,0) rotate(${-entryDirection*3}deg)`,opacity:.3},
        {transform:'translate3d(0,0,0) rotate(0deg)',opacity:1}
      ],{duration:230,easing:'cubic-bezier(.16,1,.3,1)'});
      arrival.finished.then(()=>{busy=false}).catch(()=>{busy=false});
    }
    const advance=(step=1,dir=-1)=>{
      if(busy||el.classList.contains('intro-running'))return;
      if(i+step<0){card.style.transition='transform 160ms ease,opacity 160ms ease';card.style.transform='';card.style.opacity='';return}
      busy=true;
      const next=()=>{if(revealEl!==el||!card.isConnected)return;busy=false;i+=step;show(dir)};
      if(reduced){next();return}
      const current=getComputedStyle(card);
      const departure=card.animate([
        {transform:current.transform,opacity:current.opacity},
        {transform:`translate3d(${dir*Math.max(card.clientWidth*1.4,innerWidth*.75)}px,0,0) rotate(${dir*12}deg)`,opacity:0}
      ],{duration:250,easing:'cubic-bezier(.3,0,.7,.4)',fill:'forwards'});
      departure.finished.then(next).catch(()=>{busy=false});
    };
    stage.onclick=()=>{if(suppressClick){suppressClick=false;return}advance()};
    stage.addEventListener('pointerdown',e=>{if(e.button!==0||busy||el.classList.contains('intro-running'))return;gesture={x:e.clientX,y:e.clientY,dx:0,dragging:false};suppressClick=false;card.style.transition='none'});
    stage.addEventListener('pointermove',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(!gesture.dragging&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){gesture=null;return}if(!gesture.dragging&&Math.abs(dx)>10){gesture.dragging=true;stage.setPointerCapture(e.pointerId)}if(!gesture.dragging)return;e.preventDefault();gesture.dx=dx;card.style.transform=`translateX(${dx}px) rotate(${dx/35}deg)`;card.style.opacity=String(Math.max(.35,1-Math.abs(dx)/650))},{passive:false});
    stage.addEventListener('pointerup',()=>{if(!gesture)return;const {dx,dragging}=gesture;gesture=null;if(!dragging)return;suppressClick=true;if(Math.abs(dx)>=Math.min(75,card.clientWidth*.22))advance(dx<0?1:-1,dx<0?-1:1);else{card.style.transition='transform 160ms ease,opacity 160ms ease';card.style.transform='';card.style.opacity=''}});
    stage.addEventListener('pointercancel',()=>{gesture=null;suppressClick=true;card.style.transition='transform 160ms ease,opacity 160ms ease';card.style.transform='';card.style.opacity=''});
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
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeReveal()});
