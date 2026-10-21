const TYPE_COLORS={normal:"#8a8a68",fire:"#d9622b",water:"#4a78d6",electric:"#c9a218",grass:"#4f9a3a",ice:"#4aa8a8",fighting:"#a8322b",poison:"#8a3f8a",ground:"#b08a3a",flying:"#7c6fc7",psychic:"#d9467a",bug:"#829a1a",rock:"#968233",ghost:"#5b4a85",dragon:"#5a3ad9",dark:"#5a4a3f",steel:"#7f7f99",fairy:"#c96f9a"};
const REGIONS={1:"Kanto",2:"Johto",3:"Hoenn",4:"Sinnoh"};
const FIELD_SLOTS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
const STD=[...FIELD_SLOTS,"SP1","RP1"];
const FULL=[...FIELD_SLOTS,"SP1","SP2","SP3","SP4","SP5","RP1","RP2"];
const SLOT_NAME={C:"Catcher","1B":"First base","2B":"Second base","3B":"Third base",SS:"Shortstop",LF:"Left field",CF:"Center field",RF:"Right field",DH:"Designated hitter",SP1:"Starter 1",SP2:"Starter 2",SP3:"Starter 3",SP4:"Starter 4",SP5:"Starter 5",RP1:"Closer",RP2:"Setup man"};
const POS_XY={C:[50,91],"1B":[74,61],"2B":[63,44],SS:[37,44],"3B":[26,61],LF:[19,32],CF:[50,22],RF:[81,32],SP1:[50,68],DH:[12,88]};
const WEIGHT={SP1:1.5,SP2:1.25,SP3:1.1,SP5:.95,C:1.1,SS:1.05,CF:1.05,DH:.95,RP2:.95};
const DEF_IMP={C:1.2,"1B":.5,"2B":1,"3B":.9,SS:1.3,LF:.7,CF:1.2,RF:.8};

