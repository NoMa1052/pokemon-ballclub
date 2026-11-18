window.__pbcReady=true;window.dispatchEvent(new Event('pbc-ready'));
// A same-origin recovery link resumes the saved draft directly at card selection.
if(new URLSearchParams(location.search).get('resumePack')==='1'){
 const url=new URL(location.href);
 url.searchParams.delete('resumePack');
 history.replaceState(history.state,'',url);
 if(isPack()&&run.picks.length>0&&run.picks.length<run.size&&!run.locked&&!run.hand&&!run.result&&!run.selected){
  if(!run.spin||run.unrevealed){
   run.spin=run.spin||drawNext();
   run.justRipped=false;
   run.unrevealed=false;
   saveRun();
   render();
  }
  requestAnimationFrame(()=>document.getElementById('cands')?.scrollIntoView({block:'center',behavior:'instant'}));
 }
}
