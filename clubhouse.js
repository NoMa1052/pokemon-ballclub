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
    ['both','Two-way manager','Complete seasons in Spin and Packs.',b=>Object.keys(b.boards).some(k=>k.startsWith('spin'))&&Object.keys(b.boards).some(k=>k.startsWith('pack'))]
  ];
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
    const unlocks=achievements.filter(([k,,,test])=>!b.unlocked.includes(k)&&test(b,r)).map(([k])=>k);
    b.unlocked.push(...unlocks);store.set(KEY,JSON.stringify(b));
    return {fresh:true,unlocks,previous,newBest:previous==null||snap.wins>previous};
  }
  return {read,record,boardKey,boardName,identity,achievements};
})();
