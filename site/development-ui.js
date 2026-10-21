/* Packs: choose a new teammate or develop one you already own. */
(() => {
 const $=id=>document.getElementById(id),best=m=>Math.max(...STD.map(s=>posOvr(m,s))),difference=n=>(n>0?'+':'')+n;
 let choice=null,lastTrigger=null;
 const chainOptions=card=>{
  if(typeof candyOptions!=='function'||!card||!run?.candies||run.hand||run.locked||run.result||spinning||!run.spin?.pack||!run.spin.ids.includes(card.id)||run.spin.usedIds?.includes(card.id))return [];
  const middle=EVOLUTION_PARENT[card.num],first=EVOLUTION_PARENT[middle];
  if(!first)return [];
  return candyOptions().filter(o=>o.evolve&&o.owned.num===first&&o.next.num===middle).map(o=>({...o,finalCard:card}));
 };
 const cardBase=tcardHTML;
 tcardHTML=function(m,mini){
  let html=cardBase(m,mini),label=m.friendship?`Friendship +${m.friendship} · Raised on your team`:'';
  const opts=developmentOptions(m),chains=chainOptions(m);
  if(!label&&(opts.length||chains.length))label=[...opts.map(o=>`${o.kind==='evolve'?'Evolve':o.kind==='family'?'Family train':'Train'} ${o.owned.name} · +${o.added} friendship`),...chains.map(o=>`Candy: ${o.owned.name} → ${o.next.name} → ${m.name}`)].join(' / ');
  if(mini&&(opts.length||chains.length)&&!m.friendship)label=[...opts.map(o=>`${o.kind==='evolve'?'Evolve':o.kind==='family'?'Family train':'Train'} ${o.owned.name}`),...chains.map(o=>`Candy combo: ${o.owned.name}`)].join(' / ');
  if(label)html=html.replace('<div class="tc-art">',`<div class="tc-growth">${esc(label)}</div><div class="tc-art">`);
  return html;
 };
 function closeChoice(){choice=null;$('developmentChoice')?.remove();lastTrigger?.focus?.()}
 function showChoice(id){
  const card=BYID.get(id),opts=developmentOptions(card),chains=chainOptions(card);if(!opts.length&&!chains.length)return;
  choice=id;$('developmentChoice')?.remove();
  const el=document.createElement('div');el.id='developmentChoice';el.className='sheet growth-sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','growthTitle');
  const canDraft=!takenNums().includes(card.num),teamBefore=teamOvr();
  const single=opts.length===1&&!chains.length?opts[0]:null;
  const title=canDraft?'Use this card':single?(single.kind==='evolve'?'Evolve ':'Train ')+single.owned.name:'Choose an upgrade';
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2 id="growthTitle">${esc(title)}</h2><button class="btn" id="growthClose">Back</button></div><div class="sheet-body"><p class="growth-cost">${canDraft?'Add a new teammate or upgrade one you already have.':single?.kind==='evolve'?'Evolve your teammate with this card.':'Use this duplicate to strengthen a teammate.'}</p>${opts.map(o=>{
   const before=posOvr(o.owned,o.slot),after=posOvr(o.next,o.slot),gain=after-before,teamAfter=rosterRating({...run.slots,[o.slot]:o.next},slotList()),evolves=o.kind==='evolve';
   return `<section class="growth-option"><div class="growth-line">${tok(o.next)}<span><small>${evolves?'EVOLUTION':o.kind==='family'?'FAMILY TRAINING':'DUPLICATE TRAINING'}</small><b>${esc(o.owned.name)}${evolves?' → '+esc(o.next.name):''}</b><span>Stays at ${lbl(o.slot)}</span></span></div><div class="growth-upgrade"><div><small>${lbl(o.slot)} RATING</small><div class="growth-score"><span>${before}</span><i aria-hidden="true">→</i><strong>${after}</strong></div></div><b class="growth-gain">${difference(gain)}<small>rating</small></b></div>${teamBefore!==teamAfter?`<p class="growth-team">Team rating <b>${teamBefore} → ${teamAfter}</b></p>`:''}<p class="growth-spend">Uses this pack pick. No new roster spot filled.</p><button class="btn primary growth-apply" data-growth-slot="${o.slot}">${evolves?'Evolve into '+esc(o.next.name):o.kind==='family'?'Family train '+esc(o.owned.name):'Train '+esc(o.owned.name)}</button><details><summary>Card preview & bonus details</summary><p>Adds ${o.added} friendship, reaching ${o.bonus}/10 total. Friendship improves every position, up to a rating of 99.</p>${tcardHTML(o.next)}</details></section>`;
  }).join('')}${chains.map(o=>`<section class="growth-option growth-chain"><div class="growth-line">${tok(o.next)}<span><small>RARE CANDY COMBO</small><b>${esc(o.owned.name)} → ${esc(o.next.name)} → ${esc(card.name)}</b><span>Stays at ${lbl(o.slot)}</span></span></div><p class="growth-spend">Step 1: confirm spending your Rare Candy to evolve ${esc(o.owned.name)}. Step 2: choose whether to use this ${esc(card.name)} pack card to evolve ${esc(o.next.name)}. You can cancel before using the Candy. Afterward, your pack card stays available until selected.</p><button class="btn primary growth-chain-apply" data-chain-slot="${esc(o.slot)}" data-chain-num="${o.next.num}">Use Rare Candy → ${esc(o.next.name)}</button></section>`).join('')}${canDraft?`<div class="growth-alternative"><span>Or add a new teammate</span><button class="btn growth-draft" id="growthDraft">Draft ${esc(card.name)} <b>${best(card)}</b></button></div>`:''}<p class="growth-footer">${run.doubleArmed&&!run.second?'Master Ball: you get one more choice after this. ':''}You can undo until you open the next pack.</p></div></div>`;
  document.body.appendChild(el);$('growthClose').onclick=closeChoice;
  el.querySelectorAll('[data-growth-slot]').forEach(b=>b.onclick=()=>{if(applyDevelopment(id,b.dataset.growthSlot)){closeChoice();render()}});
  el.querySelectorAll('[data-chain-slot]').forEach(b=>b.onclick=()=>{
    const slot=b.dataset.chainSlot,form=+b.dataset.chainNum,original=id;
    closeChoice();
    window.pbcOpenRareCandyChain?.(slot,form,()=>{
      if(run.spin?.ids.includes(original)&&!run.spin?.usedIds?.includes(original))showChoice(original);
    });
  });
  if($('growthDraft'))$('growthDraft').onclick=()=>{closeChoice();run.selected=id;render()};
  $('growthClose').focus();el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeChoice()}if(e.key==='Tab'){const bs=[...el.querySelectorAll('button,summary')].filter(b=>b.getClientRects().length),first=bs[0],last=bs[bs.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 }
 document.addEventListener('click',e=>{
  const button=e.target.closest('.pcard,.rv-mini');if(!button||!isPack()||run.hand||button.disabled||run.doubleArmed)return;
  const id=+button.dataset.id,card=BYID.get(id);if(!card)return;
  const options=developmentOptions(card);
  if(options.length||chainOptions(card).length){e.preventDefault();e.stopImmediatePropagation();lastTrigger=button;closeReveal();showChoice(id)}
  else if(takenNums().includes(card.num)||run.spin?.usedIds?.includes(id)){e.preventDefault();e.stopImmediatePropagation()}
 },true);
 function chooseMasterCard(id){if(developmentOptions(BYID.get(id)).length||chainOptions(BYID.get(id)).length)showChoice(id);else{run.selected=id;render()}}
 document.addEventListener('pbc-master-picks',e=>{const ids=e.detail;if(!run.doubleArmed||run.second||run.hand||!Array.isArray(ids)||ids.length!==2||new Set(ids).size!==2||ids.some(id=>!run.spin?.ids.includes(id)))return;run.masterQueue=[ids[1]];saveRun();chooseMasterCard(ids[0])});
 const previousRender=render;
 render=function(){previousRender();if(run.second&&!run.hand&&!choice&&run.masterQueue?.length){const id=run.masterQueue.shift();saveRun();chooseMasterCard(id);return;}if(choice&&!developmentOptions(BYID.get(choice)).length)closeChoice();
  const toast=$('handToast');if(toast&&run.handFeedback?.development){const f=run.handFeedback;toast.classList.add('growth-toast');toast.querySelector('span').innerHTML=`<b>${esc(f.name)} ${f.development==='evolve'?'evolved':'trained'}</b><small>Rating ${f.old} <span aria-hidden="true">→</span> <strong>${f.rating}</strong></small>`}
  if(isPack()){const intro=$('throwBox')?.querySelector('.throw-sub');if(intro&&!run.unrevealed)intro.textContent='Open 5 cards. Draft a teammate or develop your roster.'}
  if(isPack()&&run.spin?.pack&&!run.hand&&!run.locked){const hint=$('place')?.querySelector('.hint');if(hint)hint.textContent='Pick a teammate, or tap an Evolve / Train card to develop your roster.'}
 };
 render();
})();
