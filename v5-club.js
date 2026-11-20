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
 // Clubhouse sections stay open or closed while you move around the page.
 const OPEN=new Set();
 const isOpen=k=>OPEN.has(k)?' open':'';
 window.clubOpen=isOpen;
 document.addEventListener('toggle',e=>{const k=e.target?.dataset?.sec;if(k&&e.target.classList.contains('c2-sec')){if(e.target.open)OPEN.add(k);else OPEN.delete(k)}},true);
 const CHEV='<i class="c2-chev" aria-hidden="true"></i>';
 function caseHTML(ach,earned){
  const got=ach.filter(a=>earned.has(a[0])).length;
  return `<details class="bcase c2-sec" data-sec="badges"${isOpen('badges')}><summary class="bcase-lid" aria-label="Badge case, ${got} of ${ach.length} earned"><span>Badge case</span><i class="bcase-clasp" aria-hidden="true"></i><em>${got} of ${ach.length}</em>${CHEV}</summary>
   <div class="bcase-tray">${ach.map(([k,name])=>`<button type="button" class="bslot${earned.has(k)?' on':''}" data-badge="${k}" aria-label="${esc(name)}${earned.has(k)?', earned':', locked'}. Tap for details"><span class="bwell">${badgeSVG(k)}</span></button>`).join('')}</div>
   <p class="bcase-hint">Tap a badge to see what it is and how to earn it.</p></details>`;
 }
 function closeBadge(){const p=document.getElementById('bdgPop');if(p){p.remove();p._from?.focus?.()}}
 function showBadge(k,from){
  closeBadge();const a=Clubhouse.achievements.find(x=>x[0]===k);if(!a)return;const on=Clubhouse.read().unlocked.includes(k);
  const p=document.createElement('div');p.id='bdgPop';p._from=from;p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-labelledby','bdgPopT');
  p.innerHTML=`<div class="bdg-card${on?' on':''}"><span class="bdg-big">${badgeSVG(k)}</span><em class="${on?'':'lk'}">${on?'Earned':'Locked'}</em><h3 id="bdgPopT">${a[1]}</h3><p>${a[2]}</p><button type="button" class="btn" id="bdgPopX">Close</button></div>`;
  document.body.appendChild(p);p.addEventListener('click',e=>{if(e.target===p||e.target.id==='bdgPopX')closeBadge()});document.getElementById('bdgPopX').focus();
 }
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-badge]');if(b)showBadge(b.dataset.badge,b)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('bdgPop')){e.stopPropagation();e.preventDefault();closeBadge()}},true);
 const TEXT={hundred:'100',elite:'150',perfect:'162',allgens:'1–4',leglineup:'×3',ironman:'50',shinyhunt:'10'};
 const day=t=>{try{return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return ''}};
 // Shared by Clubhouse, Leaderboard and League: a posted roster as a grid of tappable players.
 // Roster view: unit ratings, then players grouped into lineup, rotation and bullpen. The best player gets a gold outline.
 window.lineupHTML=roster=>{
  if(!Array.isArray(roster))return '';
  const slots=roster.length===11?STD:FULL,ps=slots.map((s,i)=>({s,m:BYID.get(roster[i])})).filter(x=>x.m);
  if(!ps.length)return '';
  const rate=x=>posOvr(x.m,x.s),best=ps.reduce((a,x)=>!a||rate(x)>rate(a)?x:a,null);
  const groups=[['Lineup',ps.filter(x=>FIELD_SLOTS.includes(x.s))],['Rotation',ps.filter(x=>x.s.startsWith('SP'))],['Bullpen',ps.filter(x=>x.s.startsWith('RP'))]].filter(g=>g[1].length);
  const avg=a=>Math.round(a.reduce((t,x)=>t+rate(x),0)/a.length);
  const unit=([label,a])=>{const v=avg(a);return `<div><small>${label}</small><b>${v}</b><span class="rs-bar" aria-hidden="true"><i style="width:${Math.max(4,Math.min(100,(v-70)/29*100))}%"></i></span></div>`};
  const chip=x=>`<button type="button" class="rs-chip${x===best?' best':''}" data-history-mon="${x.m.id}" aria-label="${esc(x.m.name)}, ${lbl(x.s)}, rated ${rate(x)}${x===best?', best player':''}. Open card">${tok(x.m)}<span><b>${esc(x.m.name.replace(/^Shiny /,''))}</b><small>${lbl(x.s)}</small></span><em>${rate(x)}</em></button>`;
  return `<div class="rs"><div class="rs-units">${groups.map(unit).join('')}</div>${groups.map(([label,a])=>`<h4 class="rs-h"><span>${label}</span><span>${avg(a)} avg</span></h4><div class="rs-grid">${a.map(chip).join('')}</div>`).join('')}<p class="rs-cap">Gold outline: best player · Tap a player for their card</p></div>`;
 };
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
 const aceOf=r=>{let b=null,bv=-1;FULL.forEach((s,i)=>{const m=BYID.get(r?.[i]);if(m){const v=posOvr(m,s);if(v>bv){bv=v;b=m}}});return b};
 const mostDrafted=hist=>{const c=new Map();hist.forEach(h=>(h.roster||[]).forEach(id=>{const m=BYID.get(id);if(!m)return;const o=c.get(m.num)||{m:BYID.get(m.num)||m,n:0};o.n++;c.set(m.num,o)}));return [...c.values()].sort((a,b)=>b.n-a.n||a.m.num-b.m.num)};
 window.favoriteMon=()=>{try{return mostDrafted(Clubhouse.read().history.filter(h=>h.board==='pack-16'))[0]?.m.num||null}catch(e){return null}};
 const GEAR='<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M18.4 13a6.6 6.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a6.4 6.4 0 0 0-1.7-1L14 3.5h-4l-.4 2.5a6.4 6.4 0 0 0-1.7 1l-2.4-1-2 3.4L5.6 11a6.6 6.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a6.4 6.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a6.4 6.4 0 0 0 1.7-1l2.4 1 2-3.4zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>';
 const artImg=(m,cls='')=>`<img class="${cls}" src="${ART_URL(m.num,m.shiny)}" alt="" decoding="async" onerror="this.onerror=null;this.src='${SPRITE_URL(m.num,m.shiny)}';this.classList.add('px')">`;
 const colors=m=>{const a=TYPE_COLORS[m?.types?.[0]]||'#5f7fb6';return [a,TYPE_COLORS[m?.types?.[1]]||a]};
 window.clubhouseHTML=()=>{
  try{Clubhouse.sweep()}catch(e){}
  const b=Clubhouse.read(),hist=b.history.filter(h=>h.board==='pack-16'),bd=b.boards['pack-16'];
  const user=window.Account?.user||null,note=window.Account?.takeStatus?.()||'',favs=mostDrafted(hist);
  const av=BYID.get((user&&window.Account.avatar?.())||favs[0]?.m.num||25),[c1,c2]=colors(av);
  const best=bd?(bd.best||hist[0]||{wins:bd.bestWins}):null,titles=bd?.championships||0;
  const avg=hist.length?Math.round(hist.reduce((a,h)=>a+h.wins,0)/hist.length):bd?.bestWins||0,hundreds=hist.filter(h=>h.wins>=100).length;
  const earned=new Set(b.unlocked),ach=Clubhouse.achievements;
  const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
  const card=`<section class="c2-tc" style="--c1:${c1};--c2:${c2}"><div class="c2-tc-top"><small>My Clubhouse</small>${user?`<button type="button" class="c2-gear" data-acct="manage">${GEAR}Account</button>`:'<button type="button" class="c2-gear" data-acct="open">Sign in</button>'}</div>
   <h2>${esc(user?.name||'Your club')}</h2><p>${bd?`${plural(bd.seasons,'season')} · ${plural(titles,'title')}`:'Finish a season to start your record.'}</p>
   ${!user?'<p class="c2-sub">Sign in to keep your Clubhouse on every device.</p>':''}${note?`<p class="c2-note" role="status">${esc(note)}</p>`:''}
   ${av?artImg(av,'c2-tc-art'):''}
   ${bd?`<div class="c2-stats"><div>Best<b>${best.wins}</b></div><div>Avg wins<b>${avg}</b></div><div>100-win<b>${hundreds}</b></div><div>Titles<b>${titles}</b></div></div>`:'<div class="c2-stats c2-stats-0"></div>'}</section>`;
  const sec=(k,title,meta,body)=>`<details class="c2-sec c2-row" data-sec="${k}"${isOpen(k)}><summary><b>${title}</b><span class="c2-meta">${meta}</span>${CHEV}</summary><div class="c2-body">${body}</div></details>`;
  let bestHTML='';
  if(best?.roster){const a=aceOf(best.roster);
   bestHTML=sec('best','Best season',`${best.wins}–${162-best.wins}`,`<div class="c2-best">${a?`<span class="c2-best-art">${artImg(a)}</span>`:''}<div class="c2-best-mid"><b>${esc(best.team||'Best season')}</b><small>${[best.date?day(best.date):'',best.champ?'World champions':''].filter(Boolean).join(' · ')}</small><small>${[best.rating?'Rating '+best.rating:'',best.grade?'Grade '+esc(best.grade):''].filter(Boolean).join(' · ')}</small></div></div>${lineupHTML(best.roster)}`)}
  const top=favs.slice(0,5),most=top[0]?.n||1;
  const favHTML=top.length?sec('drafted','Most drafted',esc(top[0].m.name),`<ol class="c2-favs">${top.map(x=>`<li><button type="button" data-history-mon="${x.m.id}" aria-label="${esc(x.m.name)}, drafted in ${x.n} seasons. Open card">${artImg(x.m)}<span class="c2-fav-n"><b>${esc(x.m.name)}</b><span class="c2-fav-bar"><i style="width:${Math.round(100*x.n/most)}%"></i></span></span><em>${x.n} season${x.n===1?'':'s'}</em></button></li>`).join('')}</ol>`):'';
  const lineup=h=>FULL.map((s,i)=>{const m=BYID.get(h.roster[i]);return m?`<button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${tok(m)}<i>${lbl(s)}</i><em>${posOvr(m,s)}</em></button>`:''}).join('');
  const season=h=>{const mvp=BYID.get(h.mvp?.id);return `<details class="ch-season${h.champ?' champ':''}"><summary><span class="g">${h.grade}</span><span class="r">${h.team?`<em>${esc(h.team)}</em>`:''}<b>${h.wins}–${162-h.wins}</b><small>${h.champ?'World champions · ':''}Roster ${h.rating}${h.date?' · '+day(h.date):''}</small></span>${mvp?`<span class="m">${tok(mvp)}<small>MVP</small></span>`:''}</summary><div class="ch-lineup">${lineup(h)}</div></details>`};
  let rv={w:0,l:0};try{Object.values(JSON.parse(store.get('pbc5-rivals')||'{}')).forEach(x=>{rv.w+=+x?.w||0;rv.l+=+x?.l||0})}catch(e){}
  const log=hist.length?sec('log','Season log',plural(hist.length,'season'),hist.map(season).join('')):'';
  const riv=typeof rivalriesHTML==='function'?sec('rivals','Rival series',rv.w+rv.l?`${rv.w}–${rv.l}`:'None yet',`<div class="c2-riv">${rivalriesHTML()}</div>`):'';
  const dexHTML=typeof collectionHTML==='function'?collectionHTML():'';
  return `<div class="c2"><div class="c2-l">${card}${bestHTML?`<div class="c2-o2">${bestHTML}</div>`:''}${favHTML?`<div class="c2-o3">${favHTML}</div>`:''}<div class="c2-o5">${log}${riv}</div></div>
   <div class="c2-r"><div class="c2-o4">${caseHTML(ach,earned)}</div><div class="c2-o6">${dexHTML}</div></div></div>`;
 };
})();
