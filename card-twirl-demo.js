/* Isolated animation preview: uses the production reveal and actual card data. */
(()=>{
 const legend=LEGENDS.find(m=>m.num===150)||LEGENDS[0];
 const shiny=BYID.get(6+SHINY_ID);
 const ordinary=BYID.get(25);
 if(!legend||!shiny||!ordinary)throw Error('Demo cards unavailable');
 const style=document.createElement('style');
 style.textContent='body>.wrap,body>.tabbar{visibility:hidden!important}#intro,.home-gate,.first-visit{display:none!important}.reveal .rv-top{z-index:3}.reveal .rv-close,.reveal .rv-btn{font-size:13px!important}.reveal .rv-count{font-size:15px}';
 document.head.append(style);
 document.getElementById('intro')?.remove();
 document.documentElement.classList.remove('intro-on','intro-hide');
 // These are preview-only cards: no draw, save, pick, or public post occurs.
 const start=(shinyFirst=false)=>{
  const ids=shinyFirst?[shiny.id,legend.id,ordinary.id]:[legend.id,shiny.id,ordinary.id];
  openReveal({pack:true,ids,usedIds:[]});
  const el=document.querySelector('.reveal');
  const replay=el?.querySelector('#rvClose'),toggle=el?.querySelector('#rvSkip');
  if(replay){replay.textContent='Replay legendary';replay.dataset.demo='legend'}
  if(toggle){toggle.textContent='Replay shiny';toggle.dataset.demo='shiny'}
 };
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-demo],.rv-mini,#rvList,#rvRerip,#rvTake2,#masterConfirm');
  if(!target||!target.closest('.reveal'))return;
  e.preventDefault();e.stopImmediatePropagation();
  start(target.dataset.demo==='shiny');
 },true);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();start()}
 },true);
 start(new URLSearchParams(location.search).get('card')==='shiny');
})();
