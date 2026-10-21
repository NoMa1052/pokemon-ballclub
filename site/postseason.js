/* Read-only post-season team inspection. No changes to drafting, ratings or season calculations. */
(() => {
  const $ = id => document.getElementById(id);
  const maxRating = v => v >= 90 ? 'elite' : v >= 80 ? 'great' : v >= 70 ? 'good' : 'developing';

  function buildFinalTeam() {
    const season = $('season');
    if (!run?.result || !season || season.hidden) return;
    const panel = season.querySelector('.panel');
    const fieldSource = $('field');
    const penSource = $('pen');
    if (!panel || !fieldSource || !penSource) return;

    panel.querySelector('#postseasonTeam')?.remove();
    const slots = slotList().filter(s => run.slots[s]);
    const groups = [
      ['Lineup', slots.filter(s => FIELD_SLOTS.includes(s))],
      ['Rotation', slots.filter(s => s.startsWith('SP'))],
      ['Bullpen', slots.filter(s => s.startsWith('RP'))]
    ].filter(([,members]) => members.length);
    const grade = Number(teamOvr());
    const wrap = document.createElement('section');
    wrap.id = 'postseasonTeam';
    wrap.className = 'postseason-team';
    wrap.setAttribute('aria-label', 'Final team inspection');
    wrap.innerHTML = '<div class="postseason-heading"><div><span class="postseason-eyebrow">SEASON COMPLETE</span><h3>Your Final Team</h3><p>See your lineup on the diamond or review every player’s position rating.</p></div><div class="postseason-overall"><small>TEAM RATING</small><strong></strong></div></div><div class="postseason-tabs" role="tablist" aria-label="Final team views"><button type="button" role="tab" id="postseasonFieldTab" aria-controls="postseasonFieldPanel" aria-selected="true">On Field</button><button type="button" role="tab" id="postseasonRatingsTab" aria-controls="postseasonRatingsPanel" aria-selected="false">Ratings</button></div><div id="postseasonFieldPanel" role="tabpanel" aria-labelledby="postseasonFieldTab"></div><div id="postseasonRatingsPanel" role="tabpanel" aria-labelledby="postseasonRatingsTab" hidden></div>';
    wrap.querySelector('.postseason-overall strong').textContent = Number.isFinite(grade) ? grade : '—';

    // Clone the field that was rendered from this exact completed roster.
    const field = fieldSource.cloneNode(true);
    field.id = 'postseasonField';
    field.classList.add('postseason-field');
    const mowing = field.querySelector('pattern#mow');
    if (mowing) {
      mowing.id = 'postseason-mow';
      const painted = field.querySelectorAll('[style*="url(#mow)"]');
      painted.forEach(el => el.setAttribute('style', el.getAttribute('style').replaceAll('url(#mow)', 'url(#postseason-mow)')));
    }
    const staff = penSource.cloneNode(true);
    staff.id = 'postseasonPen';
    const rot = staff.querySelector('#staff'), bp = staff.querySelector('#bullpen');
    if (rot) rot.id = 'postseasonStaff';
    if (bp) bp.id = 'postseasonBullpen';
    const viewing = document.createElement('div');
    viewing.className = 'postseason-field-view';
    viewing.append(field,staff);
    const fPanel = wrap.querySelector('#postseasonFieldPanel');
    fPanel.append(viewing);
    const note = document.createElement('p');
    note.className = 'postseason-field-help';
    note.textContent = 'Tap a Pokémon to view its assigned-position rating.';
    fPanel.append(note);

    const ratings = wrap.querySelector('#postseasonRatingsPanel');
    ratings.innerHTML = groups.map(([name, members]) => '<section class="postseason-rating-group"><h4>' + name + '</h4><div class="postseason-rating-list">' +
      members.map(s => {
        const m = run.slots[s];
        const rating = posOvr(m, s);
        return '<div class="postseason-rating-row" data-postseason-slot="' + s + '"><span class="postseason-position">' + esc(lbl(s)) + '</span><span class="postseason-player">' + esc(m.name) + '</span><span class="postseason-value ' + maxRating(rating) + '" aria-label="' + rating + ' out of 100">' + rating + '</span></div>';
      }).join('') + '</div></section>').join('');
    const fieldTab = wrap.querySelector('#postseasonFieldTab');
    const ratingTab = wrap.querySelector('#postseasonRatingsTab');
    function select(view, target) {
      const isField = view === 'field';
      fieldTab.setAttribute('aria-selected',String(isField));
      ratingTab.setAttribute('aria-selected',String(!isField));
      fPanel.hidden = !isField;
      ratings.hidden = isField;
      wrap.dataset.view = view;
      if (target) {
        const row = [...ratings.querySelectorAll('[data-postseason-slot]')].find(el => el.dataset.postseasonSlot === target);
        if (row) {row.classList.add('postseason-target');row.scrollIntoView({block:'nearest',behavior:'auto'});}
      } else ratings.querySelectorAll('.postseason-target').forEach(el => el.classList.remove('postseason-target'));
    }
    fieldTab.addEventListener('click', () => select('field'));
    ratingTab.addEventListener('click', () => select('ratings'));
    [fieldTab,ratingTab].forEach(tab => tab.addEventListener('keydown', e => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const next = e.key === 'Home' ? 'field' : e.key === 'End' ? 'ratings' : tab === fieldTab ? 'ratings' : 'field';
      select(next);
      (next === 'field' ? fieldTab : ratingTab).focus();
    }));
    viewing.querySelectorAll('button.tag[data-slot]').forEach(button => {
      const s=button.dataset.slot,m=run.slots[s];if(!m)return;
      button.disabled=false;
      button.type='button';
      button.classList.add('postseason-inspect');
      button.removeAttribute('onclick');
      button.setAttribute('aria-label',m.name+' at '+SLOT_NAME[s]+'. Rating '+posOvr(m,s)+'. View rating.');
      button.addEventListener('click',() => {select('ratings',s);ratingTab.focus({preventScroll:true})});
    });

    // Follow the season outcome, ahead of submission, scouting and detailed stats.
    const top = panel.querySelector('.res-top');
    if (top) top.after(wrap);
    else panel.prepend(wrap);
  }
  const previousFinish = finish;
  finish = function(scroll){
    const value = previousFinish(scroll);
    buildFinalTeam();
    return value;
  };
  // The results screen may already have been rendered during startup.
  if(run?.result && !$('season')?.hidden) buildFinalTeam();
})();
