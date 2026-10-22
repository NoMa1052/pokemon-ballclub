/* Ballclub native team sharing and reliable 1080x1350 roster export. */
(function(){
'use strict';
const CW=1080,CH=1350,GAME_URL='https://pokemon-ballclub.vercel.app/';
let modal=null,objectUrl=null,focusBefore=null;
const navy='#10254a',ink='#152b46',cream='#f4e9d4',gold='#e6c685',red='#b63e45';
function snapshot(){
 if(!run||!run.slots||!slotList().some(s=>run.slots[s]))throw Error('Complete your roster before sharing.');
 const players=slotList().filter(s=>run.slots[s]).map(s=>{const m=run.slots[s];return {slot:s,num:m.num||m.id,shiny:!!m.shiny,name:m.name,rating:posOvr(m,s)}});
 const res=run.result,win=Number(res?.wins);
 return {players,ovr:teamOvr(),mode:isPack()?'Packs':'Spin',size:run.size,team:run.submitted?.team||'My Ballclub',record:res&&Number.isFinite(win)?String(win)+'–'+String(162-win):null,wins:win,champ:!!res?.post?.champ};
}
function text(s){return s.record?'Built a '+s.ovr+' OVR Pokémon Ballclub. Went '+s.record+(s.champ?' and won the World Series.':'.')+'\nThink you can beat it?\n'+GAME_URL:'Built a '+s.ovr+' OVR Pokémon Ballclub in '+s.mode+' mode.\nThink you can build a better team?\n'+GAME_URL;}
function paint(ctx,str,px,py,sz,fill,align,max){ctx.textAlign=align||'left';ctx.textBaseline='middle';ctx.fillStyle=fill;let size=sz;ctx.font='700 '+size+'px "Barlow",Arial,sans-serif';while(max&&ctx.measureText(String(str)).width>max&&size>16){ctx.font='700 '+(--size)+'px "Barlow",Arial,sans-serif'}ctx.fillText(String(str),px,py)}
function rect(ctx,x,y,w,h,fill,r=0){ctx.fillStyle=fill;if(r&&ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}else ctx.fillRect(x,y,w,h)}
function image(url){return new Promise(resolve=>{const img=new Image();let done=false;const end=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok?img:null)};const timer=setTimeout(()=>end(false),6000);img.crossOrigin='anonymous';img.onload=()=>end(true);img.onerror=()=>end(false);img.src=url})}
async function renderCanvas(s){
 // Fallback field-view poster drawn by hand: the record and the challenge on top, the team on the diamond, staff underneath.
 try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])}catch(_){}
 const logoSrc=document.querySelector('.mark.logo img')?.currentSrc||'logo.webp';
 const sprite=p=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+(p.shiny?'shiny/':'')+p.num+'.png';
 const images=await Promise.all([image(logoSrc).then(i=>i||image('logo.webp')),...s.players.map(p=>image(sprite(p)))]);const logo=images[0],imgOf=p=>images[s.players.indexOf(p)+1];
 const canvas=document.createElement('canvas');canvas.width=CW;canvas.height=CH;const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
 const font=(w,sz,fam)=>w+' '+sz+'px '+fam,DISPLAY='"Graduate",Georgia,serif',DATA='"Oswald","Arial Narrow",Arial,sans-serif',BODY='"Barlow",Arial,sans-serif';
 const txt=(str,x,y,f,fill,align='center',max)=>{c.font=f;c.textAlign=align;c.textBaseline='middle';c.fillStyle=fill;let t=String(str);if(max)while(c.measureText(t).width>max&&t.length>3)t=t.slice(0,-2)+'…';c.fillText(t,x,y);return c.measureText(t).width};
 // Background matches the game
 const bg=c.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#10254a');bg.addColorStop(1,'#0b1b33');c.fillStyle=bg;c.fillRect(0,0,CW,CH);
 // Header: logo, record, outcome, team line
 if(logo){const h=118,w=logo.width*h/logo.height;c.drawImage(logo,(CW-w)/2,34,w,h)}
 const gold='#ffcb05';
 if(s.record){txt(s.record,CW/2,222,font(400,104,DISPLAY),s.champ?gold:cream)}
 else txt('Draft complete',CW/2,222,font(400,64,DISPLAY),cream);
 const outcome=s.champ?'WORLD SERIES CHAMPIONS':s.record?'FINAL RECORD':'READY FOR THE SEASON';
 txt(outcome+'  ·  '+s.ovr+' OVR',CW/2,292,font(600,30,DATA),s.champ?'#ffe08a':cream);
 txt(s.team+'  ·  '+s.mode+'  ·  '+(s.size===11?'Quick':'Standard'),CW/2,334,font(500,24,BODY),'#9fb0c6','center',900);
 // Field
 const F={x:40,y:372,w:1000,h:700},hx=F.x+F.w/2,hy=F.y+F.h*.95,R=F.h*.9,d=F.h*.2;
 c.save();c.beginPath();c.roundRect?c.roundRect(F.x,F.y,F.w,F.h,22):c.rect(F.x,F.y,F.w,F.h);c.clip();
 c.fillStyle='#0a1830';c.fillRect(F.x,F.y,F.w,F.h);
 const fan=(r)=>{c.beginPath();c.moveTo(hx,hy);c.arc(hx,hy,r,-Math.PI*.75,-Math.PI*.25);c.closePath()};
 fan(R+18);c.fillStyle='#b8693f';c.fill(); // warning track
 fan(R);c.fillStyle='#2c7341';c.fill();
 c.save();fan(R);c.clip();c.fillStyle='rgba(255,255,255,.05)';for(let i=-12;i<12;i+=2){c.beginPath();c.moveTo(hx+i*60,F.y);c.lineTo(hx+i*60+60,F.y);c.lineTo(hx+i*60+60-700,F.y+700);c.lineTo(hx+i*60-700,F.y+700);c.fill()}
 c.beginPath();c.arc(hx,hy-d*1.15,d*1.55,0,Math.PI*2);c.fillStyle='#b98159';c.fill();c.restore();
 c.beginPath();c.moveTo(hx,hy);c.lineTo(hx+d,hy-d);c.lineTo(hx,hy-2*d);c.lineTo(hx-d,hy-d);c.closePath();c.fillStyle='#2e7d4f';c.fill();
 c.strokeStyle='rgba(244,238,220,.85)';c.lineWidth=4;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx-R*Math.SQRT1_2,hy-R*Math.SQRT1_2);c.moveTo(hx,hy);c.lineTo(hx+R*Math.SQRT1_2,hy-R*Math.SQRT1_2);c.stroke();
 [[hx+d,hy-d],[hx,hy-2*d],[hx-d,hy-d]].forEach(([x,y])=>{c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle=cream;c.fillRect(-9,-9,18,18);c.restore()});
 c.restore();
 // Player token: sprite in a ring, rating badge, name plate
 const token=(p,x,y,r,label)=>{
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle='#f4eedc';c.fill();c.lineWidth=5;c.strokeStyle='#0b1b33';c.stroke();
  const im=imgOf(p);if(im){c.imageSmoothingEnabled=false;const z=r*2.3;c.drawImage(im,x-z/2,y-z/2-r*.08,z,z);c.imageSmoothingEnabled=true}
  else txt(p.name[0],x,y,font(700,r,DATA),'#0b1b33');
  const hi=p.rating>=95,bw=r*1.05,bh=r*.62;c.fillStyle=hi?gold:'#0b1b33';c.beginPath();c.roundRect?c.roundRect(x+r*.35,y+r*.42,bw,bh,bh/2):c.rect(x+r*.35,y+r*.42,bw,bh);c.fill();
  txt(p.rating,x+r*.35+bw/2,y+r*.42+bh/2+1,font(700,r*.48,DATA),hi?'#0b1b33':cream);
  if(label){c.font=font(600,r*.36,DATA);const lw=c.measureText(label).width+14;c.fillStyle='#0b1b33';c.beginPath();c.roundRect?c.roundRect(x-r*1.02,y-r*1.08,lw,r*.52,6):c.rect(x-r*1.02,y-r*1.08,lw,r*.52);c.fill();txt(label,x-r*1.02+lw/2,y-r*1.08+r*.26+1,font(600,r*.36,DATA),cream)}
  c.font=font(600,r*.42,BODY);const nm=p.name.length>11?p.name.slice(0,10)+'…':p.name,nw=c.measureText(nm).width+20;
  c.fillStyle='rgba(11,27,51,.92)';c.beginPath();c.roundRect?c.roundRect(x-nw/2,y+r+8,nw,r*.62,8):c.rect(x-nw/2,y+r+8,nw,r*.62);c.fill();
  txt(nm,x,y+r+8+r*.31+1,font(600,r*.42,BODY),cream);
 };
 const onField=s.players.filter(p=>POS_XY[p.slot]||p.slot==='SP1');
 onField.forEach(p=>{const xy=POS_XY[p.slot]||[50,68];token(p,F.x+F.w*xy[0]/100,F.y+F.h*xy[1]/100,46,p.slot==='SP1'?'SP':p.slot)});
 // Staff row
 const staff=s.players.filter(p=>!onField.includes(p));
 if(staff.length){
  const gap=Math.min(160,(CW-120)/staff.length),x0=CW/2-gap*(staff.length-1)/2;
  staff.forEach((p,i)=>token(p,x0+i*gap,1150,36,p.slot==='RP1'?'CL':p.slot==='RP2'?'SU':p.slot))}
 // Footer: the challenge and where to play
 c.fillStyle='#d63a26';for(let x=0;x<CW;x+=40)c.fillRect(x,CH-112,28,5);
 txt(s.record?'Think you can beat it?':'Think you can build a better team?',CW/2,CH-72,font(400,36,DISPLAY),cream);
 txt('pokemon-ballclub.vercel.app',CW/2,CH-32,font(600,26,DATA),gold);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/png'));
 return {blob,url:globalThis.URL.createObjectURL(blob),name:'pokemon-ballclub-'+(s.record?s.wins+'-wins':'roster')+'.png'};
}

