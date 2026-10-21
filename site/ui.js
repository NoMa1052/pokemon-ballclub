// ---------- state ----------
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
let mode="practice",run=null,spinning=false,sortBy="ovr";
// 16 picks is the standard game; 11 is Easy.
const prefSize=()=>store.get("pbc2-size")==="11"?11:16;
// Two ways to play: Spin (one type from one region per pick) and Packs (rip 5 random Pokémon per pick).
const isPack=()=>mode==="pack";
const runKey=(m,size)=>m==="daily"?"pbc2-daily-"+today()+(size===16?"-16":""):m==="pack"?"pbc2-pack-"+size:"pbc2-practice-"+size;
// Each device gets its own daily spins: one run per day, different for every player.
function deviceId(){let id=store.get("pbc2-id");if(!id){id=String((Math.random()*2**32)>>>0);store.set("pbc2-id",id)}return id}
function saveRun(){store.set(runKey(run.mode,run.size),JSON.stringify({...run,slots:Object.fromEntries(Object.entries(run.slots).map(([k,m])=>[k,m.id])),result:run.result||null}))}
function loadRun(m){
  try{const o=JSON.parse(store.get(runKey(m,prefSize()))||"null");if(!o)return null;
    if(o.locked&&(!o.result?.me?.order||!o.result?.post)){if(Number.isFinite(o.result?.wins))o.previousWins=o.result.wins;o.result=null;o.locked=false;}
    if(!o.used||(o.size!==11&&o.size!==16))return null;if(o.doubles==null)o.doubles=1;if(o.releases==null)o.releases=1;if(o.candies==null)o.candies=1;o.moving=null;o.selected=o.hand?.held||null;o.unrevealed=!!o.unrevealed;o.justRipped=false;o.showStats=true;if(!o.keeps)o.keeps={type:1,gen:1};o.slots=Object.fromEntries(Object.entries(o.slots).map(([k,id])=>[k,BYID.get(id)]));return o}catch(e){return null}
}
function freshRun(m){
  const size=prefSize();
  const show=true;
  const seed=m==="daily"?hash("pbc-daily-"+today()+"-"+size+"-"+deviceId()):(Math.random()*2**32)>>>0;
  return {...makeRun(m,size,show,seed),keeps:{type:1,gen:1},doubles:1,releases:1,candies:1};
}
// Keep type and keep region: once each per run.
function canLock(run,keep){
  const sp=run.spin;if(!sp||sp.legend||!run.keeps[keep])return false;
  return POOLS.some(p=>!run.used.includes(p.key)&&(keep==="type"?p.type===sp.type&&p.gen!==sp.gen:p.gen===sp.gen&&p.type!==sp.type));
}
function setMode(m){spinning=false;mode=m==="pack"?"pack":"practice";store.set("pbc2-mode",mode);run=loadRun(mode)||freshRun(mode);render();if(run.locked&&run.result)finish(false)}
const takenNums=()=>Object.values(run.slots).filter(Boolean).map(m=>m.num);
const drawNext=()=>isPack()?packSpin(run,takenNums()):nextSpin(run);
const slotList=()=>run.size===16?FULL:STD;
const started=()=>run.picks.length>0||run.spin;

// ---------- render ----------
const LBL={RP1:"CL",RP2:"SU"};
const lbl=s=>LBL[s]||s;
POS_XY.SP1=[50,70];
// Spot ratings: the runs a Pokémon is worth at one specific spot, shown on the 40-99 scale.
// Because they come from runs, an 85 at shortstop is worth the same as an 85 at first base.
// Relievers are the one exception: one rating for both CL and SU, and the closer slot counts a bit more.
const posOvr=(m,s)=>slotRating(m,s);
// Three overalls on every card, each judged only on its own job:
// OFF is the bat alone (its rating as a DH), DEF is the glove at its best position, PIT is its best pitching role.
// A DH's glove never counts against it and a hitter's arm never counts, so each number stands on its own.
const FIELD_ONLY=FIELD_SLOTS.filter(s=>s!=="DH");
// The headline box is the best rating anywhere, with its spot, so a card shows how good a Pokémon really is
// before you tap it. DEF is the glove at the best fielding spot, so headline = OFF bat + DEF glove for fielders.
function setOverall(m){
  const ds=FIELD_ONLY.reduce((a,s)=>slotRuns(m,s)>slotRuns(m,a)?s:a),ps=naturalSpot(m,["SP1","RP1"]);
  const hs=STD.reduce((a,s)=>posOvr(m,s)>posOvr(m,a)||(posOvr(m,s)===posOvr(m,a)&&s===ds)?s:a);m.hspot=lbl(hs==="SP1"?"SP":hs==="RP1"?"RP":hs);
  m.off=posOvr(m,"DH");m.def=GLOVE((m.pd[ds]-50)/10);m.dspot=ds;
  m.pit=posOvr(m,ps);m.pspot=ps==="SP1"?"SP":"RP";
  m.ovr=Math.max(...STD.map(s=>posOvr(m,s)))}
