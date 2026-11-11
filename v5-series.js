/* v5: rival series. A best of 7 against any posted team that you watch and manage:
   pick your starter, see every at-bat on the diamond, and decide when to go to the bullpen. */
(() => {
 const $=id=>document.getElementById(id);
 const KEY='pbc5-rivals',SITE='pokemon-ballclub.vercel.app';
 const ready=()=>run&&run.size===16&&FULL.every(s=>run.slots[s]);
 // Your series team: the 16-player team on screen, or the last one you finished a season with.
 const LAST='pbc5-last16';
 function remember(){if(run?.result&&ready()){store.set(LAST,JSON.stringify(FULL.map(s=>run.slots[s].id)));if(run.submitted?.team)store.set(LAST+'-name',run.submitted.team)}}
 const SERIES_URL=LB_URL.replace(/ballclub_scores$/,'ballclub_series');
 const myName=()=>{remember();return (ready()&&run.submitted?.team)||store.get(LAST+'-name')||''};
 function team(){
  if(ready())return run.slots;
  try{const ids=JSON.parse(store.get(LAST)||'null');if(Array.isArray(ids)&&ids.length===16){const o=Object.fromEntries(ids.map((id,i)=>[FULL[i],BYID.get(id)]));if(FULL.every(s=>o[s]))return o}}catch(e){}
  return null;
 }
 const book=()=>{try{return JSON.parse(store.get(KEY)||'{}')||{}}catch(e){return{}}};
 const short=m=>m.name.replace(/^Shiny /,'');
 const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');
 const ip=o=>Math.floor(o/3)+(o%3?'.'+o%3:'');
 const me=()=>deviceId().slice(0,16);

 window.rivalSeriesButton=x=>x.device===me()?'':`<button type="button" class="btn rival-btn"${team()?'':' disabled'}>${team()?'Play a best of 7 against this club':'Finish a 16-player season to play this club'}</button>`;
 window.wireRivalSeries=(root,rows)=>{const theirs=rows.filter(x=>x.device!==me());root.querySelectorAll('.rival-btn').forEach((b,i)=>b.onclick=()=>{if(theirs[i]&&team())start(theirs[i])})};
 window.rivalriesHTML=()=>{
  const list=Object.values(book()).filter(x=>x&&x.team).sort((a,b)=>b.last-a.last).slice(0,8);
  return `<section class="records-rivals"><h3>Rival series</h3>${list.length?`<ul>${list.map(x=>`<li><span>${esc(x.team)}</span><b class="${x.w>x.l?'up':x.w<x.l?'down':''}">${x.w}–${x.l}</b></li>`).join('')}</ul><p class="hint">Series won and lost against each club.</p>`:'<p class="hint">Play any posted club in a best of 7. Your series records show up here.</p>'}<button type="button" class="btn rival-pick" onclick="pickRival()">Pick a rival</button></section>`;
 };

 let S=null,timer=0;
 const HOME=[true,true,false,false,false,true,true];
 function start(rival){
  stop();
  const them=Object.fromEntries(rival.roster.map((id,i)=>[FULL[i],BYID.get(id)]).filter(x=>x[1]));
  const mineSlots=team();if(!mineSlots)return;
  S={rival,mine:Ballgame.club(mineSlots,'Your club'),theirs:Ballgame.club(them,rival.team),r:rngFrom((Math.random()*2**32)>>>0),no:0,w:0,l:0,results:[],game:null,fast:false,auto:false,asked:'',saved:false};
  shell();pre();
 }
 function shell(){
  let el=$('series');
  if(!el){el=document.createElement('div');el.id='series';el.className='bg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Rival series');document.body.appendChild(el);
   el.addEventListener('keydown',e=>{if(e.key==='Escape')leave()})}
  el.innerHTML=`<div class="bg-in"><header class="bg-top"><span>Rival series · Best of 7</span><button type="button" class="btn" id="bgClose">Leave</button></header><div class="bg-series" id="bgSeries" hidden></div><div class="bg-stage" id="bgStage"></div></div>`;
  $('bgClose').onclick=leave;
  document.documentElement.classList.add('lg-lock');
  document.querySelectorAll('.sheet').forEach(s=>{if(!s.hidden)s.hidden=true});
 }
 // ---------- choosing a rival ----------
 let pickToken=0;
 window.pickRival=async function(){
  stop();S=null;shell();
  const stage=$('bgStage'),my=++pickToken;
  if(!team()){stage.innerHTML='<div class="bg-pre"><h3>Pick a rival</h3><p class="hint">Finish a season with a 16-player team first. That team plays the series.</p></div>';return}
  stage.innerHTML='<div class="bg-pre"><h3>Pick a rival</h3><p class="hint">Loading clubs…</p></div>';
  let leagues=[];try{leagues=(JSON.parse(store.get('pbc5-leagues')||'[]')||[]).filter(x=>x&&x.code)}catch(e){}
  const get=async q=>{const r=await fetch(`${LB_URL}?select=team,wins,grade,roster,device,created_at&mode=eq.pack&size=eq.16${q}&order=wins.desc,created_at.asc&limit=120`,{headers:lbHead()});if(!r.ok)throw 0;return r.json()};
  const best=rows=>{const seen=new Set();return rows.filter(x=>x.device!==me()&&Array.isArray(x.roster)&&x.roster.length===16&&!seen.has(x.device)&&seen.add(x.device))};
  let groups;
  try{groups=await Promise.all([...leagues.map(async l=>[l.name,best(await get('&leagues=cs.%7B'+l.code+'%7D'))]),(async()=>['Top of the leaderboard',best(await get('')).slice(0,12)])()])}
  catch(e){if(my===pickToken&&$('bgStage'))stage.innerHTML='<div class="bg-pre"><h3>Pick a rival</h3><p class="hint">Couldn\'t reach the leaderboard. Check your connection and try again.</p><button type="button" class="btn" onclick="pickRival()">Try again</button></div>';return}
  if(my!==pickToken||!$('bgStage'))return;
  const recs=book(),flat=[];
  const html=groups.map(([name,rows],gi)=>{
   const isLeague=gi<leagues.length;
   if(!rows.length)return isLeague?`<h4>${esc(name)}</h4><p class="hint">Nobody else in this league has posted a team yet.</p>`:'';
   return `<h4>${esc(name)}</h4><ul class="bg-rivals">${rows.map(x=>{const i=flat.push(x)-1,r=recs[x.device+'|'+x.team];return `<li><button type="button" data-i="${i}"><span><b>${esc(x.team)}</b><small>${x.wins}–${162-x.wins} · ${esc(x.grade)}${r?` · you are ${r.w}–${r.l} in series`:''}</small></span><em>Play</em></button></li>`}).join('')}</ul>`}).join('');
  stage.innerHTML=`<div class="bg-pre bg-choose"><h3>Pick a rival</h3><p class="hint">Your last finished 16-player team plays a best of 7 against the club you choose.</p>${html||'<p class="hint">No clubs to play yet.</p>'}</div>`;
  stage.querySelectorAll('.bg-rivals button').forEach(b=>b.onclick=()=>start(flat[+b.dataset.i]));
 };
 function stop(){clearTimeout(timer);timer=0}
 function leave(){stop();$('series')?.remove();S=null;document.documentElement.classList.remove('lg-lock')}
 const pips=n=>Array.from({length:4},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('');
 function strip(){
  $('bgSeries').innerHTML=`<div class="bg-club me"><b>Your club</b><span class="bg-pips" aria-hidden="true">${pips(S.w)}</span></div><strong aria-label="Series ${S.w} to ${S.l}">${S.w}–${S.l}</strong><div class="bg-club"><b>${esc(S.rival.team)}</b><span class="bg-pips" aria-hidden="true">${pips(S.l)}</span></div>`;
 }
 // Their manager runs a four-man rotation, so you see the ace again in game 5.
 const theirStarter=()=>S.theirs.rot[S.no%4];

 // ---------- before the game ----------
 function pre(){
  stop();$('bgSeries').hidden=false;strip();
  const no=S.no,home=HOME[no],ts=theirStarter(),avail=S.mine.rot.map(p=>Ballgame.rested(p,no));
  let pick=S.mine.rot.findIndex((p,i)=>avail[i]);
  S.mine.rot.forEach((p,i)=>{if(avail[i]&&posOvr(p.m,'SP1')>posOvr(S.mine.rot[pick].m,'SP1'))pick=i});
  const draw=()=>{
   $('bgStage').innerHTML=`<div class="bg-pre"><h3>Game ${no+1}<small>${home?'At your park':'On the road'}</small></h3>
    <p class="bg-them">They start <b>${esc(short(ts.m))}</b><em>SP ${posOvr(ts.m,'SP1')}</em></p>
    <h4 id="bgPickH">Who gets the ball?</h4>
    <div class="bg-pick" role="radiogroup" aria-labelledby="bgPickH">${S.mine.rot.map((p,i)=>`<button type="button" role="radio" aria-checked="${i===pick}" data-i="${i}"${avail[i]?'':' disabled'}>${tok(p.m)}<b>${esc(short(p.m))}</b><em>${posOvr(p.m,'SP1')}</em><small>${avail[i]?'Rested':'Started game '+(p.lastStart+1)}</small></button>`).join('')}</div>
    <label class="bg-auto"><input type="checkbox" id="bgAuto"${S.auto?' checked':''}> Let my coaches make the pitching changes</label>
    <button type="button" class="btn primary bg-go" id="bgGo">Play ball</button>
    ${no?`<button type="button" class="btn quiet bg-sim" id="bgSim">Sim the rest of the series</button>`:''}</div>`;
   $('bgStage').querySelectorAll('.bg-pick button').forEach(b=>b.onclick=()=>{pick=+b.dataset.i;draw()});
   $('bgAuto').onchange=e=>{S.auto=e.target.checked};
   $('bgGo').onclick=()=>play(pick);
   if($('bgSim'))$('bgSim').onclick=()=>{S.auto=true;while(S.w<4&&S.l<4){const a=S.mine.rot.map((p,i)=>Ballgame.rested(p,S.no)?i:-1).filter(i=>i>=0);newGame(a[0]);finishGame(true);if(S.w<4&&S.l<4)S.no++}end()};
  };
  draw();$('bgGo').focus({preventScroll:true});
 }
 function newGame(pick){
  const home=HOME[S.no],mine=S.mine.rot[pick],theirs=theirStarter();
  S.side=home?1:0;
  S.game=home?Ballgame.create(S.theirs,S.mine,S.r,S.no,[theirs,mine]):Ballgame.create(S.mine,S.theirs,S.r,S.no,[mine,theirs]);
  S.asked='';S.feed=[];S.myStarter=mine;
 }
 function finishGame(silent){
  const g=S.game;
  while(!g.done){Ballgame.autoManage(g,0);Ballgame.autoManage(g,1);Ballgame.step(g)}
  const won=g.winner===S.side;won?S.w++:S.l++;
  S.results.push({won,me:g.score[S.side],opp:g.score[1-S.side]});
  if(!silent)post();
 }

 // Box score: every hitter and pitcher in this game, for either club.
 function boxHTML(){
  const g=S.game;if(!g)return'';
  const side=i=>{const t=g.teams[i],f=g.pit[i],mine=i===S.side;
   return `<div class="bx-team"><h5>${esc(mine?'Your club':S.rival.team)}</h5>
    <table class="bx"><thead><tr><th scope="col">Batting</th><th scope="col">AB</th><th scope="col">R</th><th scope="col">H</th><th scope="col">HR</th><th scope="col">RBI</th><th scope="col">BB</th><th scope="col">K</th></tr></thead><tbody>${t.order.map(b=>`<tr><th scope="row"><small>${esc(lbl(b.pos))}</small>${esc(short(b.m))}</th><td>${b.g.ab}</td><td>${b.g.r}</td><td class="${b.g.h?'hi':''}">${b.g.h}</td><td class="${b.g.hr?'hi':''}">${b.g.hr}</td><td>${b.g.rbi}</td><td>${b.g.bb}</td><td>${b.g.k}</td></tr>`).join('')}</tbody></table>
    <table class="bx"><thead><tr><th scope="col">Pitching</th><th scope="col">IP</th><th scope="col">H</th><th scope="col">R</th><th scope="col">BB</th><th scope="col">K</th></tr></thead><tbody>${f.used.map(p=>`<tr><th scope="row">${esc(p.m.id?short(p.m):'Middle relief')}</th><td>${ip(p.g.outs)}</td><td>${p.g.h}</td><td>${p.g.r}</td><td>${p.g.bb}</td><td class="${p.g.k>=6?'hi':''}">${p.g.k}</td></tr>`).join('')}</tbody></table></div>`};
  return side(S.side)+side(1-S.side);
 }
 const boxBlock=open=>`<details class="bg-box" id="bgBox"${open?' open':''}><summary>Box score</summary><div id="bgBoxIn">${open?boxHTML():''}</div></details>`;
 function wireBox(){const d=$('bgBox');if(d)d.ontoggle=()=>{S.boxOpen=d.open;if(d.open)$('bgBoxIn').innerHTML=boxHTML()}}

 // ---------- the game ----------
 function play(pick){
  newGame(pick);
  const g=S.game,names=[S.side===0?'You':S.rival.team,S.side===1?'You':S.rival.team];
  $('bgStage').innerHTML=`<div class="bg-live">
   <div class="bg-board"><table class="bg-line" id="bgLine" aria-label="Line score"></table></div>
   <div class="bg-field"><div class="bg-diamond" id="bgDiamond" aria-hidden="true"><svg viewBox="0 0 200 150"><path d="M100 140 L20 60 A113 113 0 0 1 180 60 Z" class="grass"/><path d="M100 138 L52 90 L100 42 L148 90 Z" class="dirt"/><path d="M100 124 L66 90 L100 56 L134 90 Z" class="grass"/><circle cx="100" cy="92" r="6" class="dirt"/></svg><span class="base b1" id="bgB1"></span><span class="base b2" id="bgB2"></span><span class="base b3" id="bgB3"></span><span class="base hp" id="bgHP"></span><i class="bg-ball" id="bgBall"></i></div>
    <div class="bg-state"><b id="bgInn"></b><span class="bg-outs" id="bgOuts" aria-hidden="true"></span><small id="bgOutsT"></small><p id="bgMatch"></p></div></div>
   <p class="bg-call" id="bgCall" aria-live="polite"></p>
   <div class="bg-prompt" id="bgPrompt" hidden></div>
   <ol class="bg-feed" id="bgFeed" aria-label="Scoring plays"></ol>
   ${boxBlock(S.boxOpen)}
   <div class="bg-ctl"><button type="button" class="btn" id="bgSpeed" aria-pressed="${S.fast}">${S.fast?'Speed: Fast':'Speed: Normal'}</button><button type="button" class="btn" id="bgSkip">Skip to final</button></div></div>`;
  $('bgSpeed').onclick=()=>{S.fast=!S.fast;$('bgSpeed').textContent=S.fast?'Speed: Fast':'Speed: Normal';$('bgSpeed').setAttribute('aria-pressed',S.fast)};
  $('bgSkip').onclick=()=>{stop();finishGame()};
  S.names=names;wireBox();paint(null);
  timer=setTimeout(tick,700);
 }
 function line(){
  const g=S.game,n=Math.max(9,g.line[0].length),from=Math.max(0,n-9),cols=Array.from({length:9},(_,i)=>from+i);
  const row=i=>`<tr class="${i===S.side?'me':''}"><th scope="row">${esc(S.names[i])}</th>${cols.map(c=>`<td>${g.line[i][c]??''}</td>`).join('')}<td class="tot">${g.score[i]}</td><td class="tot">${g.hits[i]}</td></tr>`;
  $('bgLine').innerHTML=`<thead><tr><th></th>${cols.map(c=>`<th scope="col">${c+1}</th>`).join('')}<th scope="col">R</th><th scope="col">H</th></tr></thead><tbody>${row(0)}${row(1)}</tbody>`;
 }
 function paint(ev){
  const g=S.game;line();
  if(S.boxOpen&&$('bgBoxIn'))$('bgBoxIn').innerHTML=boxHTML();
  const bases=ev&&!ev.endHalf?ev.bases:g.bases.map(x=>x?x.m:null);
  ['bgB1','bgB2','bgB3'].forEach((id,i)=>{$(id).innerHTML=bases[i]?tok(bases[i]):'';$(id).classList.toggle('on',!!bases[i])});
  $('bgInn').textContent=g.done?'Final':`${g.half?'Bottom':'Top'} ${ord(g.inning)}`;
  const shown=ev&&ev.endHalf?0:g.outs;
  $('bgOuts').innerHTML=[0,1,2].map(i=>`<i class="${i<shown?'on':''}"></i>`).join('');
  $('bgOutsT').textContent=`${shown} out${shown===1?'':'s'}`;
  if(!g.done){const bs=g.half,b=g.teams[bs].order[g.idx[bs]%9],p=g.pit[1-bs].cur;
   $('bgHP').innerHTML=tok(b.m);
   $('bgMatch').innerHTML=`<span>At bat</span> <b>${esc(short(b.m))}</b><br><span>Pitching</span> <b>${esc(p.m.id?short(p.m):'Middle relief')}</b>`}
 }
 function call(ev){
  const mineBat=ev.half===S.side,c=$('bgCall');
  c.textContent=ev.text+(ev.walkoff?'. Walk-off!':'.');
  c.className='bg-call '+(ev.runs?(mineBat?'good':'bad'):ev.type==='K'&&!mineBat?'k':'');
  // The ball leaves the bat on every hit; a homer carries over the wall.
  if(['1B','2B','3B','HR'].includes(ev.type)){
   const ball=$('bgBall'),ang=(-65+130*Math.random())*Math.PI/180,far={'1B':48,'2B':72,'3B':84,HR:120}[ev.type];
   ball.style.setProperty('--dx',(Math.sin(ang)*far).toFixed(0)+'px');ball.style.setProperty('--dy',(-Math.cos(ang)*far).toFixed(0)+'px');
   ball.classList.remove('fly');void ball.offsetWidth;ball.classList.add('fly');
  }
  if(ev.runs){
   S.feed.unshift(`<li class="${mineBat?'good':'bad'}"><small>${ev.half?'Bot':'Top'} ${ev.inning}</small><span>${esc(ev.text)}</span><b>${ev.score[S.side]}–${ev.score[1-S.side]}</b></li>`);
   $('bgFeed').innerHTML=S.feed.slice(0,4).join('');
   const d=$('bgDiamond');d.classList.remove('flash-good','flash-bad');void d.offsetWidth;d.classList.add(mineBat?'flash-good':'flash-bad');
  }
 }
 function nextReliever(g,side){const lead=g.score[side]-g.score[1-side],t=g.teams[side];return g.inning>=9&&lead>=0&&lead<=3?t.cl:g.inning===8&&lead>=-1&&lead<=4?t.su:t.mid}
 function ask(){
  const g=S.game,f=g.pit[S.side],sp=f.sp,next=nextReliever(g,S.side),box=$('bgPrompt');
  const why=sp.g.r>=4&&!Ballgame.tiring(g,S.side)?`has given up ${sp.g.r} runs`:'is tiring';
  box.hidden=false;
  box.innerHTML=`<h4>Your call, skipper</h4><p><b>${esc(short(sp.m))}</b> ${why}: ${ip(sp.g.outs)} innings, ${sp.g.r} run${sp.g.r===1?'':'s'}, ${f.bf} batters faced.</p><div><button type="button" class="btn" id="bgStay">Leave him in</button><button type="button" class="btn primary" id="bgPull">Go to ${esc(next.m.id?short(next.m):'the bullpen')}</button></div>`;
  const go=pull=>{box.hidden=true;box.innerHTML='';if(pull){Ballgame.relief(g,S.side);paint(null)}timer=setTimeout(tick,350)};
  $('bgStay').onclick=()=>go(false);$('bgPull').onclick=()=>go(true);$('bgPull').focus({preventScroll:true});
 }
 function tick(){
  if(!S||!S.game)return;const g=S.game;
  if(g.done){timer=setTimeout(()=>finishGame(),900);return}
  const fs=1-g.half;
  Ballgame.autoManage(g,1-S.side);
  if(fs===S.side){
   const f=g.pit[S.side];
   if(S.auto||f.sp.g.r>=8)Ballgame.autoManage(g,S.side);
   else if(f.cur===f.sp&&g.outs===0&&g.inning>=5&&(Ballgame.tiring(g,S.side)||f.sp.g.r>=4)){
    const k=g.inning+'-'+g.half;if(S.asked!==k){S.asked=k;ask();return}
   }
  }
  const ev=Ballgame.step(g);paint(ev);call(ev);
  const base=ev.runs?1300:ev.out?260:480,extra=ev.endHalf?250:0;
  timer=setTimeout(tick,(base+extra)/(S.fast?3.2:1));
 }

 // ---------- after the game ----------
 function post(){
  stop();strip();
  const g=S.game,res=S.results[S.results.length-1],star=Ballgame.star(g,S.side),sp=S.myStarter,over=S.w===4||S.l===4;
  S.names=S.names||['',''];
  $('bgStage').innerHTML=`<div class="bg-post"><p class="bg-final ${res.won?'w':'l'}"><small>Game ${S.no+1} final${g.inning>9?' · '+g.inning+' innings':''}</small><b>${res.won?'You win':'You lose'} ${res.me}–${res.opp}</b></p>
   <div class="bg-board"><table class="bg-line" id="bgLine" aria-label="Line score"></table></div>
   <ul class="bg-notes"><li>${tok(star.m)}<span><b>${esc(short(star.m))}</b> ${star.g.h} for ${star.g.ab}${star.g.hr?', '+star.g.hr+' HR':''}${star.g.rbi?', '+star.g.rbi+' RBI':''}</span></li><li>${tok(sp.m)}<span><b>${esc(short(sp.m))}</b> ${ip(sp.g.outs)} innings, ${sp.g.r} run${sp.g.r===1?'':'s'}, ${sp.g.k} strikeout${sp.g.k===1?'':'s'}</span></li></ul>
   ${boxBlock(true)}
   ${S.feed&&S.feed.length?`<details class="bg-plays"><summary>Scoring plays</summary><ol class="bg-feed">${[...S.feed].reverse().join('')}</ol></details>`:''}
   <button type="button" class="btn primary bg-go" id="bgNext">${over?'See the series result':'Next game'}</button></div>`;
  line();wireBox();
  $('bgNext').onclick=()=>{if(over)end();else{S.no++;pre()}};$('bgNext').focus({preventScroll:true});
 }
 function end(){
  stop();strip();
  const won=S.w>S.l,key=S.rival.device+'|'+S.rival.team,all=book(),rec=all[key]||{team:S.rival.team,w:0,l:0};
  const fresh=!S.saved;
  if(!S.saved){rec[won?'w':'l']++;rec.team=S.rival.team;rec.last=Date.now();all[key]=rec;store.set(KEY,JSON.stringify(all));S.saved=true}
  const mvp=S.mine.order.reduce((a,b)=>(b.ser.h+2*b.ser.hr+1.5*b.ser.rbi)>(a.ser.h+2*a.ser.hr+1.5*a.ser.rbi)?b:a);
  const games=S.results.map((x,i)=>`<li class="${x.won?'w':'l'}"><small>G${i+1}</small><b>${x.won?'W':'L'}</b><span>${x.me}–${x.opp}</span></li>`).join('');
  $('bgStage').innerHTML=`<div class="bg-end"><p class="bg-banner ${won?'w':'l'}"><small>${won?'Series win':'Series loss'}</small><b>${won?'You beat':'You fell to'} ${esc(S.rival.team)} ${Math.max(S.w,S.l)}–${Math.min(S.w,S.l)}</b></p>
   <ol class="bg-games">${games}</ol>
   <ul class="bg-notes"><li>${tok(mvp.m)}<span><b>${esc(short(mvp.m))}</b> led your club: ${mvp.ser.h} for ${mvp.ser.ab}${mvp.ser.hr?', '+mvp.ser.hr+' HR':''}, ${mvp.ser.rbi} RBI</span></li></ul>
   <p class="hint">All-time against this club: ${rec.w}–${rec.l} in series. Your records are in Records, under My Clubhouse.</p>
   <div class="bg-actions"><button type="button" class="btn primary" id="bgShare">Share result</button><button type="button" class="btn" id="bgAgain">Rematch</button><button type="button" class="btn" id="bgDone">Done</button></div><p class="hint" id="bgMsg" role="status"></p></div>`;
  $('bgAgain').onclick=()=>start(S.rival);$('bgDone').onclick=leave;
  if(fresh)postSeries();
  $('bgShare').onclick=async()=>{
   const text=`⚾ Pokémon Ballclub · Rival series\n${won?'Beat':'Lost to'} ${S.rival.team} ${Math.max(S.w,S.l)}–${Math.min(S.w,S.l)}\n${S.results.map(x=>x.won?'🟩':'🟥').join('')}\n⭐ ${short(mvp.m)}: ${mvp.ser.h} hits, ${mvp.ser.hr} HR, ${mvp.ser.rbi} RBI\n${SITE}`;
   try{if(navigator.share&&matchMedia('(pointer:coarse)').matches){await navigator.share({text});return}await navigator.clipboard.writeText(text);$('bgMsg').textContent='Result copied.'}catch(e){if(e?.name!=='AbortError')$('bgMsg').textContent='Could not share from this browser.'}};
  $('bgShare').focus({preventScroll:true});
 }

 // Series results go to your leagues' feeds, under the name of your last posted team.
 async function postSeries(){
  const codes=typeof leagueCodes==='function'?leagueCodes():[],msg=$('bgMsg');
  if(!codes.length)return;
  let name=myName();
  // No name saved on this phone yet: use the name of the last team this device posted.
  if(!name){try{const r=await fetch(`${LB_URL}?select=team&device=eq.${encodeURIComponent(me())}&order=created_at.desc&limit=1`,{headers:lbHead()});if(r.ok){name=((await r.json())[0]||{}).team||'';if(name)store.set(LAST+'-name',name)}}catch(e){}}
  if(!S)return;
  if(!name){if(msg)msg.textContent='Post a team once to give your club a name. Then your series results show in your league.';return}
  const row={device:me(),team:name.slice(0,40),opp_device:S.rival.device||null,opp_team:String(S.rival.team).slice(0,40),w:S.w,l:S.l,games:S.results.map(x=>[x.me,x.opp]),leagues:codes};
  try{const r=await fetch(SERIES_URL,{method:'POST',headers:lbHead({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify(row)});if(!r.ok)throw 0;
   if(msg&&S)msg.textContent='Posted to your league.'}
  catch(e){if(msg&&S)msg.textContent="Couldn't post this series to your league."}
 }
 window.leagueSeriesFeed=async(code,host)=>{
  if(!host)return;host.innerHTML='';
  let rows;try{const r=await fetch(`${SERIES_URL}?select=team,opp_team,w,l,games,device,created_at&leagues=cs.%7B${code}%7D&order=created_at.desc&limit=12`,{headers:lbHead()});if(!r.ok)throw 0;rows=await r.json()}catch(e){return}
  if(!host.isConnected)return;
  const day=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  host.innerHTML=`<h3 class="lg-h">Rival series <span>Latest results</span></h3>`+(rows.length?`<ul class="lg-series">${rows.map(x=>{const won=x.w>x.l;return `<li class="${x.device===me()?'me':''}"><span><b>${esc(x.team)}</b> ${won?'beat':'lost to'} <b>${esc(x.opp_team)}</b></span><em>${Math.max(x.w,x.l)}–${Math.min(x.w,x.l)}</em><small>${[(x.games||[]).map(g=>g[0]>g[1]?'W':'L').join(' '),day(x.created_at)].filter(Boolean).join(' · ')}</small></li>`}).join('')}</ul>`:'<p class="hint">No series yet. Open a team above and play it in a best of 7; the result shows here for the whole league.</p>');
 };

 // Results page: a way into the series from the season you just finished.
 function card(){
  document.querySelector('#season .rival-card')?.remove();
  if(!run?.result||run.size!==16)return;
  const after=document.querySelector('#season .season-actions');if(!after)return;
  const c=document.createElement('section');c.className='rival-card';
  c.innerHTML='<div><h3>Rival series</h3><p>Take this team into a best of 7 against a friend in your league or any posted club.</p></div><button type="button" class="btn" id="rivalPick">Pick a rival</button>';
  after.after(c);$('rivalPick').onclick=()=>pickRival();
 }
 const prevFinish=finish;finish=function(){const v=prevFinish.apply(this,arguments);remember();card();return v};
 if(run?.result){remember();card()}
})();
