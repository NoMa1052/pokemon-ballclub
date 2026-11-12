/* Ballclub native team sharing and reliable 1080x1350 roster export. */
(function(){
'use strict';
const CW=1080,CH=1350,GAME_URL='https://pokemon-ballclub.vercel.app/';
let modal=null,objectUrl=null,focusBefore=null;
const navy='#10254a',ink='#152b46',cream='#f4e9d4',gold='#e6c685',red='#b63e45';
function shareLink(){let code='';try{code=(typeof leagueCodes==='function'&&leagueCodes()[0])||''}catch(_){}return 'pokemon-ballclub.vercel.app'+(code?'/?league='+code:'')}
window.shareLink=shareLink;
function snapshot(){
 if(!run||!run.slots||!slotList().some(s=>run.slots[s]))throw Error('Complete your roster before sharing.');
 const players=slotList().filter(s=>run.slots[s]).map(s=>{const m=run.slots[s];return {slot:s,num:m.num||m.id,shiny:!!m.shiny,name:m.name,rating:posOvr(m,s)}});
 const res=run.result,win=Number(res?.wins),done=res&&Number.isFinite(win);
 let team=run.submitted?.team||'';try{team=team||store.get('pbc5-last16-name')||''}catch(_){}
 let mvp=null;try{const h=Clubhouse.read().history[0];if(done&&h&&h.wins===win&&h.mvp)mvp=h.mvp}catch(_){}
 const post=res?.post||{};
 return {players,ovr:teamOvr(),team:team||'My Ballclub',record:done?String(win)+'–'+String(162-win):null,wins:win,grade:done?res.grade:'',champ:!!post.champ,made:!!post.made,outcome:done?String(post.text||(post.made?'Made the playoffs':'Missed the playoffs')).replace(/\.$/,''):'',mvp};
}
function text(s){
 const l=[];
 if(s.record){l.push('⚾ '+s.team+' went '+s.record+(s.grade?' ('+s.grade+')':''));l.push(s.champ?'🏆 World Series champions':s.outcome);
  if(s.mvp)l.push('⭐ MVP '+s.mvp.name+': '+s.mvp.hr+' HR, '+Number(s.mvp.ops).toFixed(3).replace(/^0/,'')+' OPS');l.push('Beat it: '+shareLink())}
 else{l.push('⚾ '+s.team+' is drafted: '+s.ovr+' OVR');l.push('Build a better one: '+shareLink())}
 return l.join('\n');
}
function paint(ctx,str,px,py,sz,fill,align,max){ctx.textAlign=align||'left';ctx.textBaseline='middle';ctx.fillStyle=fill;let size=sz;ctx.font='700 '+size+'px "Barlow",Arial,sans-serif';while(max&&ctx.measureText(String(str)).width>max&&size>16){ctx.font='700 '+(--size)+'px "Barlow",Arial,sans-serif'}ctx.fillText(String(str),px,py)}
function rect(ctx,x,y,w,h,fill,r=0){ctx.fillStyle=fill;if(r&&ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}else ctx.fillRect(x,y,w,h)}
function image(url){return new Promise(resolve=>{const img=new Image();let done=false;const end=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok?img:null)};const timer=setTimeout(()=>end(false),6000);img.crossOrigin='anonymous';img.onload=()=>end(true);img.onerror=()=>end(false);img.src=url})}
async function renderCanvas(s){
 // Fallback field-view poster drawn by hand: the record and the challenge on top, the team on the diamond, staff underneath.
 try{await Promise.race([Promise.all([document.fonts.load('600 150px Oswald'),document.fonts.load('400 36px Graduate'),document.fonts.load('600 20px Barlow'),document.fonts.ready]),new Promise(r=>setTimeout(r,1500))])}catch(_){}
 const logoSrc=document.querySelector('.mark.logo img')?.currentSrc||'logo.webp';
 const sprite=p=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+(p.shiny?'shiny/':'')+p.num+'.png';
 const images=await Promise.all([image(logoSrc).then(i=>i||image('logo.webp')),...s.players.map(p=>image(sprite(p)))]);const logo=images[0],imgOf=p=>images[s.players.indexOf(p)+1];
 const canvas=document.createElement('canvas');canvas.width=CW;canvas.height=CH;const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
 const font=(w,sz,fam)=>w+' '+sz+'px '+fam,DISPLAY='"Graduate",Georgia,serif',DATA='"Oswald","Arial Narrow",Arial,sans-serif',BODY='"Barlow",Arial,sans-serif';
 const txt=(str,x,y,f,fill,align='center',max)=>{c.font=f;c.textAlign=align;c.textBaseline='middle';c.fillStyle=fill;let t=String(str);if(max)while(c.measureText(t).width>max&&t.length>3)t=t.slice(0,-2)+'…';c.fillText(t,x,y);return c.measureText(t).width};
 // Background matches the game
 const bg=c.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#10254a');bg.addColorStop(1,'#0b1b33');c.fillStyle=bg;c.fillRect(0,0,CW,CH);
 // Header: logo, record, outcome, team line
 c.fillStyle='#e3350d';for(let x=0;x<CW;x+=40)c.fillRect(x,0,28,8);
 const glow=c.createRadialGradient(170,125,10,170,125,300);glow.addColorStop(0,'rgba(98,150,255,.32)');glow.addColorStop(1,'rgba(98,150,255,0)');c.fillStyle=glow;c.fillRect(0,0,520,330);
 if(logo){const h=190,w=logo.width*h/logo.height;c.drawImage(logo,36,34,w,h)}
 const gold='#ffcb05',LX=330;
 c.font=font(600,26,DATA);try{c.letterSpacing='4px'}catch(_){}
 txt((s.record?'FINAL · ':'DRAFTED · ')+s.team.toUpperCase(),LX,58,font(600,26,DATA),'#a9b8d0','left',560);
 try{c.letterSpacing='0px'}catch(_){}
 if(s.record)txt(s.record,LX-6,150,font(600,150,DATA),cream,'left');else txt(s.ovr+' OVR',LX-6,150,font(600,130,DATA),cream,'left');
 if(s.grade){c.save();c.translate(962,128);c.rotate(-.17);c.beginPath();c.arc(0,0,74,0,Math.PI*2);c.lineWidth=7;c.strokeStyle=gold;c.stroke();txt(s.grade,0,-8,font(600,68,DATA),gold);try{c.letterSpacing='3px'}catch(_){}txt('GRADE',2,44,font(600,15,DATA),gold);try{c.letterSpacing='0px'}catch(_){}c.restore()}
 if(s.record){const label=(s.champ?'WORLD SERIES CHAMPIONS':s.outcome.toUpperCase());try{c.letterSpacing='3px'}catch(_){}c.font=font(600,28,DATA);const rw=Math.min(c.measureText(label).width+44,560);
  c.fillStyle=s.champ?gold:s.made?'#e3350d':'#2c4470';c.beginPath();c.roundRect?c.roundRect(LX,236,rw,52,8):c.rect(LX,236,rw,52);c.fill();
  txt(label,LX+22,263,font(600,28,DATA),s.champ?'#12233f':'#fff','left',516);try{c.letterSpacing='0px'}catch(_){}
  txt(s.ovr+' OVR',CW-48,263,font(600,34,DATA),cream,'right')}
 // Field
 const F={x:40,y:316,w:1000,h:690},hx=F.x+F.w/2,hy=F.y+F.h*.95,R=F.h*.9,d=F.h*.2;
 c.save();c.beginPath();c.roundRect?c.roundRect(F.x,F.y,F.w,F.h+44,22):c.rect(F.x,F.y,F.w,F.h+44);c.clip();
 c.fillStyle='#0a1830';c.fillRect(F.x,F.y,F.w,F.h+44);
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
  try{c.letterSpacing='5px'}catch(_){}txt('PITCHING STAFF',CW/2,1072,font(600,22,DATA),'#a9b8d0');try{c.letterSpacing='0px'}catch(_){}
  c.fillStyle='#2c4470';c.fillRect(60,1071,330,2);c.fillRect(CW-390,1071,330,2);
  staff.forEach((p,i)=>token(p,x0+i*gap,1134,36,p.slot==='RP1'?'CL':p.slot==='RP2'?'SU':p.slot))}
 // Footer: the challenge and where to play
 c.fillStyle='#d63a26';for(let x=0;x<CW;x+=40)c.fillRect(x,CH-112,28,5);
 txt(s.record?'Think you can beat it?':'Think you can build a better team?',CW/2,CH-72,font(400,36,DISPLAY),cream);
 txt('pokemon-ballclub.vercel.app',CW/2,CH-32,font(600,26,DATA),gold);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/jpeg',.9));
 return {blob,url:globalThis.URL.createObjectURL(blob),name:'pokemon-ballclub-'+(s.record?s.wins+'-wins':'roster')+'.jpg'};
}

