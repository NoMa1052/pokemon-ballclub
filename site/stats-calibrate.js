/* The record comes from the roster formula; the 162 simulated games only produce player stats.
   Pitcher ERAs follow each pitcher's own rating in a normal league. Pitchers' wins and losses add up
   to the team record, and hitters' runs and RBI add up to the team's runs scored. */
(() => {
 const base=playSeason;
 // Split a whole-number total across players in proportion to weights, without rounding drift.
 function share(total,weights){
  const sum=weights.reduce((a,b)=>a+b,0)||1,raw=weights.map(w=>w*total/sum),out=raw.map(Math.floor);
  let left=total-out.reduce((a,b)=>a+b,0);
  raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(left>0){out[i]++;left--}});
  return out;
 }
 // Same, but nobody gets more than their cap (a starter can't win more games than he started).
 function shareCapped(total,weights,caps){
  const out=weights.map(()=>0);let left=total;
  for(let guard=0;guard<8&&left>0;guard++){
   const open=weights.map((w,i)=>out[i]<caps[i]?w:0);if(!open.some(Boolean))break;
   const add=share(left,open);add.forEach((a,i)=>{const take=Math.min(a,caps[i]-out[i]);out[i]+=take;left-=take});
  }
  return out;
 }
 playSeason=function(run){
  const s=base(run),me=s.me;if(!me)return s;
  const arms=[...me.rot,me.cl,me.pen,me.bulk].filter(p=>p&&p.st);
  const ra=Math.round(s.runs.ra),rs=Math.round(s.runs.rs);
  // Pitching, the MLB The Show way: each pitcher's line reflects his own rating against a normal league,
  // not his team's record. The game sim ties runs allowed to the rating but runs about a quarter hot,
  // so it's trimmed to a league where a 90 starter posts about a 3.20 ERA.
  // Half of each line is the rating's expected ERA and half is the season's luck, so an ace can have an
  // off year but not a bad one: a 95 lands about 2.3 to 3.6, a 70 about 4.3 to 6.
  const LEAGUE=.77,expected=ovr=>Math.max(1.6,3.2-.09*(ovr-90));
  arms.forEach(p=>{
   const real=/^(SP|RP)/.test(p.role)&&p.m.id,ovr=real?posOvr(p.m,p.role):null,ip9=p.st.outs/27;
   const before=p.st.r,simEra=ip9?before*LEAGUE/ip9:0,era=ovr==null?simEra:.5*simEra+.5*expected(ovr);
   p.st.r=Math.round(era*ip9);p.st.hr=before?Math.round(p.st.hr*p.st.r/before):p.st.hr;
  });
  // Decisions: the team's wins and losses, shared by innings pitched. Lower ERAs earn more of the wins,
  // higher ERAs take more of the losses, and starters get most decisions, as in real baseball.
  const eraOf=p=>p.st.outs?p.st.r*27/p.st.outs:5,share8=p=>p.st.outs*(/^(SP|FILL)/.test(p.role)?1:.45);
  const starter=p=>/^(SP|FILL)/.test(p.role),cap=p=>Math.max(1,starter(p)?(p.st.gs||p.st.g):Math.round(p.st.g*.35));
  const w=shareCapped(s.wins,arms.map(p=>share8(p)*Math.max(.4,7-eraOf(p))),arms.map(cap));
  const l=shareCapped(162-s.wins,arms.map(p=>share8(p)*Math.max(.8,eraOf(p))),arms.map((p,i)=>Math.max(0,(starter(p)?(p.st.gs||p.st.g):p.st.g)-w[i])));
  arms.forEach((p,i)=>{p.st.w=w[i];p.st.l=l[i]});
  me.w=s.wins;me.l=162-s.wins;
  // Hitting: runs and RBI add up to the team's runs scored.
  const bats=me.hitters.filter(h=>h.st),simRS=bats.reduce((a,h)=>a+h.st.r,0),simRBI=bats.reduce((a,h)=>a+h.st.rbi,0);
  if(simRS>0){const r=share(rs,bats.map(h=>h.st.r));bats.forEach((h,i)=>h.st.r=r[i])}
  if(simRBI>0){const rb=share(Math.round(rs*simRBI/Math.max(1,simRS)),bats.map(h=>h.st.rbi));bats.forEach((h,i)=>h.st.rbi=rb[i])}
  return s;
 };
})();
