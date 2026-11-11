/* v5: How to play as a short start card plus tap-to-open topics, written for Packs with 16 players. */
(() => {
 const topic=(title,body)=>`<details class="help-topic"><summary>${title}</summary><div class="help-body">${body}</div></details>`;
 const list=items=>`<ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 const art=k=>`<img class="help-ico" src="${ITEM_ART[k]}" alt="">`;
 const item=(icon,name,per,text)=>`<div class="help-item">${icon}<div><b>${name}</b><small>${per}</small><p>${text}</p></div></div>`;
 const pick=n=>BYID.get(n);
 howHTML=function(){
  const sample=pick(461)||pick(143)||BASE[0],leg=pick(150),shiny=BYID.get(SHINY_ID+212)||BYID.get(SHINY_ID+6);
  return `<div class="help">
  <ol class="help-steps"><li><img class="help-pic pack" src="pack-foil-v3.webp" alt=""><b>Open a pack</b><span>5 random Pokémon.</span></li><li><span class="help-pic">${tok(sample)}</span><b>Keep one</b><span>Tap a card to see its ratings.</span></li><li><span class="help-pic spot" aria-hidden="true"><i>SS</i><em>${posOvr(sample,'SS')}</em></span><b>Give it a spot</b><span>Every open spot shows its rating there.</span></li></ol>
  <p class="help-goal">Fill all 16 spots, then play a 162-game season. The dream is 162–0.</p>
  <button class="btn primary" id="quickPlay">Start playing</button>
  <a class="help-sheet" href="sanity.html"><b>Scouting sheet</b><span>Every Pokémon's rating at every position</span><i aria-hidden="true">›</i></a>
  <h3 class="help-more">Want more? Tap a topic.</h3>
  ${topic('Your items',
   item('<img class="help-ico pack" src="pack-foil-v3.webp" alt="">','Re-rip','2 per run','Swap the pack for a new one before you pick.')+
   item(art('master-ball'),'Master Ball','1 per run','Keep two cards from one pack.')+
   item(art('rare-candy'),'Rare Candy','1 per run','Evolve or boost one teammate. It does not use a pick.')+
   item(`<span class="help-ico">${tok(sample)}</span>`,'Release','1 per run','Tap a player on your roster to let him go and draft a replacement.'))}
  ${topic('Reading a card',`<div class="help-card">${tcardHTML(sample)}</div><p>The big number is the card's best rating and where it gets it. Ratings run 40 to 99.</p>${list([
   '<b>OFF</b>: hitting only. This is the DH rating.',
   '<b>DEF</b>: glove at its best fielding spot.',
   '<b>SP / RP</b>: pitching as a starter or reliever.',
   'A fielder\'s rating is bat plus glove, so go by the number on the spot, not OFF and DEF added up.'])}
   <h4>The eight bars</h4><div class="keygrid">${KEY.map(([k,,orig,g,desc])=>`<div><b style="color:var(--${g})">${k}</b><span>${desc}</span><i>From ${orig}</i></div>`).join("")}</div><a class="help-sheet" href="sanity.html"><b>Scouting sheet</b><span>Compare every Pokémon at every spot</span><i aria-hidden="true">›</i></a>`)}
  ${topic('Evolve and train',list([
   'Pull the <b>next evolution</b> of a player you own to evolve him: +5 to his ratings, +8 after a second evolution.',
   'Pull a <b>duplicate</b> to train him: +2 each time, up to +10.',
   'Either one uses that pack\'s pick, and you still need to fill every spot.',
   'Tap a card marked Evolve or Train to preview the change first.']))}
  ${topic('Moving players around',list([
   'Tap a player on the field to pick him up, then tap a spot.',
   'Tap an occupied spot to swap the two.',
   'Undo reverses your last move.',
   'Your roster locks when the season starts. Your best starter pitches first and your best reliever closes.']))}
  ${topic('Legendaries and shinies',`<div class="help-duo">${leg?`<figure>${tok(leg)}<figcaption>Legendary</figcaption></figure>`:''}${shiny?`<figure class="sh">${tok(shiny)}<figcaption>Shiny</figcaption></figure>`:''}</div>`+list([
   '<b>Legendary</b>: a pack can hold a rare sixth card. One on your roster adds +1 team rating. More do not stack.',
   '<b>Shiny</b>: a rare version with boosted stats.',
   '<b>Shiny spark</b>: a shiny lifts up to 5 teammates that share one of its types by a few points each, marked with a gold +.',
   '<b>God pack</b>: about 1 pack in 750 is all legends and top shinies.']))}
  ${topic('The season and your results',list([
   'The season plays out month by month, then October if you make it.',
   'Results show your record, grade, MVP, best pitcher and your <b>weak link</b>: the spot that cost you the most wins.',
   '<b>Post team</b> puts you on the leaderboard under a team name.',
   'Records holds the leaderboard and My Clubhouse: your bests, achievements, series records and collection.']))}
  ${topic('League and weekly challenge',list([
   'Tap <b>League</b> to start a league or join one with a 5-character code.',
   '<b>Weekly challenge</b>: everyone opens the same pack at each pick and gets one attempt.',
   'Your league is ranked on that week\'s result. A new challenge starts every Monday.']))}
  ${topic('Rival series',list([
   'After a season, tap <b>Pick a rival</b> to play a league mate or a top club in a best of 7.',
   'You choose each game\'s starter and decide when to go to the bullpen.',
   'Watch the at-bats, open the box score, or skip ahead.',
   'Results post to your league.']))}
  ${topic('What each position needs',`<div class="needs">${[...FIELD_SLOTS,"SP","RP"].map(s=>`<div><b>${s==="RP"?"CL / SU":s}</b><span>${NEEDS[s]}</span></div>`).join("")}</div><p class="help-note">C catcher · SS shortstop · LF, CF, RF outfield · DH hitter only · SP starter · CL closer · SU setup. Defense matters most at C, SS and CF.</p>`)}
  ${topic('Body and type perks',`${list([
   'Few or no arms hurts throwing and pitching.',
   'Heavy Pokémon hit for power but lose infield range.',
   'Fliers cover more outfield.'])}<p>Types give small boosts that are already in the ratings:</p><div class="guide-perks">${Object.entries(PERKS).map(([type,benefit])=>`<div style="--perk-color:${TYPE_COLORS[type]}"><b>${cap(type)}</b><span>${benefit}</span></div>`).join("")}</div>`)}
  </div>`;
 };
})();
