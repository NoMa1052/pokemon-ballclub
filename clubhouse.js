/* Local career records. Independent of ratings, RNG, saves and the public leaderboard. */
const Clubhouse = (() => {
  const KEY='pbc3-clubhouse-v1';
  const empty=()=>({version:1,seen:[],history:[],boards:{},unlocked:[],seasons:0});
  const read=()=>{try{const x=JSON.parse(store.get(KEY));return x?.version===1&&Array.isArray(x.history)&&Array.isArray(x.seen)&&x.boards&&Array.isArray(x.unlocked)?x:empty()}catch(_){return empty()}};
  const boardKey=r=>(r.mode==='pack'?'pack':'spin')+'-'+r.size;
  const boardName=k=>`${k.startsWith('pack')?'Packs':'Spin'} · ${k.endsWith('11')?'Quick':'Standard'}`;
  const identity=r=>boardKey(r)+':'+r.seed+':'+r.picks.join(',');
  const achievements=[
    ['first','Opening day','Complete a season.',(_,r)=>!!r.result],
    ['hundred','Century club','Win 100 regular-season games.',(_,r)=>r.result.wins>=100],
    ['elite','Pennant powerhouse','Win 150 regular-season games.',(_,r)=>r.result.wins>=150],
    ['champ','World champions','Win the World Series.',(_,r)=>!!r.result.post.champ],
    ['legend','Legend in the clubhouse','Finish a season with a legendary.',(_,r)=>Object.values(r.slots).some(m=>m?.leg)],
    ['shiny','Shining star','Finish a season with a shiny.',(_,r)=>Object.values(r.slots).some(m=>m?.shiny)],
    ['dynasty','Dynasty','Win three World Series.',b=>Object.values(b.boards).reduce((n,v)=>n+(v.championships||0),0)>=3],
    ['perfect','Perfect season','Go 162–0.',(_,r)=>r.result.wins===162],
    ['allgens','Gotta draft \'em all','Win the World Series with Pokémon from all four gens.',(_,r)=>!!r.result.post.champ&&allGens(Object.values(r.slots))],
    ['leglineup','Legendary lineup','Finish a season with 3 or more legendaries.',(_,r)=>Object.values(r.slots).filter(m=>m?.leg).length>=3],
    ['fullevo','Full evolution','Evolve a Pokémon from first form to final form in one draft.',(_,r)=>Object.values(r.slots).some(m=>(m?.evolutionSteps||0)>=2)],
    ['ironman','Iron man','Play 50 seasons.',b=>b.seasons>=50],
    ['rivals','Rival slayer','Win 5 rival series.',()=>seriesWon()>=5,true],
    ['week','Week winner','Finish #1 in a league for a week.',b=>!!b.weekWin,true],
    ['shinyhunt','Shiny hunter','Finish seasons with 10 different shinies.',()=>shinies()>=10,true]
  ];
  const allGens=mons=>new Set(mons.filter(Boolean).map(m=>m.gen)).size>=4;
  const json=k=>{try{return JSON.parse(store.get(k)||'null')}catch(_){return null}};
  const seriesWon=()=>Object.values(json('pbc5-rivals')||{}).reduce((n,x)=>n+(+x?.w||0),0);
  const shinies=()=>(json('pbc5-dex')?.shiny||[]).length;
  // Trophies earned outside a season (series, league weeks, collection), plus older seasons in the log.
  function sweep(extra){
    const b=read();if(extra)Object.assign(b,extra);
    const mons=h=>(h.roster||[]).map(id=>typeof BYID!=='undefined'?BYID.get(id):null);
    const past={allgens:()=>b.history.some(h=>h.champ&&allGens(mons(h))),leglineup:()=>b.history.some(h=>mons(h).filter(m=>m?.leg).length>=3)};
    const got=achievements.filter(([k,,,test,live])=>!b.unlocked.includes(k)&&(live||k==='ironman'?test(b):past[k]?.())).map(([k])=>k);
    if(got.length||extra){b.unlocked.push(...got);store.set(KEY,JSON.stringify(b))}
    return got;
  }
  function snapshot(r){
    const list=r.size===16?FULL:STD,res=r.result;
    const bat=res.me.order.map(h=>({name:h.m.name,id:h.m.id,hr:h.st.hr,ops:(h.st.h+h.st.bb)/Math.max(1,h.st.pa)+(h.st.h+h.st.d+2*h.st.t+3*h.st.hr)/Math.max(1,h.st.ab)}));
    const mvp=bat.reduce((a,b)=>b.ops>a.ops?b:a);
    return {id:identity(r),board:boardKey(r),date:Date.now(),wins:res.wins,grade:res.grade,champ:!!res.post.champ,rating:rosterRating(r.slots,list),roster:list.map(s=>r.slots[s]?.id||0),mvp,rs:res.runs.rs,ra:res.runs.ra};
  }
  function record(r){
    if(!r?.result?.me?.order||!r.result.post)return {fresh:false,unlocks:[]};
    const b=read(),id=identity(r);
    if(b.seen.includes(id))return {fresh:false,unlocks:[]};
    const snap=snapshot(r),key=snap.board,previous=b.boards[key]?.bestWins;
    b.seen.push(id);b.seasons++;b.history.unshift(snap);b.history=b.history.slice(0,40);
    const old=b.boards[key]||{seasons:0,bestWins:0,bestRating:0,championships:0};
    b.boards[key]={seasons:old.seasons+1,bestWins:Math.max(old.bestWins,snap.wins),bestRating:Math.max(old.bestRating,snap.rating),championships:old.championships+(snap.champ?1:0),best:!old.best||snap.wins>old.best.wins||(snap.wins===old.best.wins&&snap.rating>old.best.rating)?snap:old.best};
    const unlocks=achievements.filter(([k,,,test,live])=>!live&&!b.unlocked.includes(k)&&test(b,r)).map(([k])=>k);
    b.unlocked.push(...unlocks);store.set(KEY,JSON.stringify(b));
    return {fresh:true,unlocks,previous,newBest:previous==null||snap.wins>previous};
  }
  // Team names are chosen when a team is posted, after the season is already in the log.
  function setTeam(match,team){
    if(!team)return false;const b=read();let hit=false;
    const tag=h=>{if(h&&!h.team&&match(h)){h.team=team;hit=true}};
    b.history.forEach(tag);Object.values(b.boards).forEach(v=>tag(v.best));
    if(hit)store.set(KEY,JSON.stringify(b));return hit;
  }
  const name=(r,team)=>{const id=identity(r);return setTeam(h=>h.id===id,team)};
  return {read,record,boardKey,boardName,identity,achievements,name,setTeam,sweep};
})();
