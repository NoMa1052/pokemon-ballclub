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

 // The season plays out month by month on a ballpark scoreboard: the record ticks up, the pennant race
 // moves, and one of your players takes the headline. October follows game by game.
 const ENDS=MONTHS.map(m=>m[0]),SHORT=['APR','MAY','JUN','JUL','AUG','SEP'];
 const nm=m=>m.name.replace(/^Shiny /,'');
 function headlines(res,r,monthW){
  const ops=h=>{const s=h.st;return (s.h+s.bb)/Math.max(1,s.pa)+(s.h+s.d+2*s.t+3*s.hr)/Math.max(1,s.ab)};
  const bats=[...res.me.order].sort((a,b)=>ops(b)-ops(a)),era=p=>p.st.outs?p.st.r*27/p.st.outs:9;
  const arms=res.me.rot.filter(p=>p.role!=='FILL'&&p.st.outs>60).sort((a,b)=>era(a)-era(b));
  const closer=res.me.cl&&res.me.cl.m&&res.me.cl.m.id&&res.me.cl.st.sv>5?res.me.cl:null;
  const hot=()=>1.15+.4*r();
  const hitter=(h,i)=>{const s=h.st,share=(ENDS[i]-(ENDS[i-1]||0))/162*hot(),avg=Math.min(.42,s.h/Math.max(1,s.ab)+.02+.035*r());
   return{m:h.m,tag:'Player of the month',text:`hit ${avg.toFixed(3).replace(/^0/,'')} with ${Math.max(1,Math.round(s.hr*share))} HR and ${Math.max(2,Math.round(s.rbi*share))} RBI`}};
  const starter=(p,i)=>{const starts=5+(r()<.5?1:0),pct=monthW[i][0]/Math.max(1,monthW[i][0]+monthW[i][1]),w=Math.max(1,Math.min(starts,Math.round(starts*Math.min(1,pct+.1)))),e=Math.max(.6,era(p)*(.62+.25*r()));
   return{m:p.m,tag:'Pitcher of the month',text:`went ${w}–${starts-w>2?2:Math.max(0,starts-w-1)} with a ${e.toFixed(2)} ERA`}};
  const saves=(p,i)=>({m:p.m,tag:'Fireman of the month',text:`locked down ${Math.max(3,Math.round(p.st.sv*(ENDS[i]-ENDS[i-1])/162*hot()))} saves`});
  const pick=[bats[0]&&(i=>hitter(bats[0],i)),arms[0]&&(i=>starter(arms[0],i)),bats[1]&&(i=>hitter(bats[1],i)),closer?(i=>saves(closer,i)):arms[1]&&(i=>starter(arms[1],i)),bats[2]&&(i=>hitter(bats[2],i)),arms[1]?(i=>starter(arms[1],i)):bats[0]&&(i=>hitter(bats[0],i))];
  return pick.map((f,i)=>f?f(i):null);
 }
 function show(res){
  $('seasonReveal')?.remove();
  const r=rngFrom(hash('reveal:'+run.seed+':'+run.picks.join(',')));
  const games=seq(res.wins,r),clubs=[['Your Ballclub',games,true],[RIVALS[0],seq(Math.round(90+r()*10),r)],[RIVALS[1],seq(Math.round(78+r()*9),r)],[RIVALS[2],seq(Math.round(64+r()*10),r)]];
  const cum=a=>{let w=0;return a.map(g=>w+=g)};clubs.forEach(c=>c[3]=cum(c[1]));
  const mine=clubs[0][3],monthW=ENDS.map((e,i)=>{const s=ENDS[i-1]||0,w=mine[e-1]-(s?mine[s-1]:0);return[w,e-s-w]});
  const notes=moments(games,res).filter(n=>n[2]!=='note'),heads=headlines(res,r,monthW);
  const top=Math.max(...clubs.map(c=>c[3][161]));
  const el=document.createElement('div');el.id='seasonReveal';el.className='sr';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Season in progress');
  el.innerHTML=`<div class="sr-in">
   <div class="sr-top"><span>The season</span><button type="button" class="btn" id="srSkip">Skip</button></div>
   <div class="szn-cal" id="srCal">${SHORT.map(m=>`<span>${m}</span>`).join('')}<span class="po">OCT</span></div>
   <div class="szn2"><div class="szn2-in">
    <div class="szn2-head"><span>Kanto East</span><b id="srGame">Opening day</b></div>
    <div class="szn2-rec" id="srRec" aria-live="off"></div><p class="szn2-pace" id="srPace">162 games to play</p>
    <table class="szn2-st" aria-label="Standings"><thead><tr><th></th><th scope="col">Club</th><th scope="col">W</th><th scope="col">L</th><th scope="col">GB</th><th></th></tr></thead><tbody id="srRace"></tbody></table>
    <div class="szn2-mo">${SHORT.map((m,i)=>`<div id="srM${i}">${m}<b>·</b></div>`).join('')}</div>
   </div></div>
   <div class="sr-moh" id="srMoh" hidden><span>Season moments</span></div>
   <div class="sr-card" id="srCard" aria-live="polite"></div>
   <div class="sr-oct" id="srOct" hidden></div>
   <button type="button" class="btn primary sr-done" id="srDone" hidden>See your season</button>
   <p class="sr-tap" id="srTap">Tap anywhere to speed up</p>
  </div>`;
  document.body.appendChild(el);document.body.classList.add('sr-open');
  let timer=0,raf=0,closed=false,hurry=false,month=0,shown=0;
  const close=()=>{if(closed)return;closed=true;cancelAnimationFrame(raf);clearTimeout(timer);el.remove();document.body.classList.remove('sr-open');$('season')?.scrollIntoView({block:'start'})};
  const wait=(ms,fn)=>{timer=setTimeout(fn,hurry?Math.min(ms,120):ms)};
  const tiles=(w,l)=>[...String(w)].map(c=>`<span>${c}</span>`).join('')+'<i>–</i>'+[...String(l)].map(c=>`<span>${c}</span>`).join('');
  const gb=(w,lead,n)=>!n||w===lead?'–':String(lead-w);
  let rank={};
  function race(n){
   const rows=clubs.map(c=>[c[0],n?c[3][n-1]:0,c[2]]).sort((a,b)=>b[1]-a[1]||(b[2]?1:-1)),lead=rows[0][1];
   $('srRace').innerHTML=rows.map(([name,w,me],k)=>{const was=rank[name],mv=was===undefined||was===k?'':was>k?'<i class="up">▲</i>':'<i class="dn">▼</i>';rank[name]=k;
    return `<tr class="${me?'me':''}" data-club="${name}"><td class="rk">${k+1}</td><td>${name}</td><td class="n"><span>${w}</span></td><td class="n"><span>${n-w}</span></td><td class="n"><span>${gb(w,lead,n)}</span></td><td class="mv">${mv}</td></tr>`}).join('');
  }
  function paint(n){
   const w=mine[n-1];$('srRec').innerHTML=tiles(w,n-w);$('srGame').textContent=n<162?`Game ${n} of 162`:'Final';
   $('srPace').innerHTML=n<162?`On pace for <b>${Math.round(w/n*162)} wins</b>`:`Final · Grade <b>${res.grade}</b>`;
   const rows=$('srRace').children;if(!rows.length)return;
   // Numbers tick in place while a month plays; the order settles when the month ends.
   const lead=Math.max(...clubs.map(c=>c[3][n-1]));
   [...rows].forEach(row=>{const c=clubs.find(c=>c[0]===row.dataset.club),cw=c[3][n-1],t=row.querySelectorAll('.n span');t[0].textContent=cw;t[1].textContent=n-cw;t[2].textContent=gb(cw,lead,n)});
  }
  const calMark=k=>[...$('srCal').children].forEach((sp,i)=>{sp.classList.toggle('done',i<k);sp.classList.toggle('now',i===k)});
  function playMonth(){
   if(closed)return;
   const from=ENDS[month-1]||0,to=ENDS[month],t0=performance.now(),per=hurry?4:30;
   calMark(month);
   const frame=t=>{
    if(closed)return;
    const n=Math.min(to,from+1+Math.floor((t-t0)/per));
    if(n!==shown){shown=n;paint(n)}
    if(n<to){raf=requestAnimationFrame(frame);return}
    const mw=monthW[month],cell=$('srM'+month);cell.querySelector('b').textContent=`${mw[0]}-${mw[1]}`;cell.className=mw[0]>mw[1]?'hot in':mw[0]<mw[1]?'cold in':'in';
    race(to);
    const h=heads[month],extra=notes.filter(x=>x[0]>=from&&x[0]<to).slice(-1)[0],card=$('srCard');
    card.querySelectorAll('.sr-head-card').forEach(c=>c.classList.add('old'));card.querySelectorAll('.sr-note').forEach(c=>c.remove());
    while(card.children.length>2)card.lastElementChild.remove();
    if(h){$('srMoh').hidden=false;card.insertAdjacentHTML('afterbegin',`<div class="sr-head-card">${tok(h.m)}<p><small>${h.tag} · ${MONTHS[month][1]}</small><b>${esc(nm(h.m))}</b> ${h.text}.</p></div>`)}
    if(extra)card.insertAdjacentHTML('afterbegin',`<p class="sr-note ${extra[2]}">${extra[1]}</p>`);
    month++;
    wait(h?1700:900,()=>{hurry=false;month<6?playMonth():october()});
   };
   raf=requestAnimationFrame(frame);
  }
  function october(){
   if(closed)return;
   $('srTap').hidden=true;calMark(6);$('srMoh').hidden=true;
   const post=res.post,box=$('srOct'),names=['Division Series','Championship Series','World Series'];
   $('srCard').innerHTML='';box.hidden=false;$('srSkip').textContent='Skip';
   if(!post.made){box.innerHTML=`<p class="sr-out"><small>October</small>${esc(post.text)}</p>`;$('srDone').hidden=false;$('srDone').focus({preventScroll:true});return}
   let k=0;
   const series=()=>{
    if(closed)return;
    if(k>=post.games.length){
     box.insertAdjacentHTML('beforeend',post.champ?'<p class="sr-champ"><small>Champions</small>World Series winners</p>':`<p class="sr-out"><small>Season over</small>${esc(post.text)}</p>`);
     $('srDone').hidden=false;$('srDone').focus({preventScroll:true});return}
    const [a,b]=post.games[k],won=a>b,order=shuffle([...Array(a+b-1)].map((_,i)=>i<(won?a-1:a)?1:0),r).concat(won?1:0);
    box.insertAdjacentHTML('beforeend',`<div class="sr-ser"><span>${names[k]}</span><div class="sr-pips" id="srP${k}"></div><b id="srS${k}">0–0</b></div>`);
    let g=0,wa=0,wb=0;
    const game=()=>{
     if(closed)return;
     if(g<order.length){order[g]?wa++:wb++;$('srP'+k).insertAdjacentHTML('beforeend',`<i class="${order[g]?'w':'l'}">${order[g]?'W':'L'}</i>`);$('srS'+k).textContent=`${wa}–${wb}`;g++;wait(420,game)}
     else{$('srS'+k).classList.add(won?'w':'l');k++;wait(600,series)}
    };
    wait(350,game);
   };
   series();
  }
  $('srSkip').onclick=close;$('srDone').onclick=close;
  el.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  el.addEventListener('click',e=>{if(!e.target.closest('button'))hurry=true});
  race(0);$('srSkip').focus({preventScroll:true});wait(700,playMonth);
 }

 // What decided it: the spot where a solid regular (an 85) would have added the most wins.
 function weakLink(){
  const list=run.size===16?FULL:STD,base=winsFor(rating(run.slots,list)),filled=list.filter(s=>run.slots[s]);
  const solid=(85-63)/.7,reg={dhR:solid,batR:solid,spR:solid,clR:solid,suR:solid,rpR:solid,fldR:new Proxy({},{get:()=>0}),types:[]};
  let worst=null;
  for(const s of filled){const m=run.slots[s],gain=winsFor(rating({...run.slots,[s]:reg},list))-base;if(!worst||gain>worst.gain)worst={s,m,gain}}
  return worst;
 }
 function addWeakLink(){
  const host=document.querySelector('#season .season-summary');if(!host||!run.result)return;
  host.querySelector('.weak-link')?.remove();
  const w=weakLink();if(!w)return;
  const p=document.createElement('p');p.className='weak-link';
  p.innerHTML=w.gain>=1?`<b>Weak link: ${esc(w.m.name)}, ${lbl(w.s)} ${posOvr(w.m,w.s)}.</b> A solid regular (an 85) there was worth about ${w.gain} more win${w.gain===1?'':'s'}.`:`<b>No weak link.</b> Every spot was at least as good as a solid regular.`;
  (host.querySelector('.team-bars')||host.firstElementChild).after(p);
 }

 // One set of end-of-season actions, straight under the record.
 function actionBar(){
  document.getElementById('resBar')?.remove();
  const a=document.querySelector('#season .season-actions'),h=document.querySelector('#season .season-head');
  if(!h||!run.result)return;
  let hero=document.getElementById('resHero');
  if(!hero||hero.nextElementSibling!==h){
   hero?.remove();
   const res=run.result,post=res.post||{},names=['Division','Pennant','World Series'],ovr=h.querySelector('.season-tiles div:nth-child(2) b')?.textContent||'',nums=(h.querySelector('.season-runs')?.textContent||'').match(/[\d.]+/g)||[];
   const tone=post.champ?'gold':post.made?'red':'gray',eyebrow=h.querySelector('.season-eyebrow')?.textContent.trim()||'Final';
   hero=document.createElement('section');hero.id='resHero';hero.className='res-hero';
   hero.innerHTML=`<small class="rh-eye">${esc(run.week?'Final · Weekly challenge':eyebrow)}</small>
    <div class="rh-rec"><b aria-label="${res.wins} wins and ${162-res.wins} losses">${res.wins}–${162-res.wins}</b><span class="ch-stamp"><b>${esc(res.grade)}</b><small>GRADE</small></span></div>
    <span class="rh-ribbon ${tone}">${esc(String(post.text||'Season over').replace(/\.$/,''))}</span>
    ${post.made&&post.games?.length?`<div class="rh-oct">${post.games.map(([x,y],i)=>`<div class="${x>y?'w':'l'}"><i>${x>y?'✓':'✕'}</i>${names[i]||'Series'}<b>${x}–${y}</b></div>`).join('')}</div>`:''}
    <div class="rh-quad"><div>Team OVR<b>${esc(ovr)}</b></div><div>Runs / game<b>${nums[0]||'–'}</b></div><div>Staff ERA<b>${nums[1]||'–'}</b></div></div>`;
   h.before(hero);
  }
  if(a&&h.nextElementSibling!==a)h.after(a);
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
