/* First visit: no How to play wall. A single quiet line under the header links to it,
   and goes away once the player makes a pick or opens the guide. */
(() => {
 const KEY='pbc2-newhint-done';
 const done=()=>{try{store.set(KEY,'1')}catch(e){}document.getElementById('newHint')?.remove()};
 function place(){
  let seen=false;try{seen=!!store.get(KEY)||!!store.get('pbc2-seenhow')}catch(e){}
  const el=document.getElementById('newHint');
  if(seen||!run||run.picks.length>0||run.result){if(run?.picks.length>0)done();else el?.remove();return}
  if(el)return;
  const p=document.createElement('p');p.id='newHint';p.className='new-hint';
  p.innerHTML='New here? <button type="button">How to play ›</button>';
  p.querySelector('button').onclick=()=>{done();openHow()};
  const anchor=document.querySelector('.top+.stitchline,.brand-stitch')||document.querySelector('header.top');
  anchor.after(p);
 }
 const prev=render;render=function(){prev();place()};
 const prevOpen=openHow;openHow=function(){done();prevOpen()};
 document.getElementById('howBtn').onclick=openHow;
 place();
})();