// Main poster: photographs the real field and pitching staff exactly as they sit in the app,
// then frames them with the record on top and the challenge underneath.
async function render(s){
 const field=document.getElementById('postseasonField')||document.getElementById('field'),pen=document.getElementById('postseasonPen')||document.getElementById('pen');
 if(!field||!pen)return renderCanvas(s);
 try{
  if(!window.html2canvas)await new Promise((ok,no)=>{const t=document.createElement('script');t.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';t.onload=ok;t.onerror=no;document.head.append(t)});
  try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])}catch(_){}
  const shot=el=>html2canvas(el,{backgroundColor:null,scale:3,useCORS:true,logging:false,scrollX:-scrollX,scrollY:-scrollY,onclone:doc=>{const st=doc.createElement('style');st.textContent='*,*::before,*::after{animation:none!important;transition:none!important}.tag.just::before,.tag.just::after{display:none!important}';doc.head.append(st);doc.querySelectorAll('.tag.just').forEach(e=>e.classList.remove('just'));doc.querySelectorAll('.tag .nm').forEach(n=>{let t=n.textContent;while(n.scrollWidth>n.clientWidth+1&&t.length>3){t=t.slice(0,-1);n.textContent=t+'…'}})}});
  // Safari reuses the sprites it already loaded, which aren't cleared for export ("The operation is insecure").
  // Swap each outside image for a fresh, export-safe local copy while we capture, then put it back.
  const swaps=[];
  await Promise.all([...field.querySelectorAll('img'),...pen.querySelectorAll('img')].map(async i=>{
   const u=i.currentSrc||i.src;if(!/^https?:/.test(u)||u.startsWith(location.origin))return;
   try{const r=await fetch(u+(u.includes('?')?'&':'?')+'share=1',{mode:'cors',cache:'no-store'});if(!r.ok)return;
    const local=URL.createObjectURL(await r.blob());swaps.push([i,i.getAttribute('src'),i.getAttribute('srcset'),local]);
    i.removeAttribute('srcset');await new Promise(res=>{i.onload=i.onerror=res;i.src=local})}catch(_){}
  }));
  let fc,pc;
  try{fc=await shot(field);pc=await shot(pen)}
  finally{swaps.forEach(([i,src,set,local])=>{i.onload=i.onerror=null;if(set)i.setAttribute('srcset',set);i.setAttribute('src',src);URL.revokeObjectURL(local)})}
  const logo=await image(document.querySelector('.mark.logo img')?.currentSrc||'logo.webp');
  const W=1080,M=36,IW=W-2*M,fh=Math.round(fc.height*IW/fc.width),ph=Math.round(pc.height*IW/pc.width);
  const HEAD=318,GAP=22,FOOT=128,H=HEAD+fh+GAP+ph+FOOT;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10254a');g.addColorStop(1,'#0b1b33');c.fillStyle=g;c.fillRect(0,0,W,H);
  const txt=(t,x,y,f,fill)=>{c.font=f;c.textAlign='center';c.textBaseline='middle';c.fillStyle=fill;c.fillText(t,x,y)};
  if(logo){const lh=104,lw=logo.width*lh/logo.height;c.drawImage(logo,(W-lw)/2,26,lw,lh)}
  txt(s.record||'Draft complete',W/2,190,'400 '+(s.record?96:60)+'px "Graduate",Georgia,serif',s.champ?'#ffcb05':'#f4eedc');
  const outcome=(s.champ?'WORLD SERIES CHAMPIONS':s.record?'FINAL RECORD':'READY FOR THE SEASON')+'  ·  '+s.ovr+' OVR';
  if('letterSpacing' in c)c.letterSpacing='2px';
  txt(outcome,W/2,256,'600 30px "Oswald","Arial Narrow",sans-serif',s.champ?'#ffe08a':'#f4eedc');
  if('letterSpacing' in c)c.letterSpacing='0px';
  txt(s.team+'  ·  '+s.mode+'  ·  '+(s.size===11?'Quick':'Standard'),W/2,294,'500 24px "Barlow",Arial,sans-serif','#9fb0c6');
  c.drawImage(fc,M,HEAD,IW,fh);c.drawImage(pc,M,HEAD+fh+GAP,IW,ph);
  const fy=H-FOOT;c.fillStyle='#d63a26';for(let x=M;x<W-M;x+=26)c.fillRect(x,fy+18,16,4);
  if('letterSpacing' in c)c.letterSpacing='3px';
  txt(s.record?'THINK YOU CAN BEAT IT?':'THINK YOU CAN BUILD A BETTER TEAM?',W/2,fy+62,'600 38px "Oswald","Arial Narrow",sans-serif','#f4eedc');
  if('letterSpacing' in c)c.letterSpacing='0px';
  txt('pokemon-ballclub.vercel.app',W/2,fy+104,'600 28px "Barlow",Arial,sans-serif','#ffcb05');
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/png'));
  return {blob,url:globalThis.URL.createObjectURL(blob),name:'pokemon-ballclub-'+(s.record?s.wins+'-wins':'roster')+'.png'};
 }catch(e){window.PBCShareError=String(e&&e.message||e);const out=await renderCanvas(s);out.fallback=true;return out}
}
function canShare(file){try{return !!navigator.share&&!!navigator.canShare&&navigator.canShare({files:[file]})}catch(_){return false}}
function setStatus(s){const el=document.getElementById('pb-share-status');if(el)el.textContent=s}
function close(){if(!modal)return;modal.remove();modal=null;document.body.classList.remove('pb-share-open');if(objectUrl){globalThis.URL.revokeObjectURL(objectUrl);objectUrl=null}if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true})}
async function open(){
 if(modal)return;let snap;try{snap=snapshot()}catch(e){alert(e.message);return}
 focusBefore=document.activeElement;
 const overlay=document.createElement('div');overlay.id='pb-share';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Share your team');
 overlay.innerHTML='<div class="pb-share-dialog"><div class="pb-share-head"><div><small>POKÉMON BALLCLUB</small><h2>Share your team</h2></div><button id="pb-share-close" aria-label="Close">✕</button></div><div class="pb-share-preview"><span id="pb-share-spinner">Preparing your team image…</span><img id="pb-share-img" alt="Team roster poster" hidden></div><p class="pb-share-caption">Full roster, Pokémon ratings, team OVR'+(snap.record?' and '+snap.record+' record':'')+'</p><div class="pb-share-buttons"><button id="pb-share-send" class="pb-share-primary" disabled>Share Team</button><button id="pb-share-save" disabled>Save Image</button><button id="pb-share-copy">Copy Text</button></div><p id="pb-share-status" aria-live="polite">Generating your team PNG…</p><a id="pb-share-full" hidden target="_blank" rel="noopener">Open full-size image</a></div>';
 document.body.appendChild(overlay);modal=overlay;document.body.classList.add('pb-share-open');
 overlay.querySelector('#pb-share-close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelector('#pb-share-copy').onclick=async()=>{try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text(snap));else{const ta=document.createElement('textarea');ta.value=text(snap);document.body.append(ta);ta.select();if(!document.execCommand('copy'))throw Error('Clipboard unavailable');ta.remove()}setStatus('Message copied.')}catch(e){prompt('Copy your share message:',text(snap))}};
 overlay.querySelector('#pb-share-close').focus({preventScroll:true});
 try{
  const out=await render(snap);if(modal!==overlay){globalThis.URL.revokeObjectURL(out.url);return}
  objectUrl=out.url;const poster=overlay.querySelector('#pb-share-img');poster.src=out.url;poster.hidden=false;overlay.querySelector('#pb-share-spinner').remove();
  const file=new File([out.blob],out.name,{type:'image/png'}),native=canShare(file),send=overlay.querySelector('#pb-share-send'),save=overlay.querySelector('#pb-share-save'),full=overlay.querySelector('#pb-share-full');
  full.href=out.url;full.hidden=false;send.disabled=false;save.disabled=false;if(!native)send.textContent='Download + Copy';
  send.onclick=()=>{
   if(!native){
    const a=document.createElement('a');a.href=out.url;a.download=out.name;document.body.append(a);a.click();a.remove();
    try{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text(snap)).then(()=>setStatus('Image download requested and message copied. Attach the PNG in your chat.')).catch(()=>setStatus('Image download requested. Use Copy Text to copy the message.'));else setStatus('Image download requested. Use Copy Text for your message.')}catch(e){setStatus('Image download requested. Use Copy Text for your message.')}return}
   try{navigator.share({files:[file]}).then(()=>setStatus('Share sheet closed.')).catch(e=>{if(e?.name!=='AbortError')setStatus('Sharing failed. Try Save Image instead.')})}catch(e){setStatus('Sharing failed. Try Save Image instead.')}
  };
  save.onclick=()=>{
   if(native&&/iPhone|iPad|iPod/i.test(navigator.userAgent)){
    setStatus('Choose Save Image from the iPhone share sheet. If unavailable, open the full-size image and touch and hold.');
    try{navigator.share({files:[file],title:'Pokémon Ballclub roster'}).catch(e=>{if(e?.name!=='AbortError')setStatus('Open the full-size image, then touch and hold to save.')})}catch(e){setStatus('Open the full-size image, then touch and hold to save.')}
   }else{
    const a=document.createElement('a');a.href=out.url;a.download=out.name;document.body.append(a);a.click();a.remove();setStatus('Download requested. If it did not start, open the full-size image.');
   }
  };
  setStatus((out.fallback?'Simple image (screen capture failed: '+(window.PBCShareError||'unknown')+'). ':'')+(native?'Image ready. Tap Share Team to send it.':'Image ready. Save it, then send it in your chat.'));
 }catch(e){if(modal===overlay){overlay.querySelector('#pb-share-spinner').textContent='The roster image could not be generated.';setStatus(e.message||'Image export error.')}}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){e.preventDefault();e.stopImmediatePropagation();close()}},true);
document.addEventListener('click',e=>{const btn=e.target.closest?.('#dcSave,#shareBtn,.pb-share-launch');if(!btn||modal)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
function labels(){const a=document.querySelector('#dcSave'),b=document.querySelector('#shareBtn');if(a&&a.textContent!=='Share Team')a.textContent='Share Team';if(b&&b.textContent!=='Share Team')b.textContent='Share Team'}
new MutationObserver(labels).observe(document.body,{childList:true,subtree:true});labels();
window.PBCShare={open,render,snapshot,text};
})();