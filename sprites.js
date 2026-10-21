// Pokémon tokens show the sprite from PokéAPI's public sprite set (named by Pokédex number).
// Nothing is hosted here: the image loads straight from PokéAPI. If it can't load, the body-shape icon stays.
const SPRITE_URL=(id,shiny)=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny?"shiny/":""}${id}.png`;
tok=function(m,inner=""){const c=TYPE_COLORS[m.types[0]]||"#777",c2=TYPE_COLORS[m.types[1]]||c;
  const spr=m.id?`<img class="spr" src="${SPRITE_URL(m.num||m.id,m.shiny)}" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('has-spr')" onerror="this.remove()">`:"";
  return `<span class="tok${m.shiny?" shiny":""}" style="--c1:${c};--c2:${c2}">${glyph(m.shape)}${spr}${inner}</span>`};
