import vm from "node:vm"; import fs from "node:fs";
// Balance check: replays posted leaderboard rosters through the rating model at several shiny spark strengths.
// Run from the repo root: node tools/posted-teams.mjs
const R="./";const P=JSON.parse(fs.readFileSync("tools/posted-teams.json","utf8"));
const DRIVER=`
const slotsOf=(size,ids)=>{const list=size===16?FULL:STD,o={};list.forEach((s,i)=>{const m=BYID.get(ids[i]);if(m)o[s]=m});return[o,list]};
const W=(o,list)=>winsFor(rating(o,list));
OUT=JSON.stringify({
 shiny:DATA.shiny.map(([size,mode,posted,ids])=>{const[o,list]=slotsOf(size,ids);return{size,posted,wins:W(o,list),linked:sparkSlots(o,list).length,ovr:rosterRating(o,list)}}),
 strong:DATA.strong.map(([size,mode,posted,ids])=>{const[o,list]=slotsOf(size,ids);
   // best case: the teammate with the most type links turns shiny (its own stat boost included)
   let best=null;for(const s of list){const m=o[s];if(!m||m.leg||m.shiny)continue;const sh=BYID.get((m.baseId||m.id)%SHINY_ID+SHINY_ID);if(!sh)continue;const o2={...o,[s]:sh};const n=sparkSlots(o2,list).length;if(!best||n>best.n)best={n,o2,name:m.name}}
   return{posted,wins:W(o,list),withShiny:W(best.o2,list),linked:best.n,who:best.name}})});
`;
const core0=fs.readFileSync(R+"core.js","utf8");
const load=(runs,cap)=>{const ctx=vm.createContext({console,DATA:P,OUT:null});
  for(const f of ["data.js"])vm.runInContext(fs.readFileSync(R+f,"utf8"),ctx);
  const m=core0.match(/const SPARK_RUNS=[\d.]+,SPARK_CAP=\d+;/);if(!m)throw new Error("no spark consts");
  vm.runInContext(core0.replace(m[0],`const SPARK_RUNS=${runs},SPARK_CAP=${cap};`),ctx);
  for(const f of ["evolution-data.js","development.js"])vm.runInContext(fs.readFileSync(R+f,"utf8"),ctx);
  vm.runInContext(DRIVER,ctx);return JSON.parse(ctx.OUT)};
const base=load(0,6);
console.log("posted shiny teams, current model (no spark): wins",base.shiny.map(t=>t.wins).join(" "));
console.log("type-linked teammates on those teams:",base.shiny.map(t=>t.linked).join(" "));
console.log("strong teams now:",base.strong.map(t=>t.wins).join(" "));
console.log("strong + best-case shiny, no spark:",base.strong.map(t=>t.withShiny).join(" ")," links:",base.strong.map(t=>t.linked).join(" "));
for(const [r,c] of [[3,6],[4,5],[4,6],[5,5],[6,4]]){const x=load(r,c);
  const d=x.shiny.map((t,i)=>t.wins-base.shiny[i].wins),d2=x.strong.map((t,i)=>t.withShiny-base.strong[i].withShiny);
  console.log(`spark ${r}x${c}: posted shiny teams +${d.join(" +")} (162s: ${x.shiny.filter(t=>t.wins>=162).length} vs ${base.shiny.filter(t=>t.wins>=162).length}) | strong best-case +${d2.join(" +")} (162s ${x.strong.filter(t=>t.withShiny>=162).length} vs ${base.strong.filter(t=>t.withShiny>=162).length})`)}
