/* v5 phase 4: rival series (best of 7 against any posted team) and the collection. */
(() => {
 const $=id=>document.getElementById(id);
 // ---------- rival series ----------
 const ready=()=>run&&run.size===16&&FULL.every(s=>run.slots[s]);
 const REC='pbc5-series';
 const records=()=>{try{return JSON.parse(store.get(REC)||'{}')||{}}catch(e){return{}}};
 window.rivalSeriesButton=()=>`<button type="button" class="btn rival-btn"${ready()?'':' disabled'}>${ready()?'Play a best of 7':'Finish a 16-pick team to play this club'}</button>`;
 window.wireRivalSeries=(root,rows)=>root.querySelectorAll('.rival-btn').forEach((b,i)=>b.onclick=()=>{if(rows[i]&&ready())play(rows[i])});

 function simulate(rival){
  const them=Object.fromEntries(rival.roster.map((id,i)=>[FULL[i],BYID.get(id)]).filter(([,m])=>m));
  const r=rngFrom((Math.random()*2**32)>>>0),a=simTeam(run.slots,'me',true),b=simTeam(them,'rival',true),games=[];
  let wa=0,wb=0;
  while(wa<4&&wb<4){
   const home=[0,1,5,6].includes(games.length),a0=a.rs,b0=b.rs,sa=a.rot[a.rotI%5].m.name,sb=b.rot[b.rotI%5].m.name;
   home?playGame(b,a,r):playGame(a,b,r);
   const me=a.rs-a0,opp=b.rs-b0;me>opp?wa++:wb++;games.push({me,opp,home,sa,sb});
  }
  const star=a.order.reduce((x,y)=>(y.st.h+2*y.st.hr+y.st.rbi)>(x.st.h+2*x.st.hr+x.st.rbi)?y:x);
  return{games,wa,wb,star};
 }
 let timer=0;
 function play(rival){
  clearTimeout(timer);$('rivalSheet')?.remove();
  const s=simulate(rival),won=s.wa>s.wb,key=rival.device+'|'+rival.team,all=records(),rec=all[key]||[0,0];
  rec[won?0:1]++;all[key]=rec;store.set(REC,JSON.stringify(all));
  const el=document.createElement('div');el.className='sheet';el.id='rivalSheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','rvTitle');
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2 id="rvTitle">Best of 7</h2><button class="btn" id="rvClose">Close</button></div><div class="sheet-body rv-body">
   <p class="rv-vs">Your club <span>vs</span> <b>${esc(rival.team)}</b><small>${rival.wins}–${162-rival.wins} in the regular season</small></p>
   <ol class="rv-games" id="rvGames" aria-live="polite"></ol><div id="rvEnd" hidden></div></div></div>`;
  document.body.appendChild(el);
  const close=()=>{clearTimeout(timer);el.remove()};
  $('rvClose').onclick=close;el.addEventListener('click',e=>{if(e.target===el)close()});el.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  let k=0,wa=0,wb=0;const quick=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step=()=>{
   if(!el.isConnected)return;
   if(k<s.games.length){const g=s.games[k++];g.me>g.opp?wa++:wb++;
    $('rvGames').insertAdjacentHTML('beforeend',`<li class="${g.me>g.opp?'w':'l'}"><small>Game ${k} · ${g.home?'Home':'Away'}</small><b>${g.me>g.opp?'W':'L'} ${g.me}–${g.opp}</b><span>${esc(g.sa)} vs ${esc(g.sb)}</span><em>${wa}–${wb}</em></li>`);
    timer=setTimeout(step,quick?0:750);return}
   const st=s.star.st,end=$('rvEnd');end.hidden=false;
   end.innerHTML=`<p class="rv-final ${won?'w':'l'}">${won?'You win the series':'You lose the series'} ${s.wa}–${s.wb}</p><p class="hint">Your best bat: ${esc(s.star.m.name)}, ${st.h} hits, ${st.hr} HR, ${st.rbi} RBI. All-time against this club: ${rec[0]}–${rec[1]} in series.</p><div class="rv-actions"><button type="button" class="btn primary" id="rvAgain">Play again</button><button type="button" class="btn" id="rvDone">Done</button></div>`;
   $('rvAgain').onclick=()=>play(rival);$('rvDone').onclick=close;$('rvAgain').focus({preventScroll:true});
  };
  $('rvClose').focus({preventScroll:true});timer=setTimeout(step,quick?0:500);
 }

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
   return `<section class="dex-region"><h3>${REGIONS[g-1]} <span>${n} of ${list.length}</span></h3><div class="dex-bar"><i style="width:${(100*n/list.length).toFixed(1)}%"></i></div><div class="dex-grid">${list.map(m=>own.has(m.num)?`<span class="got${shiny.has(m.num)?' sh':''}${m.leg?' lg':''}">${esc(m.name)}</span>`:`<span>${m.num}</span>`).join('')}</div></section>`};
  return `<div class="dex-top"><b>${got}</b><span>of ${all.length} Pokémon rostered in a finished season</span><small>${gotLegs} of ${legs.length} legendaries · ${shiny.size} shin${shiny.size===1?'y':'ies'}</small></div>${[1,2,3,4].map(region).join('')}<p class="hint">Every finished season counts, in any mode. Gold names were shiny; outlined names are legendaries.</p>`;
 };
 const prevFinish=finish;finish=function(){const v=prevFinish.apply(this,arguments);record();return v};
 if(run?.result)record();
})();
