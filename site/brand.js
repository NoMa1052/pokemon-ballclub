// Brand layer: presentation only. It wraps the game's render, place, openLb and closeReveal
// and decorates what they draw. No game rules live here.
{
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const $=id=>document.getElementById(id);
const tilesHTML=v=>`<span class="tiles">${String(v).split("").map(c=>`<b>${c}</b>`).join("")}</span>`;
const short=s=>s==="RP1"?"CL":s==="RP2"?"SU":s;

// ---- header and settings markup ----
$("howBtn").textContent="?";$("howBtn").setAttribute("aria-label","How to play");$("howBtn").title="How to play";
document.querySelector(".top").insertAdjacentHTML("afterend",'<div class="stitchline brand-stitch" aria-hidden="true"></div>');
document.querySelector('#modeSeg [data-v=practice]').innerHTML='<span class="sg-ic ball" aria-hidden="true"></span><span class="sg-t">Spin<small>Type + region</small></span>';
document.querySelector('#modeSeg [data-v=pack]').innerHTML='<span class="sg-ic pk" aria-hidden="true"></span><span class="sg-t">Packs<small>5 random cards</small></span><span class="beta">Beta</span>';
document.querySelector('#sizeSeg [data-v="16"]').innerHTML='<b>16</b><small>Picks</small>';
document.querySelector('#sizeSeg [data-v="11"]').innerHTML='<b>11</b><small>Easy</small>';
$("lbBtn").innerHTML='<span class="pen-ic" aria-hidden="true"></span>Leaderboard';

// ---- scoreboard label and the hero's scoreboard plate ----
{const base=renderBoard;renderBoard=function(){base();document.querySelectorAll("#board .bd-lab").forEach(l=>{if(l.textContent==="Team grade")l.textContent="Grade"})}}
function decorateHero(){
  const lab=$("spinLabel");
  if(lab&&!spinning){const n=run.picks.length+1;lab.innerHTML=`<span class="sb-lab">Pick</span>${tilesHTML(String(n).padStart(2,"0"))}`;
    const sm=lab.nextElementSibling;if(sm&&sm.tagName==="SMALL")sm.textContent=`of ${run.size}`}
  const pk=$("spinBtn");
  if(pk&&pk.classList.contains("pack")&&!pk.querySelector(".pk-pips")){
    const sub=pk.querySelector(".pk-sub");if(sub)sub.innerHTML="<b>5</b>cards";
    pk.insertAdjacentHTML("beforeend",'<span class="pk-pips" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>')}
}
function decoratePen(){
  const list=slotList(),rot=list.filter(s=>s.startsWith("SP")),bp=list.filter(s=>s.startsWith("RP"));
  const cnt=a=>`${a.filter(s=>run.slots[s]).length}/${a.length}`;
  const rh=document.querySelector(".pengrp.rot .penhead"),bh=document.querySelector(".pengrp.bull .penhead");
  if(rh)rh.innerHTML=`<b>Rotation</b><span class="cnt">${cnt(rot)}</span>`;
  if(bh)bh.innerHTML=`<b>Bullpen</b><span class="cnt">${cnt(bp)}</span>`;
  // In an 11-pick run SP1 is the whole rotation and pitches from the mound, so the card shows only the pen.
}
function decorateDraftDone(){
  // "Play your season" opens the draft card first; the card's own button starts the season.
  const pb=$("playBtn");if(!pb||pb._play)return;
  pb._play=pb.onclick;pb.onclick=()=>openDC();
}

// ---- render hook ----
let landNext=false;
{const base=render;render=function(){
  base();
  decorateHero();decoratePen();decorateDraftDone();
  if(landNext){landNext=false;const c=document.querySelector('.cardrow .pcard[aria-pressed="true"]'),row=document.querySelector(".cardrow");
    if(c&&row){row.scrollLeft=c.offsetLeft-(row.clientWidth-c.offsetWidth)/2;c.classList.add("landed")}}
}}

// ---- pack reveal: fade out instead of vanishing, and the chosen card leads the way ----
closeReveal=function(){
  if(!revealEl){unlockRevealScroll();return}const el=revealEl;revealEl=null;unlockRevealScroll();
  if(reduce())el.remove();else{el.classList.add("leaving");setTimeout(()=>el.remove(),260)}
};
document.addEventListener("click",e=>{const b=e.target.closest(".reveal .rv-mini");if(!b||run.doubleArmed)return;
  b.classList.add("chosen");b.parentElement.querySelectorAll(".rv-mini").forEach(x=>{if(x!==b)x.classList.add("passed")});landNext=true},true);

// ---- drafting: a signing stamp, a burst on the field, and the team card at the end ----
let signTimer=null;
function signed(m,slot){
  document.querySelectorAll(".signed").forEach(x=>x.remove());clearTimeout(signTimer);
  const v=posOvr(m,slot),el=document.createElement("div");el.className="signed";el.setAttribute("role","status");
  el.innerHTML=`<span class="stamp">Signed</span><span class="who"><b>${esc(m.name)}</b><small>${esc(SLOT_NAME[slot]||slot)}</small></span><span class="ovv ${ovCls(v)}">${v}</span>`;
  document.body.appendChild(el);signTimer=setTimeout(()=>el.remove(),1750);
}
{const base=place;place=function(slot){
  const id=run.selected,before=run.picks.length;base(slot);
  if(run.picks.length<=before)return;
  const m=BYID.get(id),s=slotList().find(x=>run.slots[x]&&run.slots[x].id===id)||slot;signed(m,s);
  if(run.picks.length===run.size)setTimeout(openDC,reduce()?0:1100);
}}
// Save the draft card as a PNG: share sheet on phones (Save Image), a download elsewhere.
async function saveDC(root){
  const btn=root.querySelector("#dcSave"),shot=root.querySelector(".dc-shot");if(!btn||!shot||btn.disabled)return;
  const label=t=>{btn.textContent=t};btn.disabled=true;label("Saving…");
  try{
    if(!window.html2canvas)await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";s.onload=ok;s.onerror=no;document.head.append(s)});
    root.classList.add("dc-capturing");
    const canvas=await html2canvas(shot,{backgroundColor:"#0b1b33",scale:Math.min(3,Math.max(2,devicePixelRatio||2)),useCORS:true,logging:false,ignoreElements:e=>e.id==="dcSave",onclone:doc=>doc.querySelector(".dc")?.classList.add("dc-capturing")});
    root.classList.remove("dc-capturing");
    // Frame the card with a navy margin so nothing touches the image edge.
    const pad=Math.round(canvas.width*.05),framed=document.createElement("canvas");framed.width=canvas.width+pad*2;framed.height=canvas.height+pad*2;
    const fx=framed.getContext("2d");fx.fillStyle="#0b1b33";fx.fillRect(0,0,framed.width,framed.height);fx.drawImage(canvas,pad,pad);
    const blob=await new Promise(r=>framed.toBlob(r,"image/png"));const name="ballclub-draft-card.png";
    const file=new File([blob],name,{type:"image/png"});
    if(navigator.canShare?.({files:[file]})&&matchMedia("(pointer:coarse)").matches){try{await navigator.share({files:[file],title:"My Ballclub draft"})}catch(e){if(e.name!=="AbortError")throw e}}
    else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
    label("Saved");
  }catch(_){root.classList.remove("dc-capturing");label("Couldn't save")}
  setTimeout(()=>{btn.disabled=false;label("Save image")},2200);
}
function openDC(){
  if(document.querySelector(".dc")||!run||run.locked||run.result||run.picks.length<run.size)return;
  const list=slotList(),field=list.filter(s=>FIELD_SLOTS.includes(s)),staff=list.filter(s=>!FIELD_SLOTS.includes(s));
  const img=m=>`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" crossorigin="anonymous">`;
  let i=0;const row=s=>{const m=run.slots[s];if(!m)return"";const v=posOvr(m,s);return `<div class="dc-row" style="--i:${i++}"><i>${short(s)}</i>${img(m)}<span>${esc(m.name)}</span><em class="${ovCls(v)}">${v}</em></div>`};
  const best=ss=>ss.filter(s=>run.slots[s]).reduce((a,s)=>!a||posOvr(run.slots[s],s)>posOvr(run.slots[a],a)?s:a,null);
  const bat=best(field),ace=best(staff.filter(s=>s.startsWith("SP"))),rare=list.find(s=>run.slots[s]&&(run.slots[s].leg||run.slots[s].shiny));
  const third=rare&&rare!==bat&&rare!==ace?["Rare pull",rare]:["Closer",staff.find(s=>s==="RP1")];
  const stars=[["Star bat",bat],["Ace",ace],third].filter(x=>x[1]&&run.slots[x[1]]);
  const g=teamOvr();
  const el=document.createElement("div");el.className="dc";el.setAttribute("role","dialog");el.setAttribute("aria-label","Draft complete");
  el.innerHTML=`<div class="dc-in">
    <div class="dc-shot">
    <div class="dc-kick"><span>${run.size} picks in${isPack()?" · Packs":""}</span><button type="button" class="dc-save" id="dcSave">Save image</button></div>
    <div class="dc-title">Draft complete</div>
    <div class="dc-card">
      <div class="dc-band"><b>Your Ballclub</b><span class="dc-grade"><small>Grade</small>${tilesHTML(g??"--")}</span></div>
      <div class="stitchline" aria-hidden="true"></div>
      <div class="dc-cols"><div class="dc-col"><h4>Lineup</h4>${field.map(row).join("")}</div><div class="dc-col"><h4>Pitching</h4>${staff.map(row).join("")}</div></div>
    </div>
    <div class="dc-stars">${stars.map(([t,s],k)=>{const m=run.slots[s];return `<div class="dc-star" style="--i:${k}"><small>${t}</small>${img(m)}<b>${esc(m.name)}</b><em>${posOvr(m,s)}</em></div>`}).join("")}</div>
    <div class="dc-mark">pokemon-ballclub.vercel.app</div>
    </div>
    <div class="dc-acts"><button class="btn primary" id="dcPlay">Lock in and play 162</button><button class="btn quiet" id="dcBack">Tweak the lineup first</button></div>
  </div>`;
  document.body.appendChild(el);document.body.classList.add("dc-open");
  const close=()=>{el.remove();document.body.classList.remove("dc-open")};
  $("dcBack").onclick=close;
  $("dcPlay").onclick=()=>{close();const pb=$("playBtn");if(pb?._play)pb._play();else if(pb)pb.click()};
  $("dcSave").onclick=()=>saveDC(el);
  $("dcPlay").focus({preventScroll:true});
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const d=document.querySelector(".dc");if(d){d.remove();document.body.classList.remove("dc-open")}}});

