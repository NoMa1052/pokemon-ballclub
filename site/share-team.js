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
async function render(s){
 try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])}catch(_){}
 const sources=['logo.webp',...s.players.map(p=>'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+(p.shiny?'shiny/':'')+p.num+'.png')];
 const images=await Promise.all(sources.map(src=>image(src)));const logo=images[0];
 const canvas=document.createElement('canvas');canvas.width=CW;canvas.height=CH;const c=canvas.getContext('2d');if(!c)throw Error('Canvas is unavailable.');
 rect(c,0,0,CW,CH,navy);rect(c,0,0,CW,12,'#284f70');rect(c,0,12,CW,8,red);
 if(logo){const h=169,w=logo.width*h/logo.height;c.drawImage(logo,(CW-w)/2,23,w,h)}else paint(c,'POKÉMON BALLCLUB',540,112,46,cream,'center');
 paint(c,s.team,68,218,40,cream,'left',610);
 paint(c,s.mode.toUpperCase()+' · '+(s.size===11?'QUICK':'STANDARD')+' · '+s.size+' PICKS',70,260,21,'#cbd9e9');
 if(s.record){paint(c,s.record,1012,218,60,gold,'right',350);paint(c,s.champ?'WORLD SERIES CHAMPIONS':'SEASON RECORD',1012,261,18,cream,'right',380)}
 else paint(c,'DRAFT COMPLETE',1012,237,31,gold,'right',370);
 rect(c,50,306,980,936,cream,12);rect(c,50,306,980,94,ink,12);rect(c,50,359,980,42,ink);
 paint(c,'YOUR BALLCLUB',85,352,42,cream);paint(c,s.ovr+' OVR',990,352,44,gold,'right');
 rect(c,50,399,980,7,red);paint(c,'STARTING LINEUP',90,441,27,red);paint(c,'PITCHING STAFF',651,441,27,red);
 rect(c,90,461,520,3,'#bdab87');rect(c,648,461,351,3,'#bdab87');
 const field=s.players.filter(p=>FIELD_SLOTS.includes(p.slot)),staff=s.players.filter(p=>!FIELD_SLOTS.includes(p.slot));
 function row(p,i,x,y,w){
  const rh=79,cy=y+i*rh;if(i%2===0)rect(c,x,cy,w,rh-1,'#e8dbc3');
  rect(c,x+9,cy+8,68,64,'#d5c4a3',8);
  const k=s.players.indexOf(p),img=images[k+1];if(img){c.imageSmoothingEnabled=false;c.drawImage(img,x+9,cy+7,67,65);c.imageSmoothingEnabled=true}
  else paint(c,p.name[0],x+41,cy+42,28,ink,'center');
  const role=p.slot==='RP1'?'CL':p.slot==='RP2'?'SU':p.slot;
  paint(c,role,x+89,cy+40,23,'#886a35','left',58);paint(c,p.name,x+148,cy+40,26,ink,'left',w-250);
  rect(c,x+w-83,cy+17,72,49,navy,8);paint(c,p.rating,x+w-47,cy+42,28,cream,'center');
 }
 field.forEach((p,i)=>row(p,i,84,476,529));staff.forEach((p,i)=>row(p,i,642,476,360));
 if(!staff.length)paint(c,'No pitchers',657,512,23,ink);
 rect(c,50,1214,980,7,red);
 paint(c,s.champ?'WORLD SERIES CHAMPIONS':s.record?'SEASON COMPLETE':'READY FOR THE SEASON',68,1273,27,gold,'left',520);
 paint(c,'pokemon-ballclub.vercel.app',1004,1273,26,cream,'right',480);
 paint(c,'BUILD YOUR OWN BALLCLUB',540,1321,20,'#bdcedf','center');
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/png'));
 return {blob,url:globalThis.URL.createObjectURL(blob),name:'pokemon-ballclub-'+(s.record?s.wins+'-wins':'roster')+'.png'};
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
   try{navigator.share({files:[file],text:text(snap),title:'My Pokémon Ballclub'}).then(()=>setStatus('Share sheet closed.')).catch(e=>{if(e?.name!=='AbortError')setStatus('Sharing failed. Try Save Image instead.')})}catch(e){setStatus('Sharing failed. Try Save Image instead.')}
  };
  save.onclick=()=>{
   if(native&&/iPhone|iPad|iPod/i.test(navigator.userAgent)){
    setStatus('Choose Save Image from the iPhone share sheet. If unavailable, open the full-size image and touch and hold.');
    try{navigator.share({files:[file],title:'Pokémon Ballclub roster'}).catch(e=>{if(e?.name!=='AbortError')setStatus('Open the full-size image, then touch and hold to save.')})}catch(e){setStatus('Open the full-size image, then touch and hold to save.')}
   }else{
    const a=document.createElement('a');a.href=out.url;a.download=out.name;document.body.append(a);a.click();a.remove();setStatus('Download requested. If it did not start, open the full-size image.');
   }
  };
  setStatus(native?'Image ready. Share with your team message.':'Image ready. Save the PNG and copy the message separately.');
 }catch(e){if(modal===overlay){overlay.querySelector('#pb-share-spinner').textContent='The roster image could not be generated.';setStatus(e.message||'Image export error.')}}
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){e.preventDefault();e.stopImmediatePropagation();close()}},true);
document.addEventListener('click',e=>{const btn=e.target.closest?.('#dcSave,#shareBtn,.pb-share-launch');if(!btn||modal)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
function labels(){const a=document.querySelector('#dcSave'),b=document.querySelector('#shareBtn');if(a&&a.textContent!=='Share Team')a.textContent='Share Team';if(b&&b.textContent!=='Share Team')b.textContent='Share Team'}
new MutationObserver(labels).observe(document.body,{childList:true,subtree:true});labels();
window.PBCShare={open,render,snapshot,text};
})();