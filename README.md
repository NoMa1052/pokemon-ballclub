# Pokémon Ballclub

Source lives in `site/`. `npm run build` writes the deployable site to `dist/`:
one minified CSS file, one minified JS file, self-hosted fonts.

- Edit files in `site/`. `site/index.html` still runs unbuilt for quick local checks.
- New stylesheets and scripts are picked up from the tags in `site/index.html`, in order.
- Vercel reads `vercel.json`: build command `npm run build`, output `dist`.

Plan and decisions: see `ballclub-v5-plan.md` in the Claude project.
