/* Once-per-run items. Artwork is the item sprite returned by PokéAPI. */
const ITEM_ART={"master-ball":"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png","rare-candy":"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png"};
for(const name of Object.keys(ITEM_ART))fetch('https://pokeapi.co/api/v2/item/'+name+'/').then(r=>r.ok?r.json():null).then(item=>{if(item?.sprites?.default){ITEM_ART[name]=item.sprites.default;document.documentElement.style.setProperty('--'+name+'-art',`url("${item.sprites.default}")`)}}).catch(()=>{});
function candyOptions(){
 if(!run||run.hand||run.locked||run.result||spinning||!run.candies)return [];
 return Object.entries(run.slots).flatMap(([slot,owned])=>{
  const children=Object.entries(EVOLUTION_PARENT).filter(([n,parent])=>parent===owned.num&&BYID.get(+n)).map(([n])=>+n);
  const forms=children.length?children:[owned.num];
  return forms.map(num=>{const evolve=num!==owned.num,steps=Math.min(2,(owned.evolutionSteps||0)+(evolve?1:0)),bonus=Math.min(10,(owned.friendship||0)+(evolve?((owned.evolutionSteps||0)?3:5):5)),next=developedCard(num+(owned.shiny?SHINY_ID:0),bonus,steps);return {slot,owned,next,evolve}}).filter(o=>o.next.id!==owned.id);
 });
}
function candyGroups(options){
 const gain=o=>posOvr(o.next,o.slot)-posOvr(o.owned,o.slot);
 return [{title:'Evolutions',evolve:true},{title:'Boosts',evolve:false}].map(group=>({...group,options:options.map((o,index)=>({...o,index})).filter(o=>o.evolve===group.evolve).sort((a,b)=>gain(b)-gain(a)||posOvr(b.next,b.slot)-posOvr(a.next,a.slot)||a.owned.name.localeCompare(b.owned.name))})).filter(group=>group.options.length);
}
function applyCandy(slot,nextId){
 const o=candyOptions().find(o=>o.slot===slot&&o.next.id===nextId);if(!o)return false;
 const snapshot=handSnapshot(),before=teamOvr();run.slots[slot]=o.next;run.picks=run.picks.map(id=>id===o.owned.id?o.next.id:id);run.candies=0;run.handUndo=snapshot;
 run.handFeedback={name:o.next.name,old:posOvr(o.owned,slot),rating:posOvr(o.next,slot),before,after:teamOvr(),development:o.evolve?'evolve':'train'};
 sortStaff();saveRun();return true;
}
(() => {
 const close=()=>document.getElementById('candyChoice')?.remove();
 function showCandy(targetSlot=null,targetNum=null,afterUse=null){
  const options=candyOptions().filter(o=>targetSlot===null||(o.slot===targetSlot&&o.evolve&&o.next.num===targetNum));if(!options.length)return;close();document.getElementById("handToast")?.remove();const el=document.createElement('div');el.className='sheet growth-sheet candy-sheet';el.id='candyChoice';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','candyTitle');
  // Tiles sorted by biggest gain; teammates already at 99 are listed once at the bottom instead of as 0-gain options.
  const gainOf=o=>posOvr(o.next,o.slot)-posOvr(o.owned,o.slot);
  const useful=options.map((o,index)=>({...o,index})).filter(o=>gainOf(o)>0).sort((a,b)=>gainOf(b)-gainOf(a)||posOvr(b.next,b.slot)-posOvr(a.next,a.slot));
  const maxed=[...new Set(options.filter(o=>gainOf(o)<=0).map(o=>o.owned.name))];
  const spr=m=>`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="" loading="lazy">`;
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><div class="candy-heading"><img src="${ITEM_ART['rare-candy']}" alt="Rare Candy"><h2 id="candyTitle">Rare Candy</h2></div><button class="btn" id="candyClose">Back</button></div><div class="sheet-body"><p class="candy-lede"><b>1 Rare Candy.</b> Evolve or boost one teammate. It doesn't use a pack pick.</p>${useful.length?`<div class="candy-rows">${useful.map(o=>{const before=posOvr(o.owned,o.slot),after=posOvr(o.next,o.slot);return `<button class="candy-row" data-candy="${o.index}" aria-label="${o.evolve?`Evolve ${esc(o.owned.name)} into ${esc(o.next.name)}`:`Boost ${esc(o.owned.name)}`} at ${lbl(o.slot)}, ${before} to ${after}">${spr(o.next)}<span class="cr-name"><b>${esc(o.owned.name)}${o.evolve?` <i aria-hidden="true">→</i> ${esc(o.next.name)}`:''}</b><small><em class="${o.evolve?'evo':'boost'}">${o.evolve?'Evolve':'Boost'}</em>${lbl(o.slot)}</small></span><span class="cr-gain"><b>+${after-before}</b><small>${before} → ${after}</small></span></button>`}).join('')}</div>`:'<p class="growth-cost">No teammate can gain from a Rare Candy right now.</p>'}${maxed.length?`<p class="candy-maxed">${maxed.map(esc).join(', ')} ${maxed.length===1?'is':'are'} already at 99.</p>`:''}</div></div>`;
  document.body.append(el);el.querySelector('#candyClose').onclick=close;
  el.querySelectorAll('[data-candy]').forEach(b=>b.onclick=()=>{const o=options[+b.dataset.candy];const sp=m=>`<img src="${SPRITE_URL(m.num,m.shiny)}" alt="">`,bf=posOvr(o.owned,o.slot),af=posOvr(o.next,o.slot);el.querySelector('.sheet-body').innerHTML=`<div class="candy-confirm"><div class="cc-sprites">${o.evolve?`<span class="cc-from">${sp(o.owned)}</span><i aria-hidden="true">›</i>`:''}<span class="cc-to">${sp(o.next)}</span></div><b>${esc(o.owned.name)}${o.evolve?' → '+esc(o.next.name):''}</b><small>${o.evolve?'Evolve':'Friendship boost'} · stays at ${lbl(o.slot)}</small><div class="cc-score"><span>${bf}</span><i aria-hidden="true">→</i><strong>${af}</strong><em>+${af-bf}</em></div></div><p class="growth-cost">Uses your one Rare Candy. Your pack stays available.</p><button class="btn primary growth-apply" id="useCandy">${o.evolve?'Evolve':'Boost'} ${esc(o.owned.name)}</button><p class="growth-footer">Undo is available until your next pack or roster action.</p>`;el.querySelector('#candyClose').onclick=()=>showCandy(targetSlot,targetNum,afterUse);el.querySelector('#useCandy').onclick=()=>{if(applyCandy(o.slot,o.next.id)){close();render();if(typeof afterUse==='function')afterUse()}};});
  el.querySelector('#candyClose').focus();el.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const buttons=[...el.querySelectorAll('button')].filter(b=>b.getClientRects().length),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 }
 window.pbcOpenRareCandyChain=(slot,num,after)=>{if(!candyOptions().some(o=>o.slot===slot&&o.evolve&&o.next.num===num))return false;showCandy(slot,num,after);return true;};
 const cancel=handCancel;handCancel=function(){const result=cancel();run.masterQueue=[];if(!run.second)run.doubleArmed=false;saveRun();return result};
 const base=render;render=function(){base();if(run.candies==null){run.candies=1;saveRun()}
  document.getElementById('itemTools')?.remove();
  // Rare Candy lives in the draft panel and only appears when it can be used right now.
  const draft=document.getElementById('draft'),count=candyOptions().length;
  if(!run.locked&&!run.result&&!run.hand&&count&&draft&&!draft.hidden){
   const tools=document.createElement('div');tools.id='itemTools';tools.className='item-row';
   tools.innerHTML=`<button class="candy-control" type="button"><img src="${ITEM_ART['rare-candy']}" alt=""><span><b>Rare Candy</b><small>Evolve or boost a teammate</small></span><em>1 left</em></button>`;
   const anchor=draft.querySelector('#newRun');if(anchor)anchor.before(tools);else draft.append(tools);
   tools.querySelector('button').onclick=()=>showCandy();}
  const master=document.getElementById('doubleBtn');if(master)master.onclick=()=>{if(!run.doubles||run.second)return;run.doubleArmed=true;saveRun();openReveal(run.spin,true)};
 };render();
})();
