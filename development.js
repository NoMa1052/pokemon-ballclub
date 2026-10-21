/* Developed cards encode their form, friendship and evolution count in a stable numeric ID.
   This keeps saves, local history and the existing leaderboard roster format compatible. */
const DEVELOPMENT_UNIT=20000;
const originalMonGet=BYID.get.bind(BYID);
function developedCard(baseId,bonus,steps=0){
  bonus=Math.max(0,Math.min(10,Math.floor(bonus)));steps=Math.max(0,Math.min(2,Math.floor(steps)));
  if(!bonus&&!steps)return originalMonGet(baseId);
  return BYID.get(DEVELOPMENT_UNIT+(steps*11+bonus)*DEVELOPMENT_UNIT+baseId);
}
BYID.get=function(id){
  id=Number(id);const existing=originalMonGet(id);if(existing)return existing;
  if(!Number.isSafeInteger(id)||id<DEVELOPMENT_UNIT)return undefined;
  const packed=Math.floor(id/DEVELOPMENT_UNIT)-1,baseId=id%DEVELOPMENT_UNIT,steps=Math.floor(packed/11),bonus=packed%11;
  const b=originalMonGet(baseId);if(!b||steps>2||bonus<0||(!bonus&&!steps))return undefined;
  const m={...b,id,baseId,friendship:bonus,evolutionSteps:steps,z:{...b.z},r:{...b.r},fldR:{...b.fldR},pd:{...b.pd}};
  // Convert each +rating point into real run value using the inverse of the existing scale.
  const valueFor=(r)=>{const target=Math.min(99,ovr99(r)+bonus);if(!bonus||target<=ovr99(r))return r;const v=target>KNEE?KNEE-(CEIL-KNEE)*Math.log(1-(target-KNEE)/(CEIL-KNEE)):target;return (v-OVR_MID)/OVR_PER_RUN};
  m.dhR=valueFor(b.dhR);m.spR=valueFor(b.spR);m.rpR=valueFor(b.rpR);m.clR=valueFor(b.clR);m.suR=valueFor(b.suR);
  m.batR=b.batR+(m.dhR-b.dhR);
  for(const s in b.fldR){m.fldR[s]=valueFor(b.batR+b.fldR[s])-m.batR;m.pd[s]=b.pd[s]+bonus}
  // Friendship improves actual season tools too, rather than only changing the printed rating.
  const boost=bonus/18;for(const k in m.z)if(k!=='tall')m.z[k]+=boost;
  m.zBat=b.zBat+boost;m.arm=b.arm+bonus;
  for(const k in m.r)m.r[k]=Math.min(99,b.r[k]+bonus);
  BYID.set(id,m);return m;
};
function developmentOptions(card){
  if(!run||run.mode!=='pack'||!run.spin?.pack||!run.spin.ids.includes(card?.id)||run.hand||run.locked||run.result||run.spin.usedIds?.includes(card.id))return [];
  return Object.entries(run.slots).flatMap(([slot,owned])=>{
    const same=owned.num===card.num,evolve=EVOLUTION_PARENT[card.num]===owned.num;
    // Earlier family forms train the owned Pokémon without devolving it.
    let ancestor=EVOLUTION_PARENT[owned.num],earlier=false;
    for(let i=0;i<4&&ancestor;i++,ancestor=EVOLUTION_PARENT[ancestor]){
      if(ancestor===card.num){earlier=true;break;}
    }
    if(!same&&!evolve&&!earlier)return [];
    // Evolution duplicates are allowed when raised from a teammate.
    const steps=Math.min(2,(owned.evolutionSteps||0)+(evolve?1:0));
    const amount=evolve?((owned.evolutionSteps||0)?3:5):same?2:1;
    const bonus=Math.min(10,(owned.friendship||0)+amount);
    const added=bonus-(owned.friendship||0);
    // Training with an earlier form never changes the owned species.
    const form=evolve?card.num:owned.num;
    const baseId=form+((owned.shiny||card.shiny)?SHINY_ID:0),next=developedCard(baseId,bonus,steps);
    if(next.id===owned.id)return [];
    return [{slot,owned,next,kind:evolve?'evolve':same?'train':'family',bonus,steps,added}];
  });
}
function applyDevelopment(cardId,slot){
  const card=BYID.get(cardId);if(!card||spinning)return false;
  const option=developmentOptions(card).find(o=>o.slot===slot);if(!option)return false;
  const snapshot=handSnapshot(),before=teamOvr(),{owned,next,kind}=option,sp=run.spin;
  run.slots[slot]=next;run.picks=run.picks.map(id=>id===owned.id?next.id:id);
  sp.usedIds=[...(sp.usedIds||[]),cardId];
  const extra=run.doubleArmed&&!run.second&&run.picks.length<run.size;
  if(extra){run.doubles--;run.doubleArmed=false;run.second=true}else{run.spin=null;run.second=false;run.doubleArmed=false}
  run.developmentActions=(run.developmentActions||0)+1;run.selected=null;run.hand=null;run.developChoice=null;run.handUndo=snapshot;
  run.handFeedback={name:next.name,spot:lbl(slot),old:posOvr(owned,slot),rating:posOvr(next,slot),before,after:teamOvr(),development:kind};
  sortStaff();saveRun();return true;
}
