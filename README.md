# ScoreImmo - Site vitrine (STACK-2026)

Site vitrine Astro de [score-immo.fr](https://score-immo.fr) - migré de Shopify vers Cloudflare Pages.

## Stack
- **Framework** : Astro 5 (SSG statique)
- **Styles** : Tailwind + CSS custom ScoreImmo
- **Deploy** : Cloudflare Pages via GitHub Actions (wrangler)
- **Analytics** : Supabase custom tracker (gated by cookie consent)
- **Blog** : Collection MDX + content collection Astro

## Architecture
- `/` : homepage (12 sections)
- `/pages/*` : 13 pages piliers (tarifs, guide, outils, calculateurs, legal...)
- `/blogs/{guides|villes|quartiers}` : index blogs
- `/blogs/{guides|villes|quartiers}/{slug}` : articles (39 migrés depuis Shopify)
- App produit : `https://app.score-immo.fr` (Lovable + Supabase existant `afvtxiklivnmakqixkml`)

## Dev
```bash
npm install
npm run dev       # dev server
npm run build     # build static
npm run preview   # preview dist
```

## Déploiement
Auto-deploy Cloudflare Pages sur push `main`.

## Brand
- Tutoiement (sauf pages légales)
- Aucun tiret cadratin (`,` / `-` interdits)
- Charte éditoriale : ScoreImmo est le premier rapport d'aide à la décision immobilière en France
