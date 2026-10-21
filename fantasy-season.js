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
// Season sheet, laid out like the back of a baseball card: the headline numbers big, the rest as a plain list.
const ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
const teamRank=(slot,key,low)=>{const me=run.result?.me;if(!me)return null;
 const pool=FIELD_SLOTS.includes(slot)?(me.order||[]).map(h=>h.st):[...(me.rot||[]).filter(p=>p.role!=='FILL'),me.cl,me.pen].filter(p=>p?.st).map(p=>p.st);
 const mine=getLine(slot)?.data?.s;if(!mine||pool.length<2)return null;const v=key(mine);
 return 1+pool.filter(st=>low?key(st)<v:key(st)>v).length;};
const sheetStats=(slot,m,line)=>{
const rating=posOvr(m,slot);
const sub=line?.kind==='bat'?`${esc(SLOT_NAME[slot])} · Batting ${ord(line.order)}`:esc(SLOT_NAME[slot]);
const head=`<div class="fantasy-sheet-intro"><span class="fantasy-sprite">${picture(m)}</span><div><small>${sub}</small><b>${esc(m.name)}</b><span>${m.types.map(cap).map(esc).join(' / ')}</span></div><span class="fantasy-rating ${tone(rating)}"><b>${rating}</b><small>OVR</small></span></div>`;
if(!line?.data)return head+'<p>Season statistics unavailable.</p>';
const d=line.data,s=d.s,bat=line.kind==='bat';
const big=(label,value,rank)=>`<div class="ss-big"><b>${value}</b><small>${label}</small>${rank?`<em class="${rank===1?'top':''}">${rank===1?'Team best':ord(rank)+' on team'}</em>`:''}</div>`;
const rows=(title,pairs)=>`<section class="ss-list"><h5>${title}</h5>${pairs.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</section>`;
if(bat){
 const pa=Math.max(1,s.pa);
 return head+`<div class="ss-slash" aria-label="Slash line ${fmt(d.avg)} average, ${fmt(d.obp)} on-base, ${fmt(d.slg)} slugging">
   <div><b>${fmt(d.avg)}</b><small>AVG</small></div><i>/</i><div><b>${fmt(d.obp)}</b><small>OBP</small></div><i>/</i><div><b>${fmt(d.slg)}</b><small>SLG</small></div>
   <span class="ss-ops">${fmt(d.ops)}<small>OPS</small></span></div>
  <div class="ss-bigs">${big('HR',s.hr,teamRank(slot,x=>x.hr))}${big('RBI',s.rbi,teamRank(slot,x=>x.rbi))}${big('Runs',s.r,teamRank(slot,x=>x.r))}${big('Hits',s.h,teamRank(slot,x=>x.h))}</div>
  <div class="ss-lists">${rows('At the plate',[['Plate appearances',s.pa],['At bats',s.ab],['Doubles',s.d],['Triples',s.t]])}${rows('Eye and speed',[['Walks',`${s.bb} <small>${Math.round(s.bb/pa*100)}%</small>`],['Strikeouts',`${s.k} <small>${Math.round(s.k/pa*100)}%</small>`],['Stolen bases',s.sb],['Caught stealing',s.cs]])}</div>`;
}
const ipf=s.outs/3,whip=ipf?((s.h+s.bb)/ipf).toFixed(2):'0.00',k9=ipf?(s.k*9/ipf).toFixed(1):'0.0';
return head+`<div class="ss-slash ss-pitch"><div><b>${d.era.toFixed(2)}</b><small>ERA</small></div><div><b>${whip}</b><small>WHIP</small></div><div><b>${d.innings}</b><small>IP</small></div></div>
 <div class="ss-bigs">${big('Record',`${s.w}–${s.l}`,null)}${big('Strikeouts',s.k,teamRank(slot,x=>x.k))}${big('Saves',s.sv,s.sv?teamRank(slot,x=>x.sv):null)}${big('K per 9',k9,null)}</div>
 <div class="ss-lists">${rows('Workload',[['Games',s.g],['Starts',s.gs],['Batters faced',s.bf??(s.outs+s.h+s.bb)],['Pitches per inning',ipf?((s.outs+s.h+s.bb)*3.8/ipf).toFixed(1):'0.0']].slice(0,2))}${rows('Allowed',[['Hits',s.h],['Runs',s.r],['Home runs',s.hr],['Walks',s.bb]])}</div>`;
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
