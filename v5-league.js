/* v5 phase 3: weekly challenge (same packs for everyone, one attempt) and friends leagues (join by code). */
(() => {
 const $=id=>document.getElementById(id);
 const LEAGUE_URL=LB_URL.replace(/ballclub_scores$/,'ballclub_leagues'),SITE='https://pokemon-ballclub.vercel.app/';
 const KEY='pbc5-leagues',CODE=/^[A-Z2-9]{5}$/;
 const mine=()=>{try{const a=JSON.parse(store.get(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&CODE.test(x.code)).slice(0,3):[]}catch(e){return[]}};
 const keep=a=>store.set(KEY,JSON.stringify(a.slice(0,3)));
 window.leagueCodes=()=>mine().map(x=>x.code);

 // ISO week in UTC: a new challenge starts every Monday at 00:00 UTC.
 function weekKey(d=new Date()){
  const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())),day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);
  const y=t.getUTCFullYear();return y+'-W'+String(Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7)).padStart(2,'0');
 }
 function weekLeft(){
  const d=new Date(),day=d.getUTCDay()||7,end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+8-day),h=Math.max(1,Math.round((end-d)/36e5));
  return h>=48?`${Math.round(h/24)} days left`:h>=24?'1 day left':`${h} hour${h===1?'':'s'} left`;
 }
 const wkStore=w=>'pbc5-weekly-'+w;
 function weeklyState(){
  const w=weekKey();let o=null;try{o=JSON.parse(store.get(wkStore(w))||'null')}catch(e){}
  return{w,started:!!o&&((o.picks?.length||0)>0||!!o.spin),done:!!o?.result,wins:o?.result?.wins,picks:o?.picks?.length||0,posted:!!o?.submitted};
 }
 function playWeekly(){
  const w=weekKey();spinning=false;mode='pack';
  run=loadRun('pack',wkStore(w))||{...makeRun('pack',16,true,hash('weekly-'+w)),keeps:{type:1,gen:1},doubles:1,releases:1,candies:1,week:w};
  run.week=w;close();$('season').hidden=true;saveRun();render();
  if(run.locked&&run.result)finish(false);else scrollTo({top:0});
 }
 // Weekly packs come from the week and the pick number alone, so every player opens the same pack at each pick.
 // A re-rip at the same pick gives everyone the same second pack.
 const basePack=packSpin;
 packSpin=function(r,taken){
  if(r.week){const idx=r.picks.length+(r.developmentActions||0),n=r.wkRoll&&r.wkRoll.idx===idx?r.wkRoll.n+1:0;r.wkRoll={idx,n};r.draws=idx*1000+n*100}
  return basePack(r,taken);
 };

 let scope='all',board='week',form=null,note='',token=0,view='league';
 const sheet=document.createElement('div');sheet.className='sheet';sheet.id='lg';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','lgTitle');
 sheet.innerHTML='<div class="sheet-in"><div class="sheet-top"><h2 id="lgTitle">League</h2><button class="btn" id="lgClose">Close</button></div><div class="sheet-body" id="lgBody"></div></div>';
 document.body.appendChild(sheet);
 const lock=on=>{document.documentElement.classList.toggle('lg-lock',on)};
 function close(){sheet.hidden=true;lock(false)}
 function open(){sheet.hidden=false;lock(true);$('lgBody').scrollTop=0;note='';form=null;if(!mine().some(x=>x.code===scope))scope=mine()[0]?.code||'all';draw();$('lgClose').focus({preventScroll:true})}
 $('lgClose').onclick=close;sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close()});
 $('lgBtn').onclick=open;
 // Before a run the button doubles as the weekly challenge prompt; mid-run it is a short label.
 const labelBtn=()=>{const b=$('lgBtn');if(b)b.textContent=innerWidth<1000&&!document.body.classList.contains('draft-started')?`Weekly challenge · ${weekLeft()}`:'League'};
 const prevRender=render;render=function(){const v=prevRender.apply(this,arguments);labelBtn();return v};labelBtn();

 function weeklyCard(){
  const s=weeklyState(),n=+s.w.slice(-2);
  const act=s.done?`<p class="lg-status">You went <b>${s.wins}–${162-s.wins}</b>.${s.posted?' Posted.':' Post it from the results page to count.'}</p><button type="button" class="btn" id="lgPlay">See your results</button>`
   :s.started?`<p class="lg-status">In progress: pick ${Math.min(16,s.picks+1)} of 16.</p><button type="button" class="btn primary" id="lgPlay">Resume</button>`
   :`<button type="button" class="btn primary" id="lgPlay">Play this week</button>`;
  if(s.done)return `<section class="lg-week done"><div><small>Weekly challenge · week ${n} · ${weekLeft()}</small><p class="lg-status">You went <b>${s.wins}–${162-s.wins}</b>. ${s.posted?'Posted.':'Not posted yet.'}</p></div><button type="button" class="btn" id="lgPlay">${s.posted?'Results':'Post it'}</button></section>`;
  return `<section class="lg-week"><small>Weekly challenge · week ${n} · ${weekLeft()}</small><h3>Same 16 packs for everyone. One attempt.</h3><p>Every player opens the same pack at each pick, so the week goes to the best drafter. Packs, Standard.</p>${act}</section>`;
 }
 function draw(){
  const body=$('lgBody'),ls=mine(),cur=ls.find(x=>x.code===scope);
  const chip=(v,l,on)=>`<button type="button" data-scope="${v}" aria-pressed="${on}">${esc(l)}</button>`;
  const views=`<div class="seg lg-view" role="group" aria-label="View"><button type="button" data-view="league" aria-pressed="${view==='league'}">League</button><button type="button" data-view="dex" aria-pressed="${view==='dex'}">Collection</button></div>`;
  const wireViews=()=>body.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;draw()});
  if(view==='dex'&&typeof collectionHTML==='function'){token++;body.innerHTML=views+collectionHTML();wireViews();return}
  body.innerHTML=views+weeklyCard()
   +`<div class="lg-chips" role="group" aria-label="Whose teams">${ls.map(x=>chip(x.code,x.name,scope===x.code)).join('')}${ls.length<3?'<button type="button" id="lgAdd">Join or create</button>':''}</div>`
   +(form?`<div class="lg-form"><label for="lgCode">Join with a code</label><div><input id="lgCode" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="5 characters"><button type="button" class="btn" id="lgJoin">Join</button></div><label for="lgName">Or start a league</label><div><input id="lgName" maxlength="24" autocomplete="off" placeholder="League name"><button type="button" class="btn" id="lgMake">Create</button></div></div>`:'')
   +(note?`<p class="lg-note" role="status">${esc(note)}</p>`:'')
   +(cur?`<div class="lg-admin"><span>Code <b>${cur.code}</b></span><button type="button" class="btn" id="lgInvite">Invite</button><button type="button" class="btn quiet" id="lgLeave">Leave</button></div>`:'')
   +`<h3 class="lg-h">This week's standings <span>${cur?esc(cur.name):'Everyone'}</span></h3><div id="lgList"><p class="hint">Loading…</p></div>`;
  $('lgPlay').onclick=playWeekly;
  wireViews();
  body.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;note='';draw()});
  if($('lgAdd'))$('lgAdd').onclick=()=>{form=!form;note='';draw();$('lgCode')?.focus()};
  if($('lgJoin')){$('lgJoin').onclick=()=>join($('lgCode').value);$('lgCode').onkeydown=e=>{if(e.key==='Enter')join($('lgCode').value)}}
  if($('lgMake')){$('lgMake').onclick=()=>make($('lgName').value);$('lgName').onkeydown=e=>{if(e.key==='Enter')make($('lgName').value)}}
  if($('lgInvite'))$('lgInvite').onclick=()=>invite(cur);
  if($('lgLeave'))$('lgLeave').onclick=()=>{keep(mine().filter(x=>x.code!==cur.code));note=`Left ${cur.name}.`;scope=mine()[0]?.code||'all';draw()};
  list();
 }
 async function list(){
  const my=++token,w=weekKey(),me=deviceId().slice(0,16);
  const q=`${LB_URL}?select=team,wins,grade,rs,ra,roster,device,created_at&mode=eq.pack&size=eq.16${board==='week'?'&week=eq.'+w:''}${scope!=='all'?'&leagues=cs.%7B'+scope+'%7D':''}&order=wins.desc,created_at.asc&limit=200`;
  let rows;
  try{const r=await fetch(q,{headers:lbHead()});if(!r.ok)throw 0;rows=await r.json()}
  catch(e){if(my===token&&$('lgList'))$('lgList').innerHTML='<p class="hint">Couldn\'t reach the leaderboard. Check your connection and try again.</p>';return}
  if(my!==token||!$('lgList'))return;
  // One line per player: their best team on this board.
  const seen=new Set();
  rows=rows.map(x=>({...x,ovr:rosterOvr(x.roster,FULL)})).sort(lbRank).filter(x=>!seen.has(x.device)&&seen.add(x.device)).slice(0,50);
  const roster=x=>`<div class="lbroster">${x.roster.map((id,i)=>{const m=BYID.get(id);return m?`<span><i>${lbl(FULL[i]).replace(/^SP1$/,'SP')}</i>${esc(m.name)}</span>`:''}).join('')}</div>`;
  const empty=scope==='all'?'Nobody has posted the weekly challenge yet. Be the first.':'Nobody in this league has posted the weekly challenge yet. Play it above, then post your team.';
  $('lgList').innerHTML=rows.length?`<ol class="lblist">${rows.map((x,i)=>`<li class="${x.device===me?'me':''}"><details><summary><span class="rk">${i+1}</span><span class="tm"><b>${esc(x.team)}</b><small>Team ${x.ovr}</small></span><span class="rec">${x.wins}–${162-x.wins}</span><span class="gd">${esc(x.grade)}</span></summary>${roster(x)}${typeof rivalSeriesButton==='function'?rivalSeriesButton(x):''}</details></li>`).join('')}</ol>${scope!=='all'&&rows.length===1&&rows[0].device===me?'<p class="lg-solo">Only your team is here so far. Tap Invite to send your friends the code.</p>':''}<p class="hint">Weekly challenge teams only. Tap a team for its roster. All-time boards are in Records.</p>`:`<p class="hint">${empty}</p>`;
  if(typeof wireRivalSeries==='function')wireRivalSeries($('lgList'),rows);
 }
 async function lookup(code){const r=await fetch(`${LEAGUE_URL}?select=code,name&code=eq.${code}`,{headers:lbHead()});if(!r.ok)throw 0;return (await r.json())[0]||null}
 async function join(raw,quiet){
  const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!CODE.test(code)){note='A league code is 5 letters and numbers.';draw();return}
  if(mine().some(x=>x.code===code)){scope=code;form=null;note='';draw();return}
  if(mine().length>=3){note='You can be in 3 leagues. Leave one first.';draw();return}
  try{const l=await lookup(code);if(!l){note=`No league with code ${code}.`;draw();return}
   keep([...mine(),{code:l.code,name:l.name}]);scope=l.code;form=null;note=`Joined ${l.name}. Play the weekly challenge and post your team to get on the board.`;draw()}
  catch(e){note="Couldn't reach the league list. Try again.";draw()}
 }
 async function make(raw){
  const name=String(raw||'').replace(/\s+/g,' ').trim().slice(0,24);
  if(!name){note='Give the league a name first.';draw();return}
  if(mine().length>=3){note='You can be in 3 leagues. Leave one first.';draw();return}
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<3;attempt++){
   const code=Array.from({length:5},()=>A[Math.floor(Math.random()*A.length)]).join('');
   try{const r=await fetch(LEAGUE_URL,{method:'POST',headers:lbHead({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({code,name})});
    if(r.status===409)continue;if(!r.ok)throw 0;
    keep([...mine(),{code,name}]);scope=code;form=null;note=`${name} is ready. Share code ${code} with your friends.`;draw();return}
   catch(e){break}
  }
  note="Couldn't create the league. Try again.";draw();
 }
 async function invite(l){
  const text=`Join my Pokémon Ballclub league "${l.name}". Code ${l.code}: ${SITE}?league=${l.code}`;
  try{if(navigator.share){await navigator.share({text});return}await navigator.clipboard.writeText(text);note='Invite copied.'}catch(e){if(e?.name==='AbortError')return;note=`Share code ${l.code} with your friends.`}
  draw();
 }
 // Say where a posted team counts, before and after posting.
 const baseSubmit=submitHTML;
 submitHTML=function(){
  const done=run.submitted,codes=done?(done.leagues||[]):leagueCodes(),names=mine().filter(x=>codes.includes(x.code)).map(x=>x.name);
  const where=[`${isPack()?'Packs':'Spin'} ${run.size===11?'Quick':'Standard'} board`,...((done?done.week:run.week)?['Weekly challenge']:[]),...names];
  return baseSubmit()+`<p class="post-where">${done?'Counts on':'Posts to'}: ${where.map(esc).join(' · ')}</p>`;
 };
 // Invite links: ?league=CODE joins and opens the sheet.
 const invited=new URLSearchParams(location.search).get('league');
 if(invited){history.replaceState(null,'',location.pathname);sheet.hidden=false;lock(true);join(invited)}
})();
