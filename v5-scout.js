/* v5: the scouting sheet, inside the game. Every Pokémon's rating at every spot, with tap-to-open cards. */
(() => {
 const $=id=>document.getElementById(id);
 const SPOTS=[...FIELD_SLOTS,'SP1','RP1'],lab=s=>s==='SP1'?'SP':s==='RP1'?'RP':s;
 const ALL=[...BASE,...LEGENDS],tier=v=>v>=90?'hi':v>=80?'md':v<60?'lo':'';
 const best=m=>SPOTS.reduce((a,s)=>posOvr(m,s)>posOvr(m,a)?s:a,SPOTS[0]);
 let sortBy='best',asc=false,q='',pool='base',group='field';
 function close(){$('scout')?.remove();document.documentElement.classList.remove('lg-lock')}
 window.openScout=function(){
  $('scout')?.remove();
  document.querySelectorAll('.sheet').forEach(s=>{if(!s.hidden)s.hidden=true});
  const el=document.createElement('div');el.id='scout';el.className='bg scout';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Scouting sheet');
  el.innerHTML=`<div class="bg-in"><header class="bg-top"><span>Scouting sheet</span><button type="button" class="btn" id="scClose">Close</button></header>
   <div class="sc-bar"><input id="scQ" type="search" autocomplete="off" placeholder="Find a Pokémon" aria-label="Find a Pokémon" value="${esc(q)}"><div class="seg" role="group" aria-label="Which Pokémon"><button type="button" data-pool="base">Regular</button><button type="button" data-pool="leg">Legendary</button><button type="button" data-pool="all">Everyone</button></div></div>
   <div class="sc-chips" id="scChips" role="group" aria-label="Rank by position"><button type="button" data-sort="best">Best</button>${SPOTS.map(s=>`<button type="button" data-sort="${s}">${lab(s)}</button>`).join('')}</div>
   <p class="sc-tip" id="scTip"></p>
   <div class="sc-list" id="scTable"></div>
   <details class="sc-stars"><summary>How many stars at each spot</summary><div class="bg-board"><table class="sc-dist"><thead><tr><th></th>${SPOTS.map(s=>`<th scope="col">${lab(s)}</th>`).join('')}</tr></thead><tbody>${[95,90,85].map(t=>`<tr><th scope="row">${t}+</th>${SPOTS.map(s=>`<td>${BASE.filter(m=>posOvr(m,s)>=t).length}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">Regular Pokémon only, out of ${BASE.length}.</p></details>
   <div class="sc-card" id="scCard" hidden></div></div>`;
  document.body.appendChild(el);document.documentElement.classList.add('lg-lock');
  $('scClose').onclick=close;el.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('scCard').hidden)hideCard();else close()}});
  $('scQ').oninput=e=>{q=e.target.value;list()};
  el.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;list()});
  $('scChips').onclick=e=>{const h=e.target.closest('[data-sort]');if(h){sortBy=h.dataset.sort;list();h.scrollIntoView({block:'nearest',inline:'center'})}};
  $('scTable').onclick=e=>{const r=e.target.closest('[data-id]');if(r)card(BYID.get(+r.dataset.id),r)};
  list();
 };
 const cache=new Map();
 const rowOf=m=>{let r=cache.get(m.id);if(!r){const v=SPOTS.map(s=>posOvr(m,s)),bi=v.indexOf(Math.max(...v));r={m,v,best:v[bi],bs:SPOTS[bi]};cache.set(m.id,r)}return r};
 const SPOTNAME={C:'catcher','1B':'first base','2B':'second base','3B':'third base',SS:'shortstop',LF:'left field',CF:'center field',RF:'right field',DH:'designated hitter',SP1:'starting pitcher',RP1:'reliever'};
 const LEGSET=new Set(LEGENDS.map(m=>m.id));
 function list(){
  const el=$('scout');if(!el)return;
  if(sortBy==='name')sortBy='best';
  el.querySelectorAll('[data-pool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pool===pool));
  el.querySelectorAll('#scChips [data-sort]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sort===sortBy));
  const term=q.trim().toLowerCase(),si=SPOTS.indexOf(sortBy),key=r=>si<0?r.best:r.v[si];
  let rows=(pool==='leg'?LEGENDS:pool==='base'?BASE:ALL).map(rowOf).sort((a,b)=>key(b)-key(a)||b.best-a.best);
  rows.forEach((r,i)=>r.rank=i+1);
  if(term)rows=rows.filter(r=>r.m.name.toLowerCase().includes(term));
  $('scTip').textContent=`${rows.length} Pokémon, ranked ${si<0?'by their best spot':'at '+SPOTNAME[sortBy]}. Tap one for its card.`;
  const ty=m=>m.types.map(t=>`<span style="background:${TYPE_COLORS[t]||'#777'}">${t}</span>`).join('');
  $('scTable').innerHTML=rows.length?rows.map(r=>{const v=key(r),leg=LEGSET.has(r.m.id);
   return `<button type="button" class="sc-row${leg?' leg':''}${r.m.shiny?' shy':''}" data-id="${r.m.id}"><i>${r.rank}</i>${tok(r.m)}<span class="who"><b>${esc(r.m.name)}${leg?'<small>Legendary</small>':''}</b><span class="ty">${ty(r.m)}<em>Best ${lab(r.bs)} ${r.best}</em></span></span><span class="rt ${tier(v)}">${v}${si<0?`<small>${lab(r.bs)}</small>`:''}</span></button>`}).join(''):`<p class="sc-none">No Pokémon named "${esc(q)}".</p>`;
 }
 let from=null;
 function hideCard(){const c=$('scCard');if(c){c.hidden=true;c.innerHTML=''}from?.focus({preventScroll:true})}
 // Evolution family: walk up to the first stage, then lay out every stage below it.
 const parentOf=n=>EVOLUTION_PARENT[n]||null;
 function family(num){
  let root=num;while(parentOf(root))root=parentOf(root);
  const stages=[[root]];
  for(;;){const next=Object.keys(EVOLUTION_PARENT).map(Number).filter(n=>stages[stages.length-1].includes(parentOf(n)));if(!next.length)break;stages.push(next.sort((a,b)=>a-b))}
  return stages.map(st=>st.map(n=>ALL.find(x=>x.num===n&&!x.shiny)).filter(Boolean)).filter(st=>st.length);
 }
 function evoHTML(m){
  const st=family(m.num);if(st.length<2)return '<p class="hint">Does not evolve.</p>';
  return `<div class="sc-evo">${st.map((stage,i)=>(i?'<i aria-hidden="true">›</i>':'')+`<div class="stage">${stage.map(x=>{const bb=best(x);return `<button type="button" data-evo="${x.id}"${x.num===m.num?' aria-current="true"':''}>${tok(x)}<span>${esc(x.name)}</span><b>${posOvr(x,bb)}<small>${lab(bb)}</small></b></button>`}).join('')}</div>`).join('')}</div>`;
 }
 function card(m,origin){
  from=origin||from;const c=$('scCard'),b=best(m);
  c.innerHTML=`<div class="sc-card-in"><button type="button" class="btn sc-back" id="scBack">Back to the list</button><div class="help-card">${tcardHTML(m)}</div>
   <h3>Rating at every spot</h3><div class="sc-grid">${SPOTS.map(s=>{const v=posOvr(m,s);return `<div class="${s===b?'best':''}"><small>${lab(s)}</small><b class="${tier(v)}">${v}</b></div>`}).join('')}</div>
   <p class="hint">Gold outline is its best spot. A fielder's rating is bat plus glove at that position.</p><h3>Evolution path</h3>${evoHTML(m)}</div>`;
  c.hidden=false;c.scrollTop=0;$('scBack').onclick=hideCard;$('scBack').focus({preventScroll:true});
  c.querySelectorAll('[data-evo]').forEach(x=>x.onclick=()=>{const n=BYID.get(+x.dataset.evo);if(n&&n.id!==m.id)card(n)});
  c.onclick=e=>{if(e.target===c)hideCard()};
 }
 // Links to the old scouting page open the in-game sheet instead.
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="sanity.html"]');if(a){e.preventDefault();openScout()}});
})();
// The old scouting page address now opens the sheet here.
if(new URLSearchParams(location.search).has('scout')){history.replaceState(null,'',location.pathname);setTimeout(()=>openScout(),50)}
