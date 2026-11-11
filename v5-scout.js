/* v5: the scouting sheet, inside the game. Every Pokémon's rating at every spot, with tap-to-open cards. */
(() => {
 const $=id=>document.getElementById(id);
 const SPOTS=[...FIELD_SLOTS,'SP1','RP1'],lab=s=>s==='SP1'?'SP':s==='RP1'?'RP':s;
 const ALL=[...BASE,...LEGENDS],tier=v=>v>=90?'hi':v>=80?'md':v<60?'lo':'';
 const best=m=>SPOTS.reduce((a,s)=>posOvr(m,s)>posOvr(m,a)?s:a,SPOTS[0]);
 let spot='SS',q='',pool='all',worst=false,shown=30;
 function close(){$('scout')?.remove();document.documentElement.classList.remove('lg-lock')}
 window.openScout=function(){
  $('scout')?.remove();
  document.querySelectorAll('.sheet').forEach(s=>{if(!s.hidden)s.hidden=true});
  const el=document.createElement('div');el.id='scout';el.className='bg scout';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Scouting sheet');
  el.innerHTML=`<div class="bg-in"><header class="bg-top"><span>Scouting sheet</span><button type="button" class="btn" id="scClose">Close</button></header>
   <h2 class="sc-title">Every Pokémon, every spot</h2>
   <label class="sc-search"><span>Find a Pokémon</span><input id="scQ" type="search" autocomplete="off" placeholder="Name" value="${esc(q)}"></label>
   <div class="sc-chips" id="scSpots" role="group" aria-label="Position">${SPOTS.map(s=>`<button type="button" data-s="${s}">${lab(s)}</button>`).join('')}</div>
   <div class="sc-opts"><div class="seg" role="group" aria-label="Which Pokémon"><button type="button" data-pool="all">All</button><button type="button" data-pool="base">Regular</button><button type="button" data-pool="leg">Legendary</button></div><button type="button" class="btn" id="scOrder"></button></div>
   <ol class="sc-list" id="scList"></ol><button type="button" class="btn sc-more" id="scMore">Show more</button>
   <details class="sc-stars"><summary>How many stars at each spot</summary><div class="bg-board"><table class="sc-dist"><thead><tr><th></th>${SPOTS.map(s=>`<th scope="col">${lab(s)}</th>`).join('')}</tr></thead><tbody>${[95,90,85].map(t=>`<tr><th scope="row">${t}+</th>${SPOTS.map(s=>`<td>${BASE.filter(m=>posOvr(m,s)>=t).length}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">Regular Pokémon only, out of ${BASE.length}.</p></details>
   <div class="sc-card" id="scCard" hidden></div></div>`;
  document.body.appendChild(el);document.documentElement.classList.add('lg-lock');
  $('scClose').onclick=close;el.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('scCard').hidden)hideCard();else close()}});
  $('scQ').oninput=e=>{q=e.target.value;shown=30;list()};
  $('scSpots').onclick=e=>{const b=e.target.closest('button');if(b){spot=b.dataset.s;shown=30;list()}};
  el.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;shown=30;list()});
  $('scOrder').onclick=()=>{worst=!worst;shown=30;list()};
  $('scMore').onclick=()=>{shown+=30;list()};
  list();
 };
 function list(){
  const el=$('scout');if(!el)return;
  el.querySelectorAll('#scSpots button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===spot));
  el.querySelectorAll('[data-pool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pool===pool));
  $('scOrder').textContent=worst?'Worst first':'Best first';
  const term=q.trim().toLowerCase();
  let rows=(pool==='leg'?LEGENDS:pool==='base'?BASE:ALL).map(m=>[m,posOvr(m,spot)]).sort((a,b)=>worst?a[1]-b[1]:b[1]-a[1]).map((x,i)=>[...x,i+1]);
  if(term)rows=rows.filter(([m])=>m.name.toLowerCase().includes(term));
  const total=rows.length;rows=rows.slice(0,shown);
  $('scList').innerHTML=rows.length?rows.map(([m,v,rank])=>{const b=best(m);return `<li><button type="button" data-id="${m.id}"><i>${rank}</i>${tok(m)}<span><b>${esc(m.name)}</b><small>${m.leg?'Legendary · ':''}Best at ${lab(b)} ${posOvr(m,b)}</small></span><em class="${tier(v)}">${v}<small>${lab(spot)}</small></em></button></li>`}).join(''):`<li class="sc-none">No Pokémon named "${esc(q)}".</li>`;
  $('scMore').hidden=total<=shown;
  $('scList').querySelectorAll('button').forEach(b=>b.onclick=()=>card(BYID.get(+b.dataset.id),b));
 }
 let from=null;
 function hideCard(){const c=$('scCard');if(c){c.hidden=true;c.innerHTML=''}from?.focus({preventScroll:true})}
 function card(m,origin){
  from=origin;const c=$('scCard'),b=best(m);
  c.innerHTML=`<div class="sc-card-in"><button type="button" class="btn sc-back" id="scBack">Back to the list</button><div class="help-card">${tcardHTML(m)}</div>
   <h3>Rating at every spot</h3><div class="sc-grid">${SPOTS.map(s=>{const v=posOvr(m,s);return `<div class="${s===b?'best':''}"><small>${lab(s)}</small><b class="${tier(v)}">${v}</b></div>`}).join('')}</div>
   <p class="hint">Gold outline is its best spot. A fielder's rating is bat plus glove at that position.</p></div>`;
  c.hidden=false;c.scrollTop=0;$('scBack').onclick=hideCard;$('scBack').focus({preventScroll:true});
  c.onclick=e=>{if(e.target===c)hideCard()};
 }
 // Links to the old scouting page open the in-game sheet instead.
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="sanity.html"]');if(a){e.preventDefault();openScout()}});
})();
// The old scouting page address now opens the sheet here.
if(new URLSearchParams(location.search).has('scout')){history.replaceState(null,'',location.pathname);setTimeout(()=>openScout(),50)}
