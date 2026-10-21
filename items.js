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
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><div class="candy-heading"><img src="${ITEM_ART['rare-candy']}" alt="Rare Candy"><h2 id="candyTitle">Rare Candy</h2></div><button class="btn" id="candyClose">Back</button></div><div class="sheet-body"><p class="growth-cost candy-intro">Evolve a teammate or boost a fully evolved Pokémon.<span>1 use · No pack pick needed</span></p>${candyGroups(options).map(group=>`<section class="candy-group"><h3>${group.title}</h3>${group.options.map(o=>{const before=posOvr(o.owned,o.slot),after=posOvr(o.next,o.slot),gain=after-before;return `<button class="candy-option" data-candy="${o.index}">${tok(o.next)}<span><b>${esc(o.owned.name)}${o.evolve?' → '+esc(o.next.name):''}</b><small>${lbl(o.slot)} · ${o.evolve?'Evolve + friendship':'Friendship boost'}</small></span><strong class="${gain>0?'gain':gain<0?'loss':'neutral'}">${before} → ${after}<small>${gain>0?'+':''}${gain} at ${lbl(o.slot)}</small></strong></button>`}).join('')}</section>`).join('')}<p class="growth-footer">Tap a teammate to review before using your candy.</p></div></div>`;
  document.body.append(el);el.querySelector('#candyClose').onclick=close;
  el.querySelectorAll('[data-candy]').forEach(b=>b.onclick=()=>{const o=options[+b.dataset.candy];el.querySelector('.sheet-body').innerHTML=`<div class="growth-line">${tok(o.next)}<span><small>RARE CANDY</small><b>${esc(o.owned.name)}${o.evolve?' → '+esc(o.next.name):''}</b><span>Stays at ${lbl(o.slot)}</span></span></div><div class="growth-upgrade"><div><small>${lbl(o.slot)} RATING</small><div class="growth-score"><span>${posOvr(o.owned,o.slot)}</span><i>→</i><strong>${posOvr(o.next,o.slot)}</strong></div></div></div><p class="growth-cost">Uses your one Rare Candy. Your pack stays available.</p><button class="btn primary growth-apply" id="useCandy">${o.evolve?'Evolve':'Boost'} ${esc(o.owned.name)}</button><p class="growth-footer">Undo is available until your next pack or roster action.</p>`;el.querySelector('#candyClose').onclick=()=>showCandy(targetSlot,targetNum,afterUse);el.querySelector('#useCandy').onclick=()=>{if(applyCandy(o.slot,o.next.id)){close();render();if(typeof afterUse==='function')afterUse()}};});
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
