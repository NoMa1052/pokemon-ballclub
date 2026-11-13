/* One game mode: Packs with 16 players. Spin and the 11-player Quick mode were retired on Nov 11, 2026;
   their code stays in place but nothing on screen leads to it. */
store.set('pbc2-size','16');
if(mode!=='pack'||run.size!==16)setMode('pack');

/* v5 phase 1: label for the compact in-run header (mode and size switches are hidden mid-run on phones). */
(() => {
 const label=()=>{const s=document.querySelector('header.top');if(s&&run)s.dataset.run=run.week?'Weekly challenge':run.result?'Season complete':'Draft'};
 const prev=render;render=function(){const v=prev.apply(this,arguments);label();return v};label();
})();

/* Navigation: a tab bar on phones, the same buttons in the header on desktop. */
(() => {
 const ic={draft:'<rect x="4.5" y="5" width="10" height="14" rx="1.6" transform="rotate(-10 9.5 12)" opacity=".55"/><rect x="9.5" y="4.5" width="10" height="14.5" rx="1.6" transform="rotate(8 14.5 12)"/>',league:'<path d="M5 2.5a1 1 0 0 1 1 1V4l14 4.6a.6.6 0 0 1 0 1.1L6 14.5V21a1 1 0 1 1-2 0V3.500a1 1 0 0 1 1-1z"/>',records:'<path d="M7 3h10v2h3v3a4 4 0 0 1-3.6 4A5 5 0 0 1 13 14.900V17h2.500a1.500 1.500 0 0 1 1.500 1.500V21H7v-2.500A1.500 1.500 0 0 1 8.500 17H11v-2.100A5 5 0 0 1 7.600 12 4 4 0 0 1 4 8V5h3zm0 4H6v1a2 2 0 0 0 1 1.700zm10 0v2.700A2 2 0 0 0 18 8V7z"/>',scout:'<path d="M9 2.500h6a1 1 0 0 1 1 1V4h1.500A1.500 1.500 0 0 1 19 5.500v14a1.500 1.500 0 0 1-1.500 1.500h-11A1.500 1.500 0 0 1 5 19.500v-14A1.500 1.500 0 0 1 6.500 4H8v-.500a1 1 0 0 1 1-1zM8 9.250v1.500h8v-1.500zm0 3.500v1.500h8v-1.500zm0 3.500v1.500h5v-1.500z" fill-rule="evenodd"/>',help:'<path fill-rule="evenodd" d="M12 2.500a9.500 9.500 0 1 1 0 19 9.500 9.500 0 0 1 0-19zM6.300 5.900a7.600 7.600 0 0 1 0 12.200l.900 1a9 9 0 0 0 0-14.200zm11.400 0-.900-1a9 9 0 0 0 0 14.200l.900-1a7.600 7.600 0 0 1 0-12.200z"/>'};
 const tabs=[['draft','Draft'],['league','League'],['records','Records'],['scout','Scouting'],['help','How to play']];
 const nav=document.createElement('nav');nav.className='tabbar';nav.id='tabbar';nav.setAttribute('aria-label','Game');
 nav.innerHTML=tabs.map(([k,l])=>`<button type="button" data-tab="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg><span>${l}</span></button>`).join('');
 document.body.appendChild(nav);
 const go={draft:()=>{document.querySelectorAll('.sheet').forEach(s=>{if(!s.hidden)s.querySelector('.sheet-top .btn')?.click()});scrollTo({top:0,behavior:'smooth'})},
  league:()=>document.getElementById('lgBtn').click(),records:()=>document.getElementById('lbBtn').click(),scout:()=>openScout(),help:()=>document.getElementById('howBtn').click()};
 nav.onclick=e=>{const b=e.target.closest('button');if(b)go[b.dataset.tab]()};
 // While drafting, the bar stays out of the way behind a menu button in the header.
 const menu=document.createElement('button');menu.type='button';menu.className='btn menu-btn';menu.id='menuBtn';menu.setAttribute('aria-label','Menu');menu.setAttribute('aria-expanded','false');
 menu.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
 document.querySelector('header.top').appendChild(menu);
 menu.onclick=()=>{const on=document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',on)};
 document.addEventListener('click',e=>{if(document.body.classList.contains('nav-open')&&!e.target.closest('#menuBtn')){document.body.classList.remove('nav-open');menu.setAttribute('aria-expanded','false')}});
 // Desktop header: add Scouting beside Records and League, and spell out the help button.
 const sc=document.createElement('button');sc.className='btn lbbtn';sc.id='scBtn';sc.textContent='Scouting';sc.onclick=()=>openScout();
 document.getElementById('settings').appendChild(sc);
 const how=document.getElementById('howBtn');if(how){how.textContent='How to play';how.setAttribute('aria-label','How to play')}
})();

/* Shiny spark: mark linked teammates on the field, explain the link, and flag cards that would link. */
(() => {
 const list=()=>run.size===16?FULL:STD;
 const baseRuns=(m,s)=>s.startsWith('RP')?m.rpR:slotRuns(m,s);
 const shinies=()=>list().filter(s=>run.slots[s]?.shiny).map(s=>run.slots[s]);
 function mark(){
  if(!run)return;
  const sp=sparkRuns(run.slots,list());
  document.querySelectorAll('.tag[data-slot]').forEach(t=>{
   const s=t.dataset.slot,m=run.slots[s],on=!!m&&sp.linked.includes(s);
   t.classList.toggle('spark',on);t.querySelector('.spark-pip')?.remove();
   if(!on)return;
   const gain=ovr99(baseRuns(m,s)+sp.each)-ovr99(baseRuns(m,s));
   const pip=document.createElement('i');pip.className='spark-pip';pip.textContent=gain>0?'+'+gain:'+';
   (t.querySelector('.tok')||t).appendChild(pip);t.setAttribute('aria-label',(t.getAttribute('aria-label')||'')+', shiny spark'+(gain>0?' plus '+gain:''));
  });
  let line=document.getElementById('sparkLine');const sh=shinies();
  if(!sh.length||run.result){line?.remove();return}
  if(!line){line=document.createElement('p');line.id='sparkLine';line.className='spark-line';document.getElementById('board').after(line)}
  const n=sp.linked.length,types=[...new Set(sh.flatMap(m=>m.types))].map(t=>t[0].toUpperCase()+t.slice(1)).join(' or ');
  line.innerHTML=`<b>Shiny spark</b> ${Math.min(n,SPARK_CAP)} of ${SPARK_CAP} links. `+(n>=SPARK_CAP?'Fully linked.':`Draft ${types} types to link more.`);
 }
 const prev=render;render=function(){const v=prev.apply(this,arguments);mark();return v};
 const card=tcardHTML;
 tcardHTML=function(m,mini){
  let html=card(m,mini);
  if(!run||run.result||Object.values(run.slots).some(x=>x.id===m.id))return html;
  let label='';
  if(m.shiny){const n=Object.values(run.slots).filter(x=>sparkLink(m,x)).length;label=n?`Spark: links ${Math.min(n,SPARK_CAP)} teammate${n===1?'':'s'}`:'Spark: lifts teammates that share its type'}
  else{const s=shinies().find(x=>sparkLink(x,m));if(s)label='Spark link with '+s.name.replace(/^Shiny /,'')}
  return label?html.replace('<div class="tc-art">',`<div class="tc-spark">${label}</div><div class="tc-art">`):html;
 };
 mark();
})();
