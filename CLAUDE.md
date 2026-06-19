# score-immo.fr — site Astro

Site SSG d'aide à la décision immobilière (analyse d'annonces, scoring A-E sur 100).
App séparée : app.score-immo.fr (Lovable). Backend Supabase `afvtxiklivnmakqixkml`.

## Refs
- **Domaine** : score-immo.fr (Astro + CF Pages). Repo `August1nnnn/score-immo`.
- **Déploiement = `deploy.yml` sur push `main`** (PAS wrangler). Pull avant push.
- **Données baromètre** : content collections `barometre` (fiches JSON, champ `score_sections` = 5 sous-scores prix/dpe/risques/urbanisme/environnement, `details.marche.median_m2` = médiane DVF), `authors`, `articles`.

## GEO / citation IA (fait 19/06 ; voir skill `parc-geo-citation`)
But = être *cité* par les LLM, pas juste ranker. Pattern en place :
- **`/barometre/[slug]`** (101 fiches) : TL;DR speakable + `Dataset` JSON-LD (score global + 5 sous-scores) + `FAQPage` + FAQ visible. Composant réutilisable **`src/components/FAQ.astro`**. FAQ data-driven (démonstratif genre/élision : « cet appartement » / « cette maison »).
- **`/barometre`** (hub) : `Dataset` agrégé (101 annonces, score moyen, médiane €/m²) + FAQ + section « Par région ».
- **`/barometre/region/[slug]`** : 11 pages régionales, agrégats RÉELS (score moyen + médiane DVF €/m² + fourchette). Helpers partagés **`src/lib/regions.ts`**.
- **Entité** : `Organization.sameAs -> Wikidata Q140289914` dans `src/data/homepage-jsonld.ts`.
- Sources officielles citées inline (DVF/ADEME/Géorisques/INSEE). Données first-party = source primaire (le « Score immo »).

## Gotchas
- **getStaticPaths isolé** : les helpers utilisés dans `getStaticPaths` DOIVENT être importés d'un module (`src/lib/regions.ts`), jamais définis dans le frontmatter, sinon « X is not defined » au build.
- **Pas de pages-villes** : 101 fiches = 101 villes distinctes = 1 échantillon/ville = thin/trompeur. Régions seulement (>= 3 fiches).
- **Calculateurs** (`src/pages/pages/calculateur-*.astro`) : contenu = gros `bodyHtml` string inline (héritage Shopify). Réaccentué 19/06 (le texte visible était désaccentué). NE PAS réaccentuer en aveugle (JS/ids/classes dans le string) -> outil sûr `~/stack-2026/scripts/reaccent_textnodes_gemini.py` (text-nodes only + garde-fou asciifold).
- 0 tiret cadratin (— ni –), accents FR obligatoires, pas de fabrication de chiffres (YMYL).

## Analytics / bots (vérif anti-spoof)
- `functions/_middleware.ts` logge les bots HTML server-side dans `page_views` (`is_bot`).
- **`functions/_oai-verify.ts`** : vérifie `cf-connecting-ip` contre les ranges OpenAI publiés -> écrit `bot_name` + `bot_verified`. ⚠️ Les UA `ChatGPT-User`/`GPTBot` sont spoofables : ne compter que `bot_verified=true`. Voir mémoire `reference-ai-bot-verification-spoofing-19juin`.

## Conversion / Stripe
- Axe mandataire (carte Pro -> `/iad`), gotcha `STRIPE_PRICE_PRO_MANDATAIRE` non configuré : voir mémoire `project-scoreimmo-conversion-mandataire-17juin`.
