/* Phase 3: presentation-only result and records enhancements. */
(() => {
  function decorateResult() {
    const season=document.getElementById('season');
    if (!season || season.hidden || !season.querySelector('.season-summary')) return;
    const intro=season.querySelector('.res-top');
    const context=intro?.lastElementChild;
    if (context) {
      context.classList.add('result-context');
      const outcome=context.querySelectorAll(':scope > p')[1];
      if (outcome) outcome.classList.add('season-outcome');
      const rates=context.querySelector(':scope > p:first-child');
      if (rates) rates.classList.add('result-run-rates');
    }
    const details=season.querySelector('.season-details');
    if(!details||details.dataset.phase3Enhanced)return;
    details.dataset.phase3Enhanced='true';
    details.querySelectorAll('.tbl').forEach((wrap,i)=>{
      const batting=i===0;
      wrap.classList.add(batting?'stats-batting':'stats-pitching');
      wrap.setAttribute('role','region');
      wrap.setAttribute('tabindex','0');
      wrap.querySelector('table')?.setAttribute('aria-label',batting?'Batting statistics':'Pitching statistics');
      const note=document.createElement('p');
      note.className='stats-scroll-hint';
      note.textContent='Swipe table sideways for more stats';
      wrap.before(note);
    });
    const updateHints=()=>{
      if(!details.open)return;
      details.querySelectorAll('.tbl').forEach(wrap=>{
        const note=wrap.previousElementSibling;
        const overflow=wrap.scrollWidth>wrap.clientWidth+2;
        if(note?.classList.contains('stats-scroll-hint'))note.hidden=!overflow;
        wrap.setAttribute('aria-label',(wrap.classList.contains('stats-batting')?'Batting':'Pitching')+' statistics'+(overflow?', horizontally scrollable':''));
      });
    };
    details.addEventListener('toggle',()=>requestAnimationFrame(updateHints));
    window.addEventListener('resize',updateHints,{passive:true});
  }
  const oldFinish=finish;
  finish=function(scroll){const value=oldFinish(scroll);decorateResult();return value;};
  if(run?.result)decorateResult();
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#submitBtn');
    if(!btn)return;
    const field=document.getElementById('teamName'),message=document.getElementById('submitMsg');
    if(!field||!message)return;
    if(!field.value.replace(/\s+/g,' ').trim()){
      e.preventDefault();e.stopImmediatePropagation();
      field.setAttribute('aria-invalid','true');
      message.textContent='Enter a team name to post your result.';
      field.focus();
    }else field.removeAttribute('aria-invalid');
  },true);
  document.addEventListener('input',e=>{
    if(e.target?.id==='teamName'&&e.target.value.trim()){
      e.target.removeAttribute('aria-invalid');
      const msg=document.getElementById('submitMsg');
      if(msg?.textContent==='Enter a team name to post your result.')msg.textContent='';
    }
  });
})();
