# Score-Immo SEO/GEO and entity disambiguation: implementation plan

Goal: strengthen machine and human entity disambiguation and improve the Paris snippet using only verified facts.

Architecture: shared entity source plus visible mirrors, followed by one bounded article metadata change.

Tech stack: Astro 7, TypeScript data modules, JSON content, Node test runner and Cloudflare Pages.

## Global constraints

- No URL, canonical, H1, article-body, product-price, payment, database, email, analytics-consent or application changes.
- No unsupported superlatives, affiliations, customer counts or external citations.
- Rollback is a Git revert of the delivery commit.

### Task 1: canonical identity disambiguation

Files:
- Modify: `tests/entity-methodology.test.mjs`
- Modify: `tests/seo-geo-visibility.test.mjs`
- Modify: `src/data/entity.ts`
- Modify: `src/pages/a-propos.astro`
- Modify: `public/llms.txt`

Deliverable: exact official-domain, legal-publisher and SIREN facts are visible and machine readable without claiming affiliation with homonyms.

- [x] Add failing assertions for the qualified structured identifier and visible mirror.
- [x] Run `node --test tests/entity-methodology.test.mjs tests/seo-geo-visibility.test.mjs`; observe the new assertions fail.
- [x] Implement the minimal shared schema and visible-copy change.
- [x] Run the focused tests; all pass.
- [x] Inspect structured facts against legal pages and public corroboration.

Rollback: revert the changes to the five files.

### Task 2: Paris search snippet

Files:
- Modify: `tests/scoreimmo-cross-engine-seo.test.mjs`
- Modify: `src/content/articles/villes/prix-immobilier-paris-marche-plancher.json`

Deliverable: the snippet states the dated 9,530 EUR/m2 notarial benchmark and the page's comparison scope without changing the body or URL.

- [x] Add failing exact metadata assertions and length bounds.
- [x] Run `node --test tests/scoreimmo-cross-engine-seo.test.mjs`; observe the new assertion fail.
- [x] Change only `meta_title`, `meta_description`, `updated_at` and `last_reviewed`.
- [x] Run the focused test and content-truth check; both pass.

Rollback: restore the prior four JSON fields.

### Task 3: dependency security patch

Files:
- Modify: `package.json`
- Modify: `package-lock.json`

Deliverable: replace the vulnerable Astro 7.2.0 range resolution with patched Astro 7.2.10 and compatible patched transitives, without a framework-major migration.

- [x] Record the pre-change audit: one critical, three high and one moderate vulnerability.
- [x] Pin Astro 7.2.10 and refresh only compatible dependencies.
- [x] Run `npm audit`; zero vulnerabilities remain.
- [x] Re-run the complete test, build and integrity suite after the lockfile change.

Rollback: revert both package files only if the production workflow or public smoke tests regress; otherwise retain the security fix.

### Task 4: integration, review and production

Files:
- Review the complete branch diff and generated public output.

Deliverable: a reviewed commit deployed through the official workflow with public evidence.

- [x] Run `npm test`, `npm run test:content-truth`, `npm run build` and `npm run test:site-integrity`.
- [x] Parse all JSON-LD and inspect `/`, `/a-propos`, `/llms.txt`, the Paris page and `/tarifs` locally.
- [x] Run dependency, secret, placeholder and diff checks.
- [x] Obtain an independent CI guardrail review of behavior, security, layout, routes, offers and SEO invariants.
- [x] Commit and push the isolated branch, merge through GitHub, then monitor the production workflow.
- [x] Verify live HTTP, canonical, metadata, visible identity, JSON-LD, pricing and unrelated critical paths.
- [x] Update the Obsidian checkpoint with the commit, run, proof and remeasurement dates.

Rollback: create and push a revert commit on `main`, then repeat the public smoke checks.
