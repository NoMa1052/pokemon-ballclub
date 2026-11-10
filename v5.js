/* v5 phase 1: label for the compact in-run header (mode and size switches are hidden mid-run on phones). */
(() => {
 const label=()=>{const s=document.getElementById('settings');if(s&&run)s.dataset.run=(run.mode==='pack'?'Packs':'Spin')+' · '+(run.size===11?'Quick':'Standard')};
 const prev=render;render=function(){const v=prev.apply(this,arguments);label();return v};label();
})();
