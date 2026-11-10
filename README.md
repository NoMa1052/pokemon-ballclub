# Pokémon Ballclub

The site files live in the repo root. `npm run build` writes the deployable site to `dist/`:
one minified CSS file, one minified JS file, self-hosted fonts.

- `index.html` still runs unbuilt for quick local checks.
- New stylesheets and scripts are picked up from the tags in `index.html`, in order.
- Vercel reads `vercel.json`: build command `npm run build`, output `dist`.
- Production deploys from the `deploy` branch.
