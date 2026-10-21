(() => {
const $=id=>document.getElementById(id);
const fmt=x=>Number.isFinite(x)?x.toFixed(3).replace(/^0/,''):'.000';
const picture=m=>`<img src="${ART_URL(m.num,m.shiny)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${SPRITE_URL(m.num,m.shiny)}'">`;
const tone=v=>v>=90?'elite':v>=80?'great':v>=70?'good':'developing';
const batting=h=>{if(!h?.st)return null;const s=h.st,avg=s.h/Math.max(1,s.ab),obp=(s.h+s.bb)/Math.max(1,s.pa),slg=(s.h+s.d+2*s.t+3*s.hr)/Math.max(1,s.ab);return{s,avg,obp,slg,ops:obp+slg}};
const pitching=p=>!p?.st?null:{s:p.st,era:p.st.outs?p.st.r*27/p.st.outs:0,innings:ip(p.st.outs)};
const getLine=slot=>{
const me=run.result?.me;if(!me)return null;
if(FIELD_SLOTS.includes(slot)){const h=me.order?.find(x=>x.pos===slot)||me.hitters?.find(x=>x.pos===slot);if(!h)return null;return{kind:'bat',data:batting(h),order:(me.order?.findIndex(x=>x.pos===slot)??-1)+1}};
const p=slot==='RP1'?me.cl:slot==='RP2'?me.pen:me.rot?.find(x=>x.role===slot);
return p&&p.role!=='FILL'?{kind:'pitch',data:pitching(p)}:null;
};
const makeRow=slot=>{
const m=run.slots[slot],line=getLine(slot);if(!m||!line?.data)return'';
const rating=posOvr(m,slot),d=line.data,bat=line.kind==='bat';
const stats=bat?[['AVG',fmt(d.avg)],['HR',d.s.hr],['RBI',d.s.rbi],['OPS',fmt(d.ops)]]:[['ERA',d.era.toFixed(2)],['IP',d.innings],['K',d.s.k],['SV',d.s.sv]];
return `<button type="button" class="fantasy-player postseason-rating-row" data-postseason-slot="${esc(slot)}" aria-label="${bat?'Batting order '+line.order+', ':''}${esc(m.name)}, ${esc(lbl(slot))}, rating ${rating}. View card and season stats.">
<span class="fantasy-order">${bat?line.order:esc(lbl(slot))}</span>
<span class="fantasy-sprite">${picture(m)}</span>
<span class="fantasy-main"><span class="fantasy-player-top"><b>${esc(m.name)}</b><small>${esc(lbl(slot))}</small></span><span class="fantasy-stats">${stats.map(([k,v])=>`<span><small>${k}</small><b>${v}</b></span>`).join('')}</span></span>
<span class="fantasy-rating ${tone(rating)}"><b>${rating}</b><small>OVR</small></span><span class="fantasy-arrow" aria-hidden="true">›</span></button>`;
};
const sheetStats=(slot,m,line)=>{
const rating=posOvr(m,slot);
const head=`<div class="fantasy-sheet-intro"><span class="fantasy-sprite">${picture(m)}</span><div><small>${esc(SLOT_NAME[slot])}</small><b>${esc(m.name)}</b><span>${m.types.map(cap).map(esc).join(' / ')}</span></div><span class="fantasy-rating ${tone(rating)}"><b>${rating}</b><small>OVR</small></span></div>`;
if(!line?.data)return head+'<p>Season statistics unavailable.</p>';
const d=line.data,s=d.s;
const pairs=line.kind==='bat'?[['Batting order',line.order],['AVG',fmt(d.avg)],['OBP',fmt(d.obp)],['SLG',fmt(d.slg)],['OPS',fmt(d.ops)],['PA',s.pa],['AB',s.ab],['H',s.h],['2B',s.d],['3B',s.t],['HR',s.hr],['R',s.r],['RBI',s.rbi],['BB',s.bb],['K',s.k],['SB',s.sb],['CS',s.cs]]:
[['ERA',d.era.toFixed(2)],['IP',d.innings],['G',s.g],['GS',s.gs],['W',s.w],['L',s.l],['SV',s.sv],['H',s.h],['R',s.r],['HR',s.hr],['BB',s.bb],['K',s.k]];
return head+`<h4>${line.kind==='bat'?'Batting':'Pitching'} · 162-game season</h4><div class="fantasy-stat-grid">${pairs.map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div><p class="fantasy-season-note">From your completed season simulation.</p>`;
};
let active=null;
function inspect(slot,trigger){
const m=run.slots[slot];if(!m)return;
active?.remove();const modal=document.createElement('div');
modal.className='sheet fantasy-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',`${m.name} Pokémon card and season stats`);
modal.innerHTML=`<div class="sheet-in fantasy-modal-in"><div class="sheet-top"><h2>${esc(m.name)}</h2><button type="button" class="btn fantasy-close">Close</button></div>
<div class="fantasy-modal-tabs" role="tablist" aria-label="Player information"><button type="button" role="tab" id="fantasyCardTab" aria-controls="fantasyCardPanel" aria-selected="true">Pokémon Card</button><button type="button" role="tab" id="fantasyStatsTab" aria-controls="fantasyStatsPanel" aria-selected="false">Season Stats</button></div>
<div class="sheet-body fantasy-modal-body"><section id="fantasyCardPanel" role="tabpanel" aria-labelledby="fantasyCardTab">${tcardHTML(m)}</section><section id="fantasyStatsPanel" role="tabpanel" aria-labelledby="fantasyStatsTab" hidden>${sheetStats(slot,m,getLine(slot))}</section></div></div>`;
document.body.appendChild(modal);document.documentElement.classList.add('fantasy-modal-open');active=modal;
const card=modal.querySelector('#fantasyCardTab'),stats=modal.querySelector('#fantasyStatsTab'),cp=modal.querySelector('#fantasyCardPanel'),sp=modal.querySelector('#fantasyStatsPanel');
const show=isCard=>{card.setAttribute('aria-selected',String(isCard));stats.setAttribute('aria-selected',String(!isCard));cp.hidden=!isCard;sp.hidden=isCard;modal.querySelector('.fantasy-modal-body').scrollTop=0};
const close=()=>{if(active!==modal)return;active=null;modal.remove();document.documentElement.classList.remove('fantasy-modal-open');if(trigger?.isConnected)trigger.focus({preventScroll:true})};
card.onclick=()=>show(true);stats.onclick=()=>show(false);modal.querySelector('.fantasy-close').onclick=close;
for(const tab of [card,stats])tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const toCard=e.key==='Home'?true:e.key==='End'?false:tab===stats;show(toCard);(toCard?card:stats).focus()});
modal.addEventListener('click',e=>{if(e.target===modal)close()});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}if(e.key==='Tab'){const controls=[modal.querySelector('.fantasy-close'),card,stats],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
modal.querySelector('.fantasy-close').focus({preventScroll:true});
}
function decorate(){
const target=$('postseasonRatingsPanel');if(!target||!run?.result||$('season')?.hidden)return;
const lineup=run.result.me?.order?.map(x=>x.pos).filter(s=>run.slots[s])||[];
const starting=slotList().filter(s=>s.startsWith('SP')&&run.slots[s]);
const bullpen=slotList().filter(s=>s.startsWith('RP')&&run.slots[s]);
const groups=[['Batting Order',lineup],['Starting Rotation',starting],['Bullpen',bullpen]].filter(x=>x[1].length);
target.innerHTML=`<p class="fantasy-instruction">Tap a player for their Pokémon card and full season stats.</p>`+groups.map(([title,slots])=>`<section class="fantasy-group postseason-rating-group"><h4>${title}</h4><div class="fantasy-list">${slots.map(makeRow).join('')}</div></section>`).join('');
target.querySelectorAll('button.fantasy-player').forEach(b=>b.onclick=()=>inspect(b.dataset.postseasonSlot,b));
const tab=$('postseasonRatingsTab');if(tab)tab.textContent='Lineup & Ratings';
const subtitle=$('postseasonTeam')?.querySelector('.postseason-heading p');if(subtitle)subtitle.textContent='Your field, batting order, position ratings and season stats.';
}
const prev=finish;finish=function(scroll){const result=prev(scroll);decorate();return result};decorate();
})();
