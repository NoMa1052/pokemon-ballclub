/* Load-in: the stadium is dark, the tower bulbs come on one by one, then all together
   and their light floods the logo. The logo then glides into the header.
   Plays once per session. Tap to skip. Reduced motion skips it entirely. */
const INTRO={
 fadeIn:400,        // full logo fades in, dark
 bulbs:1700,        // bulbs come on one at a time, random order
 allOn:900,         // every bulb surges together and the light floods the logo
 handoff:700,       // backdrop fades, logo glides into the header
 dark:.24,          // logo brightness while the stadium is off
 blink:.45,         // chance a bulb blinks once before it stays on
 warm:60,           // ms for a bulb to warm up to full
 ease:{fadeIn:[.2,.7,.2,1], allOn:[.3,0,.2,1], handoff:[.6,0,.2,1]},
 // bulb centers in the logo's 360x254 space, 8 per tower
 bulbXY:[[55,53.8],[55,62.5],[64,50.5],[64,59.5],[73.3,47],[73.3,56.3],[82.5,43.8],[82.6,53.3],
         [266.3,43.8],[266.3,53.3],[275.7,47],[275.7,56.3],[284.8,50.5],[284.8,59.5],[293.9,53.8],[293.9,62.5]],
 towers:[[69,53],[280,53]]
};
(() => {
 let seen=false;try{seen=sessionStorage.getItem('pbc-intro')==='1'}catch(e){}
 if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches||!window.requestAnimationFrame)return;
 try{sessionStorage.setItem('pbc-intro','1')}catch(e){}
 const root=document.documentElement;root.classList.add('intro-on','intro-hide');
 const NS='http://www.w3.org/2000/svg',mk=(n,a,p)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p&&p.append(e);return e};
 const o=document.createElement('div');o.id='intro';o.setAttribute('aria-hidden','true');
 o.innerHTML='<div class="in-bg"></div><div class="in-badge"><img alt=""><svg viewBox="0 0 360 254"></svg></div>';
 document.body.prepend(o);
 const bg=o.querySelector('.in-bg'),badge=o.querySelector('.in-badge'),img=badge.querySelector('img'),svg=badge.querySelector('svg'),defs=mk('defs',{},svg);
 const grad=(id,stops)=>{const g=mk('radialGradient',{id},defs);stops.forEach(([of,c,a])=>mk('stop',{offset:of,'stop-color':`rgb(${c})`,'stop-opacity':a},g))};
 grad('inHalo',[[0,'255,252,238',.95],[.3,'255,240,195',.6],[.65,'255,228,160',.15],[1,'255,220,140',0]]);
 grad('inFlood',[[0,'255,248,228',.55],[.4,'255,238,190',.22],[1,'255,230,160',0]]);
 const floods=INTRO.towers.map(([x,y])=>mk('circle',{cx:x,cy:y,r:20,fill:'url(#inFlood)',opacity:0},svg));
 const bulbs=INTRO.bulbXY.map(([x,y])=>({h:mk('circle',{cx:x,cy:y,r:6.5,fill:'url(#inHalo)',opacity:0},svg),c:mk('circle',{cx:x,cy:y,r:2.9,fill:'#fffcef',opacity:0},svg)}));
 const bez=([x1,y1,x2,y2])=>t=>{if(t<=0)return 0;if(t>=1)return 1;let lo=0,hi=1,u=t;
  for(let i=0;i<22;i++){u=(lo+hi)/2;const x=3*(1-u)**2*u*x1+3*(1-u)*u*u*x2+u**3;if(x<t)lo=u;else hi=u}
  return 3*(1-u)**2*u*y1+3*(1-u)*u*u*y2+u**3};
 const eIn=bez(INTRO.ease.fadeIn),eA=bez(INTRO.ease.allOn),eH=bez(INTRO.ease.handoff);
 const n=bulbs.length,plan=[...Array(n).keys()].sort(()=>Math.random()-.5).map((bi,k)=>({bi,on:(k+Math.random()*.8)/n*.86*INTRO.bulbs,blink:Math.random()<INTRO.blink}));
 const lit=(p,t)=>{const d=t-p.on;if(d<0)return 0;let v=Math.min(1,d/INTRO.warm);if(p.blink&&d>90&&d<170)v=.25+.75*Math.abs(d-130)/40;return v};
 const set=(el,k,v)=>el.setAttribute(k,v);
 let raf=0,t0=0,flight=null,done=false,header=null;
 const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);root.classList.remove('intro-on','intro-hide');o.remove()};
 o.addEventListener('click',finish);
 function frame(ms){
  if(done)return;const t=ms-t0,a=INTRO.fadeIn,b=INTRO.bulbs,c=INTRO.allOn,d=INTRO.handoff,e1=a,e2=a+b,e3=e2+c,e4=e3+d;
  badge.style.opacity=eIn(Math.min(1,t/a));
  let bright=INTRO.dark;
  if(t<e2){let sum=0;plan.forEach(p=>{const v=t>=e1?lit(p,t-e1):0,B=bulbs[p.bi];sum+=v;set(B.c,'opacity',v.toFixed(3));set(B.h,'opacity',(.8*v).toFixed(3))});bright+=.06*sum/n}
  else if(t<e3){const p=(t-e2)/c,q=eA(p),surge=Math.min(1,p/.15);
   bulbs.forEach(B=>{set(B.c,'opacity',(1-q).toFixed(3));set(B.h,'r',(6.5+3.5*surge).toFixed(2));set(B.h,'opacity',((.8+.2*surge)*(1-q)).toFixed(3))});
   floods.forEach(f=>{set(f,'r',(20+240*q).toFixed(1));set(f,'opacity',(surge*(1-q)).toFixed(3))});
   bright=INTRO.dark+.06+(1-INTRO.dark-.06)*q}
  else{if(root.classList.contains('intro-hide'))root.classList.remove('intro-hide');bright=1;bulbs.forEach(B=>{set(B.c,'opacity',0);set(B.h,'opacity',0)});floods.forEach(f=>set(f,'opacity',0));
   const p=eH(Math.min(1,(t-e3)/d));bg.style.opacity=1-p;
   if(!flight){const h=header.getBoundingClientRect(),s=badge.getBoundingClientRect();flight=h.width?{dx:(h.left+h.width/2)-(s.left+s.width/2),dy:(h.top+h.height/2)-(s.top+s.height/2),k:h.width/s.width}:{dx:0,dy:0,k:1}}
   badge.style.transform=`translate(${flight.dx*p}px,${flight.dy*p}px) scale(${1+(flight.k-1)*p})`;
   if(!flight.k||flight.k===1)badge.style.opacity=1-p}
  img.style.filter=bright>=.999?'none':`brightness(${bright.toFixed(3)}) saturate(${(.15+.85*bright).toFixed(3)})`;
  if(t<e4)raf=requestAnimationFrame(frame);else finish();
 }
 const start=()=>{
  header=document.querySelector('.mark.logo img');const src=header?.currentSrc||header?.src||'logo.webp';
  img.src=src;svg.style.webkitMaskImage=svg.style.maskImage=`url("${src}")`;
  const go=()=>{if(done)return;scrollTo(0,0);raf=requestAnimationFrame(ms=>{t0=ms;frame(ms)})};
  (img.decode?img.decode():Promise.resolve()).then(go,go);
  setTimeout(finish,INTRO.fadeIn+INTRO.bulbs+INTRO.allOn+INTRO.handoff+2500); // safety net
 };
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
