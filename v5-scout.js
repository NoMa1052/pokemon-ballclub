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
   <div class="sc-bar"><input id="scQ" type="search" autocomplete="off" placeholder="Find a Pokémon" aria-label="Find a Pokémon" value="${esc(q)}"><div class="seg" role="group" aria-label="Which Pokémon"><button type="button" data-pool="base">Regular</button><button type="button" data-pool="leg">Legendary</button><button type="button" data-pool="all">All</button></div></div>
   <div class="seg sc-groups" role="group" aria-label="Columns"><button type="button" data-group="field">Fielding</button><button type="button" data-group="pitch">Pitching</button></div><p class="sc-tip" id="scTip"></p>
   <div class="sc-wrap"><table class="sc-table" id="scTable"></table></div>
   <details class="sc-stars"><summary>How many stars at each spot</summary><div class="bg-board"><table class="sc-dist"><thead><tr><th></th>${SPOTS.map(s=>`<th scope="col">${lab(s)}</th>`).join('')}</tr></thead><tbody>${[95,90,85].map(t=>`<tr><th scope="row">${t}+</th>${SPOTS.map(s=>`<td>${BASE.filter(m=>posOvr(m,s)>=t).length}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">Regular Pokémon only, out of ${BASE.length}.</p></details>
   <div class="sc-card" id="scCard" hidden></div></div>`;
  document.body.appendChild(el);document.documentElement.classList.add('lg-lock');
  $('scClose').onclick=close;el.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('scCard').hidden)hideCard();else close()}});
  $('scQ').oninput=e=>{q=e.target.value;list()};
  el.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;list()});
  el.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;if(group==='pitch'&&!['SP1','RP1','best','name'].includes(sortBy))sortBy='SP1';if(group==='field'&&['SP1','RP1'].includes(sortBy))sortBy='best';list()});
  $('scTable').onclick=e=>{
   const h=e.target.closest('[data-sort]');if(h){const k=h.dataset.sort;if(sortBy===k)asc=!asc;else{sortBy=k;asc=false}list();return}
   const r=e.target.closest('[data-id]');if(r)card(BYID.get(+r.dataset.id),r);
  };
  list();
 };
 const cache=new Map();
 const rowOf=m=>{let r=cache.get(m.id);if(!r){const v=SPOTS.map(s=>posOvr(m,s)),bi=v.indexOf(Math.max(...v));r={m,v,best:v[bi],bs:SPOTS[bi]};cache.set(m.id,r)}return r};
 function list(){
  const el=$('scout');if(!el)return;
  el.querySelectorAll('[data-pool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pool===pool));
  el.dataset.group=group;el.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.group===group));
  const term=q.trim().toLowerCase(),key=r=>sortBy==='best'?r.best:sortBy==='name'?r.m.name:r.v[SPOTS.indexOf(sortBy)];
  let rows=(pool==='leg'?LEGENDS:pool==='base'?BASE:ALL).map(rowOf);
  rows.sort((a,b)=>sortBy==='name'?(asc?-1:1)*a.m.name.localeCompare(b.m.name)*-1:(asc?1:-1)*(key(a)-key(b))||b.best-a.best);
  if(term)rows=rows.filter(r=>r.m.name.toLowerCase().includes(term));
  const grp=k=>k==='SP1'||k==='RP1'?' gp':FIELD_SLOTS.includes(k)?' gf':'';
  const th=(k,l)=>`<th scope="col" class="${sortBy===k?'on':''}${grp(k)}"><button type="button" data-sort="${k}" aria-label="Sort by ${l}">${l}${sortBy===k?(asc?' ▲':' ▼'):''}</button></th>`;
  $('scTip').textContent=`${rows.length} Pokémon. Tap a column to sort. Gold outline is each one's best spot. Tap a name for its card.`;
  $('scTable').innerHTML=`<thead><tr>${th('name','Pokémon')}${th('best','Best')}${SPOTS.map(s=>th(s,lab(s))).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><th scope="row"><button type="button" data-id="${r.m.id}">${tok(r.m)}<span>${esc(r.m.name)}</span></button></th><td class="b ${tier(r.best)}">${r.best}<small>${lab(r.bs)}</small></td>${r.v.map((v,i)=>`<td class="${tier(v)}${SPOTS[i]===sortBy?' on':''}${SPOTS[i]===r.bs?' best':''}${grp(SPOTS[i])}">${v}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="13" class="sc-none">No Pokémon named "${esc(q)}".</td></tr>`}</tbody>`;
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
