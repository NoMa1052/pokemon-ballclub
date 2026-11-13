/* v5 phase 2: while placing a pack pick on a phone, the pack's cards stay in a tray at the bottom,
   so the field and the choices are on one screen and switching cards is one tap. */
(() => {
 const $=id=>document.getElementById(id);
 function tray(){
  let el=$('pickTray');
  const sp=run?.spin,on=innerWidth<1000&&!run.result&&!run.locked&&run.hand?.kind==='draft'&&sp?.ids&&document.body.classList.contains('field-deciding');
  document.body.classList.toggle('tray-on',!!on);
  if(!on){el?.remove();return}
  const open=slotList().filter(s=>!run.slots[s]),taken=takenNums();
  const cards=sp.ids.map(id=>BYID.get(id)).filter(m=>m&&!sp.usedIds?.includes(m.id)&&(!taken.includes(m.num)||m.id===run.hand.held));
  if(cards.length<2){el?.remove();document.body.classList.remove('tray-on');return}
  if(!el){el=document.createElement('div');el.id='pickTray';el.className='pick-tray';el.setAttribute('role','group');el.setAttribute('aria-label','Cards in this pack');document.body.appendChild(el)}
  el.innerHTML=cards.map(m=>{
   const best=open.reduce((a,s)=>!a||posOvr(m,s)>posOvr(m,a)?s:a,null),held=m.id===run.hand.held;
   return `<button type="button" data-id="${m.id}" aria-pressed="${held}">${tok(m)}<b>${esc(m.name.replace(/^Shiny /,''))}</b><em>${best?posOvr(m,best):''}<small>${best?lbl(best):''}</small></em></button>`}).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
   if(handSwitch(+b.dataset.id))render();
  });
 }
 const prev=render;render=function(){const v=prev.apply(this,arguments);tray();return v};
 addEventListener('resize',tray);tray();
})();
