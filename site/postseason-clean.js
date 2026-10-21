/* Compact, read-only season summary and three-view team presentation. */
(() => {
 const $=id=>document.getElementById(id);
 const staffLabel=s=>s==='RP1'?'CL':s==='RP2'?'SU':s;
 const f3=n=>Number.isFinite(n)?n.toFixed(3).replace(/^0/,''):'.000';
 // Box score, fantasy style: pinned player column, key stats first, team leader in each column highlighted, tap a header to sort.
 function boxScore(){
  const me=run.result?.me;if(!me)return '';
  const sprite=m=>`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" loading="lazy">`;
  const tone=v=>v>=85?'hi':v>=70?'md':v<55?'lo':'';
  const who=(s,m,lead,order)=>{const v=posOvr(m,s);return `<th scope="row" data-v="${order}"><button type="button" class="box-who" data-box-slot="${esc(s)}" aria-label="${esc(m.name)}, ${esc(SLOT_NAME[s]||lbl(s))}, rating ${v}. View card"><span class="box-lead">${lead}</span>${sprite(m)}<span class="box-name"><b>${esc(m.name)}</b><small>${FIELD_SLOTS.includes(s)?`<i>${esc(lbl(s))}</i>`:''}<em class="${tone(v)}">${v}</em></small></span></button></th>`};
  const cell=(v,shown)=>`<td data-v="${v}">${shown??v}</td>`;
  const bat=(me.order||[]).filter(h=>run.slots[h.pos]&&h.st).map((h,i)=>{const st=h.st,ab=Math.max(1,st.ab),obp=(st.h+st.bb)/Math.max(1,st.pa),slg=(st.h+st.d+2*st.t+3*st.hr)/ab,avg=st.h/ab;
   return `<tr>${who(h.pos,run.slots[h.pos],i+1,i)}${cell(avg,f3(avg))}${cell(st.hr)}${cell(st.rbi)}${cell(obp+slg,f3(obp+slg))}${cell(obp,f3(obp))}${cell(slg,f3(slg))}${cell(st.h)}${cell(st.d)}${cell(st.t)}${cell(st.r)}${cell(st.bb)}${cell(st.k)}${cell(st.sb)}</tr>`}).join('');
  const arms=slotList().filter(s=>!FIELD_SLOTS.includes(s)&&run.slots[s]).map((s,i)=>{const p=s==='RP1'?me.cl:s==='RP2'?me.pen:me.rot?.find(x=>x.role===s);if(!p?.st||p.role==='FILL')return '';const st=p.st,era=st.outs?st.r*27/st.outs:0;
   return `<tr>${who(s,run.slots[s],staffLabel(s),i)}${cell(era,era.toFixed(2))}${cell(st.outs,ip(st.outs))}${cell(st.w)}${cell(st.l)}${cell(st.sv)}${cell(st.k)}${cell(st.bb)}${cell(st.h)}${cell(st.hr)}${cell(st.g)}${cell(st.gs)}</tr>`}).join('');
  // low = a lower number is better (ERA, L, BB/H/HR allowed, batter strikeouts)
  const table=(cap,cols,rows)=>`<section class="box-group"><h4>${cap}</h4><div class="box-scroll" tabindex="0" role="region" aria-label="${cap} stats, scrolls sideways"><table class="box"><thead><tr><th scope="col"><button type="button" data-sort="0">Player</button></th>${cols.map(([c,low],i)=>`<th scope="col"><button type="button" data-sort="${i+1}"${low?' data-low="1"':''}>${c}</button></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
  return table('Batting',[['AVG'],['HR'],['RBI'],['OPS'],['OBP'],['SLG'],['H'],['2B'],['3B'],['R'],['BB'],['K',1],['SB']],bat)
   +table('Pitching',[['ERA',1],['IP'],['W'],['L',1],['SV'],['K'],['BB',1],['H',1],['HR',1],['G'],['GS']],arms)
   +'<p class="box-note">Gold marks the team leader. Tap a column to sort, or a player for their card.</p>';
 }
 function wireBox(panel){
  panel.querySelectorAll('table.box').forEach(t=>{
   const rows=[...t.tBodies[0].rows],n=t.tHead.rows[0].cells.length;
   // team leader per stat column (ties all highlighted)
   for(let c=1;c<n;c++){const low=t.tHead.rows[0].cells[c].querySelector('[data-low]'),vals=rows.map(r=>+r.cells[c].dataset.v);if(new Set(vals).size<2)continue;const best=low?Math.min(...vals):Math.max(...vals);rows.forEach((r,i)=>r.cells[c].classList.toggle('lead',vals[i]===best))}
   t.tHead.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{
    const c=+b.dataset.sort,low=b.hasAttribute('data-low'),dir=c===0||low?1:-1;
    const sorted=[...t.tBodies[0].rows].sort((a,z)=>dir*((+a.cells[c].dataset.v)-(+z.cells[c].dataset.v))||(+a.cells[0].dataset.v)-(+z.cells[0].dataset.v));
    t.tBodies[0].append(...sorted);
    t.tHead.querySelectorAll('th').forEach((th,i)=>{if(i===c&&c)th.setAttribute('aria-sort',dir<0?'descending':'ascending');else th.removeAttribute('aria-sort')});
   });
  });
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
  // One header: the record, then three equal tiles. The old pennant block stays in the DOM, hidden, for other layers.
  panel.querySelector('.season-head')?.remove();top.hidden=true;
  const tone=/^[AS]/.test(res.grade)?'#5fd38d':/^B/.test(res.grade)?'#8fd3ff':/^C/.test(res.grade)?'#ffcb05':'#ff8a70';
  const playoff=post.champ?['Champions',ws?'World Series '+ws[1]+'–'+ws[2]:'World Series']:post.made?['Lost',outcome.replace(/^Lost the /,'')]:['Missed','Needs 88 wins'];
  const head=document.createElement('div');head.className='season-head';
  head.innerHTML=`<div class="season-eyebrow"><span>Final · ${isPack()?'Packs':'Spin'} · ${run.size===11?'Quick':'Standard'}</span>${best?`<em class="${/New personal/.test(best)?'pb':''}">${esc(best)}</em>`:''}</div>
   <div class="season-rec" aria-label="${res.wins} wins and ${162-res.wins} losses"><b>${res.wins}–${162-res.wins}</b></div>
   <div class="season-tiles"><div><small>Grade</small><span class="season-pennant" style="--tone:${tone}">${esc(res.grade)}</span></div>
   <div><small>Team OVR</small><b>${Number(teamOvr())}</b></div>
   <div class="${post.champ?'is-champ':''}"><small>Playoffs</small><b class="season-word">${esc(playoff[0])}</b><em>${esc(playoff[1])}</em></div></div>
   <p class="season-runs">${(res.runs.rs/162).toFixed(1)} runs scored per game${(()=>{const me=res.me,ps=me?[...(me.rot||[]),me.cl,me.pen].filter(p=>p?.st?.outs&&p.role!=='FILL'):[],o=ps.reduce((a,p)=>a+p.st.outs,0);return o?` · ${(ps.reduce((a,p)=>a+p.st.r,0)*27/o).toFixed(2)} staff ERA`:''})()}</p>`;
  top.after(head);
  const summary=document.createElement('div');summary.className='clean-season-summary';summary.hidden=true;
  summary.innerHTML='<div class="clean-outcome"><b>'+esc(outcome)+'</b>'+
   (extras.length?'<span>'+extras.map(esc).join(' · ')+'</span>':'')+'</div>'+
   '<div class="clean-metrics"><span>'+(res.runs.rs/162).toFixed(1)+' R/G</span><span>'+(res.runs.ra/162).toFixed(1)+' RA/G</span>'+
   (best?'<span>'+esc(best)+'</span>':'')+'</div>';
  head.after(summary);
  team.classList.add('clean-postseason');
  team.querySelector('.postseason-eyebrow')?.remove();
  const title=team.querySelector('.postseason-heading h3');if(title)title.textContent='Final Team';
  team.querySelector('.postseason-heading p')?.remove();
  const overall=team.querySelector('.postseason-overall');
  if(overall)overall.remove();
  const field=$('postseasonFieldPanel'),ratings=$('postseasonRatingsPanel'),nav=team.querySelector('.postseason-tabs');
  if(!field||!ratings||!nav)return;
  // Keep the original full-size pitching staff board. This uses the
  // exact rotation/bullpen clone from postseason.js instead of compact chips.
  field.querySelector('.clean-staff')?.remove();
  const staff=team.querySelector('#postseasonPen');
  if(staff)staff.hidden=false;
  // Remove previously bound two-tab buttons; reuse their existing roster panel.
  nav.innerHTML='<button type="button" role="tab" id="postseasonFieldTab" aria-controls="postseasonFieldPanel">On Field</button>'+
   '<button type="button" role="tab" id="postseasonStatsTab" aria-controls="postseasonStatsPanel">Stats</button>';
  team.querySelector('#postseasonStatsPanel')?.remove();
  const statsPanel=document.createElement('div');statsPanel.id='postseasonStatsPanel';statsPanel.setAttribute('role','tabpanel');statsPanel.setAttribute('aria-labelledby','postseasonStatsTab');statsPanel.className='box-panel';statsPanel.hidden=true;statsPanel.innerHTML=boxScore();
  ratings.after(statsPanel);wireBox(statsPanel);
  statsPanel.addEventListener('click',e=>{const b=e.target.closest('[data-box-slot]');if(!b)return;
   const card=[...ratings.querySelectorAll('button.fantasy-player')].find(x=>x.dataset.postseasonSlot===b.dataset.boxSlot);card?.click();});
  const tabs=[...nav.querySelectorAll('[role="tab"]')];
  ratings.querySelector('.fantasy-instruction')?.remove();
  const controls=ratings.querySelector('.fantasy-stats-controls');if(controls)controls.hidden=true;
  // The Lineup cards stay in the DOM, hidden: they still open each player's card and season sheet.
  function choose(view,slot){
   const fieldMode=view==='field';field.hidden=!fieldMode;ratings.hidden=true;statsPanel.hidden=fieldMode;
   team.dataset.view=view;
   tabs.forEach((tab,i)=>{const active=fieldMode?i===0:i===1;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
   statsPanel.querySelectorAll('tr.box-target').forEach(r=>r.classList.remove('box-target'));
   if(slot){const row=statsPanel.querySelector(`[data-box-slot="${slot}"]`)?.closest('tr');if(row){row.classList.add('box-target');row.scrollIntoView({block:'center',behavior:'auto'});}}
  }
  tabs.forEach((tab,i)=>{tab.onclick=()=>choose(i?'stats':'field');
   tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
     e.preventDefault();const dest=e.key==='Home'?0:e.key==='End'?1:1-i;tabs[dest].click();tabs[dest].focus({preventScroll:true});});});
  // Tapping a player on the field opens their card and season stats, same as in the Stats table.
  field.addEventListener('click',e=>{const btn=e.target.closest('button[data-slot]');if(!btn||!run.slots[btn.dataset.slot])return;
    e.stopPropagation();e.preventDefault();
    [...ratings.querySelectorAll('button.fantasy-player')].find(x=>x.dataset.postseasonSlot===btn.dataset.slot)?.click();},true);
  choose('field');
 }
 const old=finish;finish=function(scroll){const value=old(scroll);decorate();return value;};decorate();
})();
