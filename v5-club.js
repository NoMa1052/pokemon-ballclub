/* v5: My Clubhouse as a trophy room. Banner, trophy case, season log, rivalries, collection. */
(() => {
 const ICON={first:'<path fill-rule="evenodd" d="M12 2.500a9.500 9.500 0 1 1 0 19 9.500 9.500 0 0 1 0-19zM6.300 5.900a7.600 7.600 0 0 1 0 12.200l.900 1a9 9 0 0 0 0-14.200zm11.400 0-.900-1a9 9 0 0 0 0 14.200l.900-1a7.600 7.600 0 0 1 0-12.200z"/>',
  champ:'<path d="M7 3h10v2h3v3a4 4 0 0 1-3.600 4A5 5 0 0 1 13 14.900V17h2.500a1.500 1.500 0 0 1 1.500 1.500V21H7v-2.500A1.500 1.500 0 0 1 8.500 17H11v-2.100A5 5 0 0 1 7.600 12 4 4 0 0 1 4 8V5h3z"/>',
  legend:'<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',shiny:'<path d="M12 2l2.200 7.300L21.500 12l-7.300 2.700L12 22l-2.200-7.300L2.500 12l7.300-2.700z"/>',
  dynasty:'<path d="M5 4h14l-2 6a5 5 0 0 1-10 0zM9 16h6v2h2v2H7v-2h2z"/>',
  fullevo:'<path d="M12 2l7.500 7.500H14.500V12h-5V9.500H4.500zM12 11l7.500 7.500H14.500V22h-5v-3.500H4.500z"/>',
  rivals:'<path d="M13.500 2 4 14h7l-1.500 8L20 10h-7z"/>',
  week:'<path d="M5 2h2.200v20H5zM8.500 3.200 21 8.500 8.500 13.800z"/>'};

 // Original faceted badges, one shape and color per trophy.
 const BADGE={first:['oct','#e2493b','#8e1d16'],hundred:['hex','#e58a3a','#8a4510'],elite:['rhombus','#9fc3e8','#3f6d9c'],champ:['star8','#ffd23f','#a2730a'],
  legend:['shield','#a77be0','#4f2a8a'],shiny:['star4','#ff9ecf','#b0306f'],dynasty:['crest','#f2c14e','#7d5a12'],perfect:['round','#f1f4f8','#8c99ab'],
  allgens:['quad',null,null],leglineup:['tri','#7f6ff0','#33268f'],fullevo:['drop','#5fd38a','#1d7a43'],ironman:['hex','#b9c2cf','#55606f'],
  rivals:['star6','#ff7a45','#a2300c'],week:['pennant','#4fa3ff','#164f9c'],shinyhunt:['gem','#e05cc8','#7d1a6b']};
 const pts=(n,r,rot=0,cx=50,cy=50)=>Array.from({length:n},(_,i)=>{const a=rot+i*2*Math.PI/n;return [cx+r*Math.sin(a),cy-r*Math.cos(a)]});
 const star=(n,ro,ri,rot=0)=>Array.from({length:n*2},(_,i)=>{const a=rot+i*Math.PI/n,r=i%2?ri:ro;return [50+r*Math.sin(a),50-r*Math.cos(a)]});
 const SHAPES={oct:()=>pts(8,44,Math.PI/8),hex:()=>pts(6,45),rhombus:()=>[[50,4],[90,50],[50,96],[10,50]],star8:()=>star(8,46,30),
  shield:()=>[[50,5],[88,18],[84,58],[50,95],[16,58],[12,18]],star4:()=>star(4,47,19),crest:()=>[[50,6],[90,24],[78,82],[50,95],[22,82],[10,24]],
  round:()=>pts(12,45),quad:()=>[[50,4],[96,50],[50,96],[4,50]],tri:()=>[[50,6],[94,86],[6,86]],drop:()=>[[50,4],[78,46],[82,64],[70,86],[50,95],[30,86],[18,64],[22,46]],
  star6:()=>star(6,46,26),pennant:()=>[[16,8],[84,8],[84,62],[50,94],[16,62]],gem:()=>[[30,8],[70,8],[92,34],[50,94],[8,34]]};
 const mix=(a,b,t)=>{const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 function badgeSVG(k){
  const [shape,lite,dark]=BADGE[k]||BADGE.first,P=SHAPES[shape](),n=P.length,f=p=>p.map(q=>q.map(v=>v.toFixed(1)).join(',')).join(' ');
  const cols=shape==='quad'?['#d6453b','#e9b53c','#3aa86a','#b9d6f2']:null;
  let facets='';
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],c=cols?cols[i]:mix(lite,dark,[0,.35,.7,.45,.15,.55][i%6]);facets+=`<polygon points="${f([[50,50],a,b])}" fill="${c}"/>`}
  const inner=P.map(([x,y])=>[50+(x-50)*.42,50+(y-50)*.42]);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${f(P)}" fill="#0b1b38" transform="translate(0 3)" opacity=".5"/>${facets}<polygon points="${f(inner)}" fill="${cols?'#f4eedc':mix(lite,'#ffffff',.45)}" opacity=".9"/><polygon points="${f(inner)}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/><polygon points="${f(P)}" fill="none" stroke="${cols?'#2a1d05':mix(dark,'#000000',.35)}" stroke-width="3" stroke-linejoin="round"/><path d="M28 30 Q40 18 56 16" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
 }
 let caseOpen=false,caseSel=null;
 function caseHTML(ach,earned){
  const n=ach.filter(a=>earned.has(a[0])).length,got=ach.filter(a=>earned.has(a[0]));
  const sel=ach.find(a=>a[0]===caseSel)||got[got.length-1]||ach[0];
  return `<details class="ch-sec ch-log ch-case"${caseOpen?' open':''}><summary><h3>Badge case<em>${n} of ${ach.length}</em></h3><span class="case-mini">${got.map(a=>`<i>${badgeSVG(a[0])}</i>`).join('')||'<small>No badges yet. Finish a season to earn your first.</small>'}</span></summary>
   <div class="case-tray">${ach.map(([k,name])=>`<button type="button" class="bdg${earned.has(k)?' on':''}${k===sel[0]?' sel':''}" data-badge="${k}" aria-pressed="${k===sel[0]}" aria-label="${esc(name)}${earned.has(k)?'':', locked'}"><span class="bdg-art">${badgeSVG(k)}</span><span class="bdg-n">${name}</span></button>`).join('')}</div>
   <p class="case-cap"><b>${sel[1]}</b>${earned.has(sel[0])?'<em>Earned</em>':'<em class="lk">Locked</em>'}<span>${sel[2]}</span></p></details>`;
 }
 document.addEventListener('toggle',e=>{if(e.target.classList?.contains('ch-case'))caseOpen=e.target.open},true);
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-badge]');if(!b)return;caseSel=b.dataset.badge;const box=b.closest('.ch-case'),a=Clubhouse.achievements.find(x=>x[0]===caseSel),on=b.classList.contains('on');
  box.querySelectorAll('.bdg').forEach(x=>{x.classList.toggle('sel',x===b);x.setAttribute('aria-pressed',x===b)});
  box.querySelector('.case-cap').innerHTML=`<b>${a[1]}</b>${on?'<em>Earned</em>':'<em class="lk">Locked</em>'}<span>${a[2]}</span>`});
 const TEXT={hundred:'100',elite:'150',perfect:'162',allgens:'1–4',leglineup:'×3',ironman:'50',shinyhunt:'10'};
 const day=t=>{try{return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return ''}};
 // Shared by Clubhouse, Leaderboard and League: a posted roster as a grid of tappable players.
 window.lineupHTML=roster=>`<div class="ch-lineup">${FULL.map((s,i)=>{const m=BYID.get(roster[i]);return m?`<button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${tok(m)}<i>${lbl(s)}</i><em>${posOvr(m,s)}</em></button>`:''}).join('')}</div>`;
 window.starTok=roster=>{let best=null,bv=-1;FULL.forEach((s,i)=>{const m=BYID.get(roster[i]);if(m){const v=posOvr(m,s);if(v>bv){bv=v;best=m}}});return best?`<span class="star">${tok(best)}</span>`:'<span class="star"></span>'};
 // Seasons posted before names were kept: look up this device's posts once and match them by record and roster.
 let filled=false;
 window.clubhouseBackfill=async()=>{
  if(filled)return false;filled=true;
  try{
   if(!Clubhouse.read().history.some(h=>!h.team))return false;
   const r=await fetch(`${LB_URL}?select=team,wins,roster&device=eq.${deviceId()}&order=created_at.desc&limit=200`,{headers:lbHead()});if(!r.ok)return false;
   const rows=await r.json(),key=x=>x.wins+'|'+[...x.roster].sort((a,b)=>a-b).join(',');let hit=false;
   const byKey=new Map();rows.forEach(x=>{if(x.team&&Array.isArray(x.roster)&&!byKey.has(key(x)))byKey.set(key(x),x.team)});
   byKey.forEach((team,k)=>{if(Clubhouse.setTeam(h=>key({wins:h.wins,roster:h.roster.filter(Boolean)})===k,team))hit=true});
   return hit;
  }catch(e){return false}
 };
 window.clubhouseHTML=()=>{
  try{Clubhouse.sweep()}catch(e){}
  const b=Clubhouse.read(),hist=b.history.filter(h=>h.board==='pack-16'),bd=b.boards['pack-16'];
  if(!bd)return `<div class="ch"><section class="ch-hero ch-empty"><small>My Clubhouse</small><b>No banners yet</b><p>Finish a season to hang your first one. Your best seasons, trophies and collection live here.</p></section>${typeof collectionHTML==='function'?`<section class="ch-sec"><h3>Collection</h3>${collectionHTML()}</section>`:''}</div>`;
  const best=bd.best||hist[0]||{wins:bd.bestWins},avg=hist.length?Math.round(hist.reduce((a,h)=>a+h.wins,0)/hist.length):bd.bestWins,hundreds=hist.filter(h=>h.wins>=100).length;
  const earned=new Set(b.unlocked),ach=Clubhouse.achievements;
  const badge=([k,name,desc])=>`<div class="ch-badge${earned.has(k)?' on':''}"><span class="medal">${TEXT[k]?`<b>${TEXT[k]}</b>`:`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]||ICON.first}</svg>`}</span><p><b>${name}</b><small>${desc}</small></p></div>`;
  const lineup=h=>FULL.map((s,i)=>{const m=BYID.get(h.roster[i]);return m?`<button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${tok(m)}<i>${lbl(s)}</i><em>${posOvr(m,s)}</em></button>`:''}).join('');
  const season=h=>{const mvp=BYID.get(h.mvp?.id);return `<details class="ch-season${h.champ?' champ':''}"><summary><span class="g">${h.grade}</span><span class="r">${h.team?`<em>${esc(h.team)}</em>`:''}<b>${h.wins}–${162-h.wins}</b><small>${h.champ?'World champions · ':''}Roster ${h.rating}${h.date?' · '+day(h.date):''}</small></span>${mvp?`<span class="m">${tok(mvp)}<small>MVP</small></span>`:''}</summary><p class="ch-mvp">${h.mvp?`MVP ${esc(h.mvp.name)}: ${h.mvp.hr} HR, ${h.mvp.ops.toFixed(3).replace(/^0/,'')} OPS${h.rs?` · ${h.rs} runs scored, ${h.ra} allowed`:''}`:''}</p>${lineupHTML(h.roster)}</details>`};
  return `<div class="ch">
   <section class="ch-hero"><div class="ch-hero-top"><small>Best season${best.team?' · '+esc(best.team):''}</small><div class="ch-rec"><b>${best.wins}–${162-best.wins}</b>${best.grade?`<span class="ch-stamp"><b>${best.grade}</b><small>GRADE</small></span>`:''}</div></div>
    <div class="ch-stats"><div>Seasons<b>${bd.seasons}</b></div><div>Avg wins<b>${avg}</b></div><div>100-win<b>${hundreds}</b></div><div>Titles<b>${bd.championships||0}</b></div></div></section>
   ${caseHTML(ach,earned)}
   <details class="ch-sec ch-log"><summary><h3>Season log<em>${hist.length} season${hist.length===1?'':'s'}</em></h3></summary>${hist.map(season).join('')}</details>
   ${typeof rivalriesHTML==='function'?`<div class="ch-sec ch-riv">${rivalriesHTML()}</div>`:''}
   ${typeof collectionHTML==='function'?`<section class="ch-sec"><h3>Collection</h3>${collectionHTML()}</section>`:''}
  </div>`;
 };
})();
