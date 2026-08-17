# ScoreImmo cross-engine SEO focus - implementation plan

Design: `docs/verified-delivery/2026-08-17-scoreimmo-cross-engine-seo-design.md`

## Task 1 - Add executable acceptance tests

Files:

- Add `tests/scoreimmo-cross-engine-seo.test.mjs`

Assertions:

- The five-error duplicate source is absent.
- `_redirects` contains one exact permanent redirect to the ten-error guide.
- The DPE visible title targets `Grille DPE 2026`, its description is at most 160 characters, and its current Bing-performing `meta_title` is unchanged.
- The procedural negotiation guide targets method, offer, and arguments, while the existing benchmark page retains `marge de négociation` and regional intent.
- The Bordeaux title/snippet target `prix immobilier Bordeaux 2026` and `par quartier`, without a euro figure in the snippet metadata.
- The city hub contains substantive H2 sections and explicit links to Paris, Bordeaux, DPE, and negotiation.
- The Paris metadata remains unchanged.

Run the new test before implementation and record the expected failure.

## Task 2 - Consolidate the first-purchase duplicate

Files:

- Modify `public/_redirects`.
- Remove `src/content/articles/guides/erreurs-a-eviter-premier-achat-immobilier.json`.
- Modify `src/content/articles/guides/premier-achat-immobilier-erreurs-eviter.json` only to improve its generic meta description.

The ten-error guide already covers total cost, diagnostics, counter-visits, environment, borrowing capacity, negotiation, co-ownership, and emotional pressure. No unique section needs to be merged from the shorter guide.

## Task 3 - Apply conservative metadata changes

Files:

- Modify `src/content/articles/guides/dpe-comprendre-classes-energetiques.json`.
- Modify `src/content/articles/guides/negocier-prix-bien-immobilier-guide-complet.json`.
- Modify `src/content/articles/villes/prix-immobilier-bordeaux-quartiers-tendances.json`.

Do not alter the articles' numerical body copy or freshness dates in this task.

## Task 4 - Strengthen the city hub

Files:

- Modify `src/pages/blogs/[blog]/index.astro`.

Add city-only editorial sections after the article grid: a comparison method, direct priority-city navigation, and buying due-diligence guidance. Link separately to the negotiation benchmark and procedural guide. Use only non-numerical claims and existing internal URLs.

## Task 5 - Verify locally

Run:

1. `node --test tests/scoreimmo-cross-engine-seo.test.mjs`
2. `npm test`
3. `npm run test:content-truth`
4. `npm run build`

Inspect:

- `dist/_redirects` contains the permanent redirect.
- The duplicate URL is absent from generated HTML and all sitemap files.
- Target page titles, descriptions, H1 values, and hub H2/link structure are present in `dist`.
- The existing baseline route-conflict warnings do not increase beyond the seven observed on clean `origin/main`.

## Task 6 - Independent review and publication gate

Review the final diff for:

- unverified factual additions;
- accidental changes to Karmastro, Paris data, or freshness fields;
- broken internal links;
- redirect loops or chains;
- build artifacts or dependency-lock noise.

Do not commit, push, merge, deploy, or notify IndexNow until the user explicitly authorizes publication.
