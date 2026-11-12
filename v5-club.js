/* v5: My Clubhouse as a trophy room. Banner, trophy case, season log, rivalries, collection. */
(() => {
 const ICON={first:'<path fill-rule="evenodd" d="M12 2.500a9.500 9.500 0 1 1 0 19 9.500 9.500 0 0 1 0-19zM6.300 5.900a7.600 7.600 0 0 1 0 12.200l.900 1a9 9 0 0 0 0-14.200zm11.400 0-.900-1a9 9 0 0 0 0 14.200l.900-1a7.600 7.600 0 0 1 0-12.200z"/>',
  champ:'<path d="M7 3h10v2h3v3a4 4 0 0 1-3.600 4A5 5 0 0 1 13 14.900V17h2.500a1.500 1.500 0 0 1 1.500 1.500V21H7v-2.500A1.500 1.500 0 0 1 8.500 17H11v-2.100A5 5 0 0 1 7.600 12 4 4 0 0 1 4 8V5h3z"/>',
  legend:'<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',shiny:'<path d="M12 2l2.200 7.300L21.500 12l-7.300 2.700L12 22l-2.200-7.300L2.500 12l7.300-2.700z"/>',
  dynasty:'<path d="M5 4h14l-2 6a5 5 0 0 1-10 0zM9 16h6v2h2v2H7v-2h2z"/>'};
 const TEXT={hundred:'100',elite:'150',perfect:'162'};
 const day=t=>{try{return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return ''}};
 // Shared by Clubhouse, Leaderboard and League: a posted roster as a grid of tappable players.
 window.lineupHTML=roster=>`<div class="ch-lineup">${FULL.map((s,i)=>{const m=BYID.get(roster[i]);return m?`<button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${tok(m)}<i>${lbl(s)}</i><em>${posOvr(m,s)}</em></button>`:''}).join('')}</div>`;
 window.starTok=roster=>{let best=null,bv=-1;FULL.forEach((s,i)=>{const m=BYID.get(roster[i]);if(m){const v=posOvr(m,s);if(v>bv){bv=v;best=m}}});return best?`<span class="star">${tok(best)}</span>`:'<span class="star"></span>'};
 window.clubhouseHTML=()=>{
  const b=Clubhouse.read(),hist=b.history.filter(h=>h.board==='pack-16'),bd=b.boards['pack-16'];
  if(!bd)return `<div class="ch"><section class="ch-hero ch-empty"><small>My Clubhouse</small><b>No banners yet</b><p>Finish a season to hang your first one. Your best seasons, trophies and collection live here.</p></section>${typeof collectionHTML==='function'?`<section class="ch-sec"><h3>Collection</h3>${collectionHTML()}</section>`:''}</div>`;
  const best=bd.best||hist[0]||{wins:bd.bestWins},avg=hist.length?Math.round(hist.reduce((a,h)=>a+h.wins,0)/hist.length):bd.bestWins,hundreds=hist.filter(h=>h.wins>=100).length;
  const earned=new Set(b.unlocked),ach=Clubhouse.achievements;
  const badge=([k,name,desc])=>`<div class="ch-badge${earned.has(k)?' on':''}"><span class="medal">${TEXT[k]?`<b>${TEXT[k]}</b>`:`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]||ICON.first}</svg>`}</span><p><b>${name}</b><small>${desc}</small></p></div>`;
  const lineup=h=>FULL.map((s,i)=>{const m=BYID.get(h.roster[i]);return m?`<button type="button" data-history-mon="${m.id}" aria-label="Inspect ${esc(m.name)} card">${tok(m)}<i>${lbl(s)}</i><em>${posOvr(m,s)}</em></button>`:''}).join('');
  const season=h=>{const mvp=BYID.get(h.mvp?.id);return `<details class="ch-season${h.champ?' champ':''}"><summary><span class="g">${h.grade}</span><span class="r"><b>${h.wins}–${162-h.wins}</b><small>${h.champ?'World champions · ':''}Roster ${h.rating}${h.date?' · '+day(h.date):''}</small></span>${mvp?`<span class="m">${tok(mvp)}<small>MVP</small></span>`:''}</summary><p class="ch-mvp">${h.mvp?`MVP ${esc(h.mvp.name)}: ${h.mvp.hr} HR, ${h.mvp.ops.toFixed(3).replace(/^0/,'')} OPS${h.rs?` · ${h.rs} runs scored, ${h.ra} allowed`:''}`:''}</p>${lineupHTML(h.roster)}</details>`};
  return `<div class="ch">
   <section class="ch-hero"><div class="ch-hero-top"><small>Best season</small><div class="ch-rec"><b>${best.wins}–${162-best.wins}</b>${best.grade?`<span class="ch-stamp"><b>${best.grade}</b><small>GRADE</small></span>`:''}</div></div>
    <div class="ch-stats"><div>Seasons<b>${bd.seasons}</b></div><div>Avg wins<b>${avg}</b></div><div>100-win<b>${hundreds}</b></div><div>Titles<b>${bd.championships||0}</b></div></div></section>
   <section class="ch-sec"><h3>Trophy case<em>${ach.filter(a=>earned.has(a[0])).length} of ${ach.length}</em></h3><div class="ch-badges">${ach.map(badge).join('')}</div></section>
   <section class="ch-sec"><h3>Season log<em>last ${hist.length}</em></h3>${hist.map(season).join('')}</section>
   ${typeof rivalriesHTML==='function'?`<div class="ch-sec ch-riv">${rivalriesHTML()}</div>`:''}
   ${typeof collectionHTML==='function'?`<section class="ch-sec"><h3>Collection</h3>${collectionHTML()}</section>`:''}
  </div>`;
 };
})();
