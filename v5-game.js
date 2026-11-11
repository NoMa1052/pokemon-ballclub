/* v5: a playable ballgame engine for head-to-head series. Pure logic, no DOM.
   It uses the same plate-appearance model and tool grades as the season sim, one batter at a time,
   so a game can be watched and managed instead of only reported. */
const Ballgame=(()=>{
 // Head-to-head pits elite bats against elite arms. Tools are compressed so scores read like baseball
 // (about 4 to 5 runs a side between strong clubs) instead of the season sim's higher-scoring world.
 const DAMP=.6,PITCH_EDGE=.55;
 const bat=h=>({...h,zCon:h.zCon*DAMP,zPow:h.zPow*DAMP,zEye:h.zEye*DAMP,zSpd:h.zSpd,g:{ab:0,h:0,hr:0,rbi:0},ser:{ab:0,h:0,hr:0,rbi:0}});
 const arm=p=>({...p,zStf:p.zStf*DAMP+PITCH_EDGE,zCtl:p.zCtl*DAMP+PITCH_EDGE,lastStart:-9,g:{outs:0,r:0,k:0}});
 function club(slots,name){
  const t=simTeam(slots,name,false);
  return{name,order:t.order.map(bat),rot:t.rot.map(arm),cl:arm(t.cl),su:arm(t.pen),mid:arm(t.bulk),defZ:t.defZ*DAMP,hasCl:!!slots.RP1,hasSu:!!slots.RP2};
 }
 // A starter needs three games off before he can go again.
 const rested=(p,gameNo)=>gameNo-p.lastStart>3;
 const OUTS=['grounds out','flies out','lines out','pops out','grounds out','flies out'];
 function create(away,home,r,gameNo,starters){
  const g={teams:[away,home],r,score:[0,0],hits:[0,0],line:[[],[]],inning:1,half:0,outs:0,bases:[null,null,null],idx:[0,0],done:false,winner:null,log:[],
   pit:[0,1].map(i=>{const sp=starters[i];sp.lastStart=gameNo;sp.g={outs:0,r:0,k:0};return{sp,cur:sp,bf:0,limit:Math.round(Math.max(18,Math.min(29,23+3*sp.zSta))),reliefOuts:0}})};
  for(const t of g.teams)for(const b of t.order)b.g={ab:0,h:0,hr:0,rbi:0};
  g.line[0].push(0);return g;
 }
 const tiring=(g,side)=>{const f=g.pit[side];return f.cur===f.sp&&f.bf>f.limit-5};
 const spent=(g,side)=>{const f=g.pit[side];return f.cur===f.sp&&(f.bf>=f.limit||f.sp.g.r>=6)};
 // Bullpen roles: setup man in the 8th, closer in the 9th of a close game, league-average middle relief otherwise.
 function relief(g,side){
  const t=g.teams[side],f=g.pit[side],lead=g.score[side]-g.score[1-side];
  let next=t.mid;
  if(g.inning>=9&&lead>=0&&lead<=3)next=t.cl;else if(g.inning===8&&lead>=-1&&lead<=4)next=t.su;
  if(next!==f.cur){f.cur=next;f.reliefOuts=0;if(!next.g||next.gNo!==g)next.g={outs:0,r:0,k:0};next.gNo=g}
  return next;
 }
 function endHalf(g){
  if(g.half===0){
   // Home team skips the bottom of the 9th or later when already ahead.
   if(g.inning>=9&&g.score[1]>g.score[0]){finish(g);return}
   g.half=1;g.line[1].push(0);
  }else{
   if(g.inning>=9&&g.score[0]!==g.score[1]){finish(g);return}
   g.half=0;g.inning++;g.line[0].push(0);
  }
  g.outs=0;g.bases=[null,null,null];
  if(g.inning>9)g.bases[1]=g.teams[g.half].order[(g.idx[g.half]+8)%9];
  // Relievers work an inning at a time.
  const fs=1-g.half,f=g.pit[fs];if(f.cur!==f.sp)relief(g,fs);
 }
 function finish(g){g.done=true;g.winner=g.score[0]>g.score[1]?0:1}
 // One plate appearance. Returns what happened so a screen can show it.
 function step(g){
  if(g.done)return null;
  const bs=g.half,fs=1-bs,bt=g.teams[bs],ft=g.teams[fs],f=g.pit[fs],b=bt.order[g.idx[bs]%9],p=f.cur;
  g.idx[bs]++;
  const over=p===f.sp?Math.max(0,f.bf-(f.limit-5)):0,fat=over?.3+.09*over:0;
  if(p===f.sp)f.bf++;
  const o=pa(b,p,ft.defZ,fat,g.r),B=g.bases,scored=[];
  let text='',out=false,dp=false;
  const name=b.m.name.replace(/^Shiny /,'');
  if(o==='K'){out=true;p.g.k++;text=`${name} strikes out`}
  else if(o==='BB'){if(B[0]){if(B[1]){if(B[2])scored.push(B[2]);B[2]=B[1]}B[1]=B[0]}B[0]=b;text=`${name} walks`}
  else if(o==='HR'){for(const x of B)if(x)scored.push(x);B.fill(null);scored.push(b);text=scored.length===4?`${name} hits a grand slam`:scored.length===1?`${name} homers`:`${name} hits a ${scored.length}-run homer`}
  else if(o==='3B'){for(const x of B)if(x)scored.push(x);B.fill(null);B[2]=b;text=`${name} triples`}
  else if(o==='2B'){if(B[2])scored.push(B[2]);if(B[1])scored.push(B[1]);let n3=null;if(B[0]){if(g.r()<.4+.15*B[0].zSpd)scored.push(B[0]);else n3=B[0]}B[0]=null;B[1]=b;B[2]=n3;text=`${name} doubles`}
  else if(o==='1B'){if(B[2])scored.push(B[2]);let n3=null,n2=null;if(B[1]){if(g.r()<.6+.15*B[1].zSpd)scored.push(B[1]);else n3=B[1]}if(B[0]){if(!n3&&g.r()<.28+.1*B[0].zSpd)n3=B[0];else n2=B[0]}B[0]=b;B[1]=n2;B[2]=n3;text=`${name} singles`}
  else{out=true;
   if(B[0]&&g.outs<2&&g.r()<.12){dp=true;B[0]=null;text=`${name} grounds into a double play`}
   else if(B[2]&&g.outs<2&&g.r()<.3){scored.push(B[2]);B[2]=null;text=`${name} hits a sacrifice fly`}
   else text=`${name} ${OUTS[Math.floor(g.r()*OUTS.length)]}`}
  const hit=['1B','2B','3B','HR'].includes(o);
  if(o!=='BB'&&!text.includes('sacrifice')){b.g.ab++;b.ser.ab++}
  if(hit){b.g.h++;b.ser.h++;g.hits[bs]++}
  if(o==='HR'){b.g.hr++;b.ser.hr++}
  const runs=scored.length;
  if(runs){b.g.rbi+=runs;b.ser.rbi+=runs;g.score[bs]+=runs;g.line[bs][g.line[bs].length-1]+=runs;p.g.r+=runs;
   if(o!=='HR')text+=`, ${scored.map(x=>x.m.name.replace(/^Shiny /,'')).join(' and ')} score${runs===1?'s':''}`}
  const outsMade=out?(dp?2:1):0;
  g.outs+=outsMade;p.g.outs+=outsMade;if(p!==f.sp)f.reliefOuts+=outsMade;
  const ev={inning:g.inning,half:bs,batter:b,pitcher:p,type:o,text,runs,out,outs:Math.min(3,g.outs),bases:B.map(x=>x?x.m:null),score:[...g.score],walkoff:false,endHalf:false};
  // Walk-off: the home team takes the lead in the 9th or later.
  if(bs===1&&g.inning>=9&&g.score[1]>g.score[0]){ev.walkoff=true;finish(g)}
  else if(g.outs>=3){ev.endHalf=true;endHalf(g)}
  ev.done=g.done;g.log.push(ev);return ev;
 }
 // The computer's manager, also used for your side when you choose to let the game run.
 function autoManage(g,side){const f=g.pit[side];if(f.cur===f.sp&&(spent(g,side)||(g.outs===0&&tiring(g,side)&&g.inning>=6)))relief(g,side)}
 function star(g,side){return g.teams[side].order.reduce((a,b)=>(b.g.h+2*b.g.hr+1.5*b.g.rbi)>(a.g.h+2*a.g.hr+1.5*a.g.rbi)?b:a)}
 return{club,create,step,relief,autoManage,tiring,spent,rested,star};
})();