// ---- leaderboard as a standings page ----
{const base=openLb;openLb=async function(size,m){
  await base(size,m);
  const body=$("lbBody"),ol=body.querySelector(".lblist");if(!ol||ol.closest(".stand"))return;
  const lis=[...ol.children],top=lis.length?parseInt(lis[0].querySelector(".rec").textContent):0;
  lis.forEach(li=>{const r=li.querySelector(".rec"),[w,l]=r.textContent.split("–");const gb=top-(+w);
    r.outerHTML=`<span class="w">${w}</span><span class="l">${l}</span><span class="gb">${gb?gb:"–"}</span>`});
  const wrap=document.createElement("div");wrap.className="stand";
  wrap.innerHTML=`<div class="stand-top"><b>${lbMode==="pack"?"Packs":"Spin"}</b><span>${lbSize===11?"11 picks · Easy":"16 picks"}</span></div><div class="stitchline" aria-hidden="true"></div><div class="stand-head"><span></span><span>Team</span><span>W</span><span>L</span><span>GB</span><span>Grd</span></div>`;
  ol.before(wrap);wrap.appendChild(ol);
}}

// ---- sheets: while How to play or the Leaderboard is open, the page behind stays put ----
{let y=0,locked=false;const b=document.body;
  document.querySelectorAll(".sheet-body").forEach(el=>el.style.overscrollBehavior="contain");
  const sync=()=>{const open=!$("how").hidden||!$("lb").hidden;if(open===locked)return;locked=open;
    if(open){y=scrollY;Object.assign(b.style,{position:"fixed",top:-y+"px",left:"0",right:"0"})}
    else{Object.assign(b.style,{position:"",top:"",left:"",right:""});scrollTo({top:y,behavior:"instant"})}};
  ["how","lb"].forEach(id=>new MutationObserver(sync).observe($(id),{attributes:true,attributeFilter:["hidden"]}));sync()}

render();
}