// The last image is reused when the same team is shared again.
let lastKey=null,lastOut=null;
async function render(s){
 const key=JSON.stringify([s.players,s.record,s.ovr,s.team,s.grade,s.outcome]);
 if(key===lastKey&&lastOut)return {...lastOut,url:globalThis.URL.createObjectURL(lastOut.blob)};
 const out=await renderCanvas(s);lastKey=key;lastOut=out;return out;
}
// Built quietly as soon as a finished team is on screen, so Share opens the share sheet at once.
let warmKey='',ready=null;
function warm(){
 if(modal||!run?.result)return;let snap;try{snap=snapshot()}catch(_){return}
 const key=JSON.stringify([snap.players,snap.record,snap.team,snap.grade,snap.outcome]);if(key===warmKey)return;warmKey=key;ready=null;
 render(snap).then(out=>{globalThis.URL.revokeObjectURL(out.url);if(key===warmKey)ready={key,snap,file:new File([out.blob],out.name,{type:'image/jpeg'})}}).catch(()=>{warmKey=''});
}
function quickShare(){
 if(!ready||!run?.result)return false;let snap;try{snap=snapshot()}catch(_){return false}
 if(JSON.stringify([snap.players,snap.record,snap.team,snap.grade,snap.outcome])!==ready.key||!canShare(ready.file))return false;
 try{navigator.share({files:[ready.file],text:text(snap)}).catch(()=>{})}catch(_){return false}
 return true;
}
function canShare(file){try{return !!navigator.share&&!!navigator.canShare&&navigator.canShare({files:[file]})}catch(_){return false}}
function setStatus(s){const el=document.getElementById('pb-share-status');if(el)el.textContent=s}
function close(){if(!modal)return;modal.remove();modal=null;document.body.classList.remove('pb-share-open');if(objectUrl){globalThis.URL.revokeObjectURL(objectUrl);objectUrl=null}if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true})}
async function open(){
 if(modal)return;let snap;try{snap=snapshot()}catch(e){alert(e.message);return}
 focusBefore=document.activeElement;
 const overlay=document.createElement('div');overlay.id='pb-share';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Share your team');
 overlay.innerHTML='<div class="pb-share-dialog"><div class="pb-share-head"><div><small>POKÉMON BALLCLUB</small><h2>Share your team</h2></div><button id="pb-share-close" aria-label="Close">✕</button></div><div class="pb-share-preview"><span id="pb-share-spinner">Preparing your team image…</span><img id="pb-share-img" alt="Team roster poster" hidden></div><p class="pb-share-caption">'+(snap.record?snap.record+', grade '+snap.grade+', ':'')+'full lineup with ratings</p><div class="pb-share-buttons"><button id="pb-share-send" class="pb-share-primary" disabled>Share Team</button><button id="pb-share-save" disabled>Save Image</button><button id="pb-share-copy">Copy Text</button></div><p id="pb-share-status" aria-live="polite">Generating your team PNG…</p><a id="pb-share-full" hidden target="_blank" rel="noopener">Open full-size image</a></div>';
 document.body.appendChild(overlay);modal=overlay;document.body.classList.add('pb-share-open');
 overlay.querySelector('#pb-share-close').onclick=close;overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.querySelector('#pb-share-copy').onclick=async()=>{try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text(snap));else{const ta=document.createElement('textarea');ta.value=text(snap);document.body.append(ta);ta.select();if(!document.execCommand('copy'))throw Error('Clipboard unavailable');ta.remove()}setStatus('Message copied.')}catch(e){prompt('Copy your share message:',text(snap))}};
 overlay.querySelector('#pb-share-close').focus({preventScroll:true});
 try{
  const out=await render(snap);if(modal!==overlay){globalThis.URL.revokeObjectURL(out.url);return}
  objectUrl=out.url;const poster=overlay.querySelector('#pb-share-img');poster.src=out.url;poster.hidden=false;overlay.querySelector('#pb-share-spinner').remove();
  const file=new File([out.blob],out.name,{type:'image/jpeg'}),native=canShare(file),send=overlay.querySelector('#pb-share-send'),save=overlay.querySelector('#pb-share-save'),full=overlay.querySelector('#pb-share-full');
  full.href=out.url;full.hidden=false;send.disabled=false;save.disabled=false;if(!native)send.textContent='Download + Copy';
  send.onclick=()=>{
   if(!native){
    const a=document.createElement('a');a.href=out.url;a.download=out.name;document.body.append(a);a.click();a.remove();
    try{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text(snap)).then(()=>setStatus('Image download requested and message copied. Attach the image in your chat.')).catch(()=>setStatus('Image download requested. Use Copy Text to copy the message.'));else setStatus('Image download requested. Use Copy Text for your message.')}catch(e){setStatus('Image download requested. Use Copy Text for your message.')}return}
   try{navigator.share({files:[file],text:text(snap)}).then(()=>setStatus('Share sheet closed.')).catch(e=>{if(e?.name!=='AbortError')setStatus('Sharing failed. Try Save Image instead.')})}catch(e){setStatus('Sharing failed. Try Save Image instead.')}
  };
  save.onclick=()=>{
   if(native&&/iPhone|iPad|iPod/i.test(navigator.userAgent)){
    setStatus('Choose Save Image from the iPhone share sheet. If unavailable, open the full-size image and touch and hold.');
    try{navigator.share({files:[file],title:'Pokémon Ballclub roster'}).catch(e=>{if(e?.name!=='AbortError')setStatus('Open the full-size image, then touch and hold to save.')})}catch(e){setStatus('Open the full-size image, then touch and hold to save.')}
   }else{
    const a=document.createElement('a');a.href=out.url;a.download=out.name;document.body.append(a);a.click();a.remove();setStatus('Download requested. If it did not start, open the full-size image.');
   }
  };
  setStatus((native?'Image ready. Tap Share Team to send it.':'Image ready. Save it, then send it in your chat.'));
 }catch(e){if(modal===overlay){overlay.querySelector('#pb-share-spinner').textContent='The roster image could not be generated.';setStatus(e.message||'Image export error.')}}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){e.preventDefault();e.stopImmediatePropagation();close()}},true);
document.addEventListener('click',e=>{const btn=e.target.closest?.('#dcSave,#shareBtn,.pb-share-launch');if(!btn||modal)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!quickShare())open()},true);
function labels(){const a=document.querySelector('#dcSave'),b=document.querySelector('#shareBtn');if(a&&a.textContent!=='Share Team')a.textContent='Share Team';if(b&&b.textContent!=='Share Team')b.textContent='Share Team'}
let warmT=0;new MutationObserver(()=>{labels();clearTimeout(warmT);warmT=setTimeout(warm,600)}).observe(document.body,{childList:true,subtree:true});labels();setTimeout(warm,1200);
window.PBCShare={open,render,snapshot,text};
})();