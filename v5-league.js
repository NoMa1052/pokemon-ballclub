/* v5 phase 3: weekly challenge (same packs for everyone, one attempt) and friends leagues (join by code). */
(() => {
 const $=id=>document.getElementById(id);
 const LEAGUE_URL=LB_URL.replace(/ballclub_scores$/,'ballclub_leagues'),SITE='https://pokemon-ballclub.vercel.app/';
 const KEY='pbc5-leagues',CODE=/^[A-Z2-9]{5}$/;
 const mine=()=>{if(!window.Account?.user)return [];const owner=store.get('pbc-leagues-owner');if(owner&&owner!==Account.user.id)return [];try{const a=JSON.parse(store.get(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&CODE.test(x.code)).slice(0,3):[]}catch(e){return[]}};
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
    const r=await fetch(`${LB_URL}?select=league_players,team,wins,rs,ra,roster,device,week,created_at&mode=eq.pack&size=eq.16&week=lt.${weekKey()}&leagues=cs.%7B${code}%7D&order=created_at.desc&limit=600`,{headers:lbHead()});
    if(!r.ok)continue;const weeks={};
    for(const x of await r.json())(weeks[x.week]=weeks[x.week]||[]).push({...identify(x,code),ovr:rosterOvr(x.roster,FULL)});
    for(const w in weeks){const seen=new Set();weeks[w]=weeks[w].sort(lbRank).filter(x=>!seen.has(playerKey(x))&&seen.add(playerKey(x)))}
    checkWeekWin(weeks);if(Clubhouse.read().weekWin)return;
   }
  }catch(e){}
 },4000);

 const playerKey=x=>x.memberKey||'device:'+x.device;
 const playerName=x=>x.displayName||x.team;
 function identify(row,code){
  const player=row.league_players?.[code];
  return {...row,memberKey:player?.key,displayName:player?.name};
 }
 let personal={};
 async function checkWeeklyPost(request,w){
  try{
   const linked=window.Account?.user?JSON.parse(store.get('pbc6-devices')||'[]'):[];
   const devices=[...new Set([me(),...linked])].filter(d=>typeof d==='string'&&/^[a-z0-9_-]+$/i.test(d));
   const query=new URLSearchParams({select:'team,wins,roster',mode:'eq.pack',size:'eq.16',week:'eq.'+w,device:'in.('+devices.join(',')+')',order:'wins.desc,created_at.asc',limit:'1'});
   const response=await fetch(LB_URL+'?'+query,{headers:lbHead()});
   if(!response.ok)throw Error();
   const [row]=await response.json();
   if(request===token)personal={w,row};
  }catch(e){if(request===token)personal={w,error:true}}
  if(request===token)draw();
 }
 function postedWeekly(w){
  return data?.weeks?.[w]?.find(x=>isMine(x.device))||(personal.w===w&&personal.row);
 }
 async function load(){
  const my=++token,w=weekKey();data=null;personal={w,pending:true};draw();checkWeeklyPost(my,w);
  if(!mine().some(l=>l.code===scope))return;
  const league='&leagues=cs.%7B'+scope+'%7D';
  try{
   const [a,b]=await Promise.all([
    fetch(`${LB_URL}?select=league_players,team,wins,grade,rs,ra,roster,device,week,created_at,leagues&mode=eq.pack&size=eq.16&week=not.is.null${league}&order=created_at.desc&limit=600`,{headers:lbHead()}),
    scope!=='all'?readLeagueSeries(scope,200):[]]);
   if(!a.ok)throw 0;
   const scores=(await a.json()).map(x=>({...identify(x,scope),ovr:rosterOvr(x.roster,FULL)})),opponents=new Map(scores.filter(x=>x.displayName).map(x=>[JSON.stringify([x.device,x.team]),x])),series=b.map(x=>{const o=opponents.get(JSON.stringify([x.opp_device,x.opp_team]));return {...identify(x,scope),opponentName:o?.displayName,opponentKey:o?.memberKey}});
   if(my!==token)return;
   // Each player's best team per week, ranked.
   const weeks={},names={};
   for(const x of scores){(weeks[x.week]=weeks[x.week]||[]).push(x);if(!names[playerKey(x)])names[playerKey(x)]=playerName(x)}
   for(const w in weeks){const seen=new Set();weeks[w]=weeks[w].sort(lbRank).filter(x=>!seen.has(playerKey(x))&&seen.add(playerKey(x)))}
   data={weeks,names,series};
   if(scope!=='all')checkWeekWin(weeks);
  }catch(e){if(my!==token)return;data={error:true}}
  draw();
 }
 function weeklyCard(){
  const s=weeklyState(),n=wkNo(s.w),row=postedWeekly(s.w);
  if(row&&!s.posted)return `<section class="lg-week done"><div><small>Your weekly challenge · Week ${n}</small><p>${esc(row.team)} finished <b>${row.wins}–${162-row.wins}</b>.</p><details><summary>View my team</summary>${lineupHTML(row.roster)}</details></div></section>`;
  if(!s.done&&(personal.pending||personal.error))return `<section class="lg-week"><div><small>Your weekly challenge · Week ${n}</small><p>${personal.error?'Couldn’t check your weekly result.':'Checking your weekly result…'}</p></div>${personal.error?'<button type="button" class="btn" id="lgCheckWeek">Try again</button>':''}</section>`;
  const btn=s.done?(s.posted?'View my team':'Post your team'):s.started?'Resume':'Play this week';
  const line=s.done?`You went <b>${s.wins}–${162-s.wins}</b>${s.posted?'':' but have not posted it'}.`:s.started?`In progress: pick ${Math.min(16,s.picks+1)} of 16.`:'Same pack at every pick for everyone. One attempt.';
  return `<section class="lg-week${s.done?' done':''}"><div><small>Your weekly challenge · Week ${n}</small><p>${line}</p><em>${weekLeft()}</em></div><button type="button" class="btn${s.done&&s.posted?'':' primary'}" id="lgPlay">${btn}</button></section>`;
 }
 const medal=i=>i<3?` m${i+1}`:'';
 function weekRows(rows){
  const roster=x=>typeof lineupHTML==='function'?lineupHTML(x.roster):'';
  return `<ol class="lg-rows">${rows.map((x,i)=>`<li class="${isMine(x.device)?'me':''}"><details><summary><span class="rk${medal(i)}">${i+1}</span>${typeof starTok==="function"?starTok(x.roster):""}<span class="tm"><b>${esc(x.team)}${isMine(x.device)?'<i class="you">You</i>':''}</b>${x.displayName?`<small>${esc(x.displayName)}</small>`:''}</span><span class="rec">${x.wins}–${162-x.wins}</span></summary>${scope!=='all'?`<p class="hint">Team rating ${x.ovr} · Grade ${esc(x.grade)}</p>`:''}${roster(x)}${typeof rivalSeriesButton==='function'?rivalSeriesButton(x,scope==='all'):''}</details></li>`).join('')}</ol>`;
 }
 function tabWeek(){
  const rows=data.weeks[weekKey()]||[];
  if(!rows.length)return `<p class="lg-empty">${scope==='all'?'Nobody has posted this week\'s challenge yet. Be the first.':'Nobody in this league has posted this week yet. Play the challenge above, then post your team.'}</p>`;
  const rank=rows.findIndex(x=>isMine(x.device))+1;
  const players=rows.length+' player'+(rows.length===1?'':'s');
  const heading=scope==='all'?'':`<h3 class="lg-h">Week ${wkNo(weekKey())} standings</h3><p class="hint">${rank?'Your rank: #'+rank+' of '+rows.length:players+' this week'}</p>`;
  const share=scope==='all'?'':'<button type="button" class="btn" id="lgShare">Share standings</button>';
  return heading+weekRows(rows)+'<p class="hint">Tap a team to see its roster.</p>'+share;
 }
 function tabSeason(){
  const PTS=[5,3,2],table={},wks=Object.keys(data.weeks).sort();
  for(const w of wks)data.weeks[w].forEach((x,i)=>{const t=table[playerKey(x)]=table[playerKey(x)]||{device:x.device,name:data.names[playerKey(x)],pts:0,won:0,played:0,best:0};t.pts+=PTS[i]||1;t.played++;if(i===0&&w!==weekKey())t.won++;t.best=Math.max(t.best,x.wins)});
  const rows=Object.values(table).sort((a,b)=>b.pts-a.pts||b.best-a.best);
  if(!rows.length)return '<p class="lg-empty">The season table fills in as weeks are played.</p>';
  const past=wks.filter(w=>w!==weekKey()).reverse().slice(0,8);
  return `<table class="lg-table"><thead><tr><th></th><th class="l">Player</th><th>Pts</th><th>Weeks won</th><th>Played</th><th>Best</th></tr></thead><tbody>${rows.map((t,i)=>`<tr class="${isMine(t.device)?'me':''}"><td><span class="rk${medal(i)}">${i+1}</span></td><th scope="row" class="l">${esc(t.name)}</th><td class="pts">${t.pts}</td><td>${t.won}</td><td>${t.played}</td><td>${t.best}–${162-t.best}</td></tr>`).join('')}</tbody></table>
   <p class="hint">Each week: 5 points for first, 3 for second, 2 for third, 1 for playing. A week counts as won once it ends.</p>
   ${past.length?`<h3 class="lg-h">Past champions</h3><ul class="lg-past">${past.map(w=>{const c=data.weeks[w][0];return `<li><small>Week ${wkNo(w)}</small><b>${esc(playerName(c))}</b><span>${c.wins}–${162-c.wins}</span></li>`}).join('')}</ul>`:''}`;
 }
 // Series box score. Rows saved before box scores existed only have game scores.
 function seriesBoxHTML(x,P,wi){
  const b=x.box&&x.box.v===1?x.box:null,o=[wi,1-wi];
  if(!b)return '';
  const nm=id=>{if(!id)return 'Middle relief';const m=BYID.get(id);return esc(m?m.name.replace(/^Shiny /,''):'?')};
  const ip=outs=>Math.floor(outs/3)+'.'+outs%3;
  let html='';
  // Series MVP: the best bat on the winning club.
  const score=r=>r[3]+2*r[4]+1.5*r[5],mvp=(b.bat[wi]||[]).reduce((a,r)=>!a||score(r)>score(a)?r:a,null);
  if(mvp&&mvp[2]){const m=BYID.get(mvp[0]);html=`<div class="h2h-mvp">${m&&typeof tok==='function'?tok(m):''}<span><small>Series MVP</small><b>${nm(mvp[0])}</b><em>${mvp[3]} for ${mvp[2]}${mvp[4]?`, ${mvp[4]} HR`:''}, ${mvp[5]} RBI</em></span></div>`+html}
  const club=k=>`<div class="bx-team"><h5>${esc(P[k].n)}${P[k].t&&P[k].t!==P[k].n?` <small>${esc(P[k].t)}</small>`:''}</h5>
   <table class="bx"><thead><tr><th scope="col">Batting</th><th scope="col">AB</th><th scope="col">H</th><th scope="col">HR</th><th scope="col">RBI</th><th scope="col">BB</th><th scope="col">K</th></tr></thead><tbody>${(b.bat[k]||[]).map(r=>`<tr><th scope="row"><small>${esc(typeof lbl==='function'?lbl(r[1]):r[1])}</small>${nm(r[0])}</th><td>${r[2]}</td><td class="${r[3]>=Math.max(5,r[2]*.4)?'hi':''}">${r[3]}</td><td class="${r[4]?'hi':''}">${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td></tr>`).join('')}</tbody></table>
   <table class="bx"><thead><tr><th scope="col">Pitching</th><th scope="col">GS</th><th scope="col">IP</th><th scope="col">H</th><th scope="col">R</th><th scope="col">BB</th><th scope="col">K</th></tr></thead><tbody>${(b.pit[k]||[]).slice().sort((p,q)=>q[6]-p[6]||q[1]-p[1]).map(r=>`<tr><th scope="row">${nm(r[0])}</th><td>${r[6]}</td><td>${ip(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="${r[5]>=10?'hi':''}">${r[5]}</td></tr>`).join('')}</tbody></table></div>`;
  return html+club(o[0])+club(o[1]);
 }
 // Head-to-head: every series counts for both players. Rival cards for you, a grid for everyone, scoreboard results.
 function h2hParts(){
  const s=data.series;
  const oppKey=x=>x.opponentKey||'device:'+x.opp_device,oppName=x=>x.opponentName||x.opp_team;
  const names={},devices={},teams={};
  const note=(k,n,d,t,when)=>{if(!names[k])names[k]=n;if(d&&!devices[k])devices[k]=d;if(t&&(!teams[k]||when>teams[k].when))teams[k]={t,when}};
  for(const w in data.weeks)for(const x of data.weeks[w])note(playerKey(x),playerName(x),x.device,x.team,Date.parse(x.created_at));
  const pair={},tot={},last={};
  const bump=(a,b,won,x)=>{pair[a]=pair[a]||{};const p=pair[a][b]=pair[a][b]||{w:0,l:0,hist:[]};won?p.w++:p.l++;p.hist.push(won);tot[a]=tot[a]||{w:0,l:0};won?tot[a].w++:tot[a].l++;if(!p.last)p.last=x};
  for(const x of s){
   const a=playerKey(x),b=oppKey(x),aw=x.w>x.l;
   note(a,playerName(x),x.device,null,0);note(b,oppName(x),x.opp_device,null,0);
   bump(a,b,aw,x);bump(b,a,!aw,x);
  }
  const mineKey=k=>isMine(devices[k]);
  const me=Object.keys(names).find(mineKey);
  const day=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  const pct=k=>{const t=tot[k];return t?(t.w+.5)/(t.w+t.l+1):0};
  const order=Object.keys(tot).sort((a,b)=>pct(b)-pct(a)||tot[b].w-tot[a].w||names[a].localeCompare(names[b]));
  const tone=r=>r.w>r.l?'up':r.w<r.l?'down':'even';
  const ini=n=>esc((String(n).replace(/[^A-Za-z0-9]/g,'').slice(0,2)||'?').toUpperCase());
  // How a series went, from the winner's side: game-by-game and a short headline when it earns one.
  const story=x=>{
   const g=(x.games||[]).map(([a,b])=>a>b),aw=x.w>x.l,win=g.map(v=>v===aw);
   let wn=0,ls=0,down3=false,run=0,closer=0;
   for(const v of win){v?wn++:ls++;if(ls-wn>=2&&ls>=2)down3=true;run=v?run+1:0}
   closer=run;const n=g.length,lo=Math.min(x.w,x.l);
   const tag=lo===0?'Sweep':down3?'Comeback':n===7?'Game 7':closer>=3&&lo>0?`${closer} straight to close`:'';
   return {win,tag};
  };
  // Your rivals: everyone you've played, plus league mates you haven't.
  let rivals='';
  if(me){
   const mine=pair[me]||{};
   const others=[...new Set([...Object.keys(mine),...Object.keys(names).filter(k=>k!==me&&teams[k])])].filter(k=>k!==me&&!mineKey(k));
   others.sort((a,b)=>(mine[b]?Date.parse(mine[b].last.created_at):0)-(mine[a]?Date.parse(mine[a].last.created_at):0)||names[a].localeCompare(names[b]));
   rivals=others.length?`<h3 class="lg-h">Your rivals</h3><div class="h2h-rivals">${others.map(k=>{
    const r=mine[k];
    if(!r)return `<article class="h2h-card new"><span class="h2h-av">${ini(names[k])}</span><div class="h2h-who"><b>${esc(names[k])}</b><small>No series yet</small></div><button type="button" class="btn h2h-play" data-rival="${esc(k)}">Challenge</button></article>`;
    const t=tone(r),lx=r.last,st=story(lx),youWon=(playerKey(lx)===me)===(lx.w>lx.l);
    const head=t==='up'?(r.l?'You lead the series':'Undefeated against them'):t==='down'?(r.w?`${esc(names[k])} leads`:'Still looking for a win'):(r.w+r.l>=2?'Tied · rubber match next':'Tied');
    return `<article class="h2h-card ${t}"><span class="h2h-av">${ini(names[k])}</span><div class="h2h-who"><b>${esc(names[k])}</b><small>${head}</small></div><strong class="h2h-rec">${r.w}–${r.l}</strong>
     <p class="h2h-last"><span>Last: ${youWon?'won':'lost'} ${Math.max(lx.w,lx.l)}–${Math.min(lx.w,lx.l)}${st.tag==='Sweep'||st.tag==='Game 7'?' · '+esc(st.tag.toLowerCase()):''} · ${day(lx.created_at)}</span><i class="h2h-dots" aria-label="Last ${Math.min(r.hist.length,5)} series">${r.hist.slice(0,5).reverse().map(v=>`<b class="${v?'w':'l'}"></b>`).join('')}</i></p>
     <button type="button" class="btn h2h-play" data-rival="${esc(k)}">Rematch</button></article>`}).join('')}</div>`:'';
  }
  // League grid: each row's record against each column.
  const grid=order.length>=2?`<h3 class="lg-h">League grid</h3><div class="h2h-gridwrap"><table class="h2h-grid"><thead><tr><th></th>${order.map(k=>`<th scope="col" title="${esc(names[k])}">${ini(names[k])}</th>`).join('')}<th scope="col">Total</th></tr></thead><tbody>${order.map(a=>`<tr class="${mineKey(a)?'me':''}"><th scope="row">${esc(names[a])}</th>${order.map(b=>{if(a===b)return '<td class="self" aria-hidden="true"></td>';const r=pair[a]?.[b];return r?`<td class="${tone(r)}" aria-label="${esc(names[a])} ${r.w}–${r.l} against ${esc(names[b])}">${r.w}–${r.l}</td>`:'<td class="none">–</td>'}).join('')}<td class="tot">${tot[a].w}–${tot[a].l}</td></tr>`).join('')}</tbody></table></div><p class="h2h-key"><span><i class="up"></i>Leads</span><span><i class="even"></i>Tied</span><span><i class="down"></i>Trails</span></p>`:'';
  // Latest results as scoreboards, winner on top.
  const results=s.length?`<h3 class="lg-h">Latest results</h3><ul class="h2h-results">${s.slice(0,12).map(x=>{
   const aw=x.w>x.l,st=story(x);
   const A={n:playerName(x),t:x.team,k:playerKey(x),g:x.w},B={n:oppName(x),t:x.opp_team,k:oppKey(x),g:x.l};
   const [W,L]=aw?[A,B]:[B,A];
   const line=(p,win)=>`<div class="h2h-line${win?' win':''}"><span><b>${esc(p.n)}</b>${p.t&&p.t!==p.n?`<small>${esc(p.t)}</small>`:''}</span><em>${p.g}</em></div>`;
   const head=`${line(W,true)}${line(L,false)}<div class="h2h-foot"><i class="h2h-bars">${st.win.map(v=>`<b class="${v?'w':'l'}"></b>`).join('')}</i><small>${st.tag?`<strong>${esc(st.tag)}</strong> · `:''}${day(x.created_at)}</small></div>`,box=seriesBoxHTML(x,[A,B],aw?0:1);
   return `<li class="${mineKey(W.k)||mineKey(L.k)?'me':''}">${box?`<details class="h2h-res"><summary>${head}<span class="h2h-open">Box score</span></summary><div class="h2h-box">${box}</div></details>`:head}</li>`}).join('')}</ul>`:'';
  return {rivals,grid,results,any:s.length>0};
 }
 const pickBtn='<button type="button" class="btn primary lg-pick" id="lgRivalPick">Play a league series</button>';
 function tabRivals(){const h=h2hParts();return (h.rivals||h.grid?h.rivals+h.grid:'<p class="lg-empty">No series yet. Play a league mate in a best of 7. Your record against each player shows here.</p>')}
 function tabResults(){const h=h2hParts();return h.results||'<p class="lg-empty">No series yet. Results from best-of-7 series between league teams show here, with box scores.</p>'}

 // ---- League logo ----
 const SHAPES={shield:'M8 6h84v50c0 22-18 36-42 46C26 92 8 78 8 56Z',circle:'M50 4a48 48 0 1 0 0.01 0Z',banner:'M10 4h80v94L50 80 10 98Z',diamond:'M50 2 98 52 50 102 2 52Z'};
 const COLORS=['#e2350d','#1d3866','#2f6fe0','#2f8f4e','#6b3fa0','#d9a514','#1b1b1f','#138a8a','#e07a1f','#d1477a'],TRIMS=['#f4eedc','#ffcb05','#ffffff','#111111','#e2350d','#9fd8ff'];
 const initials=n=>(String(n||'?').match(/[A-Za-z0-9]+/g)||['?']).slice(0,2).map(w=>w[0]).join('').toUpperCase();
 const defLogo=name=>({s:'shield',c:'#e2350d',t:'#f4eedc',e:{k:'txt',v:initials(name)}});
 const logoKey=c=>'pbc7-logo-'+c;
 const info={};
 const logoOf=l=>{if(!l)return null;const i=info[l.code];if(i&&i.logo)return i.logo;try{return JSON.parse(store.get(logoKey(l.code))||'null')||defLogo(l.name)}catch(e){return defLogo(l.name)}};
 function crestSVG(g,cls=''){
  g=g||defLogo('?');const d=SHAPES[g.s]||SHAPES.shield,v=String(g.e?.v||'');
  const em=g.e?.k==='mon'&&BYID.get(+v)?`<image href="${SPRITE_URL(+v,false)}" x="14" y="16" width="72" height="72" style="image-rendering:pixelated"/>`
   :`<text x="50" y="${g.s==='diamond'?60:58}" text-anchor="middle" dominant-baseline="middle" font-family="Graduate,Rockwell,Georgia,serif" font-size="${v.length>2?28:v.length>1?38:50}" fill="${g.t}">${esc(v)}</text>`;
  return `<svg class="crest ${cls}" viewBox="0 0 100 104" aria-hidden="true"><path d="${d}" fill="${g.c}" stroke="${g.t}" stroke-width="5" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#0005" stroke-width="1.5" transform="translate(50 52) scale(.84) translate(-50 -52)"/>${em}</svg>`;
 }
 async function loadInfo(code){
  try{
   const rpc=n=>LB_URL.replace(/ballclub_scores$/,'rpc/'+n);
   const [a,b,m]=await Promise.all([fetch(`${LEAGUE_URL}?select=code,logo&code=eq.${code}`,{headers:lbHead()}),
    window.Account?.user?fetch(rpc('ballclub_league_can_edit'),{method:'POST',headers:await Account.postHeaders({'Content-Type':'application/json'}),body:JSON.stringify({c:code})}):null,
    fetch(rpc('ballclub_league_avatars'),{method:'POST',headers:{...lbHead(),'Content-Type':'application/json'},body:JSON.stringify({c:code})}).catch(()=>null)]);
   const row=a.ok?(await a.json())[0]:null,can=b&&b.ok?await b.json():false,members=m&&m.ok?await m.json():[];
   info[code]={logo:row?.logo||null,canEdit:can===true,members:Array.isArray(members)?members:[]};
   if(row?.logo)store.set(logoKey(code),JSON.stringify(row.logo));
  }catch(e){info[code]=info[code]||{}}
  if(scope===code)draw();
 }
 let edit=null;
 function logoEditor(cur){
  const g=edit.g,mon=g.e.k==='mon',q=edit.q||'',hits=q.length>=2?MONS.filter(m=>m.id<=493&&m.name.toLowerCase().includes(q.toLowerCase())).slice(0,10):[];
  const sw=(list,key)=>list.map(c=>`<button type="button" class="lg-sw${g[key]===c?' on':''}" data-${key}="${c}" style="--sw:${c}" aria-label="${c}" aria-pressed="${g[key]===c}"></button>`).join('');
  return `<section class="lg-edit" aria-label="Edit league logo"><div class="lg-edit-top">${crestSVG(g,'big')}<div><b>League logo</b><small>Anyone in ${esc(cur.name)} can change it.</small></div></div>
   <h4>Shape</h4><div class="lg-shapes">${Object.keys(SHAPES).map(k=>`<button type="button" data-shape="${k}" class="${g.s===k?'on':''}" aria-label="${k}" aria-pressed="${g.s===k}">${crestSVG({...g,s:k,e:{k:'txt',v:''}},'mini')}</button>`).join('')}</div>
   <h4>Color</h4><div class="lg-sws">${sw(COLORS,'c')}</div>
   <h4>Trim</h4><div class="lg-sws">${sw(TRIMS,'t')}</div>
   <h4>Emblem</h4><div class="lg-emk"><button type="button" data-emk="txt" aria-pressed="${!mon}" class="${mon?'':'on'}">Letters</button><button type="button" data-emk="mon" aria-pressed="${mon}" class="${mon?'on':''}">Pokémon</button></div>
   ${mon?`<input id="lgMonQ" placeholder="Search Gen 1–4 Pokémon" autocomplete="off" value="${esc(q)}"><div class="lg-mons">${hits.map(m=>`<button type="button" data-mon="${m.id}" class="${+g.e.v===m.id?'on':''}"><img src="${SPRITE_URL(m.id,false)}" alt="">${esc(m.name)}</button>`).join('')||(q.length>=2?'<p class="hint">No match.</p>':'<p class="hint">Type at least 2 letters.</p>')}</div>`
    :`<input id="lgTxt" maxlength="3" autocomplete="off" autocapitalize="characters" value="${esc(g.e.v)}" aria-label="Letters, up to 3">`}
   ${edit.msg?`<p class="lg-note" role="status">${esc(edit.msg)}</p>`:''}
   <div class="lg-edit-btns"><button type="button" class="btn primary" id="lgLogoSave">Save logo</button><button type="button" class="btn" id="lgLogoCancel">Cancel</button></div></section>`;
 }
 function wireEditor(cur){
  const box=document.querySelector('#lg .lg-edit');if(!box)return;
  const preview=()=>{const top=box.querySelector('.lg-edit-top svg');if(top)top.outerHTML=crestSVG(edit.g,'big')};
  const monList=()=>{const q=edit.q||'',hits=q.length>=2?MONS.filter(m=>m.id<=493&&m.name.toLowerCase().includes(q.toLowerCase())).slice(0,10):[];
   box.querySelector('.lg-mons').innerHTML=hits.map(m=>`<button type="button" data-mon="${m.id}" class="${+edit.g.e.v===m.id?'on':''}"><img src="${SPRITE_URL(m.id,false)}" alt="">${esc(m.name)}</button>`).join('')||(q.length>=2?'<p class="hint">No match.</p>':'<p class="hint">Type at least 2 letters.</p>');
   wireMons()};
  const wireMons=()=>box.querySelectorAll('[data-mon]').forEach(b=>b.onclick=()=>{edit.g.e={k:'mon',v:b.dataset.mon};edit.lastMon=b.dataset.mon;box.querySelectorAll('[data-mon]').forEach(x=>x.classList.toggle('on',x===b));preview()});
  box.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{edit.g.s=b.dataset.shape;draw()});
  box.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{edit.g.c=b.dataset.c;draw()});
  box.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{edit.g.t=b.dataset.t;draw()});
  box.querySelectorAll('[data-emk]').forEach(b=>b.onclick=()=>{const k=b.dataset.emk;if(k===edit.g.e.k)return;edit.g.e=k==='mon'?{k:'mon',v:edit.lastMon||''}:{k:'txt',v:edit.lastTxt||initials(cur.name)};draw()});
  wireMons();
  if($('lgMonQ'))$('lgMonQ').oninput=e=>{edit.q=e.target.value;monList()};
  if($('lgTxt'))$('lgTxt').oninput=e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);if(e.target.value!==v)e.target.value=v;edit.g.e={k:'txt',v};edit.lastTxt=v;preview()};
  $('lgLogoCancel').onclick=()=>{edit=null;draw()};
  $('lgLogoSave').onclick=async()=>{
   const g=edit.g;if(g.e.k==='txt'&&!g.e.v){edit.msg='Add 1 to 3 letters or numbers.';draw();return}
   if(g.e.k==='mon'&&!g.e.v){edit.msg='Pick a Pokémon.';draw();return}
   const body={s:g.s,c:g.c,t:g.t,e:{k:g.e.k,v:String(g.e.v)}};
   try{const r=await fetch(LB_URL.replace(/ballclub_scores$/,'rpc/ballclub_set_league_logo'),{method:'POST',headers:await Account.postHeaders({'Content-Type':'application/json'}),body:JSON.stringify({c:cur.code,l:body})});
    if(!r.ok){let m='';try{m=(await r.json()).message||''}catch(e){}throw Error(m)}
    info[cur.code]={...info[cur.code],logo:body,canEdit:true};store.set(logoKey(cur.code),JSON.stringify(body));edit=null;note='Logo saved.';draw();
   }catch(e){edit.msg=/member/i.test(e.message)?'Only league members can change the logo.':/sign in/i.test(e.message)?'Sign in to change the logo.':'Couldn\'t save the logo. Try again.';draw()}
  };
 }

 // ---- Week tab: your status, the podium, the rest of the table ----
 let podSel=null;
 function weekFrac(){const d=new Date(),day=(d.getUTCDay()||7)-1;return Math.min(1,(day*864e5+(d-Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())))/(7*864e5))}
 function youCard(rows){
  const s=weeklyState(),row=postedWeekly(s.w),i=rows.findIndex(x=>isMine(x.device));
  if(row){
   const lead=rows[0],me2=rows[i]||row,ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
   const head=i===0?(rows.length>1?'You\'re leading this week':'You\'re first in this week'):i>0?`You're ${ord(i+1)} this week`:'Your weekly team';
   const sub=i===0&&rows[1]?`${me2.wins-rows[1].wins} ${me2.wins-rows[1].wins===1?'win':'wins'} ahead of ${esc(playerName(rows[1]))}`:i>0?`${lead.wins-me2.wins} ${lead.wins-me2.wins===1?'win':'wins'} behind ${esc(playerName(lead))}`:'';
   return `<section class="lg-you"><div><b>${head}</b><small>${sub?sub+' · ':''}${esc(me2.team)} ${me2.wins}–${162-me2.wins}</small></div><button type="button" class="btn" id="lgMyTeam" aria-expanded="${podSel==='me'}">My team</button>${podSel==='me'?`<div class="lg-you-team">${lineupHTML(me2.roster)}</div>`:''}</section>`;
  }
  if(!s.done&&(personal.pending||personal.error))return `<section class="lg-you"><div><b>Your weekly challenge</b><small>${personal.error?'Couldn’t check your weekly result.':'Checking your weekly result…'}</small></div>${personal.error?'<button type="button" class="btn" id="lgCheckWeek">Try again</button>':''}</section>`;
  const btn=s.done?(s.posted?'View my team':'Post your team'):s.started?'Resume':'Play this week';
  const line=s.done?`You went ${s.wins}–${162-s.wins}${s.posted?'':'. Post it to count.'}`:s.started?`In progress: pick ${Math.min(16,s.picks+1)} of 16.`:'Same packs for everyone. One attempt.';
  return `<section class="lg-you cta"><div><b>${s.done?'Your weekly challenge':`Week ${wkNo(s.w)} challenge`}</b><small>${line}</small></div><button type="button" class="btn primary" id="lgPlay">${btn}</button></section>`;
 }
 function teamPanel(x,code){
  const theirs=!isMine(x.device);
  return `<div class="lg-pod-team"><p class="hint">${esc(x.team)} · Team rating ${x.ovr} · Grade ${esc(x.grade)}</p>${lineupHTML(x.roster)}${theirs?`<button type="button" class="btn lg-pod-play" data-rival="${esc(playerKey(x))}">Play a series vs ${esc(playerName(x))}</button>`:''}</div>`;
 }
 function tabWeek2(cur){
  const rows=data.weeks[weekKey()]||[],n=wkNo(weekKey());
  const top=rows.slice(0,3),order=[1,0,2].filter(i=>top[i]);
  const pod=top.length?`<div class="lg-pod n${top.length}">${order.map(i=>{const x=top[i];return `<button type="button" class="pc p${i+1}${isMine(x.device)?' me':''}${podSel===i?' sel':''}" data-pod="${i}" aria-expanded="${podSel===i}">${typeof starTok==='function'?starTok(x.roster):''}<b>${esc(playerName(x))}${isMine(x.device)?'<i class="you">You</i>':''}</b><small>${esc(x.team)}</small><em>${x.wins}–${162-x.wins}</em><span class="blk">${i+1}</span></button>`}).join('')}</div>`
   :'<p class="lg-empty in">Nobody has posted this week yet. Play the challenge, then post your team.</p>';
  const sel=typeof podSel==='number'&&top[podSel]?teamPanel(top[podSel],cur.code):'';
  const rest=rows.slice(3);
  const restHTML=rest.length?`<ol class="lg-rows lg-rest" start="4">${rest.map((x,j)=>`<li class="${isMine(x.device)?'me':''}"><details><summary><span class="rk">${j+4}</span>${typeof starTok==='function'?starTok(x.roster):''}<span class="tm"><b>${esc(playerName(x))}${isMine(x.device)?'<i class="you">You</i>':''}</b><small>${esc(x.team)}</small></span><span class="rec">${x.wins}–${162-x.wins}</span></summary>${teamPanel(x,cur.code)}</details></li>`).join('')}</ol>`:'';
  return `<section class="lg-wk"><div class="lg-wk-t"><span>Week ${n}</span><b>${weekLeft()}</b></div><div class="lg-clock" aria-hidden="true"><i style="width:${Math.round(weekFrac()*100)}%"></i></div>${pod}${sel}${top.length?'<p class="lg-tap">Tap a team to see its roster</p>':''}</section>${restHTML}${rows.length?'<button type="button" class="btn lg-share" id="lgShare">Share standings</button>':''}`;
 }
 // ---- Season tab: the points race ----
 function tabSeason2(){
  const PTS=[5,3,2],table={},wks=Object.keys(data.weeks).sort();
  for(const w of wks)data.weeks[w].forEach((x,i)=>{const t=table[playerKey(x)]=table[playerKey(x)]||{device:x.device,name:data.names[playerKey(x)],pts:0,live:0,won:0,played:0,best:0};const p=PTS[i]||1;t.best=Math.max(t.best,x.wins);if(w===weekKey()){t.live=p;return}t.pts+=p;t.played++;if(i===0)t.won++});
  // Only finished weeks count. This week's spot shows as a pending +N until Monday.
  const rows=Object.values(table).sort((a,b)=>b.pts-a.pts||b.won-a.won||b.live-a.live||b.best-a.best);
  if(!rows.length)return '<p class="lg-empty">The season race fills in as weeks are played.</p>';
  const max=Math.max(...rows.map(r=>r.pts),1),past=wks.filter(w=>w!==weekKey()).reverse().slice(0,8);
  return `<details class="rr-how"><summary>How points work<i class="c2-chev" aria-hidden="true"></i></summary><div class="rr-key"><span><b>5</b>1st</span><span><b>3</b>2nd</span><span><b>2</b>3rd</span><span><b>1</b>Played</span></div><p><i class="rr-live">+5</i>This week so far. Added when the week ends.</p></details><section class="lg-race">${rows.map((t,i)=>`<div class="rr${isMine(t.device)?' me':''}"><span class="rk${medal(i)}">${i+1}</span><div class="rr-mid"><div class="rr-top"><b>${esc(t.name)}</b>${t.won?`<i class="crown" title="${t.won} ${t.won===1?'week':'weeks'} won">${'★'.repeat(Math.min(t.won,5))}</i>`:''}</div><span class="bar"><i style="width:${Math.max(4,t.pts/max*100)}%"></i></span><small>${t.won} ${t.won===1?'week':'weeks'} won · ${t.played} played · best ${t.best}–${162-t.best}</small></div><span class="rr-pts"><em>${t.pts}</em>${t.live?`<i class="rr-live" title="If this week ended now">+${t.live}</i>`:''}</span></div>`).join('')}</section>

   ${past.length?`<h3 class="lg-h">Past champions</h3><ul class="lg-past">${past.map(w=>{const c=data.weeks[w][0];return `<li><span class="crown2" aria-hidden="true"></span><small>Week ${wkNo(w)}</small><b>${esc(playerName(c))}</b><span>${c.wins}–${162-c.wins}</span></li>`}).join('')}</ul>`:''}`;
 }
 // ---- Members row: profile Pokémon when set, initials otherwise ----
 const hue=k=>{let h=0;for(const c of String(k))h=(h*31+c.charCodeAt(0))%360;return h};
 function membersRow(cur){
  const list=new Map(),add=(key,name,extra={})=>{if(!key)return;const o=list.get(key)||{key,name};list.set(key,{...o,...(name?{name}:{}),...extra})};
  const week=data&&!data.error?(data.weeks[weekKey()]||[]):[];
  week.forEach(x=>add(playerKey(x),playerName(x),{me:isMine(x.device)}));
  if(data&&!data.error)Object.values(data.weeks).flat().forEach(x=>add(playerKey(x),playerName(x),{me:isMine(x.device)||list.get(playerKey(x))?.me}));
  (info[cur.code]?.members||[]).forEach(m=>add(m.key,m.name,{avatar:m.avatar}));
  const all=[...list.values()],shown=all.slice(0,6),more=all.length-shown.length;
  const bubble=m=>{const p=m.avatar&&BYID.get(+m.avatar),[c1,c2]=p?[TYPE_COLORS[p.types[0]]||'#5f7fb6',TYPE_COLORS[p.types[1]]||TYPE_COLORS[p.types[0]]||'#5f7fb6']:[];
   return `<span class="lg2-av${m.me?' me':''}" title="${esc(m.name||'')}" style="${p?`background:radial-gradient(circle at 35% 30%,color-mix(in srgb,${c1} 80%,#fff),${c2})`:`background:hsl(${hue(m.key)} 45% 32%)`}">${p?`<img src="${SPRITE_URL(p.num,false)}" alt="">`:esc(String(m.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()||'?')}</span>`};
  return `<div class="lg2-mem"><span class="lg2-avs">${shown.map(bubble).join('')}${more>0?`<span class="lg2-av more">+${more}</span>`:''}</span><button type="button" class="lg2-add" id="lgInvite" aria-label="Invite friends to ${esc(cur.name)}">+</button><span class="lg2-mem-t">${all.length?`${all.length} player${all.length===1?'':'s'} · `:''}<b>Invite</b></span></div>`;
 }
 // ---- One action, always at the bottom: play the week, or play a series once you've posted ----
 function actionBar(cur){
  const s=weeklyState(),row=postedWeekly(s.w),rows=data&&!data.error?(data.weeks[weekKey()]||[]):[],i=rows.findIndex(x=>isMine(x.device));
  const ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
  let b,sm,btn;
  if(row&&cur){const me2=rows[i]||row,lead=rows[0];
   b=i===0?(rows.length>1?'Leading this week':'1st this week'):i>0?`${ord(i+1)} this week`:'Posted this week';
   const gap=i>0&&lead?lead.wins-me2.wins:i===0&&rows[1]?me2.wins-rows[1].wins:null;
   sm=`${gap!=null?`${gap} ${i===0?'ahead':'back'} · `:''}${me2.wins}–${162-me2.wins}`;
   btn=`<button type="button" class="btn primary" id="lgSeries">Play a series</button>`;
  }else if(!s.done&&(personal.pending||personal.error)){
   b='Your weekly challenge';sm=personal.error?'Couldn’t check your weekly result.':'Checking your weekly result…';
   btn=personal.error?'<button type="button" class="btn" id="lgCheckWeek">Try again</button>':'';
  }else{
   b=`Week ${wkNo(s.w)} challenge`;sm=s.done?`You went ${s.wins}–${162-s.wins}${s.posted?'':'. Post it to count.'}`:s.started?`In progress: pick ${Math.min(16,s.picks+1)} of 16`:cur?'Same packs for everyone. One try.':`One try · ${weekLeft()}`;
   btn=`<button type="button" class="btn primary" id="lgPlay">${s.done?(s.posted?'View my team':'Post your team'):s.started?'Resume':'Play this week'}</button>`;
  }
  return `<div class="lg-bar" role="region" aria-label="Your week"><div class="lg-bar-t"><b>${b}</b><small>${sm}</small></div>${btn}</div>`;
 }
 function draw(){
  const body=$('lgBody'),ls=mine(),cur=ls.find(x=>x.code===scope);
  if(cur&&!info[cur.code]){info[cur.code]={};loadInfo(cur.code)}
  const can=cur&&info[cur.code]?.canEdit;
  const hero=cur?`<section class="lg2-hd"><span class="lg-crest" aria-hidden="true">${crestSVG(logoOf(cur))}</span><div class="lg2-t"><h2><button type="button" class="lg2-name" id="lgSwitch" aria-expanded="${!!form}" aria-label="${esc(cur.name)}. Switch, join or leave leagues">${esc(cur.name)}<i class="lg2-chev" aria-hidden="true"></i></button></h2><p>Week ${wkNo(weekKey())} · ${weekLeft()}</p></div>${membersRow(cur)}</section>`
   :`<section class="lg-start"><h2>Play with friends</h2><p>Everyone in a league drafts from the same packs each week. Best team wins the week.</p>
    <div class="lgs-opt"><label for="lgCode"><b>Got a code from a friend?</b></label><div class="lgs-f"><input id="lgCode" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="5-letter code" enterkeyhint="go"><button type="button" class="btn primary" id="lgJoin">Join</button></div></div>
    <div class="lgs-or" aria-hidden="true"><span>or</span></div>
    <div class="lgs-opt"><label for="lgName"><b>Start your own</b><small>You get a code to send your friends.</small></label><div class="lgs-f"><input id="lgName" maxlength="24" autocomplete="off" placeholder="League name" enterkeyhint="go"><button type="button" class="btn" id="lgMake">Create</button></div></div></section>`;
  const IC={inv:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',pen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',join:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',make:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',out:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'};
  const full=ls.length>=3,row=(act,ic,label,extra='',cls='')=>`<button type="button" class="lgm-row${cls}" data-lgm="${act}">${IC[ic]}<span>${label}</span>${extra}</button>`;
  const field=(id,ph,btn,max,cap)=>`<div class="lgm-field"><input id="${id}" maxlength="${max}" autocomplete="off" ${cap?'autocapitalize="characters" ':''}placeholder="${ph}" enterkeyhint="go"><button type="button" class="btn primary" id="${id==='lgCode'?'lgJoin':'lgMake'}">${btn}</button></div>`;
  const picker=form&&cur?`<div class="lg-menu" role="menu" aria-label="League options">
   ${ls.length>1?`<p class="lgm-cap">Your leagues</p>${ls.map(x=>`<button type="button" class="lgm-row lgm-lg" data-scope="${x.code}" aria-current="${scope===x.code}">${crestSVG(logoOf(x),'mini')}<span>${esc(x.name)}</span>${scope===x.code?IC.ok:''}</button>`).join('')}<hr>`:''}
   ${cur?(can?row('logo','pen','Edit league logo'):'')+row('invite','inv','Invite friends',`<small>${cur.code}</small>`):''}
   ${full?'<p class="lgm-hint">You can be in 3 leagues. Leave one to join another.</p>':(form==='join'||!cur?`<div class="lgm-open">${IC.join}<span>Join with a code</span></div>${field('lgCode','5-letter code','Join',5,true)}`:row('join','join','Join with a code'))+(form==='make'||!cur?`<div class="lgm-open">${IC.make}<span>Start a league</span></div>${field('lgName','League name','Create',24,false)}`:row('make','make','Start a league'))}
   ${cur?row('leave','out',form==='leave'?`Tap again to leave ${esc(cur.name)}`:`Leave ${esc(cur.name)}`,'',' danger'):''}
  </div>`:'';
  const tabs=cur?`<div class="lg-seg" role="tablist">${[['week','Week'],['season','Season'],['rivals','Rivals'],['results','Results']].map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>`:'';
  const content=!cur?'':!data?'<p class="lg-empty">Loading…</p>':data.error?'<p class="lg-empty">Couldn\'t reach the leaderboard. Check your connection and try again.</p>':tab==='season'?tabSeason2():tab==='rivals'?tabRivals():tab==='results'?tabResults():tabWeek2(cur);
  const editor=cur&&edit&&edit.code===cur.code?logoEditor(cur):'';
  body.innerHTML=hero+editor+picker+(note?`<p class="lg-note" role="status">${esc(note)}</p>`:'')+(cur?tabs+`<div id="lgList" class="lg-panel">${content}</div>`+(editor||form?'':actionBar(cur)):`<p class="lgs-cap">No league needed</p>`+actionBar(null));
  if($('lgSeries'))$('lgSeries').onclick=()=>pickRival(cur.code);
  body.classList.toggle('editing',!!editor);if(editor)wireEditor(cur)
  if($('lgCrest')&&can)$('lgCrest').onclick=()=>{edit=edit?null:{code:cur.code,g:JSON.parse(JSON.stringify(logoOf(cur)))};note='';draw()};
  body.querySelectorAll('[data-pod]').forEach(b=>b.onclick=()=>{const i=+b.dataset.pod;podSel=podSel===i?null:i;draw()});
  if($('lgMyTeam'))$('lgMyTeam').onclick=()=>{podSel=podSel==='me'?null:'me';draw()};
  if(cur)body.querySelectorAll('.lg-pod-play').forEach(b=>b.onclick=()=>pickRival(cur.code,b.dataset.rival));
  if($('lgPlay'))$('lgPlay').onclick=playWeekly;
  if($('lgCheckWeek'))$('lgCheckWeek').onclick=load;
  body.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;note='';form=null;load()});
  body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;podSel=null;draw()});
  if($('lgSwitch'))$('lgSwitch').onclick=()=>{form=form?null:'menu';note='';draw()};
  body.querySelectorAll('[data-lgm]').forEach(b=>b.onclick=()=>{const k=b.dataset.lgm;
   if(k==='logo'){form=null;edit={code:cur.code,g:JSON.parse(JSON.stringify(logoOf(cur)))};note='';draw()}
   else if(k==='invite'){form=null;draw();invite(cur)}
   else if(k==='join'||k==='make'){form=k;draw();$(k==='join'?'lgCode':'lgName')?.focus()}
   else if(k==='leave'){if(form!=='leave'){form='leave';draw();return}keep(mine().filter(x=>x.code!==cur.code));note=`Left ${cur.name}.`;scope=mine()[0]?.code||'all';form=null;load()}});
  if($('lgJoin')){$('lgJoin').onclick=()=>join($('lgCode').value);$('lgCode').onkeydown=e=>{if(e.key==='Enter')join($('lgCode').value)}}
  if($('lgMake')){$('lgMake').onclick=()=>make($('lgName').value);$('lgName').onkeydown=e=>{if(e.key==='Enter')make($('lgName').value)}}
  if($('lgInvite'))$('lgInvite').onclick=()=>invite(cur);
  if($('lgShare'))$('lgShare').onclick=()=>standings(cur);
  if($('lgLeave'))$('lgLeave').onclick=()=>{keep(mine().filter(x=>x.code!==cur.code));note=`Left ${cur.name}.`;scope=mine()[0]?.code||'all';form=null;load()};
  if(cur&&$('lgRivalPick'))$('lgRivalPick').onclick=()=>pickRival(cur.code);
  if(cur)document.querySelectorAll('#lg .h2h-play').forEach(b=>b.onclick=()=>pickRival(cur.code,b.dataset.rival));
 }
 async function lookup(code){const r=await fetch(`${LEAGUE_URL}?select=code,name&code=eq.${code}`,{headers:lbHead()});if(!r.ok)throw 0;return (await r.json())[0]||null}
 const intentKey='pbc-league-intent';
 function needAccount(action,value){
  if(window.Account?.user)return false;
  store.set(intentKey,JSON.stringify({action,value}));
  sheet.hidden=true;lock(false);
  Account.open('in','Sign in or create an account to '+(action==='join'?'join this league.':'create your league.'));
  return true;
 }
 document.addEventListener('ballclub-account-cancel',()=>{
  if(!store.get(intentKey))return;
  store.set(intentKey,'');open();
 });
 document.addEventListener('ballclub-signed-in',()=>{
  let intent;try{intent=JSON.parse(store.get(intentKey)||'null')}catch(e){}
  if(!intent)return;
  store.set(intentKey,'');sheet.hidden=false;lock(true);
  if(intent.action==='join')join(intent.value);else if(intent.action==='make')make(intent.value);
 });
 async function join(raw,quiet){
  const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!CODE.test(code)){note='A league code is 5 letters and numbers.';draw();return}
  if(needAccount('join',code))return;
  if(mine().some(x=>x.code===code)){scope=code;form=null;note='';load();return}
  if(mine().length>=3){note='You can be in 3 leagues. Leave one first.';draw();return}
  try{const l=await lookup(code);if(!l){note=`No league with code ${code}.`;draw();return}
   keep([...mine(),{code:l.code,name:l.name}]);scope=l.code;form=null;note=`Joined ${l.name}. Play the weekly challenge and post your team to get on the board.`;load()}
  catch(e){note="Couldn't reach the league list. Try again.";draw()}
 }
 async function make(raw){
  const name=String(raw||'').replace(/\s+/g,' ').trim().slice(0,24);
  if(!name){note='Give the league a name first.';draw();return}
  if(needAccount('make',name))return;
  if(mine().length>=3){note='You can be in 3 leagues. Leave one first.';draw();return}
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<3;attempt++){
   const code=Array.from({length:5},()=>A[Math.floor(Math.random()*A.length)]).join('');
   try{const r=await fetch(LEAGUE_URL,{method:'POST',headers:await Account.postHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({code,name})});
    if(r.status===409)continue;if(!r.ok)throw 0;
    keep([...mine(),{code,name}]);scope=code;form=null;note=`${name} is ready. Share code ${code} with your friends.`;load();return}
   catch(e){break}
  }
  note="Couldn't create the league. Try again.";draw();
 }
 function leagueShareLink(l){return SITE+'?league='+encodeURIComponent(l.code)}
 function standingsText(l,rows,wk){
  const heading='⚾ '+l.name+' | Pokémon Ballclub';
  const board=rows.length
   ?['Week '+wk+' standings',...rows.slice(0,10).map((x,i)=>(i+1)+'. '+x.team+(x.displayName?' ('+x.displayName+')':'')+' • '+x.wins+'–'+(162-x.wins)),...(rows.length>10?['+'+(rows.length-10)+' more teams']:[])].join('\n')
   :'Week '+wk+' is open. Set the first score!';
  return [heading,board,rows.length?'Think you can top the leaderboard?\nJoin our league:':'Join our league:',leagueShareLink(l)].join('\n\n');
 }
 async function standings(l){
  const rows=(data&&!data.error&&data.weeks[weekKey()])||[],wk=Number(weekKey().split('-W')[1]);
  const text=standingsText(l,rows,wk);
  try{if(navigator.share&&matchMedia('(pointer:coarse)').matches){await navigator.share({text});return}await navigator.clipboard.writeText(text);note='Standings copied.'}catch(e){if(e?.name==='AbortError')return;note='Could not share from this browser.'}
  draw();
 }
 async function invite(l){
  const text=['⚾ Join '+l.name+' on Pokémon Ballclub!','Everyone gets the same 16 packs each week. Best record wins.',leagueShareLink(l)].join('\n\n');
  try{if(navigator.share){await navigator.share({text});return}await navigator.clipboard.writeText(text);note='Invite copied.'}catch(e){if(e?.name==='AbortError')return;note=`Share code ${l.code} with your friends.`}
  draw();
 }
 // Say where a posted team counts, before and after posting.
 const baseSubmit=submitHTML;
 submitHTML=function(){
  // Only weekly challenge teams count in a league; free play posts to the leaderboard alone.
  const done=run.submitted,codes=done?(done.leagues||[]):run.week?leagueCodes():[],names=mine().filter(x=>codes.includes(x.code)).map(x=>x.name);
  const where=['Leaderboard',...((done?done.week:run.week)?['Weekly challenge']:[]),...names];
  return baseSubmit()+`<p class="post-where">${done?'Counts on':'Posts to'}: ${where.map(esc).join(' · ')}</p>`;
 };
 // Invite links: ?league=CODE joins and opens the sheet.
 const invited=new URLSearchParams(location.search).get('league');
 if(invited)window.addEventListener('DOMContentLoaded',()=>{const url=new URL(location.href);url.searchParams.delete('league');history.replaceState(null,'',url);sheet.hidden=false;lock(true);join(invited)},{once:true});
})();