// ---------- ratings ----------
const MONS=RAW.map(r=>({id:r[0],name:r[1],gen:r[2],types:r[3].split("/"),hp:r[4],atk:r[5],def:r[6],spa:r[7],spd:r[8],spe:r[9],shape:r[10],ht:r[11],wt:r[12],leg:!!r[13]}));
const BYID=new Map(MONS.map(m=>[m.id,m]));
const BASE=MONS.filter(m=>!m.leg);
const LEGENDS=MONS.filter(m=>m.leg);
// Shiny Pokémon: a rarer-than-legendary variant of every non-legendary, with every base stat boosted.
// A shiny gets its own id (Pokédex number + SHINY_ID) so it saves, shares and posts like any other pick.
const SHINY_ID=10000,SHINY_BOOST=1.12,SHINY_ODDS=.004;
for(const b of BASE){const s={...b,id:b.id+SHINY_ID,shiny:true,name:"Shiny "+b.name};for(const k of ["hp","atk","def","spa","spd","spe"])s[k]=Math.round(b[k]*SHINY_BOOST);MONS.push(s);BYID.set(s.id,s)}
for(const m of MONS)m.num=m.id%SHINY_ID;
// [label, arms 0-1, legs 0-1.1]
const SHAPES={1:["Head only",.1,.3],2:["Serpent",.2,.45],3:["Fish",.1,.15],4:["Head and arms",.85,.3],5:["Blob",.3,.35],6:["Upright with tail",.9,1],7:["Head and legs",.15,1],8:["Four-legged",.25,1.1],9:["Winged",.35,.85],10:["Tentacles",.6,.5],11:["Multi-body",.3,.5],12:["Humanoid",1,1],13:["Winged bug",.55,.85],14:["Armored bug",.55,.9]};
const cl=(v,a=20,b=80)=>Math.max(a,Math.min(b,v));
const SPEC=.6,BATW=.25,PROF=.5,LEAN=1.4;
const has=(m,t)=>m.types.includes(t);
const flies=m=>has(m,"flying")||m.shape===9||m.shape===13;
// Type perks: small nudges that reward Pokémon knowledge.
const PERKS={fighting:"Hitting (contact and power)",dragon:"Power",electric:"Pitch velocity",fire:"Pitch velocity",psychic:"Control and plate discipline",dark:"Baserunning and steals",ground:"Infield glove (ground balls)",rock:"Catcher durability",steel:"Catcher durability",water:"Pitcher stamina",flying:"Outfield range",ice:"Closing games",bug:"Range",normal:"Contact"};
for(const m of MONS){
  const [lab,arms,legs]=SHAPES[m.shape]||SHAPES[12];m.body=lab;m.arms=arms;m.legs=legs;
  const sz=cl(Math.log2(m.ht/10/1.5),-2,2),wt=cl(Math.log2(m.wt/10/70),-3,3);m.sz=sz;m.wl=wt;
  // A stat counts for more when it is one of this Pokémon's own strengths.
  const avg=(m.hp+m.atk+m.def+m.spa+m.spd+m.spe)/6,e={};
  for(const k of ["hp","atk","def","spa","spd","spe"])e[k]=m[k]*Math.pow(m[k]/avg,SPEC);
  const T=t=>has(m,t)?1:0;
  // What the draft screen shows: base stats with body and type effects already applied.
  const why={atk:[],spe:[],spd:[],def:[],spa:[],hp:[],ctl:[],arm:[]};
  if(arms<.5){why.atk.push("no arms");why.spa.push("no arms");why.def.push("no arms")}
  if(legs<.6)why.spe.push("no legs");else if(legs>1)why.spe.push("four legs");
  if(wt>1)why.atk.push("heavy");if(wt<-2)why.atk.push("light");if(wt>1.5)why.spe.push("heavy");
  if(arms<.5)why.spd.push("no arms");if(sz<-1)why.spd.push("tiny strike zone");if(sz>1)why.spd.push("big strike zone");if(sz>1)why.spa.push("tall");
  if(T("fighting"))why.atk.push("Fighting");if(T("dragon"))why.atk.push("Dragon");if(T("dark"))why.spe.push("Dark");
  if(T("psychic"))why.spd.push("Psychic");if(T("electric"))why.spa.push("Electric");if(T("fire"))why.spa.push("Fire");if(T("water"))why.hp.push("Water");if(T("ground"))why.def.push("Ground");
  if(legs<.6)why.hp.push("no legs");
  if(arms<.5){why.ctl.push("no arms");why.arm.push("no arms")}if(T("psychic"))why.ctl.push("Psychic");
  m.show={
    atk:Math.max(1,Math.round(m.atk*(.55+.45*arms)*(1+.08*T("fighting")+.08*T("dragon"))+8*wt)),
    spe:Math.max(1,Math.round(m.spe*Math.max(.15,Math.min(1.1,legs))*(1+.08*T("dark"))-8*Math.max(0,wt-1.5))),
    spd:Math.max(1,Math.round(m.spd*(.5+.5*arms)*(1+.08*T("psychic")+.05*T("normal"))-6*sz)),
    def:Math.max(1,Math.round(m.def*(.45+.55*Math.min(1,arms+.15))*(1+.08*T("ground")))),
    spa:Math.max(1,Math.round((m.spa+6*sz)*(.2+.8*arms)*(1+.08*(T("electric")||T("fire"))))),
    hp:Math.max(1,Math.round(m.hp*(.5+.5*Math.min(1,legs))*(1+.1*T("water"))))};
  m.why=why;
  // Display adjustments on the 40-99 scale: a multiplier toward 40 for body limits, plus points for perks.
  const F=Math.min(1,arms+.15);
  m.adj={
    atk:[.55+.45*arms,5*T("fighting")+5*T("dragon")+3*wt],
    spd:[.5+.5*arms,5*T("psychic")+3*T("normal")-3*sz],
    spe:[Math.max(.15,Math.min(1.1,legs)),5*T("dark")-5*Math.max(0,wt-1.5)],
    def:[.45+.55*F,5*T("ground")],
    spa:[.2+.8*arms,5*(T("electric")||T("fire"))+3*sz],
    hp:[.5+.5*Math.min(1,legs),5*T("water")]};
  m.raw={
    pow:(e.atk+12*wt)*(.55+.45*arms)*(1+.08*T("fighting")+.08*T("dragon")),
    con:e.spd*(.5+.5*arms)*(1+.08*T("fighting")+.05*T("normal")+.05*T("psychic")),
    eye:(e.spd-10*sz)*(1+.08*T("psychic")),
    run:(e.spe*Math.max(.15,legs)-8*Math.max(0,wt-1.5))*(1+.1*T("dark")),
    rng:(e.spe*Math.max(legs,flies(m)?1.15:0)-10*Math.max(0,wt-1))*(1+.05*T("bug")),
    glv:e.def*(.45+.55*Math.min(1,arms+.15)),
    arm:(.6*e.atk+.4*e.hp)*(.25+.75*arms),
    bulk:(e.hp+15*wt)*(1+.12*(T("rock")||T("steel"))),
    tall:sz+wt*.15,
    stf:(e.spa+6*sz)*(.2+.8*arms)*(1+.08*(T("electric")||T("fire"))),
    ctl:e.spd*(.2+.8*arms)*(1+.08*T("psychic")),
    sta:(.6*e.hp+.4*e.def)*(.5+.5*Math.min(1,legs))*(1+.1*T("water"))
  };
}
// Rank every tool against all non-legendary Pokémon onto the 20-80 scouting scale.
function rankInto(get,set){
  const vals=BASE.map(get).sort((a,b)=>a-b),N=vals.length;
  const lo=v=>{let a=0,b=N;while(a<b){const c=(a+b)>>1;vals[c]<v?a=c+1:b=c}return a};
  const hi=v=>{let a=0,b=N;while(a<b){const c=(a+b)>>1;vals[c]<=v?a=c+1:b=c}return a};
  for(const m of MONS){const v=get(m);set(m,20+60*((lo(v)+hi(v))/2/N))}
}
// ---------- scouting grades ----------
// Real 20-80 scouting grades measure standard deviations: 50 is average and every 10 points is one SD.
// Ranking by percentile instead would flatten the top, so a 5-SD defender would grade the same as the 20th best.
function zInto(get,set){
  const v=BASE.map(get),n=v.length,mu=v.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(v.reduce((a,b)=>a+(b-mu)**2,0)/n)||1;
  // Very long tails (Shuckle's Defense, Blissey's HP) are compressed past 2.5 SD so one stat can't break the game.
  for(const m of MONS){let z=(get(m)-mu)/sd;if(z>TAIL_AT)z=TAIL_AT+Math.log1p((z-TAIL_AT)*TAIL)/TAIL;if(z<-2.5)z=-2.5;set(m,z)}
}
const CL_LEV=1.8,SU_LEV=1.5,RP_PER_SD=2.2,TAIL=1.2,TAIL_AT=2.5,LG_RA9=4.5,RA9_PER_SD=1.2,BAT_RUNS=19,SPECIALIZE=.5,DH_RUNS=28,RP_CAP=4.5;
const grade=z=>Math.round(Math.max(20,Math.min(85,50+10*z)));
for(const m of MONS)m.z={};
// Stats are skewed (a few huge outliers), so grades are measured on a log scale, the way skewed stats usually are.
const LOGT=k=>k==="tall"?(m=>m.raw[k]):(m=>Math.log(Math.max(4,m.raw[k])));
for(const k of ["pow","con","eye","run","rng","glv","arm","bulk","tall","stf","ctl","sta"])zInto(LOGT(k),(m,v)=>{m.z[k]=v;m[k]=50+10*v});
// Overall power: every tool leans partly on the Pokémon's total base stats, so a fully evolved Pokémon is
// better than its baby form at nearly everything, the way raw talent lifts every part of a player's game.
const POWER=.25;
zInto(m=>Math.log(m.hp+m.atk+m.def+m.spa+m.spd+m.spe),(m,v)=>m.zTot=v);
for(const m of MONS)for(const k in m.z)if(k!=="tall")m.z[k]=(1-POWER)*m.z[k]+POWER*m.zTot;
for(const m of MONS){const z=m.z;
  z.tdp=.5*z.rng+.5*z.glv-.25*Math.max(0,m.wl);   // turning two: quick feet and sure hands
  z.cab=.7*z.bulk+.3*z.glv;                       // catcher ability: size, durability, blocking
}
// ---------- value in runs ----------
// Like WAR: every player is worth runs with the bat, runs with the glove at his spot, or runs saved on the mound.
// Runs are comparable across positions, so an 85 at shortstop and an 85 at first base are worth the same.
// Batting: contact and power drive most of it, plate discipline and speed the rest. These weights are what each
// tool is actually worth in runs in the game's own at-bat simulation (measured over 1,000+ simulated hitter seasons).
zInto(m=>.40*m.z.con+.34*m.z.pow+.15*m.z.eye+.11*m.z.run,(m,v)=>m.zBat=v);
// A DH is a full-time specialist: the slot exists for the best pure hitters, so it counts every run of bat
// value a little more than a fielder's bat. That gives elite sluggers a real home instead of burying them.
for(const m of MONS){m.batR=BAT_RUNS*m.zBat;m.dhR=DH_RUNS*m.zBat}
// Fielding: component weights follow Out of the Park Baseball's position formulas (range rules CF and SS,
// arm matters most at 3B and RF, first base rewards height). Each spot's run spread follows the defensive
// spectrum: a great or awful shortstop swings far more runs than a great or awful first baseman.
const FW={
  C:{cab:.75,arm:.25},
  "1B":{glv:.5,tall:.3,rng:.1,arm:.05,tdp:.05},
  "2B":{glv:.4,tdp:.35,rng:.2,arm:.05},
  SS:{rng:.45,arm:.3,tdp:.15,glv:.1},
  "3B":{arm:.45,glv:.35,rng:.2},
  LF:{rng:.55,glv:.25,arm:.2},
  CF:{rng:.9,arm:.05,glv:.05},
  RF:{arm:.55,rng:.45}};
