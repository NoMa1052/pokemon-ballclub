/* Draft panel (Packs and Spin): "Pick 9 / 16" header with a quiet Undo, a 16-segment progress bar, the pack, then a small Start over. */
(() => {
 const $=id=>document.getElementById(id);
 function decorate(){
  const d=$('draft'),tb=$('throwBox'),pool=$('poolHead');
  const on=!!((tb||pool)&&!run.locked&&!run.result&&!run.hand&&run.picks.length<run.size);
  document.body.classList.toggle('pack-min',on);
  if(!on)return;
  d.querySelector('.pk-head')?.remove();d.querySelector('.pk-progress')?.remove();
  const n=Math.min(run.picks.length+1,run.size),chip=$('handToast');
  const undoText=chip?.querySelector('span')?.textContent.trim();
  const head=document.createElement('div');head.className='pk-head';
  head.innerHTML=`<b>Pick<span>${n}</span><small>/ ${run.size}</small></b>${chip&&undoText?`<span class="pk-undo"><em>${esc(undoText)}</em><button type="button" id="pkUndo">Undo</button></span>`:''}`;
  const pips=document.createElement('div');pips.className='pk-progress';pips.setAttribute('role','img');pips.setAttribute('aria-label',`${run.picks.length} of ${run.size} picks made`);
  pips.innerHTML=Array.from({length:run.size},(_,i)=>`<i class="${i<run.picks.length?'done':i===run.picks.length?'now':''}"></i>`).join('');
  d.prepend(head,pips);
  $('pkUndo')?.addEventListener('click',()=>{handUndoAction();render()});
  const start=$('newRun');if(start){start.classList.add('pk-start');d.append(start)}
 }
 // Roster complete: same header, a full progress bar, and one obvious next step.
 function decorateDone(){
  const d=$('draft'),pb=$('playBtn'),done=!!(pb&&!run.locked&&!run.result&&!run.hand&&run.picks.length>=run.size);
  document.body.classList.toggle('roster-done',done);
  if(!done)return;
  d.querySelector('.pk-head')?.remove();d.querySelector('.pk-progress')?.remove();d.querySelector('.rd-next')?.remove();
  const chip=$('handToast'),undoText=chip?.querySelector('span')?.textContent.trim();
  const head=document.createElement('div');head.className='pk-head';
  head.innerHTML=`<b>Roster<span>${run.size}</span><small>/ ${run.size}</small></b>${chip&&undoText?`<span class="pk-undo"><em>${esc(undoText)}</em><button type="button" id="pkUndo">Undo</button></span>`:''}`;
  const bar=document.createElement('div');bar.className='pk-progress all-done';bar.innerHTML=Array.from({length:run.size},()=>'<i class="done"></i>').join('');
  d.prepend(head,bar);
  $('pkUndo')?.addEventListener('click',()=>{handUndoAction();render()});
  const box=document.createElement('div');box.className='rd-next';
  box.innerHTML=`<h3>Your team is set</h3><p>Check your draft card, then play the season.</p>`;
  pb.before(box);box.append(pb);
  pb.innerHTML='<span>Review team</span><i aria-hidden="true">→</i>';pb.setAttribute('aria-label','Review team');
  box.insertAdjacentHTML('beforeend','<p class="rd-tip">Want to change something first? Tap any player on the field to move them.</p>');
  const start=$('newRun');if(start){start.classList.add('pk-start');d.append(start)}
 }
 const prev=render;render=function(){prev();decorate();decorateDone()};
 decorate();decorateDone();
})();
