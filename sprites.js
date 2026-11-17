// Artwork requests retry alternate CDNs and recover when connectivity returns.
function pokemonImageError(img){
 const n=img.dataset.num,sh=img.dataset.shiny==='1',art=img.dataset.art==='1';
 const folder=art?'other/official-artwork/':'',variant=sh?'shiny/':'';
 const tail=folder+variant+n+'.png';
 const sources=['https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/'+tail,
 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+tail];
 if(art)sources.push('https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/'+variant+n+'.png','https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+variant+n+'.png');
 const attempt=Number(img.dataset.attempt||0);
 if(attempt<sources.length){img.dataset.attempt=String(attempt+1);if(art&&attempt>=2)img.classList.add('px');img.src=sources[attempt];return}
 img.dataset.failed='1';img.style.visibility='hidden';img.closest('.tok')?.classList.remove('has-spr');
}
function pokemonImageLoaded(img){delete img.dataset.failed;img.style.visibility='';img.closest('.tok')?.classList.add('has-spr')}
window.addEventListener('online',()=>document.querySelectorAll('img[data-failed="1"]').forEach(img=>{delete img.dataset.failed;img.dataset.attempt='0';pokemonImageError(img)}));
setInterval(()=>{if(navigator.onLine)document.querySelectorAll('img[data-failed="1"]').forEach(img=>{delete img.dataset.failed;img.dataset.attempt='0';pokemonImageError(img)})},30000);
const SPRITE_URL=(id,shiny)=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny?'shiny/':''}${id}.png`;
tok=function(m,inner=''){const c=TYPE_COLORS[m.types[0]]||'#777',c2=TYPE_COLORS[m.types[1]]||c;
 const spr=m.id?`<img class="spr" src="${SPRITE_URL(m.num||m.id,m.shiny)}" data-num="${m.num||m.id}" data-shiny="${m.shiny?1:0}" alt="" decoding="async" onload="pokemonImageLoaded(this)" onerror="pokemonImageError(this)">`:'';
 return `<span class="tok${m.shiny?' shiny':''}" style="--c1:${c};--c2:${c2}">${spr}${inner}</span>`};