// Spreads still follow the defensive spectrum, but narrower than real baseball: every Pokémon can play anywhere,
// so a wide spectrum would hand most of the stars to catcher and shortstop.
const FSPREAD={C:13,SS:13,CF:18,"2B":13.5,"3B":11,RF:13,LF:12.5,"1B":10.5};
// Body: big heavy builds suit catcher and the corners, light quick ones the middle of the field.
// Infielders and catchers field with their hands and throw across the diamond, so missing arms costs a lot there.
const PZ=x=>Math.max(0,x);
const BODY3={
  C:m=>.55*m.wl+.2*m.sz-(m.ht<7?1.2:0)-1.2*(1-m.arms),
  "1B":m=>-1*(1-m.arms),
  "2B":m=>-.4*PZ(m.wl)+.15*PZ(-m.wl)-1.2*(1-m.arms),
  SS:m=>-.35*PZ(m.wl)-.2*PZ(m.sz)-1.4*(1-m.arms),
  "3B":m=>.15*m.wl-1.2*(1-m.arms),
  LF:m=>.3*Math.min(1.5,PZ(m.wl))-.3*PZ(m.wl-2)+(flies(m)?.1:0),
  CF:m=>-.6*PZ(m.wl)+(flies(m)?.3:0),
  RF:m=>-.2*PZ(m.wl)+(flies(m)?.1:0)};
for(const m of MONS){m.pd={};m.fldR={};m.fraw={}}
for(const pos in FW)zInto(m=>{let s=0;for(const k in FW[pos])s+=FW[pos][k]*m.z[k];return s+BODY3[pos](m)+(["1B","2B","3B","SS"].includes(pos)&&has(m,"ground")?.3:0)},
  (m,v)=>{m.fraw[pos]=v});
// Fielding is graded partly against the Pokémon's own average glove, the way real players have a position:
// a slugger who is a fine first baseman can still be a poor shortstop. Without this, any fully evolved
// Pokémon looked average-or-better everywhere, because the comparison included every weak pre-evolution.
for(const m of MONS){const v=Object.values(m.fraw);m.fmean=v.reduce((a,b)=>a+b,0)/v.length}
// Only good all-around athletes are pulled down at their weaker spots. A Pokémon that's poor almost everywhere
// isn't boosted at its one decent spot, so a single extreme stat (Shuckle's Defense) can't make a star.
for(const pos in FW)zInto(m=>m.fraw[pos]-SPECIALIZE*Math.max(0,m.fmean),(m,v)=>{m.pd[pos]=50+10*v;m.fldR[pos]=FSPREAD[pos]*v});
// Redistribute defensive strengths while retaining each Pokémon's best fielding value.
// The original model above anchors card strength, including shinies and legends.
const POSITION_WEIGHTS={...FW,CF:{rng:.7,glv:.2,arm:.1}};
const POSITION_SPREAD={...FSPREAD,CF:14};
for(const m of MONS){m.fieldPeak=Math.max(...Object.values(m.fldR));m.positionRaw={};m.positionRuns={}}
for(const pos in POSITION_WEIGHTS)zInto(m=>{
  let v=0;for(const k in POSITION_WEIGHTS[pos])v+=POSITION_WEIGHTS[pos][k]*m.z[k];
  const body=pos==='CF'?-.6*PZ(m.wl):BODY3[pos](m);
  return v+body+(['1B','2B','3B','SS'].includes(pos)&&has(m,'ground')?.3:0);
},(m,v)=>{m.positionRaw[pos]=v});
for(const m of MONS)m.positionMean=Object.values(m.positionRaw).reduce((a,b)=>a+b,0)/8;
for(const pos in POSITION_WEIGHTS)zInto(m=>m.positionRaw[pos]-SPECIALIZE*Math.max(0,m.positionMean),(m,v)=>{m.positionRuns[pos]=POSITION_SPREAD[pos]*v});
for(const m of MONS){
  const adjustment=m.fieldPeak-Math.max(...Object.values(m.positionRuns));
  for(const pos in POSITION_WEIGHTS){m.fldR[pos]=m.positionRuns[pos]+adjustment;m.pd[pos]=50+10*m.fldR[pos]/POSITION_SPREAD[pos]}
}
// Starters win with command and durability: Control slightly over Stuff, and Stamina sets how many innings they give.
zInto(m=>.45*m.z.stf+.55*m.z.ctl,(m,v)=>m.zPit=v);
// Relievers throw one max-effort inning: Stuff and velocity (Speed) matter, Control and Stamina barely do.
// So fast, powerful arms close, and slow, durable tanks belong in the rotation.
for(const m of MONS)m.z.vel=0;
zInto(m=>Math.log(Math.max(4,m.spe*Math.max(.15,Math.min(1,m.arms+.1)))),(m,v)=>m.z.vel=v);
// Closer and setup man are the same job, so a reliever has one rating for both.
zInto(m=>.6*m.z.stf+.1*m.z.ctl+.3*m.z.vel+(has(m,"ice")?.3:0),(m,v)=>m.zRp=v);
for(const m of MONS){
  const ra9=Math.max(1.5,LG_RA9-RA9_PER_SD*m.zPit),ip=Math.max(110,Math.min(230,180+40*m.z.sta));
  m.spRA9=ra9;m.spIP=ip;m.spR=(LG_RA9-ra9)*ip/9;
  // Runs saved per 9 innings of relief. It bends smoothly toward a ceiling instead of hitting a hard floor,
  // so the very best relievers still separate from each other.
  const raw=RP_PER_SD*m.zRp,saved=raw<=2?raw:2+RP_CAP*Math.tanh((raw-2)/RP_CAP);
  // The closer slot counts more in the team's record because ninth-inning outs swing more games.
  m.clR=saved*65/9*CL_LEV;
  m.suR=saved*70/9*SU_LEV;
  m.rpR=saved*67.5/9*(CL_LEV+SU_LEV)/2;   // the reliever rating shown for both slots
}
// Position specialization: modest tool-based advantages, never a forced position quota.
for(const m of MONS){const oldPeak=Math.max(m.dhR,m.spR,m.rpR,...Object.values(m.fldR).map(v=>m.batR+v));
m.preservedPeak=oldPeak;
const z=m.z;
const bonuses={'1B':8*z.tall+5*z.glv+3*z.bulk,'3B':12*z.arm+8*z.glv,RF:9*z.arm,SS:5*z.glv+4*z.rng+4*m.arms,'2B':0,C:-3,CF:-14,LF:0};
for(const p in m.fldR)m.fldR[p]+=bonuses[p]*0.25;
const penalty=5*Math.max(0,z.vel-z.ctl)+3*Math.max(0,z.stf-z.ctl);m.rpR-=penalty*0.25;m.clR-=penalty*0.25;m.suR-=penalty*0.25;
const newPeak=Math.max(m.dhR,m.spR,m.rpR,...Object.values(m.fldR).map(v=>m.batR+v)),delta=oldPeak-newPeak;
for(const p in m.fldR){m.fldR[p]+=delta;m.pd[p]=50+10*m.fldR[p]/POSITION_SPREAD[p]}
m.dhR+=delta;m.spR+=delta;m.rpR+=delta;m.clR+=delta;m.suR+=delta;
}
// Runs a Pokémon is worth at one slot, relative to an average player there.
function slotRuns(m,slot){
  if(slot==="DH")return m.dhR;
  if(slot.startsWith("SP"))return m.spR;
  if(slot==="RP1")return m.clR;
  if(slot==="RP2")return m.suR;
  return m.batR+m.fldR[slot];
}
// A Pokémon's natural spot is where it stands out most compared with everyone else at that spot,
// the way a scout would label a prospect, rather than where it happens to swing the most runs.
const SPOT_SD={};
for(const s of [...FIELD_SLOTS,"SP1","RP1","RP2"]){const v=BASE.map(m=>slotRuns(m,s)),mu=v.reduce((a,b)=>a+b,0)/v.length;SPOT_SD[s]=[mu,Math.sqrt(v.reduce((a,b)=>a+(b-mu)**2,0)/v.length)||1]}
const standing=(m,s)=>(slotRuns(m,s)-SPOT_SD[s][0])/SPOT_SD[s][1];
// DH is the fallback anyone can fill, so it's only a natural spot for Pokémon that can't field anywhere.
function naturalSpot(m,spots){
  const field=spots.filter(s=>s!=="DH");let b=-1e9,best=field[0];
  for(const s of field){const v=standing(m,s);if(v>b){b=v;best=s}}
  if(spots.includes("DH")&&slotRuns(m,"DH")>slotRuns(m,best))return "DH";
  return best}
