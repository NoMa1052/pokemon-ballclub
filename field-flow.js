/* One compact placement strip. Occupied positions explain the exchange before it happens. */
(() => {
 const $=id=>document.getElementById(id),delta=n=>(n>0?'+':'')+n;
 let lastHand=null;
 positionPickerHTML=()=>'';
 const oldDC=openDC;openDC=function(){if(!run.hand)oldDC()};
 const oldSpin=doSpin;doSpin=function(...args){if(run.hand)return;run.handUndo=null;run.handFeedback=null;return oldSpin(...args)};
 const oldRelease=releasePlayer;releasePlayer=function(s){if(run.hand)return false;return oldRelease(s)};
 function dialog(title,body,wire){
  $('flowReview')?.remove();const source=document.activeElement,el=document.createElement('div');el.id='flowReview';el.className='flow-review simple-review';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','flowReviewTitle');
  el.innerHTML=`<div class="flow-review-panel"><h3 id="flowReviewTitle">${title}</h3>${body}</div>`;document.body.append(el);document.documentElement.classList.add('flow-review-open');
  const close=()=>{el.remove();document.documentElement.classList.remove('flow-review-open');if(source?.isConnected)source.focus()};el.querySelector('[data-close]')?.addEventListener('click',close);el.onclick=e=>{if(e.target===el)close()};
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}if(e.key==='Tab'){const bs=[...el.querySelectorAll('button,summary')].filter(b=>b.getClientRects().length),first=bs[0],last=bs.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
  wire?.(el,close);el.querySelector('[data-close]')?.focus();return el;
 }
 function confirmExchange(s){
  const m=BYID.get(run.hand.held),other=run.slots[s],held=m.id,occupant=other.id,old=posOvr(other,s),rating=posOvr(m,s);
  dialog(`Swap at ${lbl(s)}?`,`<div class="move-person">${tok(m)}<div><b>${esc(m.name)}</b><span>Goes to ${SLOT_NAME[s].toLowerCase()}</span></div></div><p class="move-rating">${lbl(s)} rating <b>${old} → ${rating}</b> <strong class="${rating>=old?'gain':'loss'}">(${delta(rating-old)})</strong></p><div class="move-person displaced">${tok(other)}<div><b>${esc(other.name)}</b><span>Returns to your hand to place next</span></div></div><div class="move-confirm-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="confirmExchange">Swap Pokémon</button></div>`,(el,close)=>{
   el.querySelector('#confirmExchange').onclick=()=>{close();if(run.hand?.held!==held||run.slots[s]?.id!==occupant)return;handPlace(s);render()};
  });
 }
 function showRatings(m){
  const slots=slotList(),open=slots.filter(s=>!run.slots[s]).sort((a,b)=>posOvr(m,b)-posOvr(m,a)),best=open[0];
  const openRows=[];let startersAdded=false;
  for(const s of open){if(s.startsWith('SP')){if(startersAdded)continue;startersAdded=true;const ss=open.filter(x=>x.startsWith('SP'));openRows.push({slot:s,short:'SP',name:'Starting pitcher',note:ss.length===1?lbl(s)+' open':ss.length+' open spots',best:best?.startsWith('SP')})}else openRows.push({slot:s,short:lbl(s),name:SLOT_NAME[s],note:'',best:s===best})}
  const occupied=slots.filter(s=>run.slots[s]).sort((a,b)=>(posOvr(m,b)-posOvr(run.slots[b],b))-(posOvr(m,a)-posOvr(run.slots[a],a)));
  const head='<div class="rating-columns"><span>Position</span><span>Rating</span><span>Change</span></div>';
  const row=(x,other)=>{const value=posOvr(m,x.slot),d=other?value-posOvr(other,x.slot):null;return `<button type="button" data-rating-slot="${x.slot}" aria-label="${other?'Review swap at ':'Place at '}${esc(SLOT_NAME[x.slot])}, ${esc(m.name)} rating ${value}${d===null?'':', change '+delta(d)}" class="position-rating-row${x.best?' recommended':''}"><span class="position-rating-label"><b>${esc(x.short)}</b><span>${esc(x.name)}</span><small>${other?esc(other.name)+' · '+posOvr(other,x.slot)+' now':x.best?'Best open spot':esc(x.note)}</small></span><strong class="position-rating-value">${value}</strong><span class="position-rating-change ${d===null?'neutral':d>0?'gain':d<0?'loss':'neutral'}">${d===null?'Open':d===0?'Same':delta(d)}</span></button>`};
  const el=dialog(`${esc(m.name)}’s positions`,`<button class="btn ratings-top-close" data-close>Close</button><p class="ratings-explainer">Ratings show <b>${esc(m.name)}</b> at each spot. Tap a position to place or review a swap.</p>${openRows.length?`<section class="rating-group"><h4>Open positions</h4>${head.replace('Change','Status')}${openRows.map(x=>row(x,null)).join('')}</section>`:''}${occupied.length?`<section class="rating-group"><h4>Compare with your team</h4><p>Change is the gain or loss versus the player there.</p>${head}${occupied.map(s=>row({slot:s,short:lbl(s),name:SLOT_NAME[s]},run.slots[s])).join('')}</section>`:''}`);
  el.classList.add('ratings-review');const panel=el.querySelector('.flow-review-panel'),title=el.querySelector('h3'),close=el.querySelector('[data-close]'),header=document.createElement('div'),body=document.createElement('div');header.className='rating-sheet-head';body.className='rating-sheet-body';header.append(title,close);[...panel.children].forEach(node=>body.append(node));panel.replaceChildren(header,body);close.focus({preventScroll:true});
  el.querySelectorAll('[data-rating-slot]').forEach(button=>button.onclick=()=>{if(run.hand?.held!==m.id)return;close.click();tapSlot(button.dataset.ratingSlot)});
 }
 tapSlot=function(s){if(run.locked||run.result||spinning)return;if(!run.hand&&run.selected)handBeginDraft();if(run.hand){if(run.slots[s]){confirmExchange(s);return}handPlace(s)}else handPickup(s);render()};
 const baseRender=render;
 render=function(){
  if(run.waitingPick&&!run.hand){run.selected=run.waitingPick;run.waitingPick=null;run.moving=null}
  if(!run.hand&&run.selected&&!run.locked&&!run.result)handBeginDraft();
  if(run.hand){run.selected=run.hand.held;run.moving=null}
  run.placementTarget=null;$('draft').hidden=false;baseRender();$('board').hidden=true;
  document.documentElement.classList.remove('flow-review-open');
  for(const id of ['fieldFlow','flowReview','handToast','handDock'])$(id)?.remove();
  const h=run.hand,m=h?BYID.get(h.held):null,f=run.handFeedback;
  document.body.classList.toggle('field-deciding',!!m);
  if(!m){lastHand=null;if(f&&run.handUndo&&!run.locked){const toast=document.createElement('div');toast.id='handToast';toast.className='hand-toast';toast.setAttribute('role','status');toast.innerHTML=`<span>${esc(f.name)} placed at ${f.spot}</span><button class="btn quiet" id="handUndo">Undo</button>`;document.body.append(toast);$('handUndo').onclick=()=>{handUndoAction();render()}}return}
  setOverall(m);
  const open=slotList().filter(s=>!run.slots[s]).sort((a,b)=>posOvr(m,b)-posOvr(m,a)),best=open[0];
  const bar=document.createElement('div');bar.id='fieldFlow';bar.className='field-flow placement-strip';
  bar.innerHTML=`<div class="placement-title">${tok(m)}<div><small class="placement-task">Choose a position</small><h3>${h.kind==='move'?'Move':'Place'} ${esc(m.name)}</h3><span>${best?`Recommended: ${lbl(best)} · ${posOvr(m,best)}`:'Choose a position'}</span></div><small>${run.picks.length}/${run.size}</small></div><div class="placement-actions"><button class="btn quiet" data-history-mon="${m.id}">Card</button><button class="btn quiet" id="heldRatings">All ratings</button>${run.handUndo?'<button class="btn quiet" id="handUndo">Undo</button>':''}<button class="btn quiet" id="handCancel">Cancel</button>${h.kind==='move'?run.releases?run.second?'<span class="hint" role="status">Release available after your second catch</span>':'<button class="btn quiet" id="handReleaseAsk">Release · 1 left</button>':'<span class="hint" role="status">Release used · 0 left</span>':''}</div>`;
  $('field').before(bar);$('draft').hidden=true;
  if(lastHand===null)requestAnimationFrame(()=>bar.scrollIntoView({block:'start',behavior:'smooth'}));lastHand=m.id;
  if($('handUndo'))$('handUndo').onclick=()=>{handUndoAction();render()};$('handCancel').onclick=()=>{handCancel();render()};
  $('heldRatings').onclick=()=>showRatings(m);
  if($('handReleaseAsk'))$('handReleaseAsk').onclick=()=>dialog(`Release ${esc(m.name)}?`,`<p class="review-note">They leave your team. You’ll get a replacement pick. One release per run.</p><div class="move-confirm-actions"><button class="btn" data-close>Keep Pokémon</button><button class="btn primary" id="releaseHeld">Release</button></div>`,(el,close)=>{el.querySelector('#releaseHeld').onclick=()=>{close();handRelease();render()}});
  document.querySelectorAll('#field .tag,#staff .tag,#bullpen .tag').forEach(tag=>{
   const s=tag.dataset.slot,other=run.slots[s],v=posOvr(m,s),fresh=tag.cloneNode(true);tag.replaceWith(fresh);fresh.removeAttribute('disabled');fresh.onclick=()=>tapSlot(s);
   fresh.classList.remove('moving','open','flow-source','flow-target','flow-occupied','flow-open');
   fresh.classList.toggle('fit-best',!other&&s===best);if(!other&&s===best)fresh.title=`Recommended: ${m.name} at ${SLOT_NAME[s]} · ${v}`;
   // Keep each resident's one current rating. Open spots show only the held card's fit.
   if(!other){fresh.querySelector('.nm.pv')?.remove();fresh.insertAdjacentHTML('beforeend',`<span class="flow-fit">${v}</span>`)}
   fresh.setAttribute('aria-label',`${SLOT_NAME[s]}: ${other?'review exchange with '+other.name:'place here'}. ${m.name} rating ${v}${!other&&s===best?'. Best open position':''}`);
  });
 };
 render();
})();
