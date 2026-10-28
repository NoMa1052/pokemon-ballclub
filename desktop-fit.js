/* Desktop: size the game to the visible window so nothing is cut off and nothing is oddly small.
   Sets --avail (height left under the header) and --fit (scale for the card row) on <html>. */
(() => {
 const root=document.documentElement;let home=null;
 function fit(){
  const g=document.querySelector('.grid');
  const top0=document.querySelector('header.top'),set=document.getElementById('settings');
  if(innerWidth<1000||!g||!g.offsetParent){root.classList.remove('desk-fit');
   // Put the settings row back under the header on narrow screens.
   if(set&&set.parentElement===top0&&home)home.parentElement.insertBefore(set,home.nextSibling);return}
  root.classList.add('desk-fit');
  // One-row header on desktop: logo, then mode/size/records, then help.
  if(set&&top0&&set.parentElement!==top0){home=set.previousElementSibling;top0.insertBefore(set,document.getElementById('howBtn'))}
  const top=g.getBoundingClientRect().top+scrollY,avail=Math.max(460,innerHeight-top-14);
  root.style.setProperty('--avail',avail+'px');
  // The pack panel needs ~260px for its header, candy row and controls; the card row gets the rest.
  root.style.setProperty('--fit',Math.max(.62,Math.min(1,(avail-250)/470)).toFixed(3));
 }
 const prev=render;render=function(){const v=prev.apply(this,arguments);fit();
  // Everything fits on screen, so keep the header in view instead of auto-scrolling to the field.
  if(root.classList.contains('desk-fit')&&document.body.classList.contains('field-deciding'))setTimeout(()=>{scrollTo({top:0});
   // Keep the picked card fully in view in the card row.
   const row=document.querySelector('#draft .cardrow'),c=row?.querySelector('.pcard[aria-pressed="true"]');
   if(row&&c)row.scrollLeft=Math.max(0,c.offsetLeft-row.offsetLeft-(row.clientWidth-c.offsetWidth)/2)},80);
  return v};
 // The landing bounce should play once. It used to replay on every re-render (for example tapping a card),
 // which looked like the last-placed player shaking.
 const prev2=render;let justTimer=0;render=function(){const v=prev2.apply(this,arguments);if(run?.just){clearTimeout(justTimer);const s=run.just;justTimer=setTimeout(()=>{if(run.just===s)run.just=null},900)}return v};
 // Card row on desktop: clicking a card that isn't centered slides it to the center first
 // (like swiping on a phone). Clicking the centered card picks it.
 document.addEventListener('click',e=>{
  if(!root.classList.contains('desk-fit'))return;
  const c=e.target.closest?.('#draft .cardrow .pcard');if(!c)return;
  const row=c.closest('.cardrow'),rr=row.getBoundingClientRect(),cr=c.getBoundingClientRect();
  if(Math.abs((cr.left+cr.width/2)-(rr.left+rr.width/2))<cr.width*.3)return;
  e.preventDefault();e.stopImmediatePropagation();
  const z=parseFloat(getComputedStyle(row).zoom)||1;
  row.scrollBy({left:((cr.left+cr.width/2)-(rr.left+rr.width/2))/z,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 },true);
 addEventListener('resize',fit);document.fonts?.ready.then(fit);fit();
})();
