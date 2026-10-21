/* Compact, read-only season summary and three-view team presentation. */
(() => {
 const $=id=>document.getElementById(id);
 const staffLabel=s=>s==='RP1'?'CL':s==='RP2'?'SU':s;
 const f3=n=>Number.isFinite(n)?n.toFixed(3).replace(/^0/,''):'.000';
 // Box score: one row per player, name column pinned, the rest scrolls sideways.
 function boxScore(){
  const me=run.result?.me;if(!me)return '';
  const sprite=m=>`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" loading="lazy">`;
  const who=(s,m,lead)=>`<th scope="row"><button type="button" class="box-who" data-box-slot="${esc(s)}" aria-label="${esc(m.name)}, ${esc(SLOT_NAME[s]||lbl(s))}. View card and stats"><span class="box-lead">${lead}</span>${sprite(m)}<span><b>${esc(m.name)}</b><small>${FIELD_SLOTS.includes(s)?esc(lbl(s))+' · ':''}${posOvr(m,s)} OVR</small></span></button></th>`;
  const bat=(me.order||[]).filter(h=>run.slots[h.pos]&&h.st).map((h,i)=>{const st=h.st,obp=(st.h+st.bb)/Math.max(1,st.pa),slg=(st.h+st.d+2*st.t+3*st.hr)/Math.max(1,st.ab);
   return `<tr>${who(h.pos,run.slots[h.pos],i+1)}<td>${f3(st.h/Math.max(1,st.ab))}</td><td>${st.hr}</td><td>${st.rbi}</td><td>${f3(obp+slg)}</td><td>${f3(obp)}</td><td>${f3(slg)}</td><td>${st.h}</td><td>${st.d}</td><td>${st.t}</td><td>${st.r}</td><td>${st.bb}</td><td>${st.k}</td><td>${st.sb}</td></tr>`}).join('');
  const arms=slotList().filter(s=>!FIELD_SLOTS.includes(s)&&run.slots[s]).map(s=>{const p=s==='RP1'?me.cl:s==='RP2'?me.pen:me.rot?.find(x=>x.role===s);if(!p?.st||p.role==='FILL')return '';const st=p.st;
   return `<tr>${who(s,run.slots[s],staffLabel(s))}<td>${(st.outs?st.r*27/st.outs:0).toFixed(2)}</td><td>${ip(st.outs)}</td><td>${st.w}</td><td>${st.l}</td><td>${st.sv}</td><td>${st.k}</td><td>${st.bb}</td><td>${st.h}</td><td>${st.hr}</td><td>${st.g}</td><td>${st.gs}</td></tr>`}).join('');
  const table=(cap,cols,rows)=>`<section class="box-group"><h4>${cap}</h4><div class="box-scroll" tabindex="0" role="region" aria-label="${cap}, scrolls sideways"><table class="box"><thead><tr><th scope="col">Player</th>${cols.map(c=>`<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
  return table('Batting',['AVG','HR','RBI','OPS','OBP','SLG','H','2B','3B','R','BB','K','SB'],bat)+table('Pitching',['ERA','IP','W','L','SV','K','BB','H','HR','G','GS'],arms)+'<p class="box-note">Swipe the table for more. Tap a player for their card.</p>';
 }
 function decorate(){
  const season=$('season'),team=$('postseasonTeam'),res=run?.result;
  if(!res||!season||season.hidden||!team)return;
  const top=season.querySelector('.res-top'),panel=season.querySelector('.panel');
  if(!top||!panel)return;
  top.classList.add('clean-result-top');
  const context=top.querySelector('.result-context')||top.children[2];if(context)context.remove();
  top.querySelector('.label')?.replaceChildren(document.createTextNode('FINAL · 162 GAMES'));
  top.querySelector('.bigrec')?.setAttribute('aria-label',res.wins+' wins and '+(162-res.wins)+' losses');
  panel.querySelector('.clean-season-summary')?.remove();
  const post=res.post||{};
  const ps=post.made&&Array.isArray(post.games)?post.games.reduce((a,g)=>[a[0]+g[0],a[1]+g[1]],[0,0]):null;
  const ws=String(post.text||'').match(/(\d+)\s*[–-]\s*(\d+)/);
  // Headline is the first sentence; anything after it becomes the supporting line.
  const sentences=String(post.text||'Season complete.').split(/(?<=\.)\s+/);
  const outcome=post.champ?'World Series Champions':sentences[0].replace(/\.$/,'');
  const extras=[...(post.champ&&ws?['Won '+ws[1]+'–'+ws[2]]:[]),...(!post.champ&&sentences.length>1?[sentences.slice(1).join(' ').replace(/\.$/,'')]:[]),...(ps?['Postseason '+ps[0]+'–'+ps[1]]:[])];
  // Compare against earlier seasons on this board only, so a first season isn't called a personal best.
  let best='';
  try{const id=Clubhouse.identity(run),key=Clubhouse.boardKey(run);
    const earlier=Clubhouse.read().history.filter(h=>h.board===key&&h.id!==id).map(h=>h.wins);
    if(earlier.length){const top=Math.max(...earlier),diff=top-res.wins;best=diff<0?'New personal best':diff===0?'Ties your best':diff+' '+(diff===1?'win':'wins')+' off your best';}
  }catch(_){}
  const summary=document.createElement('div');summary.className='clean-season-summary';
  summary.innerHTML='<div class="clean-outcome"><b>'+esc(outcome)+'</b>'+
   (extras.length?'<span>'+extras.map(esc).join(' · ')+'</span>':'')+'</div>'+
   '<div class="clean-metrics"><span>'+(res.runs.rs/162).toFixed(1)+' R/G</span><span>'+(res.runs.ra/162).toFixed(1)+' RA/G</span>'+
   (best?'<span>'+esc(best)+'</span>':'')+'</div>';
  top.after(summary);
  team.classList.add('clean-postseason');
  team.querySelector('.postseason-eyebrow')?.remove();
  const title=team.querySelector('.postseason-heading h3');if(title)title.textContent='Final Team';
  team.querySelector('.postseason-heading p')?.remove();
  const overall=team.querySelector('.postseason-overall');
  if(overall){overall.innerHTML='<strong>'+Number(teamOvr())+'</strong><span>OVR</span>';overall.setAttribute('aria-label','Team rating '+teamOvr()+' overall');}
  const field=$('postseasonFieldPanel'),ratings=$('postseasonRatingsPanel'),nav=team.querySelector('.postseason-tabs');
  if(!field||!ratings||!nav)return;
  // Keep the original full-size pitching staff board. This uses the
  // exact rotation/bullpen clone from postseason.js instead of compact chips.
  field.querySelector('.clean-staff')?.remove();
  const staff=team.querySelector('#postseasonPen');
  if(staff)staff.hidden=false;
  // Remove previously bound two-tab buttons; reuse their existing roster panel.
  nav.innerHTML='<button type="button" role="tab" id="postseasonFieldTab" aria-controls="postseasonFieldPanel">On Field</button>'+
   '<button type="button" role="tab" id="postseasonRatingsTab" aria-controls="postseasonRatingsPanel">Lineup</button>'+
   '<button type="button" role="tab" id="postseasonStatsTab" aria-controls="postseasonStatsPanel">Stats</button>';
  team.querySelector('#postseasonStatsPanel')?.remove();
  const statsPanel=document.createElement('div');statsPanel.id='postseasonStatsPanel';statsPanel.setAttribute('role','tabpanel');statsPanel.setAttribute('aria-labelledby','postseasonStatsTab');statsPanel.className='box-panel';statsPanel.hidden=true;statsPanel.innerHTML=boxScore();
  ratings.after(statsPanel);
  statsPanel.addEventListener('click',e=>{const b=e.target.closest('[data-box-slot]');if(!b)return;
   const card=[...ratings.querySelectorAll('button.fantasy-player')].find(x=>x.dataset.postseasonSlot===b.dataset.boxSlot);card?.click();});
  const tabs=[...nav.querySelectorAll('[role="tab"]')];
  ratings.querySelector('.fantasy-instruction')?.remove();
  const controls=ratings.querySelector('.fantasy-stats-controls');if(controls)controls.hidden=true;
  function choose(view,slot){
   const fieldMode=view==='field';field.hidden=!fieldMode;ratings.hidden=view!=='lineup';statsPanel.hidden=view!=='stats';
   if(view==='lineup')ratings.querySelector('[data-stats-mode="key"]')?.click();
   team.dataset.view=view;
   tabs.forEach((tab,i)=>{const active=(view==='field'?i===0:view==='lineup'?i===1:i===2);
    tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
   ratings.setAttribute('aria-labelledby','postseasonRatingsTab');
   ratings.querySelectorAll('.postseason-target').forEach(el=>el.classList.remove('postseason-target'));
   if(slot){
    const button=[...ratings.querySelectorAll('button.fantasy-player')].find(el=>el.dataset.postseasonSlot===slot);
    if(button){button.classList.add('postseason-target');button.scrollIntoView({block:'nearest',behavior:'auto'});}
   }
  }
  tabs.forEach((tab,i)=>{tab.onclick=()=>choose(['field','lineup','stats'][i]);
   tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
     e.preventDefault();const dest=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;
     tabs[dest].click();tabs[dest].focus({preventScroll:true});});});
  field.addEventListener('click',e=>{const btn=e.target.closest('button[data-slot]');
    if(btn&&run.slots[btn.dataset.slot])choose('lineup',btn.dataset.slot);});
  choose('field');
 }
 const old=finish;finish=function(scroll){const value=old(scroll);decorate();return value;};decorate();
})();
