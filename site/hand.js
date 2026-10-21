/* Serializable one-card-in-hand transactions. Ratings and draft odds stay unchanged. */
function handSnapshot(){const x=JSON.parse(JSON.stringify({...run,slots:Object.fromEntries(Object.entries(run.slots).map(([s,m])=>[s,m.id])),handUndo:null}));return x}
function handRestore(x){run=JSON.parse(JSON.stringify(x));run.slots=Object.fromEntries(Object.entries(x.slots).map(([s,id])=>[s,BYID.get(id)]));run.moving=null}
function handBeginDraft(){if(run.hand||!run.selected||run.locked||run.result)return false;run.hand={kind:'draft',held:run.selected,draftId:run.selected,base:handSnapshot()};run.handUndo=null;run.handFeedback=null;saveRun();return true}
function handPickup(s){if(run.hand||!run.slots[s]||run.locked||run.result||spinning)return false;const m=run.slots[s],base=handSnapshot();run.hand={kind:'move',held:m.id,base};delete run.slots[s];run.selected=m.id;run.moving=null;run.handUndo=null;run.handFeedback=null;saveRun();return true}
function handPlace(s){
  if(!run.hand||run.locked||run.result||!slotList().includes(s))return false;
  const h=run.hand,m=BYID.get(h.held),other=run.slots[s],before=teamOvr(),old=other?posOvr(other,s):null,v=posOvr(m,s);
  run.handUndo=handSnapshot();run.slots[s]=m;
  if(other){h.held=other.id;run.selected=other.id}
  else{
    if(h.kind==='draft'){
      const ls=run.spin;if(ls?.pack)ls.usedIds=[...(ls.usedIds||[]),h.draftId];const keep=ls?.pack&&run.doubleArmed&&!run.second&&h.base.picks.length+1<run.size;
      run.picks=[...h.base.picks,h.draftId];run.lastSpin=ls&&!ls.legend&&!ls.pack?{type:ls.type,gen:ls.gen,gens:ls.gens||[ls.gen],key:ls.key}:null;
      if(keep){run.doubleArmed=false;run.doubles--;run.second=true}else{run.spin=null;run.second=false;run.doubleArmed=false}
      run.lockUsed=false;
    }
    run.hand=null;run.selected=null;run.moving=null;sortStaff();run.just=slotList().find(k=>run.slots[k]?.id===m.id)||s;
  }
  run.handFeedback={name:m.name,spot:lbl(run.hand?s:run.just),old,rating:v,before,after:teamOvr(),held:other?.name||null};saveRun();return true;
}
function handUndoAction(){if(!run.handUndo||run.locked||run.result)return false;const x=run.handUndo;handRestore(x);run.handUndo=null;run.handFeedback=null;saveRun();return true}
function handCancel(){if(!run.hand)return false;const x=run.hand.base;handRestore(x);run.hand=null;run.selected=null;run.moving=null;run.handUndo=null;run.handFeedback=null;saveRun();return true}
function handRelease(){if(run.hand?.kind!=='move'||!run.releases||run.second||run.locked||run.result)return false;run.picks=run.picks.filter(id=>id!==run.hand.held);run.releases=0;run.hand=null;run.selected=null;run.moving=null;run.handUndo=null;run.handFeedback=null;sortStaff();saveRun();return true}
