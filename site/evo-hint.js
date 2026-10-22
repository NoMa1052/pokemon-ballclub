/* Draft cards show what a Pokémon can grow into: the final evolution's real rating,
   including the friendship boost evolving gives (+5 first evolution, +8 after two). */
(() => {
 const best=m=>Math.max(...STD.map(s=>posOvr(m,s)));
 const kids=n=>Object.entries(EVOLUTION_PARENT).filter(([c,p])=>p===n&&BYID.get(+c)).map(([c])=>+c);
 // Follow the strongest branch to the last form, applying the same boosts Rare Candy and pack evolutions use.
 function evolved(m){
  let num=m.num,f=m.friendship||0,steps=m.evolutionSteps||0,out=null;
  while(steps<2){const k=kids(num);if(!k.length)break;
   f=Math.min(10,f+(steps?3:5));steps++;
   const shiny=m.shiny?SHINY_ID:0;
   out=k.map(c=>developedCard(c+shiny,f,steps)).filter(Boolean).sort((a,b)=>best(b)-best(a))[0];
   if(!out)break;num=out.num}
  return out;
 }
 window.pbcEvolvedForm=evolved;
 const base=tcardHTML;
 tcardHTML=function(m,mini){
  const html=base(m,mini);
  // Evolving is possible in Packs, or anywhere while a Rare Candy is unused.
  if(mini||!m||!(run?.mode==='pack'||run?.candies))return html;
  const e=evolved(m);if(!e)return html;
  const r=best(e);if(r<=best(m))return html;
  const pill=`<span class="tc-evo-pill" title="Evolves into ${esc(e.name)}, rated ${r}" aria-label="Evolves into ${esc(e.name)}, rated ${r}"><img src="${SPRITE_URL(e.num,e.shiny)}" alt=""><i aria-hidden="true">▲</i>${r}</span>`;
  return html.replace(/(<div class="tc-art">[\s\S]*?)(<\/div>)/,`$1${pill}$2`);
 };
 if(typeof render==='function')render();
})();
