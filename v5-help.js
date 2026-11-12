/* v5: How to play as a short start card plus tap-to-open topics, written for Packs with 16 players. */
(() => {
 const topic=(title,body)=>`<details class="help-topic"><summary>${title}</summary><div class="help-body">${body}</div></details>`;
 const list=items=>`<ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 const art=k=>`<img class="help-ico" src="${ITEM_ART[k]}" alt="">`;
 const item=(icon,name,per,text)=>`<div class="help-item">${icon}<div><b>${name}</b><small>${per}</small><p>${text}</p></div></div>`;
 const pick=n=>BYID.get(n);
 const byName=n=>MONS.find(m=>m.name===n&&!m.shiny);
 const pic=inner=>`<div class="help-pic" aria-hidden="true">${inner}</div>`;
 const evoPic=()=>{const c=['Charmander','Charmeleon','Charizard'].map(byName);if(c.some(x=>!x))return '';return pic(`<figure>${tok(c[0])}<figcaption>On your team</figcaption></figure><i>›</i><figure>${tok(c[1])}<figcaption>Pull this<b>+5</b></figcaption></figure><i>›</i><figure>${tok(c[2])}<figcaption>Then this<b>+8</b></figcaption></figure>`)};
 const movePic=()=>{const a=byName('Machamp'),b=byName('Pikachu');if(!a||!b)return '';return pic(`<figure>${tok(a)}<figcaption>1B</figcaption></figure><i>⇄</i><figure>${tok(b)}<figcaption>3B</figcaption></figure>`)};
 const seasonPic=()=>pic(`<div class="hp-rec"><span>1</span><span>0</span><span>4</span><i>–</i><span>5</span><span>8</span></div><span class="ch-stamp"><b>A</b><small>GRADE</small></span>`);
 const leaguePic=()=>pic(`<div class="hp-rows">${[['m1','1','You','104–58'],['m2','2','Your friend','97–65'],['m3','3','Their friend','91–71']].map(([c,n,t,r])=>`<div><span class="rk ${c}">${n}</span><b>${t}</b><em>${r}</em></div>`).join('')}</div>`);
 const seriesPic=()=>pic(`<div class="hp-series"><b>Best of 7</b>${['w','l','w','w','w'].map(x=>`<span class="${x}">${x.toUpperCase()}</span>`).join('')}<em>4–1</em></div>`);
 howHTML=function(){
  const sample=pick(461)||pick(143)||BASE[0],leg=pick(150),shiny=BYID.get(SHINY_ID+212)||BYID.get(SHINY_ID+6);
  return `<div class="help">
  <div class="help-flow" role="img" aria-label="Open a pack, keep one card, give it a spot"><figure><img class="pack" src="pack-foil-v3.webp" alt=""><figcaption><b>1. Open a pack</b>5 random Pokémon</figcaption></figure><i aria-hidden="true">›</i><figure><div class="help-mini">${tcardHTML(sample,true)}</div><figcaption><b>2. Keep one</b>Tap a card for its ratings</figcaption></figure><i aria-hidden="true">›</i><figure><div><span class="spot" aria-hidden="true"><em>SS</em><strong>${posOvr(sample,'SS')}</strong></span></div><figcaption><b>3. Give it a spot</b>Each spot shows its rating</figcaption></figure></div>
  <p class="help-goal">Fill all 16 spots, then play a 162-game season. The dream is 162–0.</p><span id="quickPlay" hidden></span>
  <h3 class="help-more">Want more? Tap a topic.</h3>
  ${topic('Your items',
   item(art('super-rod'),'Super Rod','2 per run','Don\'t like the pack? Cast again for a new one before you pick.')+
   item(art('master-ball'),'Master Ball','1 per run','Keep two cards from one pack.')+
   item(art('rare-candy'),'Rare Candy','1 per run','Evolve or boost one teammate. It does not use a pick.')+
   item(`<span class="help-ico">${tok(sample)}</span>`,'Release','1 per run','Tap a player on your roster to let him go and draft a replacement.'))}
  ${topic('Reading a card',`<div class="help-card">${tcardHTML(sample)}</div><p>The big number is the card's best rating and where it gets it. Ratings run 40 to 99.</p>${list([
   '<b>OFF</b>: hitting only. This is the DH rating.',
   '<b>DEF</b>: glove at its best fielding spot.',
   '<b>SP / RP</b>: pitching as a starter or reliever.',
   'A fielder\'s rating is bat plus glove, so go by the number on the spot, not OFF and DEF added up.'])}
   <h4>The eight bars</h4><div class="keygrid">${KEY.map(([k,,orig,g,desc])=>`<div><b style="color:var(--${g})">${k}</b><span>${desc}</span><i>From ${orig}</i></div>`).join("")}</div>`)}
  ${topic('Evolve and train',evoPic()+list([
   'Pull the <b>next evolution</b> of a player you own to evolve him: +5 to his ratings, +8 after a second evolution.',
   'Pull a <b>duplicate</b> to train him: +2 each time, up to +10.',
   'Either one uses that pack\'s pick, and you still need to fill every spot.',
   'Tap a card marked Evolve or Train to preview the change first.']))}
  ${topic('Moving players around',movePic()+list([
   'Tap a player on the field to pick him up, then tap a spot.',
   'Tap an occupied spot to swap the two.',
   'Undo reverses your last move.',
   'Your roster locks when the season starts. Your best starter pitches first and your best reliever closes.']))}
  ${topic('Legendaries and shinies',`<div class="help-duo">${leg?`<figure>${tok(leg)}<figcaption>Legendary</figcaption></figure>`:''}${shiny?`<figure class="sh">${tok(shiny)}<figcaption>Shiny</figcaption></figure>`:''}</div>`+list([
   '<b>Legendary</b>: a pack can hold a rare sixth card. One on your roster adds +1 team rating. More do not stack.',
   '<b>Shiny</b>: a rare version with boosted stats.',
   '<b>Shiny spark</b>: a shiny lifts up to 5 teammates that share one of its types by a few points each, marked with a gold +.',
   '<b>God pack</b>: about 1 pack in 750 is all legends and top shinies.']))}
  ${topic('The season and your results',seasonPic()+list([
   'The season plays out month by month, then October if you make it.',
   'Results show your record, grade, MVP, best pitcher and your <b>weak link</b>: the spot that cost you the most wins.',
   '<b>Post team</b> puts you on the leaderboard under a team name.',
   'Records holds the leaderboard and My Clubhouse: your best season, trophy case, season log, series records and collection.']))}
  ${topic('League and weekly challenge',leaguePic()+list([
   'Tap <b>League</b> to start a league or join one with a 5-character code.',
   '<b>Weekly challenge</b>: everyone opens the same pack at each pick and gets one attempt.',
   'Your league is ranked on that week\'s result. A new challenge starts every Monday.']))}
  ${topic('Rival series',seriesPic()+list([
   'After a season, tap <b>Pick a rival</b> to play a league mate in a best of 7. You can also play top clubs from Records as an exhibition.',
   'You choose each game\'s starter and decide when to go to the bullpen.',
   'Watch the at-bats, open the box score, or skip ahead.',
   'League series post to your league. Exhibitions are not posted.']))}
  ${topic('What each position needs',`<div class="needs">${[...FIELD_SLOTS,"SP","RP"].map(s=>`<div><b>${s==="RP"?"CL / SU":s}</b><span>${NEEDS[s]}</span></div>`).join("")}</div><p class="help-note">C catcher · SS shortstop · LF, CF, RF outfield · DH hitter only · SP starter · CL closer · SU setup. Defense matters most at C, SS and CF.</p>`)}
  ${topic('Body and type perks',`${list([
   'Few or no arms hurts throwing and pitching.',
   'Heavy Pokémon hit for power but lose infield range.',
   'Fliers cover more outfield.'])}<p>Types give small boosts that are already in the ratings:</p><div class="guide-perks">${Object.entries(PERKS).map(([type,benefit])=>`<div style="--perk-color:${TYPE_COLORS[type]}"><b>${cap(type)}</b><span>${benefit}</span></div>`).join("")}</div>`)}
  </div>`;
 };
})();
