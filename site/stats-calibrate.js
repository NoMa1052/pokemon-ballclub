/* The record comes from the roster formula; the 162 simulated games only produce player stats.
   Scale those stats so they add up to the same season: team runs allowed and scored match the
   formula, and pitchers' wins and losses add up to the team record. */
(() => {
 const base=playSeason;
 // Split a whole-number total across players in proportion to weights, without rounding drift.
 function share(total,weights){
  const sum=weights.reduce((a,b)=>a+b,0)||1,raw=weights.map(w=>w*total/sum),out=raw.map(Math.floor);
  let left=total-out.reduce((a,b)=>a+b,0);
  raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(left>0){out[i]++;left--}});
  return out;
 }
 playSeason=function(run){
  const s=base(run),me=s.me;if(!me)return s;
  const arms=[...me.rot,me.cl,me.pen,me.bulk].filter(p=>p&&p.st);
  const ra=Math.round(s.runs.ra),rs=Math.round(s.runs.rs);
  // Pitching: runs (and the homers behind them) add up to the team's runs allowed. Hits and walks stay as simulated.
  const simRA=arms.reduce((a,p)=>a+p.st.r,0);
  if(simRA>0){const f=ra/simRA;
   const r=share(ra,arms.map(p=>p.st.r));arms.forEach((p,i)=>{p.st.r=r[i];p.st.hr=Math.round(p.st.hr*f)});}
  // Decisions: the team's wins and losses, shared by how often each pitcher won and lost in the sim.
  const w=share(s.wins,arms.map(p=>p.st.w+.01)),l=share(162-s.wins,arms.map(p=>p.st.l+.01));
  arms.forEach((p,i)=>{p.st.w=w[i];p.st.l=l[i]});
  me.w=s.wins;me.l=162-s.wins;
  // Hitting: runs and RBI add up to the team's runs scored.
  const bats=me.hitters.filter(h=>h.st),simRS=bats.reduce((a,h)=>a+h.st.r,0),simRBI=bats.reduce((a,h)=>a+h.st.rbi,0);
  if(simRS>0){const r=share(rs,bats.map(h=>h.st.r));bats.forEach((h,i)=>h.st.r=r[i])}
  if(simRBI>0){const rb=share(Math.round(rs*simRBI/Math.max(1,simRS)),bats.map(h=>h.st.rbi));bats.forEach((h,i)=>h.st.rbi=rb[i])}
  return s;
 };
})();
