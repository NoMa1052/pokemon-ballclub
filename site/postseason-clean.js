/* Compact, read-only season summary and three-view team presentation. */
(() => {
 const $=id=>document.getElementById(id);
 const staffLabel=s=>s==='RP1'?'CL':s==='RP2'?'SU':s;
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
  const outcome=post.champ?'World Series Champions':String(post.text||'Season Complete').replace(/\.$/,'');
  const extras=[...(post.champ&&ws?['Won '+ws[1]+'–'+ws[2]]:[]),...(ps?['Postseason '+ps[0]+'–'+ps[1]]:[])];
  let best='';
  try{const record=Clubhouse.read()?.boards?.[Clubhouse.boardKey(run)]?.bestWins;
    if(Number.isFinite(record)){const diff=record-res.wins;best=diff>0?diff+' '+(diff===1?'win':'wins')+' off best':'Personal best';}
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
   '<button type="button" role="tab" id="postseasonStatsTab" aria-controls="postseasonRatingsPanel">Stats</button>';
  const tabs=[...nav.querySelectorAll('[role="tab"]')];
  ratings.querySelector('.fantasy-instruction')?.remove();
  const controls=ratings.querySelector('.fantasy-stats-controls');if(controls)controls.hidden=true;
  function choose(view,slot){
   const fieldMode=view==='field';field.hidden=!fieldMode;ratings.hidden=fieldMode;
   if(!fieldMode)ratings.querySelector('[data-stats-mode="'+(view==='stats'?'all':'key')+'"]')?.click();
   team.dataset.view=view;
   tabs.forEach((tab,i)=>{const active=(view==='field'?i===0:view==='lineup'?i===1:i===2);
    tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
   ratings.setAttribute('aria-labelledby',view==='stats'?'postseasonStatsTab':'postseasonRatingsTab');
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
