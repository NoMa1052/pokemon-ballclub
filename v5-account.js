/* v5: optional sign-in. The game works without it. Signing in links this browser to a profile
   so posted teams, leagues, Clubhouse history, collection and series records follow you. */
(() => {
 const BASE_URL=LB_URL.replace(/\/rest\/v1\/.*$/,''),AUTH=BASE_URL+'/auth/v1',PROFILES=BASE_URL+'/rest/v1/ballclub_profiles';
 const SKEY='pbc6-session',DKEY='pbc6-devices',AKEY='pbc7-avatar',SYNCED=['pbc3-clubhouse-v1','pbc5-dex','pbc5-rivals','pbc5-leagues','pbc2-team'];
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
 const adopt=b=>{session={access_token:b.access_token,refresh_token:b.refresh_token,expires_at:Date.now()+(b.expires_in||3600)*1000,user:{id:b.user.id,email:b.user.email,name:session?.user?.id===b.user.id?session.user.name:null,want:session?.user?.id===b.user.id&&session.user.taken?null:b.user.user_metadata?.screen_name||null,taken:session?.user?.id===b.user.id&&session.user.taken}};save()};
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
  return {version:1,seen,history,boards,unlocked:uniq([...a.unlocked,...b.unlocked]),seasons:Math.max(a.seasons||0,b.seasons||0,seen.length),...(a.weekWin||b.weekWin?{weekWin:a.weekWin||b.weekWin}:{})};
 }
 const mergeDex=(a,b)=>!a?b||null:!b?a:{...a,...b,v:Math.max(a.v||0,b.v||0),nums:uniq([...(a.nums||[]),...(b.nums||[])]),shiny:uniq([...(a.shiny||[]),...(b.shiny||[])])};
 function mergeRivals(a,b){const o={...(b||{})};Object.entries(a||{}).forEach(([k,v])=>{const w=o[k];if(!w||(v.w||0)+(v.l||0)>(w.w||0)+(w.l||0))o[k]=v});return o}
 const mergeLeagues=(a,b)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(l=>{if(l&&l.code&&!m.has(l.code))m.set(l.code,l)});return [...m.values()].slice(0,3)};
 const local=()=>({clubhouse:json('pbc3-clubhouse-v1',null),dex:json('pbc5-dex',null),rivals:json('pbc5-rivals',{}),leagues:json('pbc5-leagues',[]),team:store.get('pbc2-team')||null});

 async function sync(){
  const t=await token();if(!t)return false;
  const rows=await call(`${PROFILES}?select=*&user_id=eq.${session.user.id}`,{},t),remote=rows[0]||{},mine=local();
  const leagueOwner=store.get('pbc-leagues-owner');
  if(leagueOwner&&leagueOwner!==session.user.id)mine.leagues=[];
  store.set('pbc-leagues-owner',session.user.id);
  const want=remote.screen_name||session.user.name||session.user.want||undefined,av=remote.avatar||+store.get(AKEY)||null;
  if(av)store.set(AKEY,String(av));
  const merged={user_id:session.user.id,...(want?{screen_name:want}:{}),...(av?{avatar:av}:{}),devices:uniq([...(remote.devices||[]),...devices,dev()]).slice(-40),team:mine.team||remote.team||null,
   clubhouse:mergeClub(mine.clubhouse,remote.clubhouse),dex:mergeDex(mine.dex,remote.dex),rivals:mergeRivals(mine.rivals,remote.rivals),leagues:mergeLeagues(mine.leagues,remote.leagues),updated_at:new Date().toISOString()};
  applying=true;
  try{
   if(merged.clubhouse)store.set('pbc3-clubhouse-v1',JSON.stringify(merged.clubhouse));
   if(merged.dex)store.set('pbc5-dex',JSON.stringify(merged.dex));
   store.set('pbc5-rivals',JSON.stringify(merged.rivals));store.set('pbc5-leagues',JSON.stringify(merged.leagues));
   if(merged.team&&!mine.team)store.set('pbc2-team',merged.team);
  }finally{applying=false}
  devices=merged.devices;save();
  const put=body=>call(PROFILES+'?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)},t);
  try{await put(merged);if(want){session.user.name=want;save()}}
  catch(e){if(e.code!=='23505')throw e;
   // The screen name chosen at sign-up was claimed first: save everything else and ask for another.
   delete merged.screen_name;session.user.name=null;session.user.want=null;session.user.taken=true;save();await put(merged);return 'taken'}
  return true;
 }
 const later=()=>{if(!session||applying)return;clearTimeout(pushTimer);pushTimer=setTimeout(()=>sync().catch(()=>{}),2500)};
 // Any change to synced data in this browser is saved to the profile a moment later.
 const set0=store.set;store.set=function(k,v){set0.call(store,k,v);if(SYNCED.includes(k))later()};

 // ---- actions ----
const RPC=BASE_URL+'/rest/v1/rpc/ballclub_name_free';
 const NAME_RE=/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,18}[A-Za-z0-9]$/,cleanName=v=>(v||'').replace(/\s+/g,' ').trim();
 const nameFree=async n=>!!(await call(RPC,{method:'POST',body:JSON.stringify({n})}));
 const friendly=e=>e.code==='invalid_credentials'||/invalid login/i.test(e.message)?'That email and password don\'t match.':e.code==='user_already_exists'||/already registered/i.test(e.message)?'That email already has an account. Sign in instead.':e.code==='weak_password'||/password should/i.test(e.message)?'Use at least 6 characters for the password.':e.code==='email_not_confirmed'||/not confirmed/i.test(e.message)?'Confirm your email first. Check your inbox for the link.':e.code==='23505'?'That screen name is taken. Try another.':e.code==='email_address_invalid'||/email address .* invalid/i.test(e.message)?'That email address doesn\'t look right.':e.status===429?'Too many tries. Wait a minute and try again.':e.message;
 async function finishSignIn(b,note){adopt(b);const named=(await sync())!=='taken';
  status=named?(note||'Signed in. This browser is linked to your profile.'):'Signed in. That screen name was just taken, so pick another.';close();refresh();if(!named)open('name');else document.dispatchEvent(new Event('ballclub-signed-in'))}
 async function signIn(email,password){await finishSignIn(await call(AUTH+'/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}))}
 async function signUp(email,password,name){
  const b=await call(AUTH+'/signup',{method:'POST',body:JSON.stringify({email,password,data:{screen_name:name}})});
  if(b?.access_token)return finishSignIn(b,'Account created. Welcome to the club, '+name+'.');
  return 'confirm';
 }
 async function setName(name){const t=await token();if(!t)throw new Error('Sign in again first.');
  await call(`${PROFILES}?user_id=eq.${session.user.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({screen_name:name})},t);
  session.user.name=name;save()}
 async function setAvatar(n){store.set(AKEY,String(n));const t=await token();if(t)await call(`${PROFILES}?user_id=eq.${session.user.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({avatar:n})},t)}
 async function signOut(){const t=session?.access_token;session=null;devices=[];save();status='Signed out. Your saved history stays on this browser.';refresh();if(t)call(AUTH+'/logout',{method:'POST'},t).catch(()=>{})}
 const recover=email=>call(AUTH+'/recover',{method:'POST',body:JSON.stringify({email})});

 // ---- UI ----
 function refresh(){const c=document.querySelector('#lb .records-clubhouse');if(c&&typeof clubhouseHTML==='function')c.innerHTML=clubhouseHTML()}
 function close(){$('acct')?.remove()}
 const F={
  name:'<label>Screen name<input id="acctName" type="text" autocomplete="nickname" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="20" required></label>',
  email:'<label>Email<input id="acctEmail" type="email" autocomplete="email" inputmode="email" autocapitalize="none" required></label>',
  pass:n=>`<label>${n?'New password':'Password'}<input id="acctPass" type="password" autocomplete="${n?'new-password':'current-password'}" minlength="6" required></label>`};
 const MODES={
  in:{title:'Sign in',fields:F.email+F.pass(),submit:'in',btns:'<button class="btn primary" type="submit">Sign in</button>',
   foot:'New here? <button class="acct-link" type="button" data-mode="up">Create an account</button>'},
  up:{title:'Create account',fields:F.name+F.email+F.pass(true),submit:'up',btns:'<button class="btn primary" type="submit">Create account</button>',
   foot:'Have an account? <button class="acct-link" type="button" data-mode="in">Sign in</button>',fine:'Your screen name is your profile name. Team names stay separate, so post any name you like each run. Your email is only for signing in.'},
  pass:{title:'Change password',fields:F.pass(true)+'<label>Type it again<input id="acctPass2" type="password" autocomplete="new-password" minlength="6" required></label>',submit:'pass',btns:'<button class="btn primary" type="submit">Save password</button>'},
  name:{title:'Pick a screen name',fields:F.name,submit:'name',btns:'<button class="btn primary" type="submit">Save</button>',fine:'3 to 20 letters or numbers. Spaces, dots, dashes and underscores are fine in the middle.'},
  reset:{title:'Set a new password',fields:F.pass(true),submit:'newpass',btns:'<button class="btn primary" type="submit">Save password</button>'}};
 function open(mode='in',note=''){
  if(mode==='manage')return manage(note);
  close();const M=MODES[mode]||MODES.in,el=document.createElement('div');el.id='acct';el.className='sheet acct-sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','acctTitle');
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2 id="acctTitle">${mode==='name'&&session?.user?.name?'Change screen name':M.title}</h2><button class="btn" id="acctClose">Close</button></div><div class="sheet-body">
   <form id="acctForm" novalidate>${M.fields}<p class="acct-msg" id="acctMsg" role="status">${esc(note)}</p>${M.btns}</form>
   ${M.foot?`<p class="acct-switch">${M.foot}</p>`:''}${M.fine?`<p class="acct-fine">${M.fine}</p>`:''}</div></div>`;
  document.body.appendChild(el);const cancel=()=>{close();document.dispatchEvent(new Event('ballclub-account-cancel'))};$('acctClose').onclick=cancel;
  const msg=t=>{$('acctMsg').textContent=t},run=async what=>{
   if(busy)return;const email=$('acctEmail')?.value.trim().toLowerCase(),pass=$('acctPass')?.value||'',name=cleanName($('acctName')?.value);
   if($('acctName')&&!NAME_RE.test(name))return msg(name.length<3||name.length>20?'Screen names are 3 to 20 characters.':'Use letters and numbers. Spaces, dots, dashes and underscores only go in the middle.');
   if($('acctEmail')&&!/^\S+@\S+\.\S+$/.test(email||''))return msg('Enter your email address.');
   if(what!=='forgot'&&what!=='name'&&pass.length<6)return msg('Use at least 6 characters for the password.');
   busy=true;msg('Working…');
   try{
    if(what==='in')await signIn(email,pass);
    else if(what==='up'){if(!(await nameFree(name)))return msg('That screen name is taken. Try another.');if(await signUp(email,pass,name)==='confirm')msg('Check your email for a confirmation link, then come back and sign in.')}
    else if(what==='forgot'){recover(email).catch(()=>{});msg('Password reset emails aren\'t set up yet. Ask Nolan to reset it for you.')}
    else if(what==='name'){if(name.toLowerCase()===(session?.user?.name||'').toLowerCase()&&name===session.user.name){manage();return}if(name.toLowerCase()!==(session?.user?.name||'').toLowerCase()&&!(await nameFree(name)))return msg('That screen name is taken. Try another.');const had=!!session?.user?.name;await setName(name);status='Screen name saved.';refresh();if(had)manage('Screen name saved.');else{close();document.dispatchEvent(new Event('ballclub-signed-in'))}}
    else if(what==='pass'){if(pass!==($('acctPass2')?.value||''))return msg('Those passwords don\'t match.');const t=await token();if(!t)return msg('Sign in again first.');await call(AUTH+'/user',{method:'PUT',body:JSON.stringify({password:pass})},t);manage('Password changed.')}
    else if(what==='newpass'){const t=await token();await call(AUTH+'/user',{method:'PUT',body:JSON.stringify({password:pass})},t);await sync();status='Password updated. You are signed in.';close();refresh()}
   }catch(e){msg(friendly(e))}finally{busy=false}
  };
  $('acctForm').onsubmit=e=>{e.preventDefault();run(M.submit)};
  el.querySelectorAll('[data-do]').forEach(b=>b.onclick=()=>run(b.dataset.do));
  el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{const v=$('acctEmail')?.value;open(b.dataset.mode);if(v&&$('acctEmail'))$('acctEmail').value=v});
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();cancel()}});
  if(mode==='name'&&session?.user?.name&&$('acctName'))$('acctName').value=session.user.name;
  if(mode==='name'||mode==='pass')$('acctClose').textContent='Back',$('acctClose').onclick=()=>manage();
  (el.querySelector('input')||$('acctClose')).focus();
 }
 // ---- the Account screen: picture, screen name, password, sign out ----
 let pick=null;
 const avatarNum=()=>+store.get(AKEY)||null;
 function manage(note=''){
  if(!session)return open('in');
  close();const u=session.user,av=avatarNum()||(typeof favoriteMon==='function'?favoriteMon():null)||25,m=BYID.get(av);
  const el=document.createElement('div');el.id='acct';el.className='sheet acct-sheet acct-manage';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','acctTitle');
  const leagues=json('pbc5-leagues',[]).length,devs=uniq([...devices,dev()]).length;
  const q=pick?.q||'',hits=q.length>=2?MONS.filter(x=>x.id<=649&&x.name.toLowerCase().includes(q.toLowerCase())).slice(0,12):[];
  const tc=m?[TYPE_COLORS[m.types[0]]||'#5f7fb6',TYPE_COLORS[m.types[1]]||TYPE_COLORS[m.types[0]]||'#5f7fb6']:['#5f7fb6','#5f7fb6'];
  el.innerHTML=`<div class="sheet-in"><div class="sheet-top"><h2 id="acctTitle">Account</h2><button class="btn" id="acctClose">Done</button></div><div class="sheet-body">
   <div class="am-me"><button type="button" class="am-av" id="amAv" style="--c1:${tc[0]};--c2:${tc[1]}" aria-label="Change profile Pokémon">${m?`<img src="${ART_URL(m.num,false)}" alt="" onerror="this.onerror=null;this.src='${SPRITE_URL(m.num,false)}'">`:''}<i>Edit</i></button><b>${esc(u.name||'No screen name yet')}</b><small>Signed in · ${esc(u.email||'')}</small></div>
   ${note?`<p class="am-note" role="status">${esc(note)}</p>`:''}
   ${pick?`<section class="am-pick" aria-label="Pick a profile Pokémon"><label for="amQ">Profile Pokémon</label><input id="amQ" placeholder="Search Gen 1–5 Pokémon" autocomplete="off" value="${esc(q)}"><div class="am-mons">${hits.map(x=>`<button type="button" data-av="${x.id}"><img src="${SPRITE_URL(x.id,false)}" alt="">${esc(x.name)}</button>`).join('')||`<p class="hint">${q.length>=2?'No match.':'Type at least 2 letters.'}</p>`}</div><button type="button" class="btn" id="amPickX">Cancel</button></section>`:''}
   <div class="am-list">
    <div class="am-r"><div><small>Screen name</small><b>${esc(u.name||'Not set')}</b></div><button type="button" class="am-btn" data-am="name">${u.name?'Change':'Add'}</button></div>
    <div class="am-r"><div><small>Profile Pokémon</small><b>${m?esc(m.name):'None'}${avatarNum()?'':' <em>(most drafted)</em>'}</b></div><button type="button" class="am-btn" data-am="pic">Change</button></div>
    <div class="am-r"><div><small>Password</small><b>••••••••</b></div><button type="button" class="am-btn" data-am="pass">Change</button></div>
    <div class="am-r"><div><small>Synced</small><b>${devs} device${devs===1?'':'s'} · ${leagues} league${leagues===1?'':'s'}</b></div></div>
   </div>
   <button type="button" class="btn am-out" data-am="out">Sign out</button>
   <p class="acct-fine">Your seasons, badges, collection and leagues are saved to this account.</p></div></div>`;
  document.body.appendChild(el);
  const done=()=>{pick=null;close();refresh()};$('acctClose').onclick=done;
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();done()}});
  el.querySelectorAll('[data-am]').forEach(b=>b.onclick=()=>{const k=b.dataset.am;if(k==='name')open('name');else if(k==='pass')open('pass');else if(k==='pic'){pick={q:''};manage();$('amQ')?.focus()}else{pick=null;close();signOut()}});
  $('amAv').onclick=()=>{pick={q:''};manage();$('amQ')?.focus()};
  if($('amPickX'))$('amPickX').onclick=()=>{pick=null;manage()};
  const wire=()=>el.querySelectorAll('[data-av]').forEach(b=>b.onclick=async()=>{const n=BYID.get(+b.dataset.av)?.num||+b.dataset.av;pick=null;try{await setAvatar(n);manage('Profile Pokémon saved.')}catch(e){manage('Saved on this device. It syncs next time you\'re online.')}refresh()});
  wire();
  if($('amQ'))$('amQ').oninput=e=>{pick.q=e.target.value;const q=pick.q,hits=q.length>=2?MONS.filter(x=>x.id<=649&&x.name.toLowerCase().includes(q.toLowerCase())).slice(0,12):[];
   el.querySelector('.am-mons').innerHTML=hits.map(x=>`<button type="button" data-av="${x.id}"><img src="${SPRITE_URL(x.id,false)}" alt="">${esc(x.name)}</button>`).join('')||`<p class="hint">${q.length>=2?'No match.':'Type at least 2 letters.'}</p>`;wire()};
  if(!pick)$('acctClose').focus();
 }
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-acct]');if(!b)return;const k=b.dataset.acct;if(k==='open')open();else if(k==='name')open('name');else if(k==='manage')manage();else signOut()});

 // A password-reset email link returns here with a short-lived session in the address.
 (function fromEmail(){
  const h=new URLSearchParams(location.hash.slice(1));if(!h.get('access_token'))return;
  const type=h.get('type'),at=h.get('access_token'),rt=h.get('refresh_token');history.replaceState(null,'',location.pathname+location.search);
  call(AUTH+'/user',{},at).then(u=>{adopt({access_token:at,refresh_token:rt,expires_in:+h.get('expires_in')||3600,user:u});
   if(type==='recovery')open('reset');else sync().then(()=>{status='Email confirmed. You are signed in.';close();document.dispatchEvent(new Event('ballclub-signed-in'))}).catch(()=>{})}).catch(()=>{});
 })();
 if(session)setTimeout(()=>sync().catch(()=>{}),1500);
 window.Account={get user(){return session?.user||null},async postHeaders(extra){
  if(!session)return lbHead(extra);
  const access=await token();
  if(!access)throw new Error('Sign in again to post to your league.');
  return lbHead({...extra,Authorization:'Bearer '+access});
 },sync,open,manage,avatar:avatarNum,takeStatus(){const s=status;status='';return s}};
})();
