// Spin mode odds with no caps, matching Packs: every roll is independent.
// - every full spin has a 1.5% chance to be a Legend spin, as many times as luck allows in a run
// - a pool's shiny roll repeats after a hit, so a pool can hold more than one shiny (very rarely)
// These replace nextSpin and poolSpin from core.js, which capped legends at one per run and shinies at one per pool.
poolSpin=function(run,filter){
  const opts=POOLS.filter(p=>!run.used.includes(p.key)&&(!filter||filter(p)));
  if(!opts.length)return null;
  const p=opts[Math.floor(rand(run)*opts.length)];run.used.push(p.key);
  const ids=p.ids.slice();let shinies=0;
  while(shinies<ids.length&&rand(run)<SHINY_ODDS){const free=ids.map((id,i)=>id<SHINY_ID?i:-1).filter(i=>i>=0);ids[free[Math.floor(rand(run)*free.length)]]+=SHINY_ID;shinies++}
  return{legend:false,shiny:shinies>0,shinies,key:p.key,type:p.type,gen:p.gen,gens:p.gens,ids:shinies?ids:p.ids};
};
nextSpin=function(run){
  if(rand(run)<LEGEND_ODDS){
    const ids=LEGENDS.map(m=>m.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(rand(run)*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
    return{legend:true,ids:ids.slice(0,10).sort((a,b)=>a-b)};
  }
  return poolSpin(run)||poolSpin({...run,used:[]});
};
// Count multiple shinies in a spin pool's note.
{const base=render;render=function(){base();
  const sp=run&&run.spin;if(!sp||sp.pack||!(sp.shinies>1))return;
  const n=[...document.querySelectorAll("#draft .shinynote")].find(x=>!x.classList.contains("legnote"));
  if(n)n.innerHTML=`<b>✨ ${sp.shinies} shinies appeared!</b> Shinies have every stat boosted.`}}