const ovCls=v=>v>=85?"hi":v>=70?"md":v<55?"lo":"";
function teamOvr(){return rosterRating(run.slots,slotList())}
document.head.insertAdjacentHTML("beforeend",`<style>
.tok .pr{position:absolute;bottom:-7px;right:-12px;font-family:var(--f-data);font-weight:700;font-size:12px;line-height:16px;padding:0 5px;border-radius:999px;background:var(--card);color:var(--ink);border:1.5px solid var(--line);font-variant-numeric:tabular-nums}
.tok .pr.hi{background:#e2b324;color:#14233a;border-color:#e2b324}.tok .pr.md{border-color:var(--good);color:var(--good)}.tok .pr.lo{border-color:var(--bad);color:var(--bad)}
.tag .nm.pv{font-family:var(--f-data);font-weight:700;font-size:13px}
.slotchip{grid-template-columns:auto 1fr;align-items:center;column-gap:6px}
.slotchip small{grid-column:1/-1}
.slotchip em{font-style:normal;justify-self:end;font-family:var(--f-data);font-weight:700;font-size:17px;font-variant-numeric:tabular-nums}
.slotchip em.hi{color:#b8860b}.slotchip em.md{color:var(--good)}.slotchip em.lo{color:var(--bad)}
.teamovr{font-family:var(--f-data);font-weight:600;font-size:13px;color:var(--muted);text-align:right}
.teamovr b{display:block;font-size:24px;color:var(--ink);line-height:1}
.cand.withovr{grid-template-columns:44px minmax(0,1fr)}
.cand.withovr .ovr2{grid-column:1/-1;grid-row:3;margin-top:8px}
.cand.withovr .bars6{grid-row:4}.cand.withovr .why{grid-row:5}
.ovr2.four{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.ovr2.four .ovr b{font-size:26px}
.ovr2.four .ovr i{font-size:11px;white-space:nowrap}
.ovr2.four .ovr.head{box-shadow:inset 0 0 0 2px var(--gold),inset 0 2px 3px rgba(0,0,0,.6)}
</style>`);
function tagHTML(slot){
  const m=run.slots[slot];
  const who=run.selected?BYID.get(run.selected):run.moving?run.slots[run.moving]:null;
  if(!m){
    if(!who)return `<span class="tok"><span class="pos">${lbl(slot)}</span></span>`;
    const lab=run.showStats?`<span class="nm pv">${posOvr(who,slot)}</span>`:`<span class="nm">${run.selected?"Place":"Move here"}</span>`;
    return `<span class="tok"><span class="pos">${lbl(slot)}</span></span>${lab}`;
  }
  const pr=run.showStats?`<span class="pr ${ovCls(posOvr(m,slot))}">${posOvr(m,slot)}</span>`:"";
  return `${tok(m,`<span class="pos">${lbl(slot)}</span>${pr}`)}<span class="nm">${run.moving===slot?"Moving…":esc(m.name)}</span>`;
}
function tapSlot(s){
  if(run.result)return;
  if(run.selected){if(!run.slots[s])place(s);return}
  if(run.moving){
    run.just=null;
    if(run.moving!==s){const a=run.slots[run.moving],b=run.slots[s];run.slots[s]=a;if(b)run.slots[run.moving]=b;else delete run.slots[run.moving]}
    run.moving=null;sortStaff();saveRun();render();return;
  }
  if(run.slots[s]){run.moving=s;render()}
}
function renderField(){
  const field=document.getElementById("field");field.querySelectorAll(".tag").forEach(e=>e.remove());
  const mk=(s,parent,xy)=>{
    const filled=!!run.slots[s];
    const target=(!filled&&run.selected)||(run.moving&&run.moving!==s);
    const b=document.createElement("button");b.className="tag"+(filled?"":" empty")+(run.just===s?" just":"")+(target?" open":"")+(run.moving===s?" moving":"");
    b.dataset.slot=s;if(xy){b.style.left=xy[0]+"%";b.style.top=xy[1]+"%"}
    b.innerHTML=tagHTML(s);b.setAttribute("aria-label",SLOT_NAME[s]+": "+(filled?run.slots[s].name:"open"));
    const active=!run.result&&(target||(filled&&!run.selected)||run.moving===s);
    if(!active)b.setAttribute("disabled","");else b.addEventListener("click",()=>tapSlot(s));
    parent.appendChild(b);
  };
  for(const s of [...FIELD_SLOTS,"SP1"])mk(s,field,POS_XY[s]);
  const staff=document.getElementById("staff"),pen=document.getElementById("bullpen");staff.innerHTML="";pen.innerHTML="";
  const rot=slotList().filter(s=>s.startsWith("SP")&&s!=="SP1"),bp=slotList().filter(s=>s.startsWith("RP"));
  staff.style.gridTemplateColumns=`repeat(${rot.length},minmax(0,1fr))`;pen.style.gridTemplateColumns=`repeat(${bp.length},minmax(0,1fr))`;
  staff.parentElement.hidden=!rot.length;
  document.getElementById("pen").style.gridTemplateColumns=rot.length?`${rot.length}fr ${bp.length}fr`:"1fr";
  for(const s of rot)mk(s,staff,null);for(const s of bp)mk(s,pen,null);
}
function renderSettings(){
  const lock=started();
  // Each roster size keeps its own saved run, so switching never loses progress.
  document.querySelectorAll("#sizeSeg button").forEach(b=>{b.setAttribute("aria-pressed",+b.dataset.v===run.size);b.disabled=false});
  document.querySelectorAll("#modeSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===mode));
}
function poolHead(sp){
  if(sp.pack)return `<div class="poolhead packhead"><span class="tchip">Pack ${sp.n||""}</span><span class="reg">Random mix<small>${sp.ids.length} cards</small></span></div>`;
  if(sp.legend)return `<div class="poolhead legend"><span class="tchip">Legend</span><span class="reg">Gen 1–4 legendaries</span></div>`;
  return `<div class="poolhead" style="--tc:${TYPE_COLORS[sp.type]}"><span class="tchip">${cap(sp.type)}</span><span class="reg">${REGIONS[sp.gen]}<small>Gen ${sp.gen}</small></span></div>`;
}
// Base stats renamed for the job they do on a ball field.
const KEY=[
  ["Power","atk","Attack","hit","Hitting power and arm strength"],
  ["Contact","spd","Sp. Def","hit","Bat-to-ball skill and plate discipline"],
  ["Speed","spe","Speed","hit","Baserunning and range in the field"],
  ["Defense","def","Defense","fld","Glove work in the field"],
  ["Arm","arm","Attack + HP","fld","Throwing strength. Matters most at C, 3B, SS and RF"],
  ["Stuff","spa","Sp. Atk","pit","Pitch velocity and movement"],
  ["Control","ctl","Sp. Def","pit","Command: fewer walks and less hard contact"],
  ["Stamina","hp","HP","pit","How deep starters go, and catcher durability"]];
const NEEDS={C:"Stamina · arm · big body","1B":"Defense · tall","2B":"Speed · Defense · light",SS:"Speed · Defense · light","3B":"Arm · Speed",LF:"Speed",CF:"Speed · flies",RF:"Speed · arm",DH:"Power · Contact",SP:"Control · Stuff · Stamina",RP:"Stuff · Speed"};
const PERK_SHORT={fighting:"Hitter",dragon:"Power",electric:"Velocity",fire:"Velocity",psychic:"Control",dark:"Steals",ground:"Infield glove",rock:"Catcher",steel:"Catcher",water:"Stamina",flying:"Range",ice:"Closer",bug:"Range",normal:"Contact"};
function traits(m){
  const t=[];const h=m.ht/10,w=m.wt/10;
  if(m.arms<.5)t.push(["No arms","warn2"]);
  if(m.legs<.5)t.push(["No legs","warn2"]);
  if(flies(m))t.push(["Flies",""]);
  if(h<.6)t.push(["Tiny",""]);else if(h>=2)t.push(["Tall",""]);
  if(w>=150)t.push(["Heavy",""]);else if(w<10)t.push(["Light",""]);
  for(const ty of m.types){const p=PERK_SHORT[ty];if(p&&!t.some(x=>x[0]===p))t.push([p,""])}
  return t.map(([l,c])=>`<span class="badge ${c}">${l}</span>`).join("");
}
function candHTML(m){
  const taken=Object.values(run.slots).some(x=>x&&x.num===m.num);
  const show=run.showStats;
  const bars=show?`<span class="bars6">${KEY.map(([k,f,,g])=>{const v=m.r[f],d=m.why[f].length?v-m.rb[f]:0,arrow=Math.abs(d)>=4?(d>0?"▲":"▼"):"";const tip=m.why[f].length?` title="${k} ${m.rb[f]} → ${v}: ${m.why[f].join(", ")}"`:"";return `<span class="sb"${tip}><i style="color:var(--${g})">${k}</i><span class="bt"><span style="width:${Math.max(4,(v-40)/59*100)}%;background:var(--${g})"></span></span><em class="${d<=-4?"dn":d>=4?"up":""}">${v}${arrow}</em></span>`}).join("")}</span>${(()=>{const r=[...new Set(Object.values(m.why).flat())];return r.length?`<span class="why">Adjusted for ${r.join(", ")}</span>`:""})()}`:"";
  const box=(v,l,on)=>`<span class="ovr ${v>=85?"hi":v>=70?"md":""}${on?" sel":""}"><b>${v}</b><i>${l}</i></span>`;
  const ovr=show?`<span class="ovr2 four">${box(m.ovr,"BEST "+m.hspot,sortBy==="ovr").replace('class="ovr ','class="ovr head ')}${box(m.off,"OFF",sortBy==="off")}${box(m.def,"DEF "+m.dspot,sortBy==="def")}${box(m.pit,m.pspot,sortBy==="pit")}</span>`:"";
  return `<button class="cand${show?" withovr":""}${m.shiny?" shiny":""}" data-id="${m.id}" aria-pressed="${run.selected===m.id}" ${taken?"disabled":""}>${tok(m)}<span style="min-width:0;display:block"><span class="nmrow"><b>${esc(m.name)}</b>${m.leg?'<span class="legtag">LEGEND</span>':""}${m.shiny?'<span class="legtag shinytag">SHINY</span>':""}${taken?'<span class="onteam">ON TEAM</span>':""}</span><small>#${dex(m.num)} · ${m.types.map(cap).join("/")} · ${m.body} · ${ftin(m.ht)}, ${lbs(m.wt)} lb</small>${bars}</span>${ovr}</button>`;
}
function slotChips(){
  if(!run.selected)return `<p class="hint" style="margin:0">Tap a Pokémon, then tap its spot here or on the field.</p>`;
  const sel=BYID.get(run.selected),st=run.showStats;
  // Starters and relievers each get one chip: pitchers sort themselves, so the open SP or RP slot is filled in order.
  const role=s=>s.startsWith("SP")?"SP":s.startsWith("RP")?"RP":s;
  let open=slotList().filter(s=>!run.slots[s]).filter((s,i,a)=>a.findIndex(x=>role(x)===role(s))===i);
  if(st)open.sort((a,b)=>posOvr(sel,b)-posOvr(sel,a));
  return `<div class="placebar"><div class="label">Where should ${esc(sel.name)} play?</div><div class="slots">${open.map(s=>{const v=posOvr(sel,s);return `<button class="slotchip${s.startsWith("RP")?" bp":s.startsWith("SP")?" sp":""}" data-slot="${s}"><b>${role(s)}</b>${st?`<em class="${ovCls(v)}">${v}</em>`:""}<small>${NEEDS[role(s)]}</small></button>`}).join("")}</div></div>`;
}function renderBoard(){
  const b=document.getElementById("board");const n=run.picks.length,size=run.size,to=teamOvr();b.classList.toggle("result",!!run.result);
  const cell=(lab,val,cls="",sub="")=>`<div class="bd-cell ${cls}"><span class="bd-lab">${lab}</span><span class="bd-main">${val}</span><span class="bd-sub">${sub}</span></div>`;
  const tile=v=>`<span class="tiles">${String(v).split("").map(c=>`<b>${c}</b>`).join("")}</span>`;
  const lamps=(k,on)=>`<span class="lamps">${Array.from({length:k},(_,i)=>`<i class="${i<on?"on":""}"></i>`).join("")}</span>`;
  if(run.result){const w=run.result.wins;
    b.innerHTML=cell("Wins",tile(w),"wide")+cell("Losses",tile(162-w),"wide")+cell("Team grade",tile(to??"--"));return}
  if(isPack()){b.innerHTML=cell("Pick",tile(String(Math.min(n+1,size)).padStart(2,"0")),"wide",`of ${size}`)+cell("Team grade",tile(to??"--"))+cell("Re-rips",lamps(2,run.rerolls))+cell("Master Ball",lamps(1,run.doubles));return}
  b.innerHTML=cell("Pick",tile(String(Math.min(n+1,size)).padStart(2,"0")),"wide",`of ${size}`)+cell("Team grade",tile(to??"--"))+cell("Respins",lamps(2,run.rerolls))+cell("Keeps",`<span class="lamps"><i class="${run.keeps.type?"on":""}"></i><i class="${run.keeps.gen?"on":""}"></i></span>`,"",`<span class="keepsub"><span>Type</span><span>Region</span></span>`);
}
function renderDraft(){
  const d=document.getElementById("draft");const n=run.picks.length,size=run.size;
  const movingNote=run.moving&&!run.locked?`<p class="note">Moving <b>${esc(run.slots[run.moving].name)}</b> from ${lbl(run.moving)}. Tap a spot to move or swap. Tap them again to cancel.</p>`:"";
  const head=movingNote;
  if(run.locked){
    d.innerHTML=`${head}<p class="note">Team locked in. Your season is below.</p>${mode!=="daily"?'<button class="btn primary" id="newRun">New run</button>':'<p class="hint" style="margin:0">New daily tomorrow. Try the other roster size, or play unlimited Practice runs.</p><button class="btn" id="goPractice">Play Practice</button>'}`;
    const nr=document.getElementById("newRun");if(nr)nr.onclick=newRun;
    const gp=document.getElementById("goPractice");if(gp)gp.onclick=()=>{document.getElementById("season").hidden=true;setMode("practice")};return;
  }
  if(n===size){
    d.innerHTML=`${head}<p class="note">Roster ready. Tap a player to pick it up and rearrange your team.</p>${Number.isFinite(run.previousWins)?`<p class="hint">Previous record: ${run.previousWins}–${162-run.previousWins}. Simulate again to save the full season.</p>`:""}<button class="btn primary" id="playBtn">Lock in and play 162</button>${mode!=="daily"?'<button class="btn quiet" id="newRun">Start over</button>':""}`;
    document.getElementById("playBtn").onclick=()=>{run.locked=true;run.moving=null;finish(true)};
    const nr=document.getElementById("newRun");if(nr)nr.onclick=newRun;
    return;
  }
  // After a reload, a saved spin stays hidden until the Poké Ball is tapped again. It reveals the same pool.
  if(!run.spin||run.unrevealed){
    const ls=run.lastSpin,showKeeps=!run.unrevealed&&ls&&(canKeepNext("type")||canKeepNext("gen")||!run.keeps.type||!run.keeps.gen);
    const keepRow=showKeeps?`<div class="spinctl keeprow"><span class="label">Or spin and keep</span>
      <button class="btn" id="keepType" ${canKeepNext("type")?"":"disabled"}>${cap(ls.type)}</button>
      <button class="btn" id="keepGen" ${canKeepNext("gen")?"":"disabled"}>${REGIONS[ls.gen]}</button></div>
      <p class="hint" style="margin:0">Keeps the type or region of your last pick. Once each per run.</p>`:"";
    d.innerHTML=`${head}<div class="throw hero" id="throwBox"><div class="throw-txt"><b id="spinLabel">Pick ${n+1}</b><small>of ${size}</small></div>${isPack()?`<button class="pack" id="spinBtn" aria-label="Rip pack for pick ${n+1}"><span class="pk-inside"></span><span class="pk-cap"></span><span class="pk-tear"></span><span class="pk-swipe">👉</span><span class="pk-ball"></span><span class="pk-name">Ballclub</span><span class="pk-sub">5 cards</span></button><span class="tapcue">Swipe across to rip</span>`:`<button class="pokeball" id="spinBtn" aria-label="Spin for pick ${n+1}"><span class="pb-btn"></span></button><span class="tapcue">Tap to spin</span>`}<span class="throw-sub">${n?"Tap a roster player to pick it up and rearrange your team.":isPack()?"Every pack has 5 random Pokémon from any type and region. Keep one and give it a spot.":"You get one type from one region. Pick a Pokémon from it and give it a spot."}</span></div><button class="btn primary spinbig" id="spinBtn2">Spin</button>${keepRow}${mode!=="daily"&&n?'<button class="btn quiet" id="newRun">Start over</button>':""}`;
    // The whole hero area spins, not just the ball, so a near miss still counts.
    let dragged=false;
    if(!isPack())document.getElementById("throwBox").onclick=()=>{if(dragged){dragged=false;return}doSpin()};document.getElementById("spinBtn2").onclick=()=>doSpin();
    const kt=document.getElementById("keepType"),kg=document.getElementById("keepGen");
    if(kt)kt.onclick=()=>doSpin("type");if(kg)kg.onclick=()=>doSpin("gen");
    const nr=document.getElementById("newRun");if(nr)nr.onclick=newRun;
    return;
  }
  const ids=run.spin.ids.map(id=>BYID.get(id));ids.forEach(setOverall);
  if(!run.showStats||sortBy==="dex")ids.sort((a,b)=>a.id-b.id);else if(sortBy==="ovr"){const spots=slotList().filter(s=>!run.slots[s]);const best=m=>Math.max(...spots.map(s=>posOvr(m,s)));ids.sort((a,b)=>best(b)-best(a));}else if(["off","def","pit"].includes(sortBy))ids.sort((a,b)=>b[sortBy]-a[sortBy]);else ids.sort((a,b)=>b.r[sortBy]-a.r[sortBy]);
  // A shiny always shows first so it can't hide at the bottom of a long pool.
  ids.sort((a,b)=>(b.shiny?1:0)-(a.shiny?1:0));
  const drafted=new Set(takenNums());ids.sort((a,b)=>Number(drafted.has(a.num))-Number(drafted.has(b.num)));
  const open=slotList().filter(s=>!run.slots[s]);
  d.innerHTML=`${head}<div id="poolHead">${poolHead(run.spin)}</div>${run.spin.bonus?`<p class="shinynote legnote"><b>🌟 Bonus legendary card!</b> This pack came with a 6th card.</p>`:""}${run.spin.shiny?`<p class="shinynote"><b>✨ A shiny appeared!</b> Shinies have every stat boosted. Rarer than a Legend spin.</p>`:""}${run.second?`<p class="note">Master Ball: catch your extra Pokémon from this pack.</p>`:""}
    ${run.showStats?`<div class="sortrow"><span class="label">Sort</span>${[["ovr","Best"],["off","Offense"],["def","Defense"],["pit","Pitching"],...KEY.filter(k=>k[1]!=="def").map(k=>[k[1],k[0]]),["dex","Dex #"]].map(([f,l])=>`<button class="chip" data-sort="${f}" aria-pressed="${sortBy===f}">${l}</button>`).join("")}</div>`:""}
    <div class="cands${run.justRipped?" reveal":""}" id="cands">${ids.map(candHTML).join("")}</div>
    <div id="place">${slotChips()}</div>
    ${run.spin.pack?`<div class="spinctl packctl">
      <span class="label">Options</span>
      <button class="btn" id="rerollBtn" ${run.rerolls&&!run.second?"":"disabled"}>Re-rip</button>
      <button class="btn${run.doubleArmed?" armed":""}" id="doubleBtn" aria-pressed="${!!run.doubleArmed}" ${run.doubles&&!run.second&&run.picks.length<size-1?"":"disabled"}>${run.doubleArmed?"Master Ball ready":"Master Ball"}</button>
    </div><p class="hint" style="margin:0">Re-rip swaps this pack for a new one: ${run.rerolls} left. Master Ball keeps two cards from one pack: ${run.doubles} left.</p>`:run.spin.legend?`<p class="hint" style="margin:0">Legend spin. These are rare, so make it count.</p>`:`<div class="spinctl">
      <span class="label">Redraw</span>
      <button class="btn" id="rerollBtn" ${run.rerolls?"":"disabled"}>Respin all</button>
      <button class="btn" id="keepType" ${canKeepNow("type")?"":"disabled"}>Keep ${cap(run.spin.type)}</button>
      <button class="btn" id="keepGen" ${canKeepNow("gen")?"":"disabled"}>Keep ${REGIONS[run.spin.gen]}</button>
    </div><p class="hint" style="margin:0">Respin all: ${run.rerolls} left. Keep ${cap(run.spin.type)} draws ${cap(run.spin.type)} from another region; Keep ${REGIONS[run.spin.gen]} draws another type from ${REGIONS[run.spin.gen]}. Once each per run.</p>`}`;
  d.querySelector("#cands").addEventListener("click",e=>{const b=e.target.closest(".cand");if(!b||b.disabled)return;run.moving=null;run.selected=+b.dataset.id===run.selected?null:+b.dataset.id;const sc=d.querySelector("#cands").scrollTop;render();const c=document.getElementById("cands");if(c)c.scrollTop=sc});
  d.querySelectorAll("[data-sort]").forEach(b=>b.onclick=()=>{sortBy=b.dataset.sort;render()});
  d.querySelector("#place").addEventListener("click",e=>{const b=e.target.closest("[data-slot]");if(b)place(b.dataset.slot)});
  const rb=document.getElementById("rerollBtn");
  if(rb){
    rb.onclick=()=>{if(!run.rerolls||run.second)return;run.rerolls--;run.selected=null;run.doubleArmed=false;run.spin=drawNext();run.justRipped=isPack();if(!isPack()){run.unrevealed=true;saveRun();render();return}saveRun();render()};
    const db=document.getElementById("doubleBtn");if(db)db.onclick=()=>{if(!run.doubles||run.second)return;run.doubleArmed=!run.doubleArmed;saveRun();render()};
    // Keeps work here too: swap the current pool for one from the last pick's type or region.
    const redrawKeep=k=>{if(!canKeepNow(k))return;const sp=poolSpin(run,nowFilter(k,run.spin));if(!sp)return;run.keeps[k]--;run.spin=sp;run.selected=null;run.unrevealed=true;saveRun();render()};
    const kt=document.getElementById("keepType"),kg=document.getElementById("keepGen");
    if(kt)kt.onclick=()=>redrawKeep("type");if(kg)kg.onclick=()=>redrawKeep("gen");
  }
}
function howHTML(){
  return `<div class="rules-guide"><p class="guide-intro">Draft your roster, find the best fits, then chase 162–0. Here’s your scouting guide.</p>
  <section class="guide-topic"><h3>1. Choose your mode and roster size</h3><div class="guide-content">
    <div class="guide-mode guide-packs"><h4>Packs <small>5 random cards</small></h4><p>Swipe across the top of the pack, or tap to open it. Inspect the cards, keep one, and give it an open position.</p><ul>
      <li><b>Re-rip: 2 per run.</b> Replace the current pack before drafting a card.</li>
      <li><b>Master Ball: once per run.</b> Use it before your first pick to catch one extra Pokémon from that pack. You need at least two open roster spots. You cannot re-rip between those two picks.</li></ul>
    </div><div class="guide-mode guide-growth"><h4>Raise your teammate <small>Packs only</small></h4><p>Pull its next evolution to evolve a roster Pokémon, or a duplicate to build friendship. Each upgrade uses your pick from that pack. You still need to fill every roster spot.</p><p><b>First evolution: +5</b> friendship to position ratings. <b>Second: +8 total</b>. Duplicates add <b>+2</b>, up to +10 total. Ratings cap at 99. Friendship lasts for this run and improves season performance too.</p><p>Tap a card marked Evolve or Train to preview the new card, ratings and team change. You can still draft an evolution normally for its base ratings.</p></div><div class="guide-mode guide-spin"><h4>Spin <small>Type + region</small></h4><p>Tap the ball to get a group of Pokémon matching a type and region, such as Fire · Johto. Choose one and give it an open position.</p><ul>
      <li><b>Respin all: 2 per run.</b> Prepare a new type-and-region draw, then tap the ball to reveal it.</li>
      <li><b>Keep type: once per run.</b> Keep Fire, for example, and draw from a different region.</li>
      <li><b>Keep region: once per run.</b> Keep Johto, for example, and draw a different type.</li></ul>
    <p class="guide-note">Before the next spin, a Keep button uses your last pick’s type or region. Keeps are unavailable on a Legend spin or when no eligible unused group remains.</p>
    </div><h4>Standard or Quick?</h4><p><b>Standard:</b> 16 players, including five starting pitchers and two relievers.<br><b>Quick:</b> 11 players, including one starter and one reliever. Both include nine batting positions and a 162-game season.</p>
  </div></section>
  <section class="guide-topic"><h3>2. Pick a Pokémon and arrange your roster</h3><div class="guide-content"><ol>
    <li><b>Inspect the card.</b> Tap a Pokémon in either mode to see its strengths and position ratings.</li>
    <li><b>Choose an open spot.</b> “Best available” highlights its strongest open position. Its best overall position may already be filled.</li>
    <li><b>One Pokémon in hand.</b> Tap a roster player to pick it up. Tap an occupied position to preview and confirm an exchange: the player there becomes your new held card. Tap an empty position to place immediately. Ratings show how your held card fits each spot. Undo reverses your last action; Cancel changes restores the unfinished rearrangement.</li>
    <li><b>Release: once per run.</b> Tap a roster Pokémon and choose Release. It leaves your team, reopens its spot, and gives you a replacement draft pick. This works in both modes before the season starts.</li><li><b>Finish the roster.</b> You can rearrange players before playing your season. Once you lock in, that team is final.</li></ol>
    <p class="guide-note">Starting pitchers are automatically ordered with the best starter first. Your best reliever closes; Standard’s other reliever handles setup.</p>
  </div></section>
  <section class="guide-topic"><h3>3. Understand the card ratings</h3><div class="guide-content">
    <p>Ratings run from <b>40 to 99</b>. For a draft decision, use the rating shown at the position you want to fill.</p>
    <div class="keygrid">${KEY.map(([k,,orig,g,desc])=>`<div><b style="color:var(--${g})">${k}</b><span>${desc}</span><i>Base stat: ${orig}</i></div>`).join("")}</div>
    <dl class="guide-definitions guide-rating-chart"><dt>Best position</dt><dd>The card’s strongest overall position. This does not account for spots already filled on your team.</dd><dt>OFF</dt><dd>Hitting alone, also used for the designated hitter (DH).</dd><dt>DEF + position</dt><dd>Glove rating at that fielding position. It is not the player’s full rating there.</dd><dt>SP or RP</dt><dd>Pitching rating as a starting pitcher or relief pitcher.</dd><dt>Position rating</dt><dd>Hitting and fielding combined for a fielder; hitting only for DH; pitching for a pitcher.</dd></dl>
    <p>A strong hitter is not automatically a strong catcher. Compare position ratings instead of adding the OFF and DEF numbers yourself.</p>
    <p class="guide-note">Only the skills relevant to a role count there: DH does not use fielding, and a non-pitcher is not penalized for weak pitching. CL and SU share a displayed relief rating, but the closer has more impact in the simulation.</p>
  </div></section>
  <section class="guide-topic"><h3>4. Play a season, share it, and try again</h3><div class="guide-content"><p>Fill every roster spot, review your swaps, then choose <b>Play your season</b>. The game simulates 162 regular-season games and a postseason if your team qualifies. Chase 162–0, but a high roster rating does not guarantee it.</p><ul>
    <li><b>Results:</b> see your record, season grade, team strengths, MVP and best pitcher. Expand the full stats for a deeper look.</li>
    <li><b>Share:</b> copy or share your result. Enter a team name and post it to the public leaderboard if you want.</li>
    <li><b>Leaderboards:</b> Spin and Packs have separate boards, with Quick and Standard separated too.</li>
    <li><b>Your clubhouse:</b> compare personal bests, recent completed teams and achievements. These records stay in this browser on this device.</li></ul><p>Runs are unlimited. Play again to build a new team and beat your own record.</p>
  </div></section>
  <section class="guide-topic"><h3>5. Legendary and shiny Pokémon</h3><div class="guide-content"><ul>
    <li><b>Legend spin:</b> a rare Spin result offering legendary Pokémon.</li>
    <li><b>Bonus legendary:</b> a pack can contain a rare sixth card.</li>
    <li><b>Legendary presence:</b> finish with a legendary on your roster for +1 team rating, capped at 99, plus a small hitting and pitching boost. Extra legendaries do not stack this team bonus.</li>
    <li><b>Shiny Pokémon:</b> rare variants with boosted stats. Their updated ratings are already shown on the card.</li></ul>
  </div></section>
  <section class="guide-topic"><h3>6. What each position needs</h3><div class="guide-content"><p>Use these traits as scouting clues. The displayed position rating is the final comparison.</p><div class="needs">${[...FIELD_SLOTS,"SP","RP"].map(s=>`<div><b>${s==="RP"?"CL / SU":s}</b><span>${NEEDS[s]}</span></div>`).join("")}</div><p class="guide-note">C = catcher; SS = shortstop; LF / CF / RF = left / center / right field; DH = designated hitter; SP = starter; CL / SU = closer / setup reliever. 1B, 2B and 3B are the bases.</p><p>Defense has the biggest effect at catcher, shortstop and center field, and less at first base and left field. DH only hits.</p></div></section>
  <section class="guide-topic"><h3>7. Deeper scouting: body and types</h3><div class="guide-content">
    <h4>Body traits</h4><ul><li>Limited arms reduce throwing, pitching and some batting skills.</li><li>Heavier Pokémon gain power but can lose infield range. Smaller Pokémon benefit from a smaller strike zone.</li><li>Flying Pokémon cover more ground in the outfield.</li></ul>
    <h4>Type perks</h4><p>Types give small boosts, not guaranteed best positions. These effects are already included in the ratings.</p><div class="guide-perks">${Object.entries(PERKS).map(([type,benefit])=>`<div style="--perk-color:${TYPE_COLORS[type]}"><b>${cap(type)}</b><span>${benefit}</span></div>`).join("")}</div>
    <p>Want to compare Pokémon across every position? Open the <a href="sanity.html">scouting sheet</a>.</p>
  </div></section></div>`;
}
function openHow(){document.getElementById("howBody").innerHTML=howHTML();document.getElementById("how").hidden=false;store.set("pbc2-seenhow","1")}
function closeHow(){document.getElementById("how").hidden=true}
function render(){renderSettings();renderBoard();renderField();renderDraft();run.justRipped=false}

// ---------- actions ----------
// Keeps carry the last drafted spin's type or region into the next spin.
const keepFilter=(keep,ls)=>keep==="type"?p=>p.type===ls.type:p=>shareRegion(p,ls)&&p.type!==ls.type;
// On the pool screen, Keep redraws from the pool being shown: same type from another region, or another type from the same region.
const nowFilter=(keep,sp)=>keep==="type"?p=>p.type===sp.type&&!shareRegion(p,sp):p=>shareRegion(p,sp)&&p.type!==sp.type;
function canKeepNow(keep){const sp=run.spin;return !!(sp&&!sp.legend&&run.keeps[keep]&&POOLS.some(p=>!run.used.includes(p.key)&&nowFilter(keep,sp)(p)))}
function canKeepNext(keep){const ls=run.lastSpin;return !!(ls&&run.keeps[keep]&&POOLS.some(p=>!run.used.includes(p.key)&&keepFilter(keep,ls)(p)))}
function doSpin(keep){
  if(spinning)return;
  if(keep&&!canKeepNext(keep))return;
  spinning=true;
  const activeRun=run;
  let sp;
  if(run.unrevealed)sp=run.spin;
  else if(keep){sp=poolSpin(run,keepFilter(keep,run.lastSpin));run.keeps[keep]--}
  else sp=drawNext();
  run.justRipped=isPack();
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done=()=>{if(run!==activeRun)return;run.spin=sp;run.unrevealed=false;run.selected=null;spinning=false;saveRun();render()};
  if(reduce){done();return}
  const btn=document.getElementById("spinBtn"),lab=document.getElementById("spinLabel");let i=0;
  document.querySelectorAll("#keepType,#keepGen,#spinBtn2").forEach(b=>b.disabled=true);
  btn.classList.add("wobble");btn.closest(".throw").classList.add("going");
  const duration=1900;
  btn.style.animation='none';
  btn.animate([{transform:'rotate(0deg)'},{transform:'rotate(1440deg)'}],{duration,easing:'cubic-bezier(.15,.65,.25,1)',fill:'forwards'});
  for(const [id,values,final] of [['typeReel',Object.keys(TYPE_COLORS).map(cap),sp.legend?'Legendary':cap(sp.type)],['regionReel',Object.values(REGIONS),sp.legend?'Gen 1–4':REGIONS[sp.gen]]]){
    const reel=document.getElementById(id);if(!reel)continue;
    const track=document.createElement('span');track.className='reel-track';
    const words=[reel.textContent,...Array.from({length:24},(_,i)=>values[i%values.length]),final];
    track.replaceChildren(...words.map(word=>{const row=document.createElement('span');row.textContent=word;return row}));reel.replaceChildren(track);
    track.animate([{transform:'translateY(0)'},{transform:`translateY(-${(words.length-1)*32}px)`}],{duration,easing:'cubic-bezier(.15,.65,.25,1)',fill:'forwards'});
  }
  setTimeout(()=>{if(run!==activeRun)return;btn.classList.add('pop');setTimeout(done,220)},duration);
}
// Pitchers always line up best first: the top starter is Starter 1 and the better reliever closes.
function sortStaff(){
  const list=slotList();
  for(const [grp,key] of [[["SP1","SP2","SP3","SP4","SP5"],"spR"],[["RP1","RP2"],"rpR"]]){
    const ss=grp.filter(s=>list.includes(s)),ms=ss.map(s=>run.slots[s]).filter(Boolean).sort((a,b)=>b[key]-a[key]);
    ss.forEach((s,i)=>{if(ms[i])run.slots[s]=ms[i];else delete run.slots[s]});
  }
}
function place(slot){
  if(!run.selected||run.slots[slot])return;
  const id=run.selected,ls=run.spin;
  run.lastSpin=ls&&!ls.legend&&!ls.pack?{type:ls.type,gen:ls.gen,gens:ls.gens||[ls.gen],key:ls.key}:null;
  // Master Ball: the first card from an armed pack keeps the pack open for one more pick.
  const keepOpen=ls&&ls.pack&&run.doubleArmed&&!run.second&&run.picks.length+1<run.size;
  run.slots[slot]=BYID.get(id);run.picks.push(id);run.selected=null;run.lockUsed=false;run.moving=null;
  if(keepOpen){run.doubleArmed=false;run.doubles--;run.second=true}else{run.spin=null;run.second=false;run.doubleArmed=false}
  sortStaff();run.just=slotList().find(s=>run.slots[s]&&run.slots[s].id===id)||slot;saveRun();render();

}
function newRun(){run=freshRun(mode);saveRun();document.getElementById("season").hidden=true;render()}
function releasePlayer(slot){
  if(run.locked||run.result||spinning||run.second||!run.releases||!run.slots[slot])return false;
  const id=run.slots[slot].id,index=run.picks.indexOf(id);if(index<0)return false;
  delete run.slots[slot];run.picks.splice(index,1);run.releases=0;run.moving=null;run.selected=null;run.just=null;
  run.doubleArmed=false;sortStaff();saveRun();render();return true;
}

// ---------- results ----------
const ip=o=>Math.floor(o/3)+"."+(o%3);
const f3=x=>isFinite(x)?x.toFixed(3).replace(/^0/,""):".000";
function square(g){return g>=65?"🟩":g>=52?"🟨":g>=42?"🟧":"🟥"}
function finish(scroll){
  const restored=!!run.result;const res=run.result||playSeason(run);run.result=res;saveRun();render();
  const list=slotList(),me=res.me;
  if(mode==="daily"){store.set("pbc2-dres-"+today(),JSON.stringify({w:res.wins,g:res.grade}))}
  let best=null;try{best=JSON.parse(store.get("pbc2-best")||"null")}catch(e){}
  const newBest=restored?!!res.isPersonalBest:!best||res.wins>best.w;res.isPersonalBest=newBest;saveRun();if(newBest&&!restored)store.set("pbc2-best",JSON.stringify({w:res.wins,g:res.grade}));
  const bat=me.order.map(h=>{const s=h.st;const obp=(s.h+s.bb)/Math.max(1,s.pa),slg=(s.h+s.d+2*s.t+3*s.hr)/Math.max(1,s.ab);return{h,s,avg:s.h/Math.max(1,s.ab),obp,slg,ops:obp+slg}});
  const pit=[...me.rot.filter(p=>p.role!=="FILL"),me.cl,...(me.pen.role==="RP2"?[me.pen]:[])].filter(p=>p.m.id).map(p=>({p,s:p.st,era:p.st.outs?p.st.r*27/p.st.outs:0}));
  const mvp=bat.reduce((a,b)=>b.ops>a.ops?b:a);
  const color=res.grade.startsWith("S")||res.grade.startsWith("A")?"var(--good)":res.grade==="F"||res.grade==="D"?"var(--bad)":"var(--mid)";
  const loss=162-res.wins;
  const ps=res.post.made?res.post.games.reduce((a,g)=>[a[0]+g[0],a[1]+g[1]],[0,0]):null;
  const rows=list.map(s=>{const m=run.slots[s];return{s,m,g:g5(fit(m,s))}});
  // Share text: short and visual, like a Wordle grid. One square per pick, colored by his rating at his spot.
  const sq=v=>v>=90?"🟩":v>=80?"🟨":v>=70?"🟧":"🟥";
  const grid=ls=>ls.map(s=>run.slots[s]?sq(posOvr(run.slots[s],s)):"⬛").join("");
  const arms=list.filter(s=>!FIELD_SLOTS.includes(s));
  const ace=pit.length?pit.reduce((x,y)=>y.era<x.era&&y.s.outs>90?y:x,pit[0]):null;
  const leg=list.map(s=>run.slots[s]).find(m=>m&&m.leg),shinies=list.map(s=>run.slots[s]).filter(m=>m&&m.shiny);
  const buildShare=()=>{
    const sub=run.submitted,o=res.post;
    const october=o.champ?"🏆 World Series champs":o.made?"🎟️ "+o.text.replace(/\.$/,""):"📺 Missed the playoffs";
    return [
      `⚾ Pokémon Ballclub${isPack()?" · Packs":""}${sub?` · ${sub.team}`:""}`,
      `${res.wins}–${loss} · ${res.grade}${sub&&sub.rank?` · #${sub.rank} on the board`:""}`,
      october,"",
      `Lineup ${grid(FIELD_SLOTS)}`,
      `Arms   ${grid(arms)}`,"",
      `⭐ ${mvp.h.m.name}: ${f3(mvp.avg)}, ${mvp.s.hr} HR`,
      ...(ace?[`🔥 ${ace.p.m.name}: ${ace.era.toFixed(2)} ERA, ${ace.s.k} K`]:[]),
      ...(leg?[`✨ Pulled ${leg.name}`]:[]),
      ...shinies.map(m=>`🌟 Found ${m.name}`),"",
      `Beat ${res.wins} wins: pokemon-ballclub.vercel.app`].join("\n");
  };
  const el=document.getElementById("season");el.hidden=false;
  el.innerHTML=`<div class="panel">
    <div class="res-top">
      <div class="pennant" style="--pc:${color}"><span>${res.grade}</span></div>
      <div><div class="label">Final, 162 games</div><div class="bigrec">${res.wins}–${loss}</div></div>
      <div style="min-width:0;flex:1 1 220px"><p style="margin:0 0 6px">Scored ${(res.runs.rs/162).toFixed(1)} runs a game, allowed ${(res.runs.ra/162).toFixed(1)}.</p><p style="margin:0 0 6px"><b>${res.post.text}</b>${ps?` Postseason ${ps[0]}–${ps[1]}.`:""}</p><p class="hint" style="margin:0">${newBest?"New personal best on this device.":`Your best here: ${best?.w??res.wins}–${162-(best?.w??res.wins)} (${best?.g??res.grade}).`}</p></div>
    </div>
    <div class="submit" id="submitBox">${submitHTML()}</div>
    <div class="share"><button class="btn" id="shareBtn">Share result</button><button class="btn" id="again">New run</button></div>
    <p class="hint" id="shareMsg" style="margin-top:6px"></p>
    <div class="awards" style="margin-top:16px">
      <div class="award"><span class="label">Team MVP</span><b>${esc(mvp.h.m.name)}</b><span>${f3(mvp.avg)} / ${f3(mvp.obp)} / ${f3(mvp.slg)}, ${mvp.s.hr} HR</span></div>
      ${pit.length?(()=>{const a=pit.reduce((x,y)=>y.era<x.era&&y.s.outs>90?y:x,pit[0]);return `<div class="award"><span class="label">Best arm</span><b>${esc(a.p.m.name)}</b><span>${a.era.toFixed(2)} ERA, ${a.s.k} K</span></div>`})():""}
    </div>
    <div class="label" style="margin:16px 0 6px">Lineup card and batting</div>
    <div class="tbl lineup"><table><thead><tr><th>#</th><th class="l">Pos</th><th class="l">Pokémon</th><th>AVG</th><th>OBP</th><th>SLG</th><th>HR</th><th>RBI</th><th>SB</th></tr></thead><tbody>
    ${bat.map(x=>`<tr><td>${x.h.slot}</td><td class="l">${x.h.pos}</td><td class="l">${esc(x.h.m.name)}</td><td>${f3(x.avg)}</td><td>${f3(x.obp)}</td><td>${f3(x.slg)}</td><td>${x.s.hr}</td><td>${x.s.rbi}</td><td>${x.s.sb}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="label" style="margin:16px 0 6px">Pitching</div>
    <div class="tbl"><table><thead><tr><th class="l">Role</th><th class="l">Pokémon</th><th>ERA</th><th>IP</th><th>K</th><th>BB</th><th>SV</th></tr></thead><tbody>
    ${pit.map(x=>`<tr><td class="l">${lbl(x.p.role)}</td><td class="l">${esc(x.p.m.name)}</td><td>${x.era.toFixed(2)}</td><td>${ip(x.s.outs)}</td><td>${x.s.k}</td><td>${x.s.bb}</td><td>${x.s.sv}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="hint">Your record comes from the runs your roster is worth. Stat lines come from an at-bat simulation. Undrafted bullpen innings are covered by league-average relievers and omitted here.</p>
  </div>`;
  document.getElementById("shareBtn").onclick=async()=>{const msg=document.getElementById("shareMsg"),text=buildShare();
    // Phones open the share sheet (Messages, group chats). Everything else copies.
    if(navigator.share&&matchMedia("(pointer:coarse)").matches){try{await navigator.share({text});return}catch(e){if(e.name==="AbortError")return}}
    navigator.clipboard.writeText(text).then(()=>msg.textContent="Copied. Paste it in your group chat.").catch(()=>{msg.innerHTML=`<textarea readonly style="width:100%;height:160px">${esc(text)}</textarea>`;const t=msg.querySelector("textarea");t.focus();t.select()})};
  wireSubmit();
  const ag=document.getElementById("again");if(ag)ag.onclick=()=>{newRun();window.scrollTo({top:0,behavior:"smooth"})};
  const tp=document.getElementById("toPractice");if(tp)tp.onclick=()=>{document.getElementById("season").hidden=true;setMode("practice");window.scrollTo({top:0,behavior:"smooth"})};
  if(scroll)el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}

// ---------- leaderboard ----------
// Scores live in a Supabase table that anyone can read and add to, but nobody can edit or delete.
const LB_URL="https://etxzgstfaosrxxusbfwx.supabase.co/rest/v1/ballclub_scores",LB_KEY="sb_publishable_pGOS2OlzIyD-neTlknxr1w_TDLCX73f";
const lbHead=(extra={})=>({apikey:LB_KEY,Authorization:"Bearer "+LB_KEY,...extra});
let lbSize=null,lbMode=null;
// Team grade from a saved roster: the same number as the in-game scoreboard. It breaks ties in wins,
// then run differential, then whoever posted first.
function rosterOvr(ids,slots){return rosterRating(Object.fromEntries(ids.map((id,i)=>[slots[i],BYID.get(id)]).filter(([,m])=>m)),slots)??0}
const lbRank=(a,b)=>b.wins-a.wins||b.ovr-a.ovr||(b.rs-b.ra)-(a.rs-a.ra)||new Date(a.created_at)-new Date(b.created_at);
function submitHTML(){
  if(run.submitted)return `<div class="posted"><span>Posted as <b>${esc(run.submitted.team)}</b>${run.submitted.rank?`, #${run.submitted.rank} on the ${isPack()?"Packs ":""}${run.size}&#8209;pick board`:""}.</span><button class="btn" id="seeLb">View leaderboard</button></div>`;
  const last=store.get("pbc2-team")||"";
  return `<div class="label">Post to the leaderboard</div><div class="submitrow"><input id="teamName" maxlength="24" placeholder="Team name" value="${esc(last)}" autocomplete="off" enterkeyhint="send"><button class="btn primary sm" id="submitBtn">Submit</button></div><p class="hint" id="submitMsg" style="margin:4px 0 0"></p>`;
}
function wireSubmit(){
  const box=document.getElementById("submitBox");if(!box)return;
  const see=document.getElementById("seeLb");if(see)see.onclick=()=>openLb(run.size);
  const btn=document.getElementById("submitBtn"),inp=document.getElementById("teamName"),msg=document.getElementById("submitMsg");if(!btn)return;
  const go=async()=>{
    if(btn.disabled)return;
    const team=inp.value.replace(/\s+/g," ").trim().slice(0,24);
    if(!team){msg.textContent="Give your team a name first.";inp.focus();return}
    btn.disabled=true;msg.textContent="Posting…";
    const list=slotList(),res=run.result;
    const row={team,size:run.size,wins:res.wins,grade:res.grade,rs:Math.round(res.runs.rs),ra:Math.round(res.runs.ra),roster:list.map(s=>run.slots[s]?run.slots[s].id:0),device:deviceId().slice(0,16),mode:isPack()?"pack":"spin"};
    try{
      const r=await fetch(LB_URL,{method:"POST",headers:lbHead({"Content-Type":"application/json",Prefer:"return=minimal"}),body:JSON.stringify(row)});
      if(!r.ok)throw new Error(r.status);
      store.set("pbc2-team",team);
      let rank=null;
      try{const c=await fetch(`${LB_URL}?select=id&mode=eq.${row.mode}&size=eq.${run.size}&wins=gt.${res.wins}`,{method:"HEAD",headers:lbHead({Prefer:"count=exact"})});const cr=c.headers.get("content-range");
        if(cr){rank=+cr.split("/")[1]+1;
          // Same wins: count the tied teams that rank above this one.
          const t=await fetch(`${LB_URL}?select=roster,rs,ra,created_at&mode=eq.${row.mode}&size=eq.${run.size}&wins=eq.${res.wins}`,{headers:lbHead()});
          if(t.ok){const sl=slotList(),mine={wins:res.wins,ovr:rosterOvr(row.roster,sl),rs:row.rs,ra:row.ra,created_at:new Date().toISOString()};
            const tied=await t.json(),self=tied.findIndex(x=>x.rs===row.rs&&x.ra===row.ra&&String(x.roster)===String(row.roster));if(self>=0)tied.splice(self,1);
            rank+=tied.map(x=>({...x,wins:res.wins,ovr:rosterOvr(x.roster,sl)})).filter(x=>lbRank(x,mine)<0).length;}}}catch(e){}
      run.submitted={team,rank};saveRun();box.innerHTML=submitHTML();wireSubmit();
    }catch(e){btn.disabled=false;msg.textContent="Couldn't reach the leaderboard. Try again."}
  };
  btn.onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go()};
}
async function openLb(size,m){
  lbSize=size||run.size;lbMode=m||(isPack()?"pack":"spin");document.getElementById("lb").hidden=false;
  const body=document.getElementById("lbBody"),want=[lbSize,lbMode].join();
  const tabs=`<div class="lbtabrow"><div class="seg lbtabs lbmodes" role="group" aria-label="Mode">${[["spin","Spin"],["pack","Packs"]].map(([v,l])=>`<button data-m="${v}" aria-pressed="${v===lbMode}">${l}</button>`).join("")}</div><div class="seg lbtabs" role="group" aria-label="Board">${[16,11].map(v=>`<button data-v="${v}" aria-pressed="${v===lbSize}">${v===11?"11 · Easy":"16 picks"}</button>`).join("")}</div></div>`;
  const wire=()=>body.querySelectorAll(".lbtabs button").forEach(b=>b.onclick=()=>b.dataset.m?openLb(lbSize,b.dataset.m):openLb(+b.dataset.v,lbMode));
  body.innerHTML=tabs+`<p class="hint">Loading…</p>`;wire();
  let rows;
  try{const r=await fetch(`${LB_URL}?select=team,wins,grade,rs,ra,roster,device,created_at&mode=eq.${lbMode}&size=eq.${lbSize}&order=wins.desc,created_at.asc&limit=100`,{headers:lbHead()});if(!r.ok)throw 0;rows=await r.json()}
  catch(e){if([lbSize,lbMode].join()!==want)return;body.innerHTML=tabs+`<p class="hint">Couldn't reach the leaderboard. Check your connection and try again.</p>`;wire();return}
  if([lbSize,lbMode].join()!==want)return;
  const slots=lbSize===16?FULL:STD,me=deviceId().slice(0,16);
  rows=rows.map(x=>({...x,ovr:rosterOvr(x.roster,slots)})).sort(lbRank).slice(0,50);
  const roster=x=>`<div class="lbroster">${x.roster.map((id,i)=>{const m=BYID.get(id);return m?`<span><i>${lbl(slots[i]).replace(/^SP1$/,"SP")}</i>${esc(m.name)}</span>`:""}).join("")}</div>`;
  const date=t=>new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"});
  body.innerHTML=tabs+(rows.length?`<ol class="lblist">${rows.map((x,i)=>`<li class="${x.device===me?"me":""}"><details><summary><span class="rk">${i+1}</span><span class="tm"><b>${esc(x.team)}</b><small>Team ${x.ovr} · ${date(x.created_at)}</small></span><span class="rec">${x.wins}–${162-x.wins}</span><span class="gd">${esc(x.grade)}</span></summary>${roster(x)}</details></li>`).join("")}</ol><p class="hint">Ranked by wins. Ties go to the higher team grade. Tap a team to see its roster.</p>`:`<p class="hint">No teams yet. Finish a season and be the first.</p>`);
  wire();
}
function closeLb(){document.getElementById("lb").hidden=true}

// ---------- wiring ----------
document.getElementById("lbBtn").onclick=()=>openLb(run.size);
document.getElementById("lbClose").onclick=closeLb;
document.getElementById("lb").addEventListener("click",e=>{if(e.target.id==="lb")closeLb()});
document.getElementById("sizeSeg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.disabled||+b.dataset.v===run.size)return;store.set("pbc2-size",b.dataset.v);document.getElementById("season").hidden=true;setMode(mode)});
document.getElementById("modeSeg").addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.dataset.v===mode)return;document.getElementById("season").hidden=true;setMode(b.dataset.v);window.scrollTo({top:0,behavior:"smooth"})});
document.getElementById("howBtn").onclick=openHow;
document.getElementById("howClose").onclick=closeHow;
document.getElementById("how").addEventListener("click",e=>{if(e.target.id==="how")closeHow()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeHow();closeLb()}});
setMode(store.get("pbc2-mode"));

