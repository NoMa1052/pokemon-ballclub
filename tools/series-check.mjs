// Scoring check for the head-to-head game engine: posted rosters play each other.
// Run from the repo root: node tools/series-check.mjs
import vm from "node:vm"; import fs from "node:fs";
const P=JSON.parse(fs.readFileSync("tools/posted-teams.json","utf8"));
const ctx=vm.createContext({console,DATA:[...P.strong,...P.shiny].filter(t=>t[0]===16),OUT:null});
for(const f of ["data.js","core.js","evolution-data.js","development.js","v5-game.js"])vm.runInContext(fs.readFileSync(f,"utf8"),ctx);
vm.runInContext(`
const mk=t=>Object.fromEntries(t[3].map((id,i)=>[FULL[i],BYID.get(id)]).filter(x=>x[1]));
const r=rngFrom(7);let runs=0,games=0,hi=0,shut=0,extra=0,hits=0;const res=[];
const teams=DATA.map(t=>({wins:t[2],slots:mk(t)}));
for(let a=0;a<teams.length;a++)for(let b=0;b<teams.length;b++){if(a===b)continue;
  const A=Ballgame.club(teams[a].slots,'a'),B=Ballgame.club(teams[b].slots,'b');let wa=0;
  for(let n=0;n<8;n++){const g=Ballgame.create(A,B,r,n*10,[A.rot[n%5],B.rot[n%5]]);
    while(!g.done){Ballgame.autoManage(g,0);Ballgame.autoManage(g,1);Ballgame.step(g)}
    runs+=g.score[0]+g.score[1];hits+=g.hits[0]+g.hits[1];games++;hi=Math.max(hi,...g.score);if(!g.score[0]||!g.score[1])shut++;if(g.inning>9)extra++;if(g.winner===0)wa++}
  res.push([teams[a].wins-teams[b].wins,wa/8])}
const buckets={};for(const [d,w] of res){const k=d>=15?'better by 15+':d>=5?'better by 5-14':d>-5?'even':d>-15?'worse by 5-14':'worse by 15+';(buckets[k]=buckets[k]||[]).push(w)}
OUT=JSON.stringify({games,runsPerSide:+(runs/games/2).toFixed(2),hitsPerSide:+(hits/games/2).toFixed(1),highScore:hi,shutoutPct:+(100*shut/games).toFixed(1),extraPct:+(100*extra/games).toFixed(1),awayWinPctBySeasonGap:Object.fromEntries(Object.entries(buckets).map(([k,v])=>[k,+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2)]))});
`,ctx);
console.log(ctx.OUT);
