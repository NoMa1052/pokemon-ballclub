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
 const ic={draft:'<path d="M7 3h10v18H7z"/><path d="M7 7h10M7 17h10"/>',league:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>',records:'<path d="M5 20V10M12 20V4M19 20v-7"/>',scout:'<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'};
 const tabs=[['draft','Draft'],['league','League'],['records','Records'],['scout','Scouting'],['help','How to play']];
 const nav=document.createElement('nav');nav.className='tabbar';nav.id='tabbar';nav.setAttribute('aria-label','Game');
 nav.innerHTML=tabs.map(([k,l])=>`<button type="button" data-tab="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg><span>${l}</span></button>`).join('');
 document.body.appendChild(nav);
 const go={draft:()=>{document.querySelectorAll('.sheet').forEach(s=>{if(!s.hidden)s.querySelector('.sheet-top .btn')?.click()});scrollTo({top:0,behavior:'smooth'})},
  league:()=>document.getElementById('lgBtn').click(),records:()=>document.getElementById('lbBtn').click(),scout:()=>openScout(),help:()=>document.getElementById('howBtn').click()};
 nav.onclick=e=>{const b=e.target.closest('button');if(b)go[b.dataset.tab]()};
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
   t.appendChild(pip);t.setAttribute('aria-label',(t.getAttribute('aria-label')||'')+', shiny spark'+(gain>0?' plus '+gain:''));
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
