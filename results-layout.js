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
   // Show why each player won: MVP leads with OPS (how it's picked) plus the stats he led the team in;
   // Cy Young shows ERA, record and strikeouts.
   const me=run.result.me,f3=n=>n.toFixed(3).replace(/^0/,'');
   const bat=h=>{const st=h.st,ab=Math.max(1,st.ab),obp=(st.h+st.bb)/Math.max(1,st.pa),slg=(st.h+st.d+2*st.t+3*st.hr)/ab;return {OPS:[obp+slg,f3(obp+slg)],AVG:[st.h/ab,f3(st.h/ab)],OBP:[obp,f3(obp)],HR:[st.hr,st.hr],RBI:[st.rbi,st.rbi],R:[st.r,st.r],SB:[st.sb,st.sb]}};
   const cell=(v,l)=>`<span><b>${esc(String(v))}</b><small>${esc(l)}</small></span>`;
   const mvpStats=name=>{const hs=(me.order||[]).filter(h=>h.st),h=hs.find(x=>x.m.name===name);if(!h)return '';const mine=bat(h),all=hs.map(bat);
    const lead=['AVG','HR','RBI','R','SB'].map(k=>[k,all.filter(o=>o[k][0]>mine[k][0]).length]).sort((a,b)=>a[1]-b[1]).slice(0,1).map(x=>x[0]);
    return cell(mine.OPS[1],'OPS')+lead.map(k=>cell(mine[k][1],k)).join('')};
   const cyStats=name=>{const ps=[...(me.rot||[]),me.cl,me.pen].filter(p=>p?.st?.outs&&p.m.name===name),p=ps[0];if(!p)return '';const st=p.st;
    return cell((st.r*27/st.outs).toFixed(2),'ERA')+cell(st.k,'K')};
   box.innerHTML=items.map(x=>{const m=byName(x.n),cy=/arm/i.test(x.t),label=cy?'Cy Young':/mvp/i.test(x.t)?'MVP':x.t;return `<div class="season-award"><small class="aw-label">${esc(label)}</small><div class="aw-who">${m?`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" loading="lazy">`:''}<b>${esc(x.n)}</b></div><div class="aw-stats">${cy?cyStats(x.n):mvpStats(x.n)}</div></div>`}).join('');
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
