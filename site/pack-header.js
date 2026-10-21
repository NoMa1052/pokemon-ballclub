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
 const prev=render;render=function(){prev();decorate()};
 decorate();
})();