// The rating shown at a spot. Relievers show their one reliever rating at both CL and SU.
function slotRating(m,s){return ovr99(s.startsWith("RP")?m.rpR:slotRuns(m,s))}
const fitKey=s=>s.startsWith("SP")?"SP":s.startsWith("RP")?"CL":s;
function fit(m,slot){return slotRuns(m,slot)}
function glove(m,pos){return m.pd[pos]??50}
// Display ratings: each category ranked across non-legendary Pokémon onto 40-99,
// curved so most Pokémon sit in the 55-80 range like a sports video game.
function rank99(get,set){
  const vals=BASE.map(get).sort((a,b)=>a-b),N=vals.length;
  const lo=v=>{let a=0,b=N;while(a<b){const c=(a+b)>>1;vals[c]<v?a=c+1:b=c}return a};
  const hi=v=>{let a=0,b=N;while(a<b){const c=(a+b)>>1;vals[c]<=v?a=c+1:b=c}return a};
  for(const m of MONS){const v=get(m);const p=(lo(v)+hi(v))/2/N;set(m,Math.round(Math.min(99,40+59*Math.pow(p,.85)+(v>vals[N-1]?3:0))))}
}
// Overall numbers on the familiar 40-99 scale come straight from runs, so they mean the same thing at every spot.
const OVR_MID=63,OVR_PER_RUN=.7;
// Above 90 the scale bends so 99 stays rare: each extra run adds less, and only true outliers (mostly legendaries) reach 99.
const KNEE=90,CEIL=104;
const ovr99=r=>{const v=OVR_MID+OVR_PER_RUN*r;return Math.round(Math.max(40,Math.min(99,v<=KNEE?v:KNEE+(CEIL-KNEE)*(1-Math.exp(-(v-KNEE)/(CEIL-KNEE))))))};
// Stat bars use the same 40-99 curve as the overalls: R=30 so a blend of the bars lands close to the overall (elite all-around players earn a small bonus),
// so bars and overalls are on one scale. rb is the plain base stat on the same scale, so arrows show where body and type moved it.
const BAR_RUNS=30,BAR=z=>ovr99(BAR_RUNS*z);
// The DEF box is picked from each Pokémon's best spot, so it keeps the gentler 14-per-SD grade or most cards would read 90+.
const GLOVE=z=>Math.round(Math.max(40,Math.min(99,64+14*z)));
const BAR_TOOL={atk:"pow",spd:"con",spe:"run",def:"glv",spa:"stf",hp:"sta"};
for(const m of MONS){m.r={};m.rb={}}
for(const k in BAR_TOOL)zInto(m=>Math.log(m[k]),(m,v)=>m.rb[k]=BAR(v));
for(const m of MONS)for(const k in BAR_TOOL)m.r[k]=BAR(m.z[BAR_TOOL[k]]);
// Control has its own bar (Sp. Def base, like Contact, but its own body and type adjustments).
for(const m of MONS){m.r.ctl=BAR(m.z.ctl);m.rb.ctl=m.rb.spd}
// Arm gets a bar too: it drives catcher, third base, shortstop and right field, and was the biggest hidden input.
zInto(m=>Math.log(.6*m.atk+.4*m.hp),(m,v)=>m.rb.arm=BAR(v));
for(const m of MONS)m.r.arm=BAR(m.z.arm);
for(const m of MONS){
  m.hitO=.3*m.r.atk+.3*m.r.spd+.2*m.r.spe+.2*m.r.def;
  m.pitO=.55*m.r.spa+.25*m.r.hp+.2*m.r.spd;
  m.role=m.hitO>=m.pitO?"Hitter":"Pitcher";
}
// Hit and Pitch overalls come straight from the game's own hitting and pitching value,
// so a high Pitch number really means a good starter. Fielding fit stays hidden.
for(const m of MONS){m.hovr=ovr99(m.dhR);m.povr=ovr99(m.spR)}
for(const m of MONS){m.ovr=Math.max(m.hovr,m.povr);m.role=m.hovr>=m.povr?"Hitter":"Pitcher"}
function filler(name,g){const f={id:0,name,types:["normal"],shape:12,ht:18,wt:800,body:"Humanoid",arms:1,pow:g,con:g,eye:g,run:g,arm:g,stf:g,ctl:g,sta:g,bat:g,pd:{},fit:{DH:g,SP:g,CL:g}};for(const p in FW){f.pd[p]=g}return f}
const g5=g=>Math.max(20,Math.min(80,Math.round(g/5)*5));
const gcls=g=>g>=57?"g-good":g<43?"g-bad":"g-mid";
const dex=id=>String(id).padStart(3,"0");
const GL={
1:'<circle cx="12" cy="12" r="7.5"/>',
2:'<path d="M4 19c5 0 4-7 8-7s3-6 7-6" fill="none" stroke-width="3.4" stroke-linecap="round"/><circle cx="19.5" cy="5.5" r="2.8"/>',
3:'<ellipse cx="10.5" cy="12" rx="6.5" ry="4.3"/><path d="M16 12l5-4.5v9z"/>',
4:'<circle cx="12" cy="10" r="5.5"/><path d="M7 11.5 3.5 16M17 11.5l3.5 4.5" fill="none" stroke-width="2.6" stroke-linecap="round"/>',
5:'<path d="M5 19c-2-6 1-11 6-12.5 6-1.6 9 3 8.5 7.5-.4 4-3 5-6.5 5z"/>',
6:'<circle cx="11" cy="5.5" r="3.4"/><ellipse cx="11" cy="13" rx="4.2" ry="5"/><path d="M9 17.5 8 21.5M13 17.5l1 4M14.5 15.5 21 19.5M7 11l-3 2.5M15 11l3 2" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
7:'<circle cx="12" cy="9.5" r="6.3"/><path d="M9.3 15.3 8.3 21M14.7 15.3l1 5.7" fill="none" stroke-width="2.6" stroke-linecap="round"/>',
8:'<ellipse cx="11" cy="12" rx="7" ry="3.8"/><circle cx="18.5" cy="7.5" r="3"/><path d="M6 15v5M9.5 15.5v4.5M13 15.5v4.5M16 15v5" fill="none" stroke-width="2" stroke-linecap="round"/>',
9:'<ellipse cx="12" cy="14" rx="3.2" ry="4.6"/><circle cx="12" cy="8" r="2.4"/><path d="M9 12 2 6l3 9zM15 12l7-6-3 9z"/>',
10:'<path d="M5 12a7 7 0 0 1 14 0z"/><path d="M7 12c0 3-2 4-1 8M10.3 12c0 3-1 5 0 8.5M13.7 12c0 3 1 5 0 8.5M17 12c0 3 2 4 1 8" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
11:'<circle cx="7.5" cy="9" r="3.8"/><circle cx="16.5" cy="9" r="3.8"/><circle cx="12" cy="16.5" r="3.8"/>',
12:'<circle cx="12" cy="4.8" r="2.9"/><path d="M12 8.5v7M6 11h12M12 15.5l-4 5.5M12 15.5l4 5.5" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
13:'<ellipse cx="12" cy="14.5" rx="2.6" ry="5.5"/><ellipse cx="7" cy="9" rx="4.6" ry="2.6" transform="rotate(-25 7 9)" opacity=".85"/><ellipse cx="17" cy="9" rx="4.6" ry="2.6" transform="rotate(25 17 9)" opacity=".85"/>',
14:'<ellipse cx="12" cy="12.5" rx="6.2" ry="7.3"/><path d="M5.5 9 2.5 7.5M5.5 13H2M5.5 17l-3 1.5M18.5 9l3-1.5M18.5 13H22M18.5 17l3 1.5" fill="none" stroke-width="1.8" stroke-linecap="round"/><path d="M12 6v13" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>'};
function glyph(shape){return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="#fff" stroke="#fff" stroke-width="0">${GL[shape]||GL[12]}</svg>`}
function tok(m,inner=""){const c=TYPE_COLORS[m.types[0]]||"#777",c2=TYPE_COLORS[m.types[1]]||c;return `<span class="tok" style="--c1:${c};--c2:${c2}">${glyph(m.shape)}${inner}</span>`}
const cap=t=>t[0].toUpperCase()+t.slice(1);
function ftin(dm){const i=Math.round(dm*3.937);return `${Math.floor(i/12)}'${i%12}"`}
const lbs=hg=>Math.round(hg*.2205)
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));


