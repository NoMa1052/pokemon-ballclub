/* Presentation and career progression only. The existing game remains the source of truth. */
(() => {
  const $=id=>document.getElementById(id),reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const role=s=>s.startsWith('SP')?'SP':s.startsWith('RP')?'RP':s;
  const delta=n=>n>0?'+'+n:String(n);
  const cls=n=>n>0?'gain':n<0?'loss':'neutral';
  let compareOpen=false,lastSelected=null,lastRecord=null;

  const originalCard=tcardHTML;
  tcardHTML=function(m,mini){
    let html=originalCard(m,mini);if(mini)return html;
    const tools=KEY.slice().sort((a,b)=>m.r[b[1]]-m.r[a[1]]).slice(0,2);
    html=html.replace(`<small>${m.hspot}</small>`,`<small>Best ${m.hspot}</small>`);
    html=html.replace(/<div class="tc-meta">[^<]*<\/div>/,`<div class="tc-meta">#${dex(m.num)} · ${m.types.map(cap).join(' / ')}</div><div class="tc-strengths">${tools.map(([n,k])=>`<span>${n} <b>${m.r[k]}</b></span>`).join('')}</div>`);
    return html;
  };

  const originalPicker=positionPickerHTML;
  positionPickerHTML=function(m){
    const html=originalPicker(m);if(!m)return html;
    const roles=slotList().filter((s,i,a)=>a.findIndex(x=>role(x)===role(s))===i);
    const best=roles.slice().sort((a,b)=>posOvr(m,b)-posOvr(m,a)).slice(0,3);
    const filled=slotList().filter(s=>run.slots[s]);
    const comparisons=slotList().map(s=>{
      const other=run.slots[s],v=posOvr(m,s),old=other?posOvr(other,s):null,n=old==null?null:v-old;
      return `<div class="position-compare"><b>${lbl(s)}</b><span>${other?esc(other.name):'Open'}${old!=null?` <small>${old}</small>`:''}</span><strong>${v}</strong><em class="${n==null?'neutral':cls(n)}">${n==null?'Open':delta(n)}</em></div>`;
    }).join('');
    return html+`<p class="natural-positions">Best overall: ${best.map(s=>`<b>${role(s)} ${posOvr(m,s)}</b>`).join(' · ')}</p>${filled.length?`<details class="roster-comparison" ${compareOpen?'open':''}><summary>Compare with your roster</summary><div class="compare-head"><span>Spot / current player</span><span>New</span><span>Change</span></div>${comparisons}<p class="hint">Draft into an open spot. After drafting, tap a roster player to preview a move or swap.</p></details>`:''}`;
  };

  const previousHow=howHTML;
  howHTML=function(){return previousHow().replace('Build a Pokémon baseball team. See how far it goes.','Draft a team. Find their best positions. Chase 162–0.').replace('Open a pack of 5 cards, or spin for a type and region.','Packs: open 5 random cards.<br>Spin: get Pokémon matching one type and region.').replace('Tap a card to see its stats and position ratings.','Pick a Pokémon, inspect its card, and find the best open spot.').replace('Fill your roster, rearrange it, then simulate a season.','Fill every spot, preview swaps, then play a 162-game season.');};

  function careerHTML(){
    const b=Clubhouse.read();
    return `<div class="career-intro"><h3>Your clubhouse</h3><p class="hint">Personal records on this device. Each mode and roster size has its own board.</p></div>${b.seasons?`<div class="career-boards">${Object.entries(b.boards).map(([k,v])=>`<div><small>${Clubhouse.boardName(k)}</small><b>${v.bestWins}–${162-v.bestWins}</b><span>${v.seasons} season${v.seasons===1?'':'s'} · Best roster ${v.bestRating}</span></div>`).join('')}</div>`:'<p class="hint">Finish a season to set your first record.</p>'}<details class="achievement-list"><summary>Achievements · ${b.unlocked.length}/${Clubhouse.achievements.length}</summary><div>${Clubhouse.achievements.map(([k,n,d])=>`<p class="${b.unlocked.includes(k)?'earned':''}"><b>${b.unlocked.includes(k)?'✓ ':''}${n}</b><span>${d}</span></p>`).join('')}</div></details>${b.history.length?`<div class="career-history"><h4>Recent seasons</h4>${b.history.slice(0,12).map(h=>`<details><summary><span><b>${h.wins}–${162-h.wins}</b> · ${esc(h.grade)}${h.champ?' · Champions':''}<small>${Clubhouse.boardName(h.board)} · Roster ${h.rating}</small></span></summary><p class="hint">MVP: ${esc(h.mvp.name)} · ${h.mvp.hr} HR · ${h.mvp.ops.toFixed(3)} OPS</p><div class="saved-lineup">${(h.roster.length===16?FULL:STD).map((s,i)=>{const m=BYID.get(h.roster[i]);return m?`<span><i>${lbl(s)}</i><button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${esc(m.name)}</button><em>${posOvr(m,s)}</em></span>`:''}).join('')}</div></details>`).join('')}</div>`:''}`;
  }
  let recordsTab='leaderboard',recordsRequest=0;
  const recordsNav=()=>`<div class="records-tabs" role="tablist" aria-label="Records"><button id="recordsPublicTab" role="tab" aria-controls="recordsPanel" aria-selected="${recordsTab==='leaderboard'}" data-records="leaderboard">Leaderboard</button><button id="recordsClubTab" role="tab" aria-controls="recordsPanel" aria-selected="${recordsTab==='clubhouse'}" data-records="clubhouse">My Clubhouse</button></div>`;
  function wireRecords(){
    const tabs=[...$('lbBody').querySelectorAll('[data-records]')];
    tabs.forEach(b=>{b.onclick=()=>showRecords(b.dataset.records,true);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tab=e.key==='Home'?'leaderboard':e.key==='End'?'clubhouse':recordsTab==='leaderboard'?'clubhouse':'leaderboard';showRecords(tab,true)}}});
    $('lbBody').querySelectorAll('[data-record-mode]').forEach(b=>b.onclick=()=>{lbMode=b.dataset.recordMode;showRecords('leaderboard')});
    $('lbBody').querySelectorAll('[data-record-size]').forEach(b=>b.onclick=()=>{lbSize=+b.dataset.recordSize;showRecords('leaderboard')});
    const retry=$('recordsRetry');if(retry)retry.onclick=()=>showRecords('leaderboard');
  }
  function recordsRoster(x,slots){
    const groups=[['Fielders',slots.filter(s=>FIELD_SLOTS.includes(s))],['Rotation',slots.filter(s=>s.startsWith('SP'))],['Bullpen',slots.filter(s=>s.startsWith('RP'))]];
    return `<div class="records-team"><div class="records-team-rating"><span>Roster rating <b>${x.ovr}</b></span><small>${(x.rs/162).toFixed(1)} scored · ${(x.ra/162).toFixed(1)} allowed per game</small></div>${groups.map(([title,group])=>`<div class="records-roster-group"><h4>${title}</h4><div class="records-roster">${group.map(s=>{const m=BYID.get(x.roster[slots.indexOf(s)]);return m?`<div class="records-player"><i>${lbl(s)}</i><button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${esc(m.name)}</button><b aria-label="Position rating ${posOvr(m,s)}">${posOvr(m,s)}</b></div>`:''}).join('')}</div></div>`).join('')}<p class="records-roster-note">Each number is the player’s rating at that position. Tap a Pokémon to inspect its card.</p></div>`;
  }
  async function showRecords(tab,focus=false){
    recordsTab=tab;const request=++recordsRequest,body=$('lbBody');
    const filters=tab==='leaderboard'?`<div class="records-filters"><div><span>Mode</span><div class="records-filter-buttons" role="group" aria-label="Leaderboard mode">${[['spin','Spin'],['pack','Packs']].map(([v,l])=>`<button data-record-mode="${v}" aria-pressed="${lbMode===v}">${l}</button>`).join('')}</div></div><div><span>Roster size</span><div class="records-filter-buttons" role="group" aria-label="Leaderboard roster size">${[16,11].map(v=>`<button data-record-size="${v}" aria-pressed="${lbSize===v}">${v===16?'Standard':'Quick'}<small>${v} players</small></button>`).join('')}</div></div></div>`:'';
    const shell=content=>recordsNav()+`<div id="recordsPanel" role="tabpanel" aria-labelledby="${tab==='leaderboard'?'recordsPublicTab':'recordsClubTab'}">${filters}<div class="records-results">${content}</div></div>`;
    const paint=(content,initial=false)=>{if(initial)body.innerHTML=shell(content);else body.querySelector('.records-results').innerHTML=content;wireRecords();if(focus&&initial)$(tab==='leaderboard'?'recordsPublicTab':'recordsClubTab').focus()};
    if(tab==='clubhouse'){paint(`<div class="records-clubhouse">${careerHTML()}</div>`,true);return}
    paint('<p class="hint" role="status">Loading teams…</p>',true);
    const size=lbSize,which=lbMode;
    let rows;
    try{const response=await fetch(`${LB_URL}?select=team,wins,grade,rs,ra,roster,device,created_at&mode=eq.${which}&size=eq.${size}&order=wins.desc,created_at.asc&limit=100`,{headers:lbHead()});if(!response.ok)throw new Error('Leaderboard unavailable');rows=await response.json()}
    catch(_){if(request!==recordsRequest||$('lb').hidden)return;paint('<p class="hint" role="status">Couldn’t load the leaderboard. Your personal records are still available in My Clubhouse.</p><button class="btn" id="recordsRetry">Try again</button>');return}
    if(request!==recordsRequest||$('lb').hidden)return;
    const slots=size===16?FULL:STD,me=deviceId().slice(0,16),date=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    rows=rows.map(x=>({...x,ovr:rosterOvr(x.roster,slots)})).sort(lbRank).slice(0,50);
    paint(rows.length?`<div class="stand records-stand"><div class="stand-head"><span></span><span>Team</span><span>W</span><span>L</span><span>Grade</span><span></span></div><ol class="lblist">${rows.map((x,i)=>`<li class="${x.device===me?'me':''}"><details><summary aria-label="Rank ${i+1}, ${esc(x.team)}, ${x.wins} wins, roster rating ${x.ovr}. View roster"><span class="rk">${i+1}</span><span class="tm"><b>${esc(x.team)}</b><small>Rating ${x.ovr} · ${date(x.created_at)}</small></span><span class="w">${x.wins}</span><span class="l">${162-x.wins}</span><span class="gd">${esc(x.grade)}</span><span class="records-arrow" aria-hidden="true"></span></summary>${recordsRoster(x,slots)}</details></li>`).join('')}</ol></div><p class="hint records-ranking">Ranked by wins, then roster rating, run differential and earliest post. Tap a team to view its roster.</p>`:'<p class="hint">No teams yet on this board. Finish a season and post your team.</p>');
  }
  openLb=function(size,m){lbSize=size||run.size;lbMode=m||(isPack()?'pack':'spin');$('lb').hidden=false;$('lbTitle').textContent='Records';return showRecords('leaderboard')};
  const previousCloseLb=closeLb;
  closeLb=function(){recordsRequest++;previousCloseLb()};
  $('lbClose').onclick=closeLb;
  function openCareer(){lbSize=lbSize||run.size;lbMode=lbMode||(isPack()?'pack':'spin');$('lb').hidden=false;$('lbTitle').textContent='Records';return showRecords('clubhouse')}
  function inspectHistoricalCard(id){
    const m=BYID.get(id);if(!m||document.querySelector('.historical-card'))return;
    setOverall(m);const el=document.createElement('div');el.className='sheet historical-card';el.setAttribute('role','dialog');el.setAttribute('aria-label',m.name+' card');
    el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2>${esc(m.name)}</h2><button class="btn history-card-close">Close</button></div><div class="sheet-body">${tcardHTML(m)}<p class="hint">Best positions: ${STD.slice().sort((a,b)=>posOvr(m,b)-posOvr(m,a)).slice(0,3).map(s=>`${role(s)} ${posOvr(m,s)}`).join(' · ')}</p></div></div>`;
    document.body.append(el);document.documentElement.classList.add('inspect-open');
    const close=()=>{el.remove();document.documentElement.classList.remove('inspect-open')};el.querySelector('.history-card-close').onclick=close;el.onclick=e=>{if(e.target===el)close()};el.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-history-mon]');if(b)inspectHistoricalCard(+b.dataset.historyMon)});
  function progressGuide(){
    document.querySelector('.career-link')?.remove();
    $('lbBtn').innerHTML='<span class="pen-ic" aria-hidden="true"></span>Records';
    document.querySelector('#modeSeg [data-v=practice] .sg-t small').textContent='Type + region choices';
    document.querySelector('#modeSeg [data-v=pack] .sg-t small').textContent='Open 5 random cards';
    const throwBox=$('throwBox');if(throwBox){
      const lab=$('spinLabel');if(!spinning&&lab)lab.textContent=isPack()?'Open Pack':'Spin for your next player';
      const cue=throwBox.querySelector('.tapcue');if(cue&&!spinning)cue.textContent=isPack()?'Swipe across the seam · or tap':'Tap the ball to spin';
      const sub=throwBox.querySelector('.throw-sub');if(sub)sub.textContent=run.unrevealed?'Your choices are ready. Open to continue.':isPack()?'Choose one card, then give it a position.':'One type + one region. Pick a Pokémon, then its position.';
    }
    const pb=$('playBtn');if(pb){pb.textContent='Review team';const note=document.querySelector('.simulate-note');if(note)note.textContent='Your lineup is final when the season starts.';}
    document.querySelectorAll('#doubleBtn,#rvTake2').forEach(b=>b.classList.add('master-ball-control'));
    if(isPack())$('poolHead')?.remove();
    if(run.moving&&!run.locked&&!run.result){
      const slot=run.moving,m=run.slots[slot];
      $('draft').insertAdjacentHTML('beforeend',`<div class="release-control"><button class="btn" id="releasePlayer" ${!run.releases||run.second?'disabled':''}>Release ${esc(m.name)}<small>${run.releases||0} left</small></button><p class="hint">Reopen this spot and draft a replacement. Once per run.</p><div id="releaseConfirm" hidden><p>Release <b>${esc(m.name)}</b>? You’ll get a replacement pick. This cannot be undone.</p><button class="btn" id="cancelRelease">Keep Pokémon</button><button class="btn primary" id="confirmRelease">Release Pokémon</button></div></div>`);
      $('draft').querySelector('.move-title').after($('draft').querySelector('.release-control'));
      $('releasePlayer').onclick=()=>{$('releaseConfirm').hidden=false;$('confirmRelease').focus()};
      $('cancelRelease').onclick=()=>{$('releaseConfirm').hidden=true;$('releasePlayer').focus()};
      $('confirmRelease').onclick=()=>releasePlayer(slot);
    }
    $('draft').querySelectorAll('details.roster-comparison').forEach(el=>el.ontoggle=()=>{compareOpen=el.open;});
    if(run.selected!==lastSelected){compareOpen=false;lastSelected=run.selected;}
    if(!isPack()&&run.selected){
      const c=$('draft').querySelector('.spin-card');if(c)c.setAttribute('aria-label',BYID.get(run.selected).name+' card. Tap to change Pokémon');
    }
  }
  function breakdown(){
    const list=slotList(),h=FIELD_SLOTS.map(s=>run.slots[s]),f=FIELD_ONLY.map(s=>run.slots[s]),p=list.filter(s=>!FIELD_SLOTS.includes(s));
    const mean=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length);
    return [['Hitting',mean(h.map(m=>posOvr(m,'DH'))),'Batting strength'],['Fielding',mean(f.map(m=>GLOVE((m.pd[list.find(s=>run.slots[s]===m)]-50)/10))),'Glove at assigned spots'],['Pitching',mean(p.map(s=>posOvr(run.slots[s],s))),'Rotation + bullpen']];
  }
  const grade=v=>v>=90?'A':v>=80?'B':v>=70?'C':v>=60?'D':'F';
  function enhanceResults(){
    if(!run.result||$('season').hidden||$('season').querySelector('.season-summary'))return;
    const res=run.result,b=Clubhouse.read(),k=Clubhouse.boardKey(run),best=b.boards[k]?.bestWins,stats=breakdown(),top=stats.reduce((a,x)=>x[1]>a[1]?x:a),low=stats.reduce((a,x)=>x[1]<a[1]?x:a);
    const intro=$('season').querySelector('.res-top');
    const recordText=best===res.wins?`Personal best: ${best} wins in ${Clubhouse.boardName(k)}.`:`${best-res.wins} wins short of your ${Clubhouse.boardName(k)} best (${best}).`;
    const oldBest=intro?.querySelector('div:last-child>.hint');if(oldBest)oldBest.textContent=recordText;
    const summary=document.createElement('section');summary.className='season-summary';summary.innerHTML=`<h3>Your team’s scouting report</h3><div class="team-bars">${stats.map(([n,v,d])=>`<div class="team-bar" title="${d}"><span>${n}</span><i style="--w:${Math.max(0,Math.min(100,v))}%" class="${v>=85?'hi':v>=70?'mid':'lo'}"></i><b>${v}</b></div>`).join('')}</div><p class="hint">${top[0]} led this roster. ${low[0]===top[0]?'A balanced team across all three areas.':low[0]+' is the clearest area to improve next run.'}</p>${lastRecord?.unlocks.length?`<p class="achievement-unlock" role="status">Unlocked: ${lastRecord.unlocks.map(id=>Clubhouse.achievements.find(a=>a[0]===id)[1]).join(' · ')}</p>`:''}`;
    const awards=$('season').querySelector('.awards');awards.before(summary);
    const mv=res.me.order.map(h=>({h,ops:(h.st.h+h.st.bb)/Math.max(1,h.st.pa)+(h.st.h+h.st.d+2*h.st.t+3*h.st.hr)/Math.max(1,h.st.ab)})).sort((a,b)=>b.ops-a.ops)[0];
    const mvpBox=awards.querySelector('.award');if(mvpBox)mvpBox.lastElementChild.textContent=`${mv.h.st.hr} HR · ${mv.ops.toFixed(3)} OPS · ${mv.h.st.rbi} RBI`;
    const panel=$('season').querySelector('.panel'),details=document.createElement('details');details.className='season-details';details.innerHTML='<summary>Full batting and pitching stats</summary>';
    const nodes=[...panel.children],start=nodes.findIndex(n=>n.classList.contains('label')&&n.textContent.includes('Lineup card'));
    if(start>=0){nodes[start].before(details);nodes.slice(start).forEach(n=>details.append(n));}
    panel.insertAdjacentHTML('beforeend','<button class="btn quiet result-career" id="resultClubhouse">View my clubhouse</button>');$('resultClubhouse').onclick=openCareer;
    const share=$('shareBtn');share.textContent=navigator.share&&matchMedia('(pointer:coarse)').matches?'Share result':'Copy result';
    share.onclick=async()=>{
      const text=`⚾ Pokémon Ballclub

Record: ${res.wins}–${162-res.wins}
${res.post.champ?'🏆 World Series champions!':res.post.made?res.post.text:'Missed the playoffs.'}

Mode: ${isPack()?'Packs':'Spin'}
Roster: ${run.size===16?'Standard':'Quick'} (${run.size} players)
Team rating: ${teamOvr()}

⭐ MVP: ${mv.h.m.name}
${mv.h.st.hr} home runs

Can you beat ${res.wins} wins?
https://pokemon-ballclub.vercel.app/`,msg=$('shareMsg');
      if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({text});return}catch(e){if(e.name==='AbortError')return}}
      try{await navigator.clipboard.writeText(text);msg.textContent='Copied. Share your team with a friend.'}catch(_){msg.innerHTML='<label>Copy your result<textarea readonly></textarea></label>';const t=msg.querySelector('textarea');t.value=text;t.focus();t.select();}
    };
    const again=$('again');if(again)again.onclick=()=>{newRun();const d=document.querySelector('.ux-dialog');if(d){d.querySelector('#restartRun').addEventListener('click',()=>requestAnimationFrame(()=>$('draft').scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'})));}else $('draft').scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});};
  }
  const oldFinish=finish;
  finish=function(scroll){
    oldFinish(false);lastRecord=Clubhouse.record(run);enhanceResults();progressGuide();
    if(scroll)$('season').scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});
  };
  // Save completed current boards from older versions without changing their progress.
  for(const m of ['practice','pack'])for(const size of [11,16]){
    try{const saved=JSON.parse(store.get(runKey(m,size)));if(saved?.result?.me?.order&&saved?.result?.post){saved.slots=Object.fromEntries(Object.entries(saved.slots).map(([s,id])=>[s,BYID.get(id)]));Clubhouse.record(saved)}}catch(_){}
  }
  const oldRender=render;
  render=function(){oldRender();progressGuide();};
  // Historical cards are inspectable without editing or replaying completed seasons.
  render();if(!$('how').hidden)openHow();if(run.result){lastRecord=Clubhouse.record(run);finish(false);}
})();
