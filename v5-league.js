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

 // ---------- the League page ----------
 let scope='all',tab='week',form=null,note='',token=0,data=null;
 const sheet=document.createElement('div');sheet.className='bg league';sheet.id='lg';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','League');
 sheet.innerHTML='<div class="bg-in"><header class="bg-top"><span>League</span><button type="button" class="btn" id="lgClose">Close</button></header><div id="lgBody" class="lg-body"></div></div>';
 document.body.appendChild(sheet);
 const lock=on=>{document.documentElement.classList.toggle('lg-lock',on)};
 function close(){sheet.hidden=true;lock(false)}
 function open(){document.querySelectorAll('.sheet').forEach(x=>{if(!x.hidden)x.hidden=true});sheet.hidden=false;lock(true);sheet.scrollTop=0;note='';form=null;if(!mine().some(x=>x.code===scope))scope=mine()[0]?.code||'all';load();$('lgClose').focus({preventScroll:true})}
 $('lgClose').onclick=close;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close()});
 $('lgBtn').onclick=open;
 const labelBtn=()=>{const b=$('lgBtn');if(b)b.textContent='League';const t=document.querySelector('#tabbar [data-tab=league]');if(t)t.classList.toggle('due',!weeklyState().done)};
 const prevRender=render;render=function(){const v=prevRender.apply(this,arguments);labelBtn();return v};labelBtn();
 const isMine=d=>typeof isMyDevice==='function'?isMyDevice(d):d===deviceId().slice(0,16);
 const me=()=>deviceId().slice(0,16),wkNo=w=>+String(w).slice(-2);
 const SERIES=LB_URL.replace(/ballclub_scores$/,'ballclub_series');

 // Week winner trophy: you topped a finished week in one of your leagues (2+ players that week).
 function checkWeekWin(weeks){
  const now=weekKey();
  for(const w in weeks){if(w<now&&weeks[w].length>=2&&isMine(weeks[w][0].device)){try{if(!Clubhouse.read().weekWin)Clubhouse.sweep({weekWin:w})}catch(e){}return}}
 }
 setTimeout(async()=>{
  try{
   if(Clubhouse.read().weekWin||!mine().length)return;
   const day=new Date().toISOString().slice(0,10);if(store.get('pbc6-weekchk')===day)return;store.set('pbc6-weekchk',day);
   for(const code of mine().map(x=>x.code)){
    const r=await fetch(`${LB_URL}?select=team,wins,rs,ra,roster,device,week,created_at&mode=eq.pack&size=eq.16&week=lt.${weekKey()}&leagues=cs.%7B${code}%7D&order=created_at.desc&limit=600`,{headers:lbHead()});
    if(!r.ok)continue;const weeks={};
    for(const x of await r.json())(weeks[x.week]=weeks[x.week]||[]).push({...x,ovr:rosterOvr(x.roster,FULL)});
    for(const w in weeks){const seen=new Set();weeks[w]=weeks[w].sort(lbRank).filter(x=>!seen.has(x.device)&&seen.add(x.device))}
    checkWeekWin(weeks);if(Clubhouse.read().weekWin)return;
   }
  }catch(e){}
 },4000);

 async function load(){
  const my=++token;data=null;draw();
  const league=scope!=='all'?'&leagues=cs.%7B'+scope+'%7D':'&week=eq.'+weekKey();
  try{
   const [a,b]=await Promise.all([
    fetch(`${LB_URL}?select=team,wins,grade,rs,ra,roster,device,week,created_at&mode=eq.pack&size=eq.16&week=not.is.null${league}&order=created_at.desc&limit=600`,{headers:lbHead()}),
    scope!=='all'?fetch(`${SERIES}?select=team,opp_team,w,l,games,device,created_at&leagues=cs.%7B${scope}%7D&order=created_at.desc&limit=200`,{headers:lbHead()}):null]);
   if(!a.ok)throw 0;
   const scores=(await a.json()).map(x=>({...x,ovr:rosterOvr(x.roster,FULL)})),series=b&&b.ok?await b.json():[];
   if(my!==token)return;
   // Each player's best team per week, ranked.
   const weeks={},names={};
   for(const x of scores){(weeks[x.week]=weeks[x.week]||[]).push(x);if(!names[x.device])names[x.device]=x.team}
   for(const w in weeks){const seen=new Set();weeks[w]=weeks[w].sort(lbRank).filter(x=>!seen.has(x.device)&&seen.add(x.device))}
   data={weeks,names,series};
   if(scope!=='all')checkWeekWin(weeks);
  }catch(e){if(my!==token)return;data={error:true}}
  draw();
 }
 function weeklyCard(){
  const s=weeklyState(),n=wkNo(s.w),btn=s.done?(s.posted?'See results':'Post your team'):s.started?'Resume':'Play this week';
  const line=s.done?`You went <b>${s.wins}–${162-s.wins}</b>${s.posted?'':' but have not posted it'}.`:s.started?`In progress: pick ${Math.min(16,s.picks+1)} of 16.`:'Same pack at every pick for everyone. One attempt.';
  return `<section class="lg-week${s.done?' done':''}"><div><small>Weekly challenge · Week ${n}</small><p>${line}</p><em>${weekLeft()}</em></div><button type="button" class="btn${s.done&&s.posted?'':' primary'}" id="lgPlay">${btn}</button></section>`;
 }
 const medal=i=>i<3?` m${i+1}`:'';
 function weekRows(rows){
  const roster=x=>typeof lineupHTML==='function'?lineupHTML(x.roster):'';
  return `<ol class="lg-rows">${rows.map((x,i)=>`<li class="${isMine(x.device)?'me':''}"><details><summary><span class="rk${medal(i)}">${i+1}</span>${typeof starTok==="function"?starTok(x.roster):""}<span class="tm"><b>${esc(x.team)}${isMine(x.device)?'<i class="you">You</i>':''}</b><small>Rating ${x.ovr} · Grade ${esc(x.grade)}</small></span><span class="rec">${x.wins}–${162-x.wins}</span></summary>${roster(x)}${scope!=='all'&&typeof rivalSeriesButton==='function'?rivalSeriesButton(x):''}</details></li>`).join('')}</ol>`;
 }
 function tabWeek(){
  const rows=data.weeks[weekKey()]||[];
  if(!rows.length)return `<p class="lg-empty">${scope==='all'?'Nobody has posted this week\'s challenge yet. Be the first.':'Nobody in this league has posted this week yet. Play the challenge above, then post your team.'}</p>`;
  const lead=rows[0],mineRow=rows.find(x=>isMine(x.device)),gap=mineRow&&mineRow!==lead?lead.wins-mineRow.wins:0;
  return (mineRow?`<p class="lg-lead">${mineRow===lead?(rows.length>1?`You lead the week by ${lead.wins-rows[1].wins} win${lead.wins-rows[1].wins===1?'':'s'}.`:'You are the only one on the board. Invite your friends.'):`You are ${gap} win${gap===1?'':'s'} behind ${esc(lead.team)}.`}</p>`:'')+weekRows(rows)+'<p class="hint">Tap a team for its roster and to play it in a best of 7.</p>';
 }
 function tabSeason(){
  const PTS=[5,3,2],table={},wks=Object.keys(data.weeks).sort();
  for(const w of wks)data.weeks[w].forEach((x,i)=>{const t=table[x.device]=table[x.device]||{device:x.device,name:data.names[x.device],pts:0,won:0,played:0,best:0};t.pts+=PTS[i]||1;t.played++;if(i===0&&w!==weekKey())t.won++;t.best=Math.max(t.best,x.wins)});
  const rows=Object.values(table).sort((a,b)=>b.pts-a.pts||b.best-a.best);
  if(!rows.length)return '<p class="lg-empty">The season table fills in as weeks are played.</p>';
  const past=wks.filter(w=>w!==weekKey()).reverse().slice(0,8);
  return `<table class="lg-table"><thead><tr><th></th><th class="l">Club</th><th>Pts</th><th>Weeks won</th><th>Played</th><th>Best</th></tr></thead><tbody>${rows.map((t,i)=>`<tr class="${isMine(t.device)?'me':''}"><td><span class="rk${medal(i)}">${i+1}</span></td><th scope="row" class="l">${esc(t.name)}</th><td class="pts">${t.pts}</td><td>${t.won}</td><td>${t.played}</td><td>${t.best}–${162-t.best}</td></tr>`).join('')}</tbody></table>
   <p class="hint">Each week: 5 points for first, 3 for second, 2 for third, 1 for playing. A week counts as won once it ends.</p>
   ${past.length?`<h3 class="lg-h">Past champions</h3><ul class="lg-past">${past.map(w=>{const c=data.weeks[w][0];return `<li><small>Week ${wkNo(w)}</small><b>${esc(c.team)}</b><span>${c.wins}–${162-c.wins}</span></li>`}).join('')}</ul>`:''}`;
 }
 function tabSeries(){
  const s=data.series,rec={};
  for(const x of s){const t=rec[x.device]=rec[x.device]||{name:x.team,w:0,l:0,device:x.device};x.w>x.l?t.w++:t.l++}
  const rows=Object.values(rec).sort((a,b)=>(b.w-b.l)-(a.w-a.l)||b.w-a.w);
  const day=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  return `<button type="button" class="btn primary lg-pick" onclick="pickRival()">Play a rival series</button>`+
   (rows.length?`<table class="lg-table"><thead><tr><th></th><th class="l">Club</th><th>Series won</th><th>Lost</th></tr></thead><tbody>${rows.map((t,i)=>`<tr class="${isMine(t.device)?'me':''}"><td><span class="rk${medal(i)}">${i+1}</span></td><th scope="row" class="l">${esc(t.name)}</th><td class="pts">${t.w}</td><td>${t.l}</td></tr>`).join('')}</tbody></table>
   <h3 class="lg-h">Latest results</h3><ul class="lg-series">${s.slice(0,15).map(x=>{const won=x.w>x.l;return `<li class="${isMine(x.device)?'me':''}"><span><b>${esc(x.team)}</b> ${won?'beat':'lost to'} <b>${esc(x.opp_team)}</b></span><em>${Math.max(x.w,x.l)}–${Math.min(x.w,x.l)}</em><small>${[(x.games||[]).map(g=>g[0]>g[1]?'W':'L').join(' '),day(x.created_at)].filter(Boolean).join(' · ')}</small></li>`}).join('')}</ul>`
   :'<p class="lg-empty">No series yet. Play a league mate in a best of 7 and the result shows here for everyone.</p>');
 }
 function draw(){
  const body=$('lgBody'),ls=mine(),cur=ls.find(x=>x.code===scope);
  const clubs=data&&!data.error?Object.keys(data.names).length:0;
  const hero=cur?`<section class="lg-hero"><small>Your league</small><h2>${esc(cur.name)}</h2><p>${clubs?`${clubs} club${clubs===1?'':'s'} on the board · `:''}Code <b>${cur.code}</b></p><div><button type="button" class="btn primary" id="lgInvite">Invite friends</button><button type="button" class="btn" id="lgShare">Share standings</button>${ls.length>1||ls.length<3?`<button type="button" class="btn" id="lgSwitch">${ls.length>1?'Switch league':'Join another'}</button>`:''}</div></section>`
   :`<section class="lg-hero none"><small>No league yet</small><h2>Play with friends</h2><p>Start a league, send the code, and everyone is ranked on the same weekly packs.</p><div><button type="button" class="btn primary" id="lgSwitch">Start or join a league</button></div></section>`;
  const picker=form?`<div class="lg-form">${ls.length?`<div class="lg-chips" role="group" aria-label="Your leagues">${ls.map(x=>`<button type="button" data-scope="${x.code}" aria-pressed="${scope===x.code}">${esc(x.name)}</button>`).join('')}</div>`:''}${ls.length<3?`<label for="lgCode">Join with a code</label><div><input id="lgCode" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="5 characters"><button type="button" class="btn" id="lgJoin">Join</button></div><label for="lgName">Or start a league</label><div><input id="lgName" maxlength="24" autocomplete="off" placeholder="League name"><button type="button" class="btn" id="lgMake">Create</button></div>`:'<p class="hint">You can be in 3 leagues. Leave one to join another.</p>'}${cur?`<button type="button" class="btn quiet" id="lgLeave">Leave ${esc(cur.name)}</button>`:''}</div>`:'';
  const tabs=cur?`<div class="lg-tabs" role="tablist">${[['week','This week'],['season','Season'],['series','Series']].map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>`:`<h3 class="lg-h">This week, everyone</h3>`;
  const content=!data?'<p class="lg-empty">Loading…</p>':data.error?'<p class="lg-empty">Couldn\'t reach the leaderboard. Check your connection and try again.</p>':(!cur||tab==='week')?tabWeek():tab==='season'?tabSeason():tabSeries();
  body.innerHTML=hero+picker+(note?`<p class="lg-note" role="status">${esc(note)}</p>`:'')+weeklyCard()+tabs+`<div id="lgList" class="lg-panel">${content}</div>`;
  $('lgPlay').onclick=playWeekly;
  body.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;note='';form=null;load()});
  body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draw()});
  if($('lgSwitch'))$('lgSwitch').onclick=()=>{form=!form;note='';draw();$('lgCode')?.focus()};
  if($('lgJoin')){$('lgJoin').onclick=()=>join($('lgCode').value);$('lgCode').onkeydown=e=>{if(e.key==='Enter')join($('lgCode').value)}}
  if($('lgMake')){$('lgMake').onclick=()=>make($('lgName').value);$('lgName').onkeydown=e=>{if(e.key==='Enter')make($('lgName').value)}}
  if($('lgInvite'))$('lgInvite').onclick=()=>invite(cur);
  if($('lgShare'))$('lgShare').onclick=()=>standings(cur);
  if($('lgLeave'))$('lgLeave').onclick=()=>{keep(mine().filter(x=>x.code!==cur.code));note=`Left ${cur.name}.`;scope=mine()[0]?.code||'all';form=null;load()};
  if(data&&!data.error&&cur&&typeof wireRivalSeries==='function'&&tab==='week')wireRivalSeries($('lgList'),data.weeks[weekKey()]||[],cur.code);
 }
 async function lookup(code){const r=await fetch(`${LEAGUE_URL}?select=code,name&code=eq.${code}`,{headers:lbHead()});if(!r.ok)throw 0;return (await r.json())[0]||null}
 async function join(raw,quiet){
  const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!CODE.test(code)){note='A league code is 5 letters and numbers.';draw();return}
  if(mine().some(x=>x.code===code)){scope=code;form=null;note='';load();return}
  if(mine().length>=3){note='You can be in 3 leagues. Leave one first.';draw();return}
  try{const l=await lookup(code);if(!l){note=`No league with code ${code}.`;draw();return}
   keep([...mine(),{code:l.code,name:l.name}]);scope=l.code;form=null;note=`Joined ${l.name}. Play the weekly challenge and post your team to get on the board.`;load()}
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
    keep([...mine(),{code,name}]);scope=code;form=null;note=`${name} is ready. Share code ${code} with your friends.`;load();return}
   catch(e){break}
  }
  note="Couldn't create the league. Try again.";draw();
 }
 async function standings(l){
  const rows=(data&&!data.error&&data.weeks[weekKey()])||[],wk=Number(weekKey().split('-W')[1]),link=`${SITE.replace(/^https:\/\//,'')}?league=${l.code}`;
  const text=rows.length?`⚾ ${l.name} · Week ${wk}\n${rows.slice(0,10).map((x,i)=>`${i+1}. ${x.team} ${x.wins}–${162-x.wins}`).join('\n')}${rows.length>10?`\n+${rows.length-10} more`:''}\nResets Monday: ${link}`
   :`⚾ ${l.name} · Week ${wk}\nNo teams on the board yet. Be the first.\n${link}`;
  try{if(navigator.share&&matchMedia('(pointer:coarse)').matches){await navigator.share({text});return}await navigator.clipboard.writeText(text);note='Standings copied.'}catch(e){if(e?.name==='AbortError')return;note='Could not share from this browser.'}
  draw();
 }
 async function invite(l){
  const text=`⚾ Join my Pokémon Ballclub league, ${l.name}.\nEveryone gets the same 16 packs each week. Best record wins.\n${SITE.replace(/^https:\/\//,'')}?league=${l.code}`;
  try{if(navigator.share){await navigator.share({text});return}await navigator.clipboard.writeText(text);note='Invite copied.'}catch(e){if(e?.name==='AbortError')return;note=`Share code ${l.code} with your friends.`}
  draw();
 }
 // Say where a posted team counts, before and after posting.
 const baseSubmit=submitHTML;
 submitHTML=function(){
  const done=run.submitted,codes=done?(done.leagues||[]):leagueCodes(),names=mine().filter(x=>codes.includes(x.code)).map(x=>x.name);
  const where=['Leaderboard',...((done?done.week:run.week)?['Weekly challenge']:[]),...names];
  return baseSubmit()+`<p class="post-where">${done?'Counts on':'Posts to'}: ${where.map(esc).join(' · ')}</p>`;
 };
 // Invite links: ?league=CODE joins and opens the sheet.
 const invited=new URLSearchParams(location.search).get('league');
 if(invited){history.replaceState(null,'',location.pathname);sheet.hidden=false;lock(true);join(invited)}
})();
