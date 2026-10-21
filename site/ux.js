/* Ballclub usability pass. Game rules and pack odds stay in core.js / pack.js. */
(() => {
  const $ = id => document.getElementById(id);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const role = s => s.startsWith('SP') ? 'SP' : s.startsWith('RP') ? 'RP' : s;
  const posName = s => role(s) === 'SP' ? 'Starting pitcher' : role(s) === 'RP' ? 'Relief pitcher' : SLOT_NAME[s] || s;
  let swapTarget = null, moreSorts = false;

  // Quick start up front; the full scouting guide stays one tap away.
  const fullRules = howHTML;
  howHTML = function () {
    return `<div class="quickstart"><p class="intro-line">Build a Pokémon baseball team. See how far it goes.</p><ol class="quick-steps"><li><b>Get your choices</b><span>Open a pack of 5 cards, or spin for a type and region.</span></li><li><b>Choose a Pokémon</b><span>Tap a card to see its stats and position ratings.</span></li><li><b>Give it a position</b><span>Fill your roster, rearrange it, then simulate a season.</span></li></ol><button class="btn primary" id="quickPlay">Start playing</button></div><details class="full-rules"><summary>Full rules & scouting guide</summary>${fullRules()}</details>`;
  };
  const baseHow = openHow;
  openHow = function () { baseHow(); $('quickPlay').onclick = closeHow; };
  $('howBtn').onclick = openHow;

  document.querySelector('#modeSeg [data-v=pack]').querySelector('.beta')?.remove();
  document.querySelector('#sizeSeg [data-v="16"]').innerHTML = '<b>Standard</b><small>16 players</small>';
  document.querySelector('#sizeSeg [data-v="11"]').innerHTML = '<b>Quick</b><small>11 players</small>';
  document.querySelector('#sizeSeg [data-v="11"]').title = '9 fielders, 1 starter, 1 reliever. Standard has a full pitching staff.';

  // The scoreboard describes completed progress and distinguishes ratings from grades.
  renderBoard = function () {
    const n = run.picks.length, size = run.size, rating = teamOvr();
    const scoreboardValue=value=>{
      const raw=String(value),split=raw.indexOf('<small>'),main=split<0?raw:raw.slice(0,split),suffix=split<0?'':raw.slice(split);
      return [...main].map(char=>`<span class="score-digit${char==='—'?' score-empty':''}">${esc(char)}</span>`).join('')+suffix;
    };
    const cell = (label, value, sub = '', cls = '') => `<div class="bd-cell ${cls}"><span class="bd-lab">${label}</span><strong class="ux-score">${scoreboardValue(value)}</strong><span class="bd-sub">${sub}</span></div>`;
    const b = $('board'); b.classList.toggle('result', !!run.result);
    if (run.result) { b.innerHTML = cell('Wins', run.result.wins) + cell('Losses', 162 - run.result.wins) + cell('Rating', rating, legendaryPresence(run.slots) ? 'Legendary presence +1' : '') + cell('Grade', run.result.grade); return; }
    b.innerHTML = cell('Drafted', `${n}<small> / ${size}</small>`, `<span class="draft-progress"><i style="width:${n / size * 100}%"></i></span>`) + cell(n === size ? 'Rating' : 'Avg. rating', rating ?? '—', legendaryPresence(run.slots) ? 'Legendary presence +1' : n === size ? 'Roster complete' : `${n} player${n === 1 ? '' : 's'} filled`) + (isPack() ? cell('Re-rips', run.rerolls, 'remaining') + cell('Master Ball', run.doubles, 'remaining') : cell('Respins', run.rerolls, 'remaining') + cell('Keeps', '', `<span class="keep-counts"><span>Type <b>${run.keeps.type}</b></span><span>Region <b>${run.keeps.gen}</b></span></span>`));
  };

  // Compact choices; selected Pokémon show the existing complete stat breakdown.
  candHTML = function (m) {
    setOverall(m);
    if (run.selected === m.id) return `<button class="cand spin-card" data-id="${m.id}" aria-pressed="true" aria-label="${esc(m.name)}. Change Pokémon">${tcardHTML(m)}</button>`;
    const open = slotList().filter(s => !run.slots[s]);
    const best = open.length ? open.reduce((a, s) => posOvr(m, s) > posOvr(m, a) ? s : a) : null;
    const taken = takenNums().includes(m.num);
    const openRating = best == null ? null : posOvr(m, best);
    const openRole = best == null ? null : lbl(role(best));
    const sameFit = best != null && openRole === m.hspot && openRating === m.ovr;
    const badge = best == null ? [m.hspot, m.ovr] : [openRole, openRating];
    const fitLine = best != null && !sameFit ? `Best overall ${m.hspot} ${m.ovr}` : '';
    return `<button class="cand compact-cand${m.shiny ? ' shiny' : ''}" data-id="${m.id}" aria-pressed="false" aria-label="${esc(m.name)}, ${badge[1]} at ${badge[0]}${best != null ? ' (best open spot)' : ''}" ${taken ? 'disabled' : ''}>${tok(m)}<span class="compact-info"><b>${esc(m.name)}${m.shiny ? '<small class="rare-label">Shiny</small>' : m.leg ? '<small class="rare-label">Legend</small>' : ''}</b><small>${m.types.map(cap).join(' / ')}${taken ? ' · On team' : ''}${fitLine ? ' · ' + fitLine : ''}</small></span><span class="cand-fit"><b>${badge[1]}</b><small>${badge[0]}${best != null ? ' open' : ''}</small></span></button>`;
  };
  function playerStats(m) {
    return `<details class="player-stats"><summary>Player stats & scouting</summary><div class="ux-statgrid">${KEY.map(([name, key]) => `<span>${name}<b>${m.r[key]}</b></span>`).join('')}</div><p class="hint">${m.types.map(cap).join(' / ')} · ${m.body} · ${ftin(m.ht)} · ${lbs(m.wt)} lb</p><p class="hint">Best overall position: <b>${m.hspot} · ${m.ovr}</b></p><p class="hint">${[...new Set(Object.values(m.why).flat())].map(esc).join(' · ')}</p></details>`;
  }
  const baseSlotChips = slotChips;
  slotChips = function () {
    if(!isPack()&&run.selected)return positionPickerHTML(BYID.get(run.selected));
    return baseSlotChips();
  };

  // Moving works with a full roster. Show both sides before a swap is committed.
  function swapPlan(from, to) {
    const slots = { ...run.slots }, a = slots[from], b = slots[to];
    slots[to] = a; if (b) slots[from] = b; else delete slots[from];
    for (const group of [['SP1','SP2','SP3','SP4','SP5'], ['RP1','RP2']]) {
      const ss = group.filter(s => slotList().includes(s));
      const ms = ss.map(s => slots[s]).filter(Boolean).sort((x,y) => slotRuns(y, ss[0]) - slotRuns(x, ss[0]));
      ss.forEach((s,i) => { if (ms[i]) slots[s] = ms[i]; else delete slots[s]; });
    }
    const before = rosterRating(run.slots,slotList());
    const after = rosterRating(slots,slotList());
    const changes = Object.entries(slots).filter(([s,m]) => run.slots[s]?.id !== m.id).map(([s,m]) => {
      const old = slotList().find(k => run.slots[k]?.id === m.id);
      return { m, from: old, to: s, before: posOvr(m,old), after: posOvr(m,s) };
    });
    return { slots, changes, before, after };
  }
  function movementHTML() {
    const from = run.moving, m = run.slots[from]; setOverall(m);
    const plan = swapTarget ? swapPlan(from, swapTarget) : null;
    return `<div class="move-inspector"><div class="move-title">${tok(m)}<div><span class="label">Move or swap</span><h3>${esc(m.name)}</h3><p class="hint">${lbl(from)} · ${posOvr(m,from)} now · Best ${m.hspot} · ${m.ovr}</p></div><button class="btn" id="cancelMove">Cancel</button></div><p class="move-instruction">Pick a position to compare both players.</p><div class="move-positions">${slotList().map(s => {
      const other = run.slots[s];
      return `<button class="move-spot${s===from?' current':''}${s===swapTarget?' comparing':''}" data-compare="${s}" aria-pressed="${s===swapTarget}" ${s===from?'disabled':''} title="${SLOT_NAME[s]}"><span>${lbl(s)} <b>${posOvr(m,s)}</b></span><small>${s===from?'Current':other?esc(other.name):'Open'}</small>${other&&s!==from?`<em class="rating-delta ${posOvr(m,s)>=posOvr(other,s)?'gain':'loss'}">${posOvr(m,s)-posOvr(other,s)>0?'+':''}${posOvr(m,s)-posOvr(other,s)} at ${lbl(s)}</em>`:''}</button>`;
    }).join('')}</div>${plan ? `<div class="swap-preview"><h4>${run.slots[swapTarget]?'Swap preview':'Move preview'}</h4>${plan.changes.map(c => `<div class="swap-player"><b>${esc(c.m.name)}</b><span>${lbl(c.from)} ${c.before} <span aria-hidden="true">→</span> ${lbl(c.to)} <strong class="${c.after>=c.before?'gain':'loss'}">${c.after}</strong> <em class="rating-delta ${c.after>=c.before?'gain':'loss'}">(${c.after-c.before>0?'+':''}${c.after-c.before})</em></span></div>`).join('')}<p>Roster rating: <b>${plan.before} → ${plan.after}</b></p>${plan.changes.some(c => /^(SP|RP)/.test(c.from+c.to))?'<small>Pitchers automatically reorder within the rotation and bullpen.</small>':''}<button class="btn primary" id="confirmMove">Confirm ${run.slots[swapTarget]?'swap':'move'}</button></div>`:''}<details class="roster-card-detail"><summary>Inspect ${esc(m.name)}’s card</summary>${tcardHTML(m)}</details>${playerStats(m)}</div>`;
  }
  const oldTapSlot = tapSlot;
  tapSlot = function(s) {
    if (run.moving && !run.result && s !== run.moving) { swapTarget = s; render(); $('draft').scrollIntoView({behavior: reduced()?'auto':'smooth',block:'nearest'}); return; }
    swapTarget = null; oldTapSlot(s);
    if (run.moving) $('draft').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'nearest'});
  };
  const baseDraft = renderDraft;
  renderDraft = function () {
    if (run.moving && !run.locked) {
      $('draft').innerHTML = movementHTML();
      $('cancelMove').onclick = () => { run.moving=null; swapTarget=null; render(); };
      $('draft').querySelectorAll('[data-compare]').forEach(b => b.onclick=()=>{swapTarget=b.dataset.compare;render();});
      const confirm = $('confirmMove'); if(confirm) confirm.onclick=()=>{
        const plan=swapPlan(run.moving,swapTarget);run.slots=plan.slots;run.moving=null;swapTarget=null;run.just=null;saveRun();render();
      };
      return;
    }
    baseDraft();
    if(run.selected&&!isPack()){
      const list=$('cands'),selected=list?.querySelector('[aria-pressed="true"]'),place=$('place');
      if(selected&&place){
        const alternatives=document.createElement('details');alternatives.className='other-choices';alternatives.innerHTML='<summary>Change Pokémon</summary>';
        list.before(selected);selected.classList.add('selected-card');selected.onclick=()=>{run.selected=null;render();};
        selected.after(place);place.after(alternatives);alternatives.appendChild(list);
        const sort=$('draft').querySelector('.sortrow');if(sort)alternatives.insertBefore(sort,list);
      }
    }
    const sorts = $('draft').querySelector('.sortrow');
    if (sorts) {
      sorts.classList.add('ux-sorts');
      sorts.querySelectorAll('[data-sort]').forEach(b => {
        const primary = ['ovr','off','pit'].includes(b.dataset.sort);
        b.hidden = !primary && !moreSorts;
        if(b.dataset.sort==='ovr')b.textContent='Best fit';
        if(b.dataset.sort==='off')b.textContent='Hitting';
      });
      sorts.insertAdjacentHTML('beforeend',`<button class="chip" id="moreSorts" aria-expanded="${moreSorts}">${moreSorts?'Fewer sorts':'More sorts'}</button>`);
      $('moreSorts').onclick=()=>{moreSorts=!moreSorts;render();};
    }
    const pb=$('playBtn'); if(pb){pb.textContent='Simulate season';pb.insertAdjacentHTML('afterend','<p class="hint simulate-note">Plays all 162 games. Your lineup becomes final.</p>');}
    if(run.locked)$('draft').innerHTML='';
  };

  // Return to the next draft action after placement, rather than leaving the user down at the field.
  const placeAndSign = place;
  place = function(slot) {
    const before = run.picks.length;
    placeAndSign(slot);
    if(run.picks.length===before || run.picks.length===run.size)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const target = run.second ? $('cands') : $('throwBox');
      if(target)target.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'center'});
    }));
  };

  // A restart needs an explicit choice, with the default focus on keeping the draft.
  const restart = newRun;
  newRun = function () {
    if (!started() && !run.result) {restart();return;}
    const el=document.createElement('div');el.className='ux-dialog';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Restart draft');
    el.innerHTML='<div class="ux-dialog-card"><h2>Start a new run?</h2><p>Your current roster and results will be replaced.</p><div class="dialog-actions"><button class="btn" id="keepRun">Keep this run</button><button class="btn primary" id="restartRun">Start new run</button></div></div>';
    document.body.appendChild(el);$('keepRun').onclick=()=>el.remove();$('restartRun').onclick=()=>{el.remove();swapTarget=null;restart();};$('keepRun').focus();
  };

  function shareText() {
    const r=run.result, team=run.submitted?.team, championship=r.post.champ?'🏆 World Series champions':r.post.made?r.post.text.replace(/\.$/,''):'Missed the playoffs';
    return `⚾ Pokémon Ballclub${team?' · '+team:''}\n${r.wins}–${162-r.wins} · ${championship}\n${isPack()?'Packs':'Spin'} · ${run.size} players · Roster ${teamOvr()}\n\nCan you beat ${r.wins} wins?\nhttps://pokemon-ballclub.vercel.app`;
  }
  function decorateResults() {
    if(!run.result||$('season').hidden)return;
    document.body.classList.add('has-results');
    const season=$('season');
    const intro=season.querySelector('.res-top');
    const pennant=season.querySelector('.pennant');
    if(pennant&&!pennant.parentElement.classList.contains('result-grade')){const grade=document.createElement('div');grade.className='result-grade';pennant.before(grade);grade.append(pennant);grade.insertAdjacentHTML('beforeend','<small>Grade</small>');pennant.setAttribute('aria-label','Season grade '+run.result.grade);}

    if(intro&&!season.querySelector('.result-mode'))intro.insertAdjacentHTML('beforebegin',`<p class="result-mode">${isPack()?'Packs':'Spin'} · ${run.size===11?'Quick':'Standard'} · ${run.size} players</p>`);
    const btn=$('shareBtn'); if(btn){
      btn.textContent=navigator.share?'Share result':'Copy result';
      btn.onclick=async()=>{const text=shareText(),msg=$('shareMsg');
        try {if(navigator.share){await navigator.share({text});msg.textContent='';}else{await navigator.clipboard.writeText(text);msg.textContent='Result copied. Paste it into your chat.';}}
        catch(e){if(e.name==='AbortError')return;msg.innerHTML='<label>Copy your result<textarea readonly></textarea></label>';const t=msg.querySelector('textarea');t.value=text;t.focus();t.select();}
      };
    }
    const postLabel=season.querySelector('.submit .label');if(postLabel)postLabel.textContent='Post your team';
    const submit=$('submitBtn');if(submit)submit.textContent='Post team';
    const name=$('teamName');if(name)name.setAttribute('aria-label','Team name');
    const again=$('again');if(again)again.textContent='Play again';
    const share=season.querySelector('.share'),submitBox=$('submitBox');if(share&&submitBox)submitBox.after(share);
    season.querySelectorAll('.tbl').forEach(t=>{t.setAttribute('tabindex','0');t.setAttribute('aria-label','Season stats. Scroll horizontally for more columns.');});
  }
  const baseFinish=finish;
  finish=function(scroll){baseFinish(false);decorateResults();if(scroll)$('season').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});};

  // Keep the original card art and carousel. Dots are an optional quick way to navigate.
  function cardNavigation() {
    const row=document.querySelector('.cardrow');if(!row||row.nextElementSibling?.classList.contains('card-nav'))return;
    const cards=[...row.querySelectorAll('.pcard')];
    const nav=document.createElement('div');nav.className='card-nav';nav.setAttribute('aria-label','Pack cards');
    nav.innerHTML=cards.map((c,i)=>`<button class="card-dot" aria-label="View ${c.getAttribute('aria-label')}, card ${i+1} of ${cards.length}" title="${c.getAttribute('aria-label')}">${i+1}</button>`).join('');row.after(nav);
    const dots=[...nav.children];dots.forEach((b,i)=>b.onclick=()=>{row.scrollTo({left:cards[i].offsetLeft-(row.clientWidth-cards[i].offsetWidth)/2,behavior:reduced()?'auto':'smooth'});});
    const update=()=>{const center=row.scrollLeft+row.clientWidth/2;let closest=0,min=Infinity;cards.forEach((c,i)=>{const d=Math.abs(c.offsetLeft+c.offsetWidth/2-center);if(d<min){min=d;closest=i;}});dots.forEach((b,i)=>b.setAttribute('aria-current',i===closest?'true':'false'));};
    row.addEventListener('scroll',update,{passive:true});update();
  }

  // Small labels, never extra help boxes around the field.
  let spinPage=0,lastPool='';
  function compactSpin(){
    if(isPack()||run.result||run.moving)return;
    const draft=$('draft'),throwBox=$('throwBox');
    if(throwBox&&!throwBox.querySelector('.spin-reels')){const reels=document.createElement('div');reels.className='spin-reels';reels.innerHTML='<div class="spin-reel"><small>TYPE</small><b id="typeReel">?</b></div><div class="spin-reel"><small>REGION</small><b id="regionReel">?</b></div>';throwBox.querySelector('.tapcue').before(reels);}
    const head=$('poolHead'),controls=draft.querySelector('.spinctl'),list=$('cands');
    if(head&&controls){head.after(controls);controls.classList.add('spin-actions');controls.setAttribute('role','group');controls.setAttribute('aria-label','Redraw this Pokémon selection');
      controls.querySelector('.label')?.remove();const rb=$('rerollBtn');if(rb)controls.append(rb);}
    const ph=head?.querySelector('.poolhead');
    if(ph&&!ph.querySelector('.pool-pick'))ph.insertAdjacentHTML('beforeend',`<span class="pool-pick">Pick ${Math.min(run.picks.length+1,run.size)}<small>of ${run.size}</small></span>`);
    const hint=$('place')?.querySelector('.hint');if(hint&&!run.selected)hint.textContent='Tap a Pokémon, then choose its spot on the field.';
  }
  function decorateControls() {
    const lab=$('spinLabel');if(lab&&!spinning){lab.textContent=isPack()?'Open Pack':'Spin your next pick';lab.nextElementSibling.textContent=`Pick ${Math.min(run.picks.length+1,run.size)} of ${run.size}`;}
    const cue=$('draft').querySelector('.tapcue');if(cue&&isPack())cue.textContent='Swipe to rip · tap to open';
    const rb=$('rerollBtn');if(rb){rb.innerHTML=isPack()?`Re-rip <small>${run.rerolls} remaining</small>`:`Respin both <small>${run.rerolls} left</small>`;rb.title=isPack()?'Replace these five cards':'Get a new type and region';}
    const db=$('doubleBtn');if(db)db.innerHTML=`${run.doubleArmed?'Master Ball ready':'Master Ball'} <small>${run.doubles} left</small>`;
    for(const [id,kind,key] of [['keepType','type','type'],['keepGen','region','gen']]){
      const b=$(id);if(!b)continue;const sp=run.spin&&!run.unrevealed?run.spin:run.lastSpin;if(!sp)continue;
      const value=kind==='type'?cap(sp.type):REGIONS[sp.gen];const changing=kind==='type'?'region':'type';b.innerHTML=`Keep ${esc(value)}<small>New ${changing} · ${run.keeps[key]} left</small>`;b.title=`Keep the current ${kind} and draw a new ${changing}`;
    }
    $('draft').querySelectorAll('.spinctl + .hint').forEach(h=>h.hidden=true);
    document.querySelectorAll('.dc-grade small').forEach(l=>l.textContent='Roster rating');
    const dc=$('dcPlay');if(dc)dc.textContent='Simulate season';
    $('draft').querySelectorAll('.dchip[data-slot]').forEach(b=>b.title=posName(b.dataset.slot));
  }
  const baseRender=render;
  render=function(){baseRender();document.body.classList.toggle('has-results',!!run.result);document.body.classList.toggle('draft-started',!!started());document.body.classList.toggle('is-packs',isPack());decorateControls();compactSpin();cardNavigation();};

  const baseLb=openLb;
  openLb=async function(size,m){await baseLb(size,m);$('lbBody').querySelectorAll('.tm small').forEach(t=>t.textContent=t.textContent.replace(/^Team /,'Rating '));const header=$('lbBody').querySelector('.stand-head');if(header)header.lastElementChild.textContent='Grade';$('lbBody').querySelectorAll('.lbtabs [data-v]').forEach(b=>b.textContent=b.dataset.v==='11'?'Quick · 11':'Standard · 16');const desc=$('lbBody').querySelector('.stand-top span');if(desc)desc.textContent=lbSize===11?'Quick · 11 players':'Standard · 16 players';$('lbBody').querySelectorAll('summary').forEach(s=>s.setAttribute('aria-label',s.textContent.trim()+'. View roster'));};

  // Focus, Escape, and background isolation shared by all dialogs, including card reveals.
  let focusedDialog=null,returnFocus=null;
  const shown=e=>!e.hidden&&getComputedStyle(e).display!=='none'&&!e.classList.contains('leaving')&&!e.classList.contains('out');
  const dialogs=()=>[...document.querySelectorAll('[role=dialog]')].filter(shown);
  const focusables=e=>[...e.querySelectorAll('button:not([disabled]),[href],input,select,textarea,summary,[tabindex="0"]')].filter(x=>x.getClientRects().length);
  function syncDialogs(){
    document.querySelectorAll('.dc-grade small').forEach(l=>{if(l.textContent!=='Roster rating')l.textContent='Roster rating';});
    const dc=$('dcPlay');if(dc&&dc.textContent!=='Simulate season')dc.textContent='Simulate season';
    const ds=dialogs(),active=ds.at(-1)||null;
    [...document.querySelector('.wrap').children].forEach(c=>c.inert=!!active&&!c.contains(active));
    ds.forEach(d=>{d.setAttribute('aria-modal','true');d.inert=d!==active;});
    if(active===focusedDialog){if(active&&!active.contains(document.activeElement)){const first=active.querySelector('[data-autofocus]')||focusables(active)[0];if(first)first.focus({preventScroll:true});}return;}
    if(active){if(!focusedDialog)returnFocus=document.activeElement;focusedDialog=active;const first=active.querySelector('[data-autofocus]')||focusables(active)[0];if(first)first.focus({preventScroll:true});else{active.tabIndex=-1;active.focus({preventScroll:true});}}
    else{focusedDialog=null;if(returnFocus?.isConnected&&!returnFocus.disabled)returnFocus.focus({preventScroll:true});returnFocus=null;}
  }
  new MutationObserver(syncDialogs).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',e=>{
    const d=dialogs().at(-1);if(!d)return;
    if(e.key==='Tab'){const fs=focusables(d);if(!fs.length){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===fs[0]){e.preventDefault();fs.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===fs.at(-1)){e.preventDefault();fs[0].focus();}}
    if(e.key==='Escape'&&d.classList.contains('ux-dialog'))d.remove();
  });

  render();if(run.result)decorateResults();
  if(!store.get('pbc2-quickstart-v2')){store.set('pbc2-quickstart-v2','1');openHow();}
  syncDialogs();
})();
