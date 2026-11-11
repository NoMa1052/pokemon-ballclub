/* v5: How to play as a short start card plus tap-to-open topics, written for Packs with 16 players. */
(() => {
 const topic=(title,body)=>`<details class="help-topic"><summary>${title}</summary><div class="help-body">${body}</div></details>`;
 const list=items=>`<ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 howHTML=function(){
  return `<div class="help">
  <ol class="help-steps"><li><b>Open a pack</b><span>5 random Pokémon.</span></li><li><b>Keep one</b><span>Tap a card to see its ratings.</span></li><li><b>Give it a spot</b><span>Every open spot shows its rating there.</span></li></ol>
  <p class="help-goal">Fill all 16 spots, then play a 162-game season. The dream is 162–0.</p>
  <button class="btn primary" id="quickPlay">Start playing</button>
  <h3 class="help-more">Want more? Tap a topic.</h3>
  ${topic('Your three items',list([
   '<b>Re-rip</b> (2 per run): swap the pack for a new one before you pick.',
   '<b>Master Ball</b> (1 per run): keep two cards from one pack.',
   '<b>Rare Candy</b> (1 per run): evolve or boost one teammate. It does not use a pick.',
   '<b>Release</b> (1 per run): tap a player on your roster to let him go and draft a replacement.']))}
  ${topic('Reading a card',`<p>The big number is the card's best rating and where it gets it. Ratings run 40 to 99.</p>${list([
   '<b>OFF</b>: hitting only. This is the DH rating.',
   '<b>DEF</b>: glove at its best fielding spot.',
   '<b>SP / RP</b>: pitching as a starter or reliever.',
   'A fielder\'s rating is bat plus glove, so go by the number on the spot, not OFF and DEF added up.'])}
   <dl class="help-key">${KEY.map(([k,,orig,,desc])=>`<dt>${k}</dt><dd>${desc} <small>From ${orig}</small></dd>`).join('')}</dl>`)}
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
  ${topic('Legendaries and shinies',list([
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
   'Fliers cover more outfield.'])}<p>Types give small boosts that are already in the ratings:</p><div class="guide-perks">${Object.entries(PERKS).map(([type,benefit])=>`<div style="--perk-color:${TYPE_COLORS[type]}"><b>${cap(type)}</b><span>${benefit}</span></div>`).join("")}</div><p>Every Pokémon at every spot: <a href="sanity.html">scouting sheet</a>.</p>`)}
  </div>`;
 };
})();
