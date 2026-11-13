/* v5: optional sign-in. The game works without it. Signing in links this browser to a profile
   so posted teams, leagues, Clubhouse history, collection and series records follow you. */
(() => {
 // Hidden until it has been tested on the real login service: only test links, or ?signin=1 once on this browser.
 try{if(/[?&]signin=1/.test(location.search))localStorage.setItem('pbc6-signin','1')}catch(e){}
 const on=/-git-|localhost|127\.0\.0\.1/.test(location.hostname)||(()=>{try{return localStorage.getItem('pbc6-signin')==='1'}catch(e){return false}})();
 if(!on){window.isMyDevice=d=>!!d&&d===deviceId().slice(0,16);return}
 const BASE_URL=LB_URL.replace(/\/rest\/v1\/.*$/,''),AUTH=BASE_URL+'/auth/v1',PROFILES=BASE_URL+'/rest/v1/ballclub_profiles';
 const SKEY='pbc6-session',DKEY='pbc6-devices',SYNCED=['pbc3-clubhouse-v1','pbc5-dex','pbc5-rivals','pbc5-leagues','pbc2-team'];
 const $=id=>document.getElementById(id),dev=()=>deviceId().slice(0,16);
 const json=(k,d)=>{try{const v=JSON.parse(store.get(k)||'null');return v??d}catch(e){return d}};
 let session=json(SKEY,null),devices=json(DKEY,[]),status='',busy=false,pushTimer=0,applying=false;
 const save=()=>{store.set(SKEY,JSON.stringify(session));store.set(DKEY,JSON.stringify(devices))};
 window.isMyDevice=d=>!!d&&(d===dev()||devices.includes(d));

 async function call(url,opt={},token){
  const r=await fetch(url,{...opt,headers:{apikey:LB_KEY,Authorization:'Bearer '+(token||LB_KEY),'Content-Type':'application/json',...(opt.headers||{})}});
  let body=null;try{body=await r.json()}catch(e){}
  if(!r.ok)throw Object.assign(new Error(body?.msg||body?.error_description||body?.message||'Something went wrong. Try again.'),{status:r.status,code:body?.error_code||body?.code});
  return body;
 }
 const adopt=b=>{session={access_token:b.access_token,refresh_token:b.refresh_token,expires_at:Date.now()+(b.expires_in||3600)*1000,user:{id:b.user.id,email:b.user.email}};save()};
 async function token(){
  if(!session)return null;
  if(Date.now()<session.expires_at-60000)return session.access_token;
  try{adopt(await call(AUTH+'/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})}));return session.access_token}
  catch(e){if(e.status===400||e.status===401){session=null;save()}return null}
 }

 // ---- merging two copies of a profile (this browser and the saved one) ----
 const uniq=a=>[...new Set(a)];
 function mergeClub(a,b){
  if(!a||a.version!==1)return b||null;if(!b||b.version!==1)return a;
  const byId=new Map();[...a.history,...b.history].forEach(h=>{const o=byId.get(h.id);if(!o||(!o.team&&h.team))byId.set(h.id,{...o,...h,team:h.team||o?.team})});
  const history=[...byId.values()].sort((x,y)=>(y.date||0)-(x.date||0)).slice(0,40),seen=uniq([...a.seen,...b.seen]),boards={};
  uniq([...Object.keys(a.boards),...Object.keys(b.boards)]).forEach(k=>{const x=a.boards[k],y=b.boards[k];if(!x||!y){boards[k]=x||y;return}
   const best=!x.best?y.best:!y.best?x.best:(y.best.wins>x.best.wins||(y.best.wins===x.best.wins&&y.best.rating>x.best.rating))?y.best:x.best;
   boards[k]={seasons:Math.max(x.seasons,y.seasons),bestWins:Math.max(x.bestWins,y.bestWins),bestRating:Math.max(x.bestRating,y.bestRating),championships:Math.max(x.championships||0,y.championships||0),best}});
  return {version:1,seen,history,boards,unlocked:uniq([...a.unlocked,...b.unlocked]),seasons:Math.max(a.seasons||0,b.seasons||0,seen.length)};
 }
 const mergeDex=(a,b)=>!a?b||null:!b?a:{...a,...b,v:Math.max(a.v||0,b.v||0),nums:uniq([...(a.nums||[]),...(b.nums||[])]),shiny:uniq([...(a.shiny||[]),...(b.shiny||[])])};
 function mergeRivals(a,b){const o={...(b||{})};Object.entries(a||{}).forEach(([k,v])=>{const w=o[k];if(!w||(v.w||0)+(v.l||0)>(w.w||0)+(w.l||0))o[k]=v});return o}
 const mergeLeagues=(a,b)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(l=>{if(l&&l.code&&!m.has(l.code))m.set(l.code,l)});return [...m.values()].slice(0,3)};
 const local=()=>({clubhouse:json('pbc3-clubhouse-v1',null),dex:json('pbc5-dex',null),rivals:json('pbc5-rivals',{}),leagues:json('pbc5-leagues',[]),team:store.get('pbc2-team')||null});

 async function sync(){
  const t=await token();if(!t)return false;
  const rows=await call(`${PROFILES}?select=*&user_id=eq.${session.user.id}`,{},t),remote=rows[0]||{},mine=local();
  const merged={user_id:session.user.id,devices:uniq([...(remote.devices||[]),...devices,dev()]).slice(-40),team:mine.team||remote.team||null,
   clubhouse:mergeClub(mine.clubhouse,remote.clubhouse),dex:mergeDex(mine.dex,remote.dex),rivals:mergeRivals(mine.rivals,remote.rivals),leagues:mergeLeagues(mine.leagues,remote.leagues),updated_at:new Date().toISOString()};
  applying=true;
  try{
   if(merged.clubhouse)store.set('pbc3-clubhouse-v1',JSON.stringify(merged.clubhouse));
   if(merged.dex)store.set('pbc5-dex',JSON.stringify(merged.dex));
   store.set('pbc5-rivals',JSON.stringify(merged.rivals));store.set('pbc5-leagues',JSON.stringify(merged.leagues));
   if(merged.team&&!mine.team)store.set('pbc2-team',merged.team);
  }finally{applying=false}
  devices=merged.devices;save();
  await call(PROFILES+'?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(merged)},t);
  return true;
 }
 const later=()=>{if(!session||applying)return;clearTimeout(pushTimer);pushTimer=setTimeout(()=>sync().catch(()=>{}),2500)};
 // Any change to synced data in this browser is saved to the profile a moment later.
 const set0=store.set;store.set=function(k,v){set0.call(store,k,v);if(SYNCED.includes(k))later()};

 // ---- actions ----
 const DOM='@players.pokemon-ballclub.vercel.app';
 // A username is stored as a private sign-in address; no email is ever sent to it.
 const toLogin=u=>u.includes('@')?u:u+DOM;
 const shown=e=>(e||'').endsWith(DOM)?e.slice(0,-DOM.length):e;
 const friendly=e=>e.code==='invalid_credentials'||/invalid login/i.test(e.message)?'That username and password don\'t match.':e.code==='user_already_exists'||/already registered/i.test(e.message)?'That username is taken. Try another, or sign in if it is yours.':e.code==='weak_password'||/password should/i.test(e.message)?'Use at least 6 characters for the password.':e.code==='email_not_confirmed'||/not confirmed/i.test(e.message)?'Confirm your email first. Check your inbox for the link.':e.status===429?'Too many tries. Wait a minute and try again.':e.message;
 async function finishSignIn(b){adopt(b);await sync();status='Signed in. This browser is linked to your profile.';close();refresh()}
 async function signIn(email,password){await finishSignIn(await call(AUTH+'/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}))}
 async function signUp(email,password){
  const b=await call(AUTH+'/signup',{method:'POST',body:JSON.stringify({email,password,data:{username:shown(email)}})});
  if(b?.access_token)return finishSignIn(b);
  return 'confirm';
 }
 async function signOut(){const t=session?.access_token;session=null;devices=[];save();status='Signed out. Your saved history stays on this browser.';refresh();if(t)call(AUTH+'/logout',{method:'POST'},t).catch(()=>{})}
 const recover=email=>call(AUTH+'/recover',{method:'POST',body:JSON.stringify({email})});

 // ---- UI ----
 function cardHTML(){
  return session?`<section class="acct on"><div><small>Signed in</small><b>${esc(shown(session.user.email))}</b><span>${esc(status||'Your teams, leagues and Clubhouse follow you to any browser you sign in on.')}</span></div><button type="button" class="btn" data-acct="out">Sign out</button></section>`
   :`<section class="acct"><div><small>Optional</small><b>Save across devices</b><span>${esc(status||'Sign in to keep your teams, leagues and Clubhouse on any phone or computer.')}</span></div><button type="button" class="btn primary" data-acct="open">Sign in</button></section>`;
 }
 const base=window.clubhouseHTML;
 if(typeof base==='function')window.clubhouseHTML=()=>cardHTML()+base();
 function refresh(){const c=document.querySelector('#lb .records-clubhouse');if(c&&typeof clubhouseHTML==='function')c.innerHTML=clubhouseHTML()}
 function close(){$('acct')?.remove()}
 function open(mode='in',note=''){
  close();
  const reset=mode==='reset',el=document.createElement('div');el.id='acct';el.className='sheet acct-sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','acctTitle');
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2 id="acctTitle">${reset?'Set a new password':'Sign in'}</h2><button class="btn" id="acctClose">Close</button></div><div class="sheet-body">
   <form id="acctForm" novalidate>
    ${reset?'':`<label>Username<input id="acctEmail" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="20" required></label>`}
    <label>${reset?'New password':'Password'}<input id="acctPass" type="password" autocomplete="${reset?'new-password':'current-password'}" minlength="6" required></label>
    <p class="acct-msg" id="acctMsg" role="status">${esc(note)}</p>
    ${reset?`<button class="btn primary" type="submit" data-do="newpass">Save password</button>`:`<button class="btn primary" type="submit" data-do="in">Sign in</button><button class="btn" type="button" data-do="up">Create account</button>`}
   </form>
   <p class="acct-fine">${reset?'':'Signing in is optional. Pick a password you will remember, since there is no email reset.'}</p></div></div>`;
  document.body.appendChild(el);$('acctClose').onclick=close;
  const msg=t=>{$('acctMsg').textContent=t},run=async what=>{
   if(busy)return;const email=$('acctEmail')?.value.trim().toLowerCase(),pass=$('acctPass').value;
   if(what!=='newpass'&&!/^\S+@\S+\.\S+$/.test(email||'')&&!/^[a-z0-9_.-]{3,20}$/.test(email||''))return msg('Usernames are 3 to 20 letters, numbers, dots, dashes or underscores.');
   if(what!=='forgot'&&pass.length<6)return msg('Use at least 6 characters for the password.');
   busy=true;msg('Working…');
   try{
    if(what==='in')await signIn(toLogin(email),pass);
    else if(what==='up'){if(await signUp(toLogin(email),pass)==='confirm')msg('Account created. Tap Sign in.')}
    else if(what==='forgot'){await recover(email);msg('If that email has an account, a reset link is on its way.')}
    else if(what==='newpass'){const t=await token();await call(AUTH+'/user',{method:'PUT',body:JSON.stringify({password:pass})},t);await sync();status='Password updated. You are signed in.';close();refresh()}
   }catch(e){msg(friendly(e))}finally{busy=false}
  };
  $('acctForm').onsubmit=e=>{e.preventDefault();run(reset?'newpass':'in')};
  el.querySelectorAll('[data-do]').forEach(b=>{if(b.type!=='submit')b.onclick=()=>run(b.dataset.do)});
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
  (el.querySelector('input')||$('acctClose')).focus();
 }
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-acct]');if(!b)return;if(b.dataset.acct==='open')open();else signOut()});

 // A password-reset email link returns here with a short-lived session in the address.
 (function fromEmail(){
  const h=new URLSearchParams(location.hash.slice(1));if(!h.get('access_token'))return;
  const type=h.get('type'),at=h.get('access_token'),rt=h.get('refresh_token');history.replaceState(null,'',location.pathname+location.search);
  call(AUTH+'/user',{},at).then(u=>{adopt({access_token:at,refresh_token:rt,expires_in:+h.get('expires_in')||3600,user:u});
   if(type==='recovery')open('reset');else sync().then(()=>{status='Email confirmed. You are signed in.'}).catch(()=>{})}).catch(()=>{});
 })();
 if(session)setTimeout(()=>sync().catch(()=>{}),1500);
 window.Account={get user(){return session?.user||null},sync,open};
})();