// ---------- rng ----------
function rngFrom(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(arr,r){for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

// ---------- pools ----------
// One spin per type and region. A region with too few Pokémon of a type is merged with its smaller
// neighbor (Dragon: Kanto + Johto), so every non-legendary Pokémon can be drafted and every spin
// offers at least POOL_MIN choices.
const POOL_MIN=4,POOLS=[];
for(const t of Object.keys(TYPE_COLORS)){
  const G=[1,2,3,4].map(g=>({gens:[g],ids:BASE.filter(m=>m.gen===g&&has(m,t)).map(m=>m.id)})).filter(x=>x.ids.length);
  for(;;){const i=G.findIndex(x=>x.ids.length<POOL_MIN);if(i<0||G.length<2)break;
    const L=G[i-1],R=G[i+1],j=!L?i+1:!R?i-1:(L.ids.length<=R.ids.length?i-1:i+1),a=Math.min(i,j);
    G.splice(a,2,{gens:[...G[a].gens,...G[a+1].gens],ids:[...G[a].ids,...G[a+1].ids]})}
  for(const x of G){
    // A merged region is named like a region of its own ("Kanto + Johto", Gen "1–2") so every screen shows it as one.
    const gen=x.gens.length>1?`${x.gens[0]}–${x.gens[x.gens.length-1]}`:x.gens[0];
    if(x.gens.length>1)REGIONS[gen]=x.gens.map(g=>REGIONS[g]).join(" + ");
    POOLS.push({key:t+"|"+x.gens.join("-"),type:t,gen,gens:x.gens,ids:x.ids});
  }
}
const gensOf=p=>p.gens||[p.gen];
const shareRegion=(a,b)=>gensOf(a).some(g=>gensOf(b).includes(g));
const LEGEND_ODDS=.015; // chance any full spin turns into a Legend spin (max one per run)
function makeRun(mode,size,showStats,seed){
  return{mode,size,showStats,seed,draws:0,used:[],legendUsed:false,slots:{},picks:[],rerolls:2,lockUsed:false,spin:null,selected:null,moving:null,result:null,day:mode==="daily"?today():null};
}
// Every random draw comes from the run's seed and a counter, so daily runs replay the same way after a reload.
function rand(run){return rngFrom(hash(run.seed+":"+(run.draws++)))()}
function poolSpin(run,filter){
  const opts=POOLS.filter(p=>!run.used.includes(p.key)&&(!filter||filter(p)));
  if(!opts.length)return null;
  const p=opts[Math.floor(rand(run)*opts.length)];run.used.push(p.key);
  // Any pool can hide one shiny. Rarer than a Legend spin: well under 1 in 10 runs sees one.
  let ids=p.ids,shiny=false;
  if(rand(run)<SHINY_ODDS){ids=ids.slice();ids[Math.floor(rand(run)*ids.length)]+=SHINY_ID;shiny=true}
  return{legend:false,shiny,key:p.key,type:p.type,gen:p.gen,gens:p.gens,ids};
}
function nextSpin(run){
  if(!run.legendUsed&&rand(run)<LEGEND_ODDS){
    run.legendUsed=true;
    const ids=LEGENDS.map(m=>m.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(rand(run)*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
    return{legend:true,ids:ids.slice(0,10).sort((a,b)=>a-b)};
  }
  return poolSpin(run)||poolSpin({...run,used:[]});
}
// Pack mode: rip a pack of 5 random non-legendary Pokémon from every type and region (none already on your team).
// Any card can be shiny at the usual odds, and rarely a legendary rides along as a bonus 6th card (once per run).
const PACK_SIZE=5;
function packSpin(run,taken){
  const pool=BASE.filter(m=>!taken.includes(m.num)).map(m=>m.id);
  for(let i=0;i<PACK_SIZE;i++){const j=i+Math.floor(rand(run)*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]]}
  const ids=pool.slice(0,PACK_SIZE);let shiny=false,bonus=null;
  if(rand(run)<SHINY_ODDS){ids[Math.floor(rand(run)*PACK_SIZE)]+=SHINY_ID;shiny=true}
  if(!run.legendUsed&&rand(run)<LEGEND_ODDS){const ls=LEGENDS.filter(m=>!taken.includes(m.num));if(ls.length){run.legendUsed=true;bonus=ls[Math.floor(rand(run)*ls.length)].id;ids.push(bonus)}}
  run.packs=(run.packs||0)+1;
  return{pack:true,legend:false,shiny,bonus,n:run.packs,ids};
}
// Lock one half of the spin and redraw the other. Free, once per pick.
function lockSpin(run,keep){
  const sp=run.spin;if(!sp||sp.legend)return null;
  return poolSpin(run,keep==="type"?p=>p.type===sp.type&&!shareRegion(p,sp):p=>shareRegion(p,sp)&&p.type!==sp.type);
}
function canLock(run,keep){
  const sp=run.spin;if(!sp||sp.legend||run.lockUsed)return false;
  return POOLS.some(p=>!run.used.includes(p.key)&&(keep==="type"?p.type===sp.type&&!shareRegion(p,sp):shareRegion(p,sp)&&p.type!==sp.type));
}

// ---------- lineup ----------
// Hitting tools in standard deviations: contact, power, eye, speed, and overall bat.
function hitTools(m){const z=m.z||{};const g=k=>z[k]??(m[k]-50)/10;return{con:g("con"),pow:g("pow"),eye:g("eye"),run:g("run"),bat:m.zBat??0,obp:.55*g("eye")+.45*g("con")}}
// Each hitter gets one archetype from his strongest tool, the way scouts label prospects.
function archetype(m){
  const t=hitTools(m);
  if(t.bat>=1.3&&t.pow>=.9&&t.con>=.9)return"Complete hitter";
  if(t.bat<-.4)return"Glove first";
  const top=[["pow","Slugger"],["con","Contact hitter"],["eye","On-base threat"],["run","Speedster"]].sort((a,b)=>t[b[0]]-t[a[0]])[0];
  return t[top[0]]>=.4?top[1]:"Balanced";
}
// Batting order the way modern analytics build it: on-base and speed lead off, the best all-around bats
// hit 2nd and 3rd, the most power cleans up, a run producer protects him, and a fast bat turns the lineup over at 9.
const LINEUP_ROLE=["Leadoff","Best bat","Run producer","Cleanup","Protection","Depth","Depth","Depth","Second leadoff"];
function buildLineup(hitters){
  const pool=hitters.slice(),order=new Array(9);
  const take=f=>{let b=pool[0];for(const h of pool)if(f(h.t)>f(b.t))b=h;pool.splice(pool.indexOf(b),1);return b};
  order[0]=take(t=>t.obp+t.run+.15*t.bat);
  order[3]=take(t=>t.pow+.3*t.bat);
  order[1]=take(t=>t.bat+.2*t.obp);
  order[2]=take(t=>t.bat);
  order[4]=take(t=>t.bat+.3*t.pow);
  // The 9 hole goes to the fastest remaining bat if there is one, otherwise the weakest.
  const fast=pool.reduce((a,h)=>h.t.run>a.t.run?h:a,pool[0]);
  if(fast.t.run>=.5){order[8]=fast;pool.splice(pool.indexOf(fast),1)}
  else{const w=pool.reduce((a,h)=>h.t.bat<a.t.bat?h:a,pool[0]);order[8]=w;pool.splice(pool.indexOf(w),1)}
  for(let i=5;i<8;i++)order[i]=take(t=>t.bat);
  order.forEach((h,i)=>{h.slot=i+1;h.role=LINEUP_ROLE[i]});
  return order;
}

// A roster bonus, never multiplied by the number of legends.
function legendaryPresence(slots){return Object.values(slots).some(m=>m?.leg)?1:0}
function rosterRating(slots,list){const filled=list.filter(s=>slots[s]);return filled.length?Math.min(99,ovr99(filled.reduce((r,s)=>r+slotRuns(slots[s],s),0)/filled.length)+legendaryPresence(slots)):null}

// ---------- simulation ----------
const Z=g=>(g-50)/14;
// The game sim reads each tool in standard deviations, the same grades the ratings use.
const zOf=(m,k)=>m.z&&m.z[k]!=null?m.z[k]:((m[k]??m.stf??50)-50)/10;
const SIMP={k:.16,kS:.45,kC:.26,bb:.07,bbE:.95,bbC:.5,hr:.032,hrP:.95,hrS:.7,ba:.338,baC:.03,baS:.022,baD:.025,baP:.018,xb:.07,st:.07,stS:1.35,stMax:.6,sb0:.74,sbS:.08};
function simTeam(slots,name,track){
  const hitters=FIELD_SLOTS.map(pos=>{const m=slots[pos]||filler("Fill-in",40);const t=hitTools(m);return{m,pos,zCon:t.con,zPow:t.pow,zEye:t.eye,zSpd:t.run,t,arch:archetype(m),st:{pa:0,ab:0,h:0,d:0,t:0,hr:0,r:0,rbi:0,bb:0,k:0,sb:0,cs:0}}});
  const presence=legendaryPresence(slots)*.025;
  hitters.forEach(h=>{h.zCon+=presence;h.zPow+=presence;h.zEye+=presence});
  const order=buildLineup(hitters);
  let dsum=0,dw=0;for(const pos of FIELD_SLOTS){if(pos==="DH")continue;dsum+=glove(slots[pos]||filler("",40),pos)*DEF_IMP[pos];dw+=DEF_IMP[pos]}
  // Relievers air it out for one inning, so velocity adds to their stuff in the game sim too.
  const mkP=(m,role)=>({m,role,zStf:role.startsWith("SP")||role==="FILL"?zOf(m,"stf"):.75*zOf(m,"stf")+.35*zOf(m,"vel"),zCtl:zOf(m,"ctl")+presence,zSta:zOf(m,"sta"),st:{g:0,gs:0,w:0,l:0,sv:0,outs:0,h:0,r:0,bb:0,k:0,hr:0}});
  const rot=["SP1","SP2","SP3","SP4","SP5"].filter(s=>slots[s]).map(s=>mkP(slots[s],s));
  while(rot.length<5)rot.push(mkP(filler("Spot starter",45),"FILL"));
  return{name,track,order,hitters,defZ:Z(dsum/dw),armZ:Z((slots.C||filler("",40)).arm),
    rot,cl:mkP(slots.RP1||filler("Closer",45),"RP1"),pen:slots.RP2?mkP(slots.RP2,"RP2"):mkP(filler("Bullpen",50),"PEN"),bulk:mkP(filler("League-average relief",50),"BULK"),
    rotI:0,w:0,l:0,rs:0,ra:0};
}
function pa(b,p,defZ,fat,r){
  // Pitchers matter as much here as in the ratings: Stuff drives strikeouts, weak contact and fewer homers; Control limits walks.
  const pS=Math.max(-1.5,p.zStf)-fat,pC=Math.max(-1.5,p.zCtl)-fat*.6;
  const P=SIMP,pQ=.45*pS+.55*pC;   // command: location keeps the ball in the park and off the barrel, same mix as the starter rating
  // Contact cuts strikeouts and lifts batting average on balls in play; eye draws walks; power hits homers.
  const k=Math.min(.45,P.k*Math.exp(P.kS*pS-P.kC*b.zCon));
  const bb=Math.min(.22,P.bb*Math.exp(P.bbE*b.zEye-P.bbC*pC));
  const hr=Math.min(.10,P.hr*Math.exp(P.hrP*b.zPow-P.hrS*pQ));
  const hbp=.009;
  let x=r();
  if(x<k)return"K";x-=k;
  if(x<bb)return"BB";x-=bb;
  if(x<hbp)return"BB";x-=hbp;
  if(x<hr)return"HR";
  // Pitchers already affect strikeouts and home runs. Keep their extra BABIP
  // effect modest so strong contact/power cards are not suppressed twice.
  const babip=Math.max(.22,Math.min(.38,P.ba+P.baC*b.zCon+P.baS*b.zSpd-P.baD*defZ-P.baP*pQ));
  if(r()<babip){const y=r(),t=.022+.018*Math.max(0,b.zSpd),d=.2+SIMP.xb*b.zPow;return y<t?"3B":y<t+d?"2B":"1B"}
  return"OUT";
}
function playGame(away,home,r){
  const teams=[away,home];
  const score=[0,0];
  const g={};
  for(const i of [0,1]){
    const t=teams[i];const sp=t.rot[t.rotI%5];t.rotI++;
    g[i]={idx:0,cur:sp,sp,bf:0,spOuts:0,reliefOuts:0,limit:Math.round(Math.max(18,Math.min(29,23+3*sp.zSta))),spRuns:0,spExit:null,clIn:null,last:sp,used:new Set([sp])};
    sp.st.gs++;sp.st.g++;
  }
  const changeTo=(fi,np)=>{const f=g[fi];if(f.cur===f.sp)f.spExit=score[fi]-score[1-fi];f.cur=np;f.last=np;f.reliefOuts=0;if(!f.used.has(np)){f.used.add(np);np.st.g++;np.previousGame=np.lastGame;np.lastGame=teams[fi].rotI}};
  let inning=1,over=false;
  while(!over){
    for(const bi of [0,1]){
      const fi=1-bi,bt=teams[bi],ft=teams[fi],f=g[fi],B=g[bi];
      if(bi===1&&inning>=9&&score[1]>score[0]){over=true;break}
      // The drafted late-inning arms are one-inning relievers, not the entire bullpen.
      // Unrepresented relief work is covered by an average, unlisted staff.
      const rest=p=>ft.rotI-(p.lastGame??0);
      const available=p=>p.m.id&&p.st.outs<(p.role==='RP2'?255:240)&&p.st.g<(p.role==='RP2'?85:80)&&!f.used.has(p)&&!(p.lastGame===ft.rotI-1&&p.previousGame===ft.rotI-2);
      if(f.cur!==f.sp&&f.reliefOuts>=3)changeTo(fi,ft.bulk);
      const lead=score[fi]-score[bi];
      // Save/hold opportunities come first. Idle late-inning arms also get
      // occasional tune-up work instead of waiting indefinitely for a close lead.
      if(inning>=9&&f.clIn===null&&available(ft.cl)&&((lead>=1&&lead<=3)||(lead===0&&fi===1)||(inning===9&&((lead>=-1&&lead<=4&&rest(ft.cl)>=2)||rest(ft.cl)>=4)))){changeTo(fi,ft.cl);f.clIn=lead;f.clInning=inning}
      else if(inning===8&&ft.pen.role==='RP2'&&available(ft.pen)&&((lead>=-1&&lead<=4)||rest(ft.pen)>=4))changeTo(fi,ft.pen);
      let outs=0;const bases=[null,null,null];
      if(inning>9){bases[1]=bt.order[(B.idx+8)%9]}
      while(outs<3){
        // starter hook
        if(f.cur===f.sp&&(f.bf>=f.limit||f.spOuts>=21||f.sp.st.outs>=675||(f.spRuns>=6&&inning>=3)))changeTo(fi,ft.bulk);
        if(f.cur!==f.sp&&f.cur!==ft.bulk&&f.reliefOuts>=3)changeTo(fi,ft.bulk);
        const p=f.cur;
        // steal
        const ru=bases[0];
        // Fast runners try to steal far more often, and make it more often.
        if(ru&&!bases[1]&&outs<2&&r()<Math.min(SIMP.stMax,SIMP.st*Math.exp(SIMP.stS*Math.max(-1.5,ru.zSpd)))){
          if(r()<Math.max(.5,Math.min(.92,SIMP.sb0+SIMP.sbS*ru.zSpd-.05*ft.armZ))){bases[1]=ru;bases[0]=null;if(bt.track)ru.st.sb++}
          else{bases[0]=null;outs++;if(bt.track)ru.st.cs++;if(ft.track)p.st.outs++;if(p===f.sp)f.spOuts++;else f.reliefOuts++;continue}
        }
        const b=bt.order[B.idx%9];B.idx++;
        const fat=(p===f.sp&&f.bf>f.limit-5)?.35:0;
        f.bf+=p===f.sp?1:0;
        const o=pa(b,p,ft.defZ,fat,r);
        let runs=0;const scored=[];
        const adv=(n)=>{ // force advance for walks
          if(n==="BB"){if(bases[0]){if(bases[1]){if(bases[2])scored.push(bases[2]);bases[2]=bases[1]}bases[1]=bases[0]}bases[0]=b}
        };
        let outMade=false;
        if(o==="K"){outMade=true;if(bt.track){b.st.k++;}if(ft.track)p.st.k++}
        else if(o==="BB"){adv("BB");if(ft.track)p.st.bb++;if(bt.track)b.st.bb++}
        else if(o==="HR"){for(const x of bases)if(x)scored.push(x);bases.fill(null);scored.push(b)}
        else if(o==="3B"){for(const x of bases)if(x)scored.push(x);bases.fill(null);bases[2]=b}
        else if(o==="2B"){if(bases[2])scored.push(bases[2]);if(bases[1])scored.push(bases[1]);let n3=null;if(bases[0]){if(r()<.4+.15*bases[0].zSpd)scored.push(bases[0]);else n3=bases[0]}bases[0]=null;bases[1]=b;bases[2]=n3}
        else if(o==="1B"){
          if(bases[2])scored.push(bases[2]);let n3=null,n2=null;
          if(bases[1]){if(r()<.6+.15*bases[1].zSpd)scored.push(bases[1]);else n3=bases[1]}
          if(bases[0]){if(!n3&&r()<.28+.1*bases[0].zSpd)n3=bases[0];else n2=bases[0]}
          bases[0]=b;bases[1]=n2;bases[2]=n3;
        }else{ // ball in play out
          outMade=true;
          if(bases[0]&&outs<2&&r()<.13*(1-.35*b.zSpd)){outs++;bases[0]=null;if(ft.track)p.st.outs++;if(p===f.sp)f.spOuts++;else f.reliefOuts++}
          else if(outs<2){if(bases[2]&&r()<.45){scored.push(bases[2]);bases[2]=null}if(bases[1]&&!bases[2]&&r()<.3){bases[2]=bases[1];bases[1]=null}}
        }
        if(o!=="BB"&&bt.track){b.st.ab++}
        if(bt.track){b.st.pa++;if(o==="1B"||o==="2B"||o==="3B"||o==="HR")b.st.h++;if(o==="2B")b.st.d++;if(o==="3B")b.st.t++;if(o==="HR")b.st.hr++}
        if(ft.track){if(o==="1B"||o==="2B"||o==="3B"||o==="HR")p.st.h++;if(o==="HR")p.st.hr++}
        if(outMade){outs++;if(ft.track)p.st.outs++;if(p===f.sp)f.spOuts++;else f.reliefOuts++}
        if(outs>=3&&o==="OUT"){scored.length=0}
        runs=scored.length;
        if(runs){score[bi]+=runs;if(p===f.sp)f.spRuns+=runs;if(ft.track)p.st.r+=runs;if(bt.track){for(const s of scored)s.st.r++;if(!(o==="OUT"&&outs>=3))b.st.rbi+=runs}}
        if(bi===1&&inning>=9&&score[1]>score[0]){over=true;break}
      }
      if(over)break;
      if(bi===1&&inning>=9&&score[0]!==score[1]){over=true;break}
      if(inning>=20&&bi===1){score[r()<.5?0:1]++;over=true;break}
    }
    inning++;
  }
  // decisions
  const wi=score[1]>score[0]?1:0,li=1-wi;
  for(const i of [0,1]){
    const t=teams[i],f=g[i];if(!t.track)continue;
    if(f.spExit===null)f.spExit=score[i]-score[1-i];
    if(i===wi){
      const wp=(f.spOuts>=15&&f.spExit>0)?f.sp:f.last;wp.st.w++;
      if(f.clIn!==null&&f.clIn>=1&&f.clIn<=3&&f.last===t.cl&&wp!==t.cl)t.cl.st.sv++;
    }else{
      if(f.spExit<0)f.sp.st.l++;else f.last.st.l++;
    }
  }
  for(const i of [0,1]){const t=teams[i];t.rs+=score[i];t.ra+=score[1-i]}
  teams[wi].w++;teams[li].l++;
  return wi;
}


function assign(cands,slots){
  const out={},used=new Set(),open=new Set(slots),pairs=[];
  for(const m of cands)for(const s of slots)pairs.push([fit(m,s),m,s]);
  pairs.sort((a,b)=>b[0]-a[0]);
  for(const [,m,s] of pairs){if(used.has(m.id)||!open.has(s))continue;out[s]=m;used.add(m.id);open.delete(s);if(!open.size)break}
  return out;
}

// ---------- record ----------
// Team runs scored and allowed over 162 games, starting from a league-average 729 each way.
const LG_RUNS=729,EMPTY_HITTER=30;
function teamRuns(slots,list){
  let rs=LG_RUNS,ra=LG_RUNS;
  for(const s of list){const m=slots[s];
    if(!m){if(FIELD_SLOTS.includes(s))rs-=EMPTY_HITTER;else ra+=EMPTY_HITTER;continue}
    if(s==="DH")rs+=m.dhR;
    else if(FIELD_SLOTS.includes(s)){rs+=m.batR;ra-=m.fldR[s]}
    else ra-=slotRuns(m,s);}
  // Small morale edge: 1% more scoring and 1% fewer runs allowed.
  if(legendaryPresence(slots)){rs*=1.01;ra*=.99}
  return{rs:Math.max(300,rs),ra:Math.max(250,ra)};
}
// Team strength is the log of runs scored over runs allowed, the same ratio behind baseball's Pythagorean
// win expectation. Five starters can shut down far more runs than one, so 16-pick rosters are scaled
// to the same footing as 11-pick ones.
const SIZE_SCALE={11:.70,16:1.29};
// Only elite rosters get bent: above a typical good draft, strength is stretched (16 picks) or squeezed (11 picks)
// so a perfect 162-0 takes roughly a top 1-in-1,000 draft at either size. Ordinary teams are unaffected.
const TOP_BEND={11:[1.024,-.3],16:[1.03,.72]};
function rating(slots,list){const {rs,ra}=teamRuns(slots,list),n=list.length>=16?16:11,x=Math.log(rs/ra)/SIZE_SCALE[n],[t,k]=TOP_BEND[n];return x+k*Math.max(0,x-t)}
// Strength to wins: average rosters land near .500, and a perfect season takes a near-perfect draft.
// Steeper than real baseball on purpose, so 162-0 is possible.
const CURVE=[[-.6,15],[-.3,40],[.04,81],[.57,100],[.8,118],[1,143],[1.07,152],[1.14,162]];
const SMALL_ROSTER=0;
function winsFor(x){if(x<=CURVE[0][0])return CURVE[0][1];for(let i=1;i<CURVE.length;i++){const [x1,y1]=CURVE[i],[x0,y0]=CURVE[i-1];if(x<=x1)return Math.round(y0+(y1-y0)*(x-x0)/(x1-x0))}return 162}
function gradeFor(w,post){
  if(w===162&&post&&post.sweep)return"S+";
  const t=[[150,"A+"],[140,"A"],[130,"A-"],[120,"B+"],[108,"B"],[97,"B-"],[87,"C+"],[81,"C"],[73,"C-"],[62,"D"]];
  for(const [v,l] of t)if(w>=v)return l;return"F";
}
function postseason(w,r){
  if(w<88)return{made:false,text:"Missed the playoffs. It takes about 88 wins to get in."};
  if(w===162)return{made:true,champ:true,sweep:true,games:[[3,0],[4,0],[4,0]],text:"Swept all three rounds: 11–0 in October."};
  const p=w/162,rounds=[["Division Series",3,.58],["Championship Series",4,.6],["World Series",4,.62]],games=[];
  for(const [name,need,o] of rounds){
    const q=p*(1-o)/(p*(1-o)+o*(1-p));let a=0,b=0;while(a<need&&b<need)r()<q?a++:b++;games.push([a,b]);
    if(b===need)return{made:true,champ:false,games,text:`Lost the ${name} ${a}–${b}.`};
  }
  return{made:true,champ:true,sweep:games.every(g=>g[1]===0),games,text:`Won the World Series ${games[2][0]}–${games[2][1]}.`};
}
let refCache=null;
function refTeams(){if(refCache)return refCache;const r=rngFrom(4242);return refCache=[0,1,2,3,4,5].map(i=>assign(shuffle(BASE.slice(),r).slice(0,24+i*4),FULL))}
function playSeason(run){
  const list=run.size===16?FULL:STD;
  const R=rating(run.slots,list)-(run.size===16?0:SMALL_ROSTER),wins=winsFor(R),runs=teamRuns(run.slots,list);
  const r=rngFrom(hash(run.picks.join(",")+":"+run.seed));
  const post=postseason(wins,r);
  const me=simTeam(run.slots,"me",true);const refs=refTeams();
  for(let g=0;g<162;g++){const o=simTeam(refs[g%6],"ref",false);g%2?playGame(me,o,r):playGame(o,me,r)}
  return{R,wins,runs,post,grade:gradeFor(wins,post),me};
}

