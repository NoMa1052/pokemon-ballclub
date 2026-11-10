/* v5 phase 2: the season plays out on screen before the results, the results name the weak link,
   and Post / Share / Play again stay within reach on phones. */
(() => {
 const $=id=>document.getElementById(id);
 const MONTHS=[[26,'April'],[54,'May'],[81,'June'],[107,'July'],[135,'August'],[162,'September']];
 const RIVALS=['Cerulean Tides','Coronet Climbers','Goldenrod Radio'];
 const seq=(wins,r)=>shuffle(Array.from({length:162},(_,i)=>i<wins?1:0),r);

 function moments(games,res){
  const out=[];let w=0,streak=0,kind=null,best={1:[0,0],0:[0,0]};
  games.forEach((g,i)=>{
   if(g===kind)streak++;else{kind=g;streak=1}
   if(streak>best[g][0])best[g]=[streak,i];
   w+=g;
   if(g&&w===88&&res.wins>=88)out.push([i,'Clinched a playoff spot','good']);
   if(g&&w===100)out.push([i,'Win number 100','good']);
   if(!g&&i+1-w===1&&res.wins>=140)out.push([i,`First loss of the year, in game ${i+1}`,'bad']);
  });
  if(res.wins===162)out.push([80,'81–0 at the halfway mark','good']);
  if(best[1][0]>=6&&res.wins<162)out.push([best[1][1],`Won ${best[1][0]} straight`,'good']);
  if(best[0][0]>=4)out.push([best[0][1],`Dropped ${best[0][0]} in a row`,'bad']);
  const ops=h=>{const s=h.st;return (s.h+s.bb)/Math.max(1,s.pa)+(s.h+s.d+2*s.t+3*s.hr)/Math.max(1,s.ab)};
  const bat=res.me.order.reduce((a,b)=>ops(b)>ops(a)?b:a),arms=res.me.rot.filter(p=>p.role!=='FILL'&&p.st.outs);
  out.push([47,`${bat.m.name} is carrying the lineup`,'note']);
  if(arms.length){const ace=arms.reduce((a,b)=>b.st.r/b.st.outs<a.st.r/a.st.outs?b:a);out.push([112,`${ace.m.name} is the ace of the staff`,'note'])}
  return out.sort((a,b)=>a[0]-b[0]);
 }

 function show(res){
  $('seasonReveal')?.remove();
  const r=rngFrom(hash('reveal:'+run.seed+':'+run.picks.join(',')));
  const games=seq(res.wins,r),rivals=[[RIVALS[0],seq(Math.round(90+r()*10),r)],[RIVALS[1],seq(Math.round(78+r()*9),r)],[RIVALS[2],seq(Math.round(64+r()*10),r)]];
  const notes=moments(games,res);
  const cum=a=>{let w=0;return a.map(g=>w+=g)},mine=cum(games),theirs=rivals.map(([n,g])=>[n,cum(g)]);
  const top=theirs.reduce((a,b)=>b[1][161]>a[1][161]?b:a)[1];
  const diff=(c,i)=>2*c[i]-(i+1),peak=Math.max(12,...mine.map((_,i)=>Math.abs(diff(mine,i))),...top.map((_,i)=>Math.abs(diff(top,i))));
  const X=i=>(8+i*308/161).toFixed(1),Y=d=>(60-d/peak*52).toFixed(1),pts=(c,n)=>c.slice(0,n).map((_,i)=>X(i)+','+Y(diff(c,i))).join(' ');
  const el=document.createElement('div');el.id='seasonReveal';el.className='sr';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Season in progress');
  el.innerHTML=`<div class="sr-in">
   <div class="sr-top"><span>162 games</span><button type="button" class="btn" id="srSkip">Skip to final</button></div>
   <div class="sr-head"><small id="srGame"></small><b id="srRec" aria-live="off">0–0</b><span id="srPace"></span></div>
   <svg class="sr-chart" viewBox="0 0 324 120" role="img" aria-label="Games above .500 through the season"><line x1="8" y1="60" x2="316" y2="60"></line><polyline id="srRival" points=""></polyline><polyline id="srLine" points=""></polyline><text x="12" y="112">games above .500</text></svg>
   <div class="sr-stand" id="srStand"></div>
   <div class="sr-notes" id="srNotes" aria-live="polite"></div>
   <div class="sr-post" id="srPost" hidden></div>
   <button type="button" class="btn primary sr-done" id="srDone" hidden>See your season</button>
  </div>`;
  document.body.appendChild(el);document.body.classList.add('sr-open');
  let shown=0,raf=0,start=0,timer=0,closed=false;const PER=62;
  const close=()=>{if(closed)return;closed=true;cancelAnimationFrame(raf);clearTimeout(timer);el.remove();document.body.classList.remove('sr-open');$('season')?.scrollIntoView({block:'start'})};
  function paint(n){
   const i=n-1,w=mine[i],l=n-w;
   $('srGame').textContent=`Game ${n} of 162 · ${MONTHS.find(m=>n<=m[0])[1]}`;
   $('srRec').textContent=`${w}–${l}`;
   $('srPace').textContent=n<162?`On pace for ${Math.round(w/n*162)} wins`:`Final · Grade ${res.grade}`;
   $('srLine').setAttribute('points',pts(mine,n));$('srRival').setAttribute('points',pts(top,n));
   const table=[['Your Ballclub',w,true],...theirs.map(([name,c])=>[name,c[i],false])].sort((a,b)=>b[1]-a[1]),lead=table[0][1];
   $('srStand').innerHTML=table.map(([name,tw,me],k)=>`<div class="${me?'me':''}"><i>${k+1}</i><span>${name}</span><b>${tw}–${n-tw}</b><em>${tw===lead?'—':lead-tw}</em></div>`).join('');
   const due=notes.filter(x=>x[0]<n).slice(-3).reverse();
   $('srNotes').innerHTML=due.map(([g,t,c])=>`<p class="${c}"><small>Game ${g+1}</small>${t}</p>`).join('');
  }
  function finale(){
   paint(162);$('srSkip').textContent='Skip';
   const post=res.post,box=$('srPost'),names=['Division Series','Championship Series','World Series'];
   const lines=post.made?post.games.map(([a,b],k)=>`<p class="${a>b?'good':'bad'}"><small>${names[k]}</small>${a>b?'Won':'Lost'} ${a}–${b}</p>`):[`<p class="bad"><small>October</small>${post.text}</p>`];
   if(post.made&&post.champ)lines.push('<p class="champ">World Series champions</p>');
   box.hidden=false;let k=0;
   const next=()=>{if(closed)return;if(k<lines.length){box.insertAdjacentHTML('beforeend',lines[k++]);timer=setTimeout(next,850)}else{$('srDone').hidden=false;$('srDone').focus({preventScroll:true})}};
   timer=setTimeout(next,500);
  }
  function frame(t){
   if(closed)return;if(!start)start=t;
   const n=Math.min(162,Math.floor((t-start)/PER)+1);
   if(n!==shown){shown=n;paint(n)}
   if(n<162)raf=requestAnimationFrame(frame);else finale();
  }
  $('srSkip').onclick=close;$('srDone').onclick=close;
  el.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  paint(1);raf=requestAnimationFrame(frame);$('srSkip').focus({preventScroll:true});
 }

 // What decided it: the spot where a player as good as your typical starter would have added the most wins.
 function weakLink(){
  const list=run.size===16?FULL:STD,base=winsFor(rating(run.slots,list)),filled=list.filter(s=>run.slots[s]);
  if(filled.length<3)return null;
  const runs=filled.map(s=>slotRuns(run.slots[s],s)).sort((a,b)=>a-b),mid=runs[Math.floor(runs.length/2)];
  const typical={dhR:mid,batR:mid,spR:mid,clR:mid,suR:mid,rpR:mid,fldR:new Proxy({},{get:()=>0}),types:[]};
  let worst=null;
  for(const s of filled){const m=run.slots[s],gain=winsFor(rating({...run.slots,[s]:typical},list))-base;if(!worst||gain>worst.gain)worst={s,m,gain}}
  return worst;
 }
 function addWeakLink(){
  const host=document.querySelector('#season .season-summary');if(!host||!run.result)return;
  host.querySelector('.weak-link')?.remove();
  const w=weakLink();if(!w)return;
  const p=document.createElement('p');p.className='weak-link';
  p.innerHTML=w.gain>=1?`<b>Weak link: ${esc(w.m.name)}, ${lbl(w.s)} ${posOvr(w.m,w.s)}.</b> A player as good as your typical starter there was worth about ${w.gain} more win${w.gain===1?'':'s'}.`:`<b>No weak link.</b> No single spot held this team back by a full win.`;
  (host.querySelector('.team-bars')||host.firstElementChild).after(p);
 }

 // Phones: keep the three end-of-season actions in reach until the real buttons scroll into view.
 let watch=null;
 function actionBar(){
  let bar=$('resBar');
  if(!run.result||innerWidth>=1000){bar?.remove();watch?.disconnect();watch=null;return}
  const real=document.querySelector('#season .season-actions');if(!real)return;
  if(!bar){
   bar=document.createElement('div');bar.id='resBar';bar.className='res-bar';
   bar.innerHTML='<button type="button" class="btn primary" data-a="post">Post team</button><button type="button" class="btn" data-a="share">Share</button><button type="button" class="btn" data-a="again">Play again</button>';
   bar.onclick=e=>{const a=e.target.closest('button')?.dataset.a;if(!a)return;
    if(a==='post'){const box=$('submitBox');box?.scrollIntoView({block:'center'});box?.querySelector('input')?.focus({preventScroll:true})}
    if(a==='board')(run.week||(typeof leagueCodes==='function'&&leagueCodes().length)?$('lgBtn'):$('lbBtn'))?.click();
    if(a==='share')$('shareBtn')?.click();
    if(a==='again')$('again')?.click()};
   document.body.appendChild(bar);
  }
  // Once the team is posted, the first button opens the standings instead.
  const post=bar.querySelector('[data-a=post],[data-a=board]');
  if(post){post.dataset.a=run.submitted?'board':'post';post.textContent=run.submitted?'Standings':'Post team';post.classList.toggle('primary',!run.submitted)}
  const box=$('submitBox');if(box&&!box._v5){box._v5=new MutationObserver(()=>actionBar());box._v5.observe(box,{childList:true})}
  watch?.disconnect();watch=new IntersectionObserver(es=>bar.classList.toggle('away',es[0].isIntersecting));watch.observe(real);
 }

 const prevFinish=finish;
 finish=function(){
  const fresh=!run.result,v=prevFinish.apply(this,arguments);
  addWeakLink();actionBar();
  if(fresh&&run.result&&!matchMedia('(prefers-reduced-motion: reduce)').matches)show(run.result);
  return v;
 };
 const prevRender=render;render=function(){const v=prevRender.apply(this,arguments);actionBar();return v};
 if(run?.result){addWeakLink();actionBar()}
})();
