(() => {
  let expanded=false;
  const $=id=>document.getElementById(id);
  const fmt3=n=>Number.isFinite(n)?n.toFixed(3).replace(/^0/,''):'.000';
  function extraStats(slot){
    const me=run.result?.me;if(!me)return null;
    if(FIELD_SLOTS.includes(slot)){
      const h=me.order?.find(x=>x.pos===slot);if(!h?.st)return null;
      const s=h.st;
      return {stats:[['OBP',fmt3((s.h+s.bb)/Math.max(1,s.pa))],['SLG',fmt3((s.h+s.d+2*s.t+3*s.hr)/Math.max(1,s.ab))],['PA',s.pa],['AB',s.ab],['H',s.h],['2B',s.d],['3B',s.t],['R',s.r],['BB',s.bb],['K',s.k],['SB',s.sb],['CS',s.cs]],type:'bat'};
    }
    const p=slot==='RP1'?me.cl:slot==='RP2'?me.pen:me.rot?.find(x=>x.role===slot);
    if(!p?.st||p.role==='FILL')return null;
    const s=p.st;return {stats:[['G',s.g],['GS',s.gs],['W',s.w],['L',s.l],['H',s.h],['R',s.r],['HR',s.hr],['BB',s.bb]],type:'pitch'};
  }
  function enhance(){
    const season=$('season'),root=$('postseasonRatingsPanel');
    if(!run?.result||!root||!season||season.hidden)return;
    season.querySelector('.season-details')?.remove();
    if(!root.querySelector('.fantasy-group'))return;
    for(const button of [...root.querySelectorAll('button.fantasy-player')]){
      const slot=button.dataset.postseasonSlot,record=extraStats(slot);
      if(!record)continue;
      const card=document.createElement('div');card.className='fantasy-integrated-card';
      const details=document.createElement('div');details.className='fantasy-integrated-detail';details.hidden=!expanded;
      details.setAttribute('aria-label',(record.type==='bat'?'Additional batting':'Additional pitching')+' statistics');
      details.innerHTML='<div class="fantasy-integrated-grid">'+record.stats.map(([k,v])=>`<div class="fantasy-integrated-metric"><span>${k}</span><strong>${v}</strong></div>`).join('')+'</div>';
      button.after(card);card.append(button,details);
    }
    const intro=root.querySelector('.fantasy-instruction');
    if(intro)intro.textContent='Batting order and season totals. Tap a Pokémon for their card and complete stat sheet.';
    const controls=document.createElement('div');controls.className='fantasy-stats-controls';
    controls.innerHTML='<span class="fantasy-controls-label">Season statistics</span><div class="fantasy-control-seg" role="group" aria-label="Statistics detail"><button type="button" data-stats-mode="key">Key Stats</button><button type="button" data-stats-mode="all">All Stats</button></div>';
    root.querySelector('.fantasy-group').before(controls);
    const buttons=[...controls.querySelectorAll('[data-stats-mode]')];
    function change(all){
      expanded=all;
      for(const b of buttons)b.setAttribute('aria-pressed',String((b.dataset.statsMode==='all')===all));
      for(const d of root.querySelectorAll('.fantasy-integrated-detail'))d.hidden=!all;
    }
    for(const b of buttons)b.addEventListener('click',()=>change(b.dataset.statsMode==='all'));
    change(expanded);
    const heading=$('postseasonTeam')?.querySelector('.postseason-heading p');
    if(heading)heading.textContent='Review your completed lineup, ratings and full season statistics.';
  }
  const previous=finish;
  finish=function(scroll){const value=previous(scroll);enhance();return value};
  enhance();
})();
