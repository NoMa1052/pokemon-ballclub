/* v5: My Clubhouse as a trophy room. Banner, trophy case, season log, rivalries, collection. */
(() => {
 const ICON={first:'<path fill-rule="evenodd" d="M12 2.500a9.500 9.500 0 1 1 0 19 9.500 9.500 0 0 1 0-19zM6.300 5.900a7.600 7.600 0 0 1 0 12.200l.900 1a9 9 0 0 0 0-14.200zm11.400 0-.900-1a9 9 0 0 0 0 14.200l.900-1a7.600 7.600 0 0 1 0-12.200z"/>',
  champ:'<path d="M7 3h10v2h3v3a4 4 0 0 1-3.600 4A5 5 0 0 1 13 14.900V17h2.500a1.500 1.500 0 0 1 1.500 1.500V21H7v-2.500A1.500 1.500 0 0 1 8.500 17H11v-2.100A5 5 0 0 1 7.600 12 4 4 0 0 1 4 8V5h3z"/>',
  legend:'<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',shiny:'<path d="M12 2l2.200 7.300L21.500 12l-7.300 2.700L12 22l-2.200-7.300L2.500 12l7.300-2.700z"/>',
  dynasty:'<path d="M5 4h14l-2 6a5 5 0 0 1-10 0zM9 16h6v2h2v2H7v-2h2z"/>',
  fullevo:'<path d="M12 2l7.500 7.500H14.500V12h-5V9.500H4.500zM12 11l7.500 7.500H14.500V22h-5v-3.500H4.500z"/>',
  rivals:'<path d="M13.500 2 4 14h7l-1.500 8L20 10h-7z"/>',
  week:'<path d="M5 2h2.200v20H5zM8.500 3.200 21 8.500 8.500 13.800z"/>'};


 // Original enamel pin badges: a metal rim, a glossy enamel face and one emblem each.
 const poly=P=>'M'+P.map(q=>q.map(v=>v.toFixed(1)).join(' ')).join('L')+'Z';
 const ring=(n,r,rot=0)=>Array.from({length:n},(_,i)=>{const a=rot+i*2*Math.PI/n;return [50+r*Math.sin(a),50-r*Math.cos(a)]});
 const star=(n,ro,ri)=>Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n,r=i%2?ri:ro;return [50+r*Math.sin(a),50-r*Math.cos(a)]});
 const dots=(y,c='#f4f6fa')=>[30,50,70].map(x=>`<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>`).join('');
 // key: [outline, light, dark, emblem, centre]
 const BADGE={
  first:['M14 10H86V52L50 92L14 52Z','#f0584a','#8e1d16','',[50,48]],
  hundred:['M50 6a44 44 0 1 0 0 88a44 44 0 1 0 0-88z','#f0a85a','#8a4a14','<path d="M27 20q17 30 0 60M73 20q-17 30 0 60" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3.500" stroke-linecap="round"/>'],
  elite:['M8 12L94 50L8 88Z','#8cc2f2','#2f5f96','',[36,50]],
  champ:[poly(star(5,47,21)),'#ffd84a','#a2730a','',[50,52]],
  legend:['M8 28L30 50L50 14L70 50L92 28L83 86H17Z','#b68cf0','#4f2a8a',dots(70),[50,58]],
  shiny:[poly(star(4,47,17)),'#ffa9d6','#b0306f',''],
  dynasty:['M50 5L91 21L81 78L50 96L19 78L9 21Z','#f5cc5c','#7d5a12',dots(44,'#fff6d6')],
  perfect:['M50 4L96 50L50 96L4 50Z','#fbfcfe','#9aa7b8',''],
  allgens:['M18 9H82Q91 9 91 18V82Q91 91 82 91H18Q9 91 9 82V18Q9 9 18 9Z','#e9b53c','#7d5a12','<rect x="0" y="0" width="50" height="50" fill="#d6453b"/><rect x="50" y="0" width="50" height="50" fill="#e9b53c"/><rect x="0" y="50" width="50" height="50" fill="#3aa86a"/><rect x="50" y="50" width="50" height="50" fill="#9cc8ee"/><path d="M50 0V100M0 50H100" stroke="#e8edf3" stroke-width="5"/><circle cx="50" cy="50" r="11" fill="#e8edf3" stroke="#5b6472" stroke-width="2"/>'],
  leglineup:['M50 7L94 86H6Z','#8f80f5','#33268f',dots(70),[50,60]],
  fullevo:['M50 5L90 44H70L92 80H8L30 44H10Z','#6fe09a','#1d7a43','',[50,52]],
  ironman:[poly(ring(6,46)),'#cfd6e0','#55606f','<circle cx="50" cy="50" r="15" fill="#1a2233" stroke="#fff" stroke-opacity=".6" stroke-width="2.500"/>'],
  rivals:['M60 3L16 56H43L34 97L84 40H55Z','#ff8a55','#a2300c','<path d="M56 16L30 50H50L44 78" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'],
  week:['M17 7H83V93L50 73L17 93Z','#5fb0ff','#164f9c','<text x="50" y="52" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="38" fill="#fff">1</text>',[50,44]],
  shinyhunt:['M30 9H70L93 36L50 93L7 36Z','#f070d8','#7d1a6b','<path d="M7 36H93M30 9L40 36L50 93L60 36L70 9" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.500" stroke-linejoin="round"/>',[50,44]]};
 const mix=(a,b,t)=>{const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 let uid=0; // ids must be unique per copy: a gradient inside a hidden copy does not paint
 function badgeSVG(k){
  const u=k+(++uid),[d,lite,dark,extra,c]=BADGE[k]||BADGE.first,[cx,cy]=c||[50,50],sc=f=>`translate(${cx} ${cy}) scale(${f}) translate(${-cx} ${-cy})`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>
   <linearGradient id="bm-${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#c3ccd8"/><stop offset=".6" stop-color="#7b8696"/><stop offset=".85" stop-color="#e3e9f0"/><stop offset="1" stop-color="#8b95a4"/></linearGradient>
   <linearGradient id="be-${u}" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${mix(lite,'#ffffff',.35)}"/><stop offset=".45" stop-color="${lite}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
   <clipPath id="bc-${u}"><path d="${d}"/></clipPath></defs>
   <path d="${d}" transform="translate(0 4)" fill="#000" opacity=".4"/>
   <path d="${d}" fill="url(#bm-${u})" stroke="#2b3240" stroke-width="2.500" stroke-linejoin="round"/>
   <g transform="${sc(.8)}"><g clip-path="url(#bc-${u})"><path d="${d}" fill="url(#be-${u})"/>${extra||`<path d="${d}" transform="${sc(.5)}" fill="${mix(lite,'#ffffff',.55)}" opacity=".75" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>`}
    <ellipse cx="34" cy="16" rx="52" ry="30" fill="#fff" opacity=".24"/></g>
    <path d="${d}" fill="none" stroke="${mix(dark,'#000000',.4)}" stroke-width="2.500" stroke-linejoin="round"/></g></svg>`;
 }
 let caseOpen=false;
 function caseHTML(ach,earned){
  const got=ach.filter(a=>earned.has(a[0]));
  return `<details class="ch-sec ch-log ch-case"${caseOpen?' open':''}><summary><h3>Badge case<em>${got.length} of ${ach.length}</em></h3><span class="case-mini">${got.map(a=>`<i>${badgeSVG(a[0])}</i>`).join('')||'<small>No badges yet. Finish a season to earn your first.</small>'}</span></summary>
   <div class="case-tray">${ach.map(([k,name])=>`<button type="button" class="bdg${earned.has(k)?' on':''}" data-badge="${k}" aria-label="${esc(name)}${earned.has(k)?', earned':', locked'}. Tap for details"><span class="bdg-art">${badgeSVG(k)}</span><span class="bdg-n">${name}</span></button>`).join('')}</div>
   <p class="case-hint">Tap a badge to see how to earn it.</p></details>`;
 }
 function closeBadge(){const p=document.getElementById('bdgPop');if(p){p.remove();p._from?.focus?.()}}
 function showBadge(k,from){
  closeBadge();const a=Clubhouse.achievements.find(x=>x[0]===k);if(!a)return;const on=Clubhouse.read().unlocked.includes(k);
  const p=document.createElement('div');p.id='bdgPop';p._from=from;p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-labelledby','bdgPopT');
  p.innerHTML=`<div class="bdg-card${on?' on':''}"><span class="bdg-big">${badgeSVG(k)}</span><em class="${on?'':'lk'}">${on?'Earned':'Locked'}</em><h3 id="bdgPopT">${a[1]}</h3><p>${a[2]}</p><button type="button" class="btn" id="bdgPopX">Close</button></div>`;
  document.body.appendChild(p);p.addEventListener('click',e=>{if(e.target===p||e.target.id==='bdgPopX')closeBadge()});document.getElementById('bdgPopX').focus();
 }
 document.addEventListener('toggle',e=>{if(e.target.classList?.contains('ch-case'))caseOpen=e.target.open},true);
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-badge]');if(b)showBadge(b.dataset.badge,b)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('bdgPop')){e.stopPropagation();e.preventDefault();closeBadge()}},true);
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
