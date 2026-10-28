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
  if(root.classList.contains('desk-fit')&&document.body.classList.contains('field-deciding'))setTimeout(()=>scrollTo({top:0}),60);
  return v};
 addEventListener('resize',fit);document.fonts?.ready.then(fit);fit();
})();
