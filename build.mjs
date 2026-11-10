// Builds the site files in the repo root into dist/: one minified CSS file, one minified JS file, self-hosted fonts.
// index.html stays the source of truth and still runs unbuilt for local editing.
import { transform } from "esbuild";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

const SRC = ".", OUT = "dist";
const read = f => readFile(`${SRC}/${f}`, "utf8");
const hash = s => createHash("sha1").update(s).digest("hex").slice(0, 10);
const local = u => !/^(https?:)?\/\//.test(u);
const bare = u => u.split("?")[0];

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/fonts`, { recursive: true });
// Site files are copied as they are, so old file URLs (sanity.html, cached pages) keep working.
for (const f of await readdir(SRC)) if (/\.(html|css|js|png|webp|avif|jpg|svg|ico)$/.test(f)) await cp(`${SRC}/${f}`, `${OUT}/${f}`);

// Fonts: latin subsets from @fontsource, swapped in so text never blocks on a font download.
const FONTS = [["barlow", "Barlow", [400, 500, 600, 700]], ["oswald", "Oswald", [500, 600, 700]], ["graduate", "Graduate", [400]]];
let fontCss = "";
for (const [pkg, family, weights] of FONTS) for (const w of weights) {
  const file = `${pkg}-latin-${w}-normal.woff2`;
  await cp(`node_modules/@fontsource/${pkg}/files/${file}`, `${OUT}/fonts/${file}`);
  fontCss += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format("woff2")}\n`;
}

let html = await read("index.html");

// CSS: every local stylesheet and inline <style> block, in document order.
const cssParts = [fontCss];
const cssTag = /<link rel="stylesheet" href="([^"]+)">\s*|<style[^>]*>([\s\S]*?)<\/style>\s*/g;
const head = html.slice(0, html.indexOf("</head>"));
for (const m of head.matchAll(cssTag)) {
  if (m[1] && !local(m[1])) continue; // Google Fonts link is dropped below
  cssParts.push(m[1] ? await read(bare(m[1])) : m[2]);
}
const css = (await transform(cssParts.join("\n"), { loader: "css", minify: true })).code;
const cssName = `app.${hash(css)}.css`;
await writeFile(`${OUT}/${cssName}`, css);

// JS: classic scripts that share globals, so they are joined in order, not bundled as modules.
const body = html.slice(html.indexOf("</head>"));
const scripts = [...body.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => bare(m[1])).filter(local);
const inlineFirst = scripts.shift(); // intro.js runs before the page content paints
const js = (await transform((await Promise.all(scripts.map(read))).join("\n;\n"), { minify: true, target: "es2020" })).code;
const jsName = `app.${hash(js)}.js`;
await writeFile(`${OUT}/${jsName}`, js);
const intro = (await transform(await read(inlineFirst), { minify: true, target: "es2020" })).code.replace(/<\/script/g, "<\\/script");

const newHead = head
  .replace(cssTag, "")
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/, "")
  + `<link rel="preload" href="fonts/barlow-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="${cssName}">\n`;
let newBody = body.replace(/<script src="[^"]+"><\/script>\s*/g, "");
newBody = newBody.replace("<body>", () => `<body>\n<script>${intro}</script>`)
  .replace("</body>", () => `<script src="${jsName}" defer></script>\n</body>`);
await writeFile(`${OUT}/index.html`, newHead + newBody);

const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
console.log(`css ${cssName} ${kb(css)} · js ${jsName} ${kb(js)} · ${scripts.length + 1} scripts, ${cssParts.length - 1} style sources`);
