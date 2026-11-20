/* v5 phase 4: the collection. Rival series live in v5-series.js. */
(() => {
 const $=id=>document.getElementById(id);
 // ---------- collection ----------
 const DEX='pbc5-dex',REGIONS=['Kanto','Johto','Hoenn','Sinnoh'];
 function dex(){
  let d;try{d=JSON.parse(store.get(DEX)||'null')}catch(e){}
  if(!d||!Array.isArray(d.nums))d={nums:[],shiny:[]};
  if(!Array.isArray(d.shiny))d.shiny=[];
  if(d.v!==2){
   // Fill in from seasons already saved in the Clubhouse (its last 40).
   try{const c=JSON.parse(store.get('pbc3-clubhouse-v1')||'null');for(const h of c?.history||[])add(d,(h.roster||[]).map(id=>BYID.get(id)).filter(Boolean))}catch(e){}
   d.v=2;store.set(DEX,JSON.stringify(d));
  }
  return d;
 }
 function add(d,mons){for(const m of mons){if(!d.nums.includes(m.num))d.nums.push(m.num);if(m.shiny&&!d.shiny.includes(m.num))d.shiny.push(m.num)}}
 function record(){if(!run?.result)return;const d=dex(),before=d.nums.length+d.shiny.length;add(d,Object.values(run.slots).filter(Boolean));if(d.nums.length+d.shiny.length!==before)store.set(DEX,JSON.stringify(d))}
 // The collection is a Pokédex: one region at a time, every number in order, rostered Pokémon shown.
 let dexRegion=1;
 const allMons=()=>[...new Map(MONS.filter(m=>!m.shiny&&m.id<SHINY_ID&&!m.baseId).map(m=>[m.num,m])).values()].sort((a,b)=>a.num-b.num);
 const no=n=>'#'+String(n).padStart(3,'0');
 function dexGrid(g){
  const d=dex(),own=new Set(d.nums),shiny=new Set(d.shiny);
  return allMons().filter(m=>m.gen===g).map(m=>own.has(m.num)
   ?`<button type="button" class="pdx-c got${shiny.has(m.num)?' sh':''}${m.leg?' lg':''}" data-history-mon="${m.id}" aria-label="${no(m.num)} ${esc(m.name)}${shiny.has(m.num)?', shiny':''}. Open card"><img src="${SPRITE_URL(m.num,shiny.has(m.num))}" alt="" loading="lazy" decoding="async"><small>${no(m.num)}</small></button>`
   :`<span class="pdx-c" aria-label="${no(m.num)}, not rostered yet"><i aria-hidden="true"></i><small>${no(m.num)}</small></span>`).join('');
 }
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-dex-region]');if(!b)return;dexRegion=+b.dataset.dexRegion;
  const box=b.closest('.pdx');if(!box)return;box.querySelectorAll('[data-dex-region]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));
  const grid=box.querySelector('.pdx-grid');grid.innerHTML=dexGrid(dexRegion);grid.scrollTop=0});
 window.collectionHTML=()=>{
  const d=dex(),own=new Set(d.nums),shiny=new Set(d.shiny),all=allMons();
  const legs=all.filter(m=>m.leg),gotLegs=legs.filter(m=>own.has(m.num)).length,got=all.filter(m=>own.has(m.num)).length;
  const tab=g=>{const list=all.filter(m=>m.gen===g),n=list.filter(m=>own.has(m.num)).length;return `<button type="button" role="tab" data-dex-region="${g}" aria-selected="${dexRegion===g}"><b>${REGIONS[g-1]}</b><small>${n}/${list.length}</small></button>`};
  return `<details class="pdx c2-sec" data-sec="dex"${window.clubOpen?.('dex')||''}>
   <summary class="pdx-top" aria-label="Pokédex, ${got} of ${all.length} caught"><span class="pdx-lens" aria-hidden="true"></span><span class="pdx-leds" aria-hidden="true"><i></i><i></i><i></i></span><b>Pokédex</b><em>${got}/${all.length}</em><i class="c2-chev" aria-hidden="true"></i></summary>
   <div class="pdx-screen">
    <div class="pdx-head"><div class="pdx-count"><b>${got}</b><small>of ${all.length}<br>caught</small></div><div class="pdx-chips"><em>${gotLegs}/${legs.length} legendaries</em><em>${shiny.size} shin${shiny.size===1?'y':'ies'}</em></div></div>
    <div class="pdx-bar" aria-hidden="true"><i style="width:${(100*got/all.length).toFixed(1)}%"></i></div>
    <div class="pdx-tabs" role="tablist" aria-label="Region">${[1,2,3,4].map(tab).join('')}</div>
    <div class="pdx-grid">${dexGrid(dexRegion)}</div>
   </div>
   <div class="pdx-foot"><span class="pdx-dpad" aria-hidden="true"></span><small>Caught means rostered in a finished season. Tap one for its card.</small><span class="pdx-ab" aria-hidden="true"><i></i><i></i></span></div>
  </details>`;
 };
 const prevFinish=finish;finish=function(){const v=prevFinish.apply(this,arguments);record();return v};
 if(run?.result)record();
})();
