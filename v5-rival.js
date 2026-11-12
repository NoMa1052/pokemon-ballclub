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
 window.collectionHTML=()=>{
  const d=dex(),own=new Set(d.nums),shiny=new Set(d.shiny);
  const all=[...new Map(MONS.filter(m=>!m.shiny&&m.id<SHINY_ID&&!m.baseId).map(m=>[m.num,m])).values()].sort((a,b)=>a.num-b.num);
  const legs=all.filter(m=>m.leg),gotLegs=legs.filter(m=>own.has(m.num)).length,got=all.filter(m=>own.has(m.num)).length;
  const region=g=>{const list=all.filter(m=>m.gen===g),n=list.filter(m=>own.has(m.num)).length;
   return `<details class="dex-region"><summary><b>${REGIONS[g-1]}</b><span>${n} of ${list.length}</span><div class="dex-bar"><i style="width:${(100*n/list.length).toFixed(1)}%"></i></div></summary><div class="dex-grid">${list.map(m=>own.has(m.num)?`<span class="got${shiny.has(m.num)?' sh':''}${m.leg?' lg':''}" title="${esc(m.name)}">${tok(m)}<i>${esc(m.name)}</i></span>`:`<span><b></b><i>#${m.num}</i></span>`).join('')}</div></details>`};
  const pct=Math.round(100*got/all.length);
  return `<div class="dex-top"><div class="dex-ring" style="--p:${pct}"><b>${got}</b><small>of ${all.length}</small></div><div><span>Pokémon rostered in a finished season</span><div class="dex-chips"><em>${gotLegs}/${legs.length} legendaries</em><em>${shiny.size} shin${shiny.size===1?'y':'ies'}</em></div></div></div>${[1,2,3,4].map(region).join('')}`;
 };
 const prevFinish=finish;finish=function(){const v=prevFinish.apply(this,arguments);record();return v};
 if(run?.result)record();
})();
