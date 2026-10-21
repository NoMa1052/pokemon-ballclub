/* Results screen order: verdict, season highlights, the team, the scouting report, then one action card to post and share. */
(() => {
 const $=id=>document.getElementById(id);
 function layout(){
  const season=$('season'),res=run?.result;if(!res||!season||season.hidden)return;
  const panel=season.querySelector('.panel'),head=panel?.querySelector('.season-head'),team=$('postseasonTeam');if(!panel||!head||!team)return;
  // 1. Highlights: MVP and best arm as a compact pair with sprites, right under the verdict.
  const awards=panel.querySelector('.awards');
  if(awards&&!panel.querySelector('.season-awards')){
   const byName=n=>Object.values(run.slots).find(m=>m?.name===n);
   const items=[...awards.querySelectorAll('.award')].map(a=>({t:a.querySelector('.label')?.textContent||'',n:a.querySelector('b')?.textContent||'',d:a.querySelector('span:last-child')?.textContent||''}));
   const box=document.createElement('div');box.className='season-awards';
   const stats=d=>d.replace(/ 0\.(\d{3}) OPS/,' .$1 OPS').replace(/, /g,' · ').split(' · ').slice(0,2).map(t=>{const m=t.trim().match(/^([\d.]+)\s*(.+)$/);return m?`<span><b>${esc(m[1])}</b><small>${esc(m[2])}</small></span>`:''}).join('');
   box.innerHTML=items.map(x=>{const m=byName(x.n),label=/arm/i.test(x.t)?'Cy Young':/mvp/i.test(x.t)?'MVP':x.t;return `<div class="season-award"><small class="aw-label">${esc(label)}</small><div class="aw-who">${m?`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" loading="lazy">`:''}<b>${esc(x.n)}</b></div><div class="aw-stats">${stats(x.d)}</div></div>`}).join('');
   awards.hidden=true;head.after(box);
  }
  // 2. One action card: post the team, then share or start over.
  const submit=$('submitBox'),share=panel.querySelector('.share'),msg=$('shareMsg');
  let actions=panel.querySelector('.season-actions');
  if(!actions){actions=document.createElement('section');actions.className='season-actions';actions.setAttribute('aria-label','Post and share');}
  // placed last, after the scouting report (below)
  [submit,share,msg].forEach(n=>{if(n&&n.parentElement!==actions)actions.append(n)});
  // 3. The team, then 4. the scouting report at the end.
  (panel.querySelector('.season-awards')||head).after(team);
  const report=panel.querySelector('.season-summary');
  if(report)team.after(report);
  (report||team).after(actions);
  if(report){
   // Only call out a weak area when there is one worth fixing.
   const vals=[...report.querySelectorAll('.team-bar b')].map(b=>+b.textContent),note=report.querySelector(':scope > p.hint');
   if(note&&vals.length&&Math.min(...vals)>=80)note.hidden=true;}
  $('resultClubhouse')?.remove();
  const help=team.querySelector('.postseason-field-help');if(help)help.textContent='Tap a player for their card and season stats.';
 }
 const prev=finish;finish=function(scroll){const v=prev(scroll);layout();return v};
 layout();
})();
