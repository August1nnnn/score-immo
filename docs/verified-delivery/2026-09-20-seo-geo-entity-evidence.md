# Score-Immo SEO/GEO and entity disambiguation: evidence

## Authority and scope

- Production authorization: explicit user instruction on 20 September 2026.
- Delivery path: isolated branch, pull request, merge to `main`, official GitHub Actions deployment.
- In scope: official entity disambiguation, Paris snippet, bounded dependency security patch.
- Out of scope: product logic, checkout, database, customer data, prices, URLs, article body, analytics and outbound communications.

## Baseline and RED evidence

- Baseline commit: `4910004b` from `origin/main`.
- Baseline suite: 268 tests passed, 173 content JSON files passed, 336 pages built, 336 HTML files and 13,423 links passed integrity.
- New source assertions failed before implementation in four expected places: structured identifier, visible identity mirror, llms identity and exact Paris metadata.
- Dependency audit before patch: one critical, three high and one moderate vulnerability.

## Pre-deployment verification

- Focused suite: 24 of 24 tests passed.
- Full suite after dependency patch: 268 of 268 tests passed.
- Content truth: 173 JSON files passed.
- Production build: 336 pages generated.
- Site integrity: 336 HTML files, 13,424 links and 37 redirects checked successfully.
- Structured data: 1,621 JSON-LD blocks parsed successfully across 336 built HTML files.
- Dependency audit: zero vulnerabilities.
- Clean-install parity: the first PR guardrails exposed two missing optional Linux lockfile entries caused by npm 11 versus npm 10 generation differences; the lockfile was regenerated and clean-installed with npm 10.9.3, then the complete suite passed locally.
- Diff check, placeholder scan and changed-diff secret scan: clean.
- Local preview: `/`, `/a-propos`, `/blogs/villes/prix-immobilier-paris-marche-plancher`, `/tarifs` and `/llms.txt` returned 200.
- Browser smoke at 390 by 844 and 1440 by 1000: no horizontal overflow, no console errors, expected titles and H1s, official identity visible.

## Production evidence

- Pull request: `#55`, merged on 20 September 2026.
- Delivery commit: `69278406e6db4b4d7fe9b9e3e5945ef0eae6a959`.
- Merge commit on `main`: `c9aaa8b6d923d0ee6b50c201619a4ae228c50799`.
- Independent PR guardrail run: `35528563180`, successful after clean Linux install, browser geometry, behavioral, security, route, offer and SEO checks.
- Production workflow: `35528640386`, successful on the exact merge SHA; Cloudflare deployment and IndexNow notification passed.
- Public HTTP: homepage, About, Paris article, pricing, `llms.txt`, `robots.txt`, sitemap and application returned 200.
- Public canonical URLs: exact on homepage, About, Paris article, pricing and application.
- Public entity proof: visible official-identity section and Organization JSON-LD expose Score-Immo, official domains, legal publisher and SIREN consistently.
- Public Paris proof: the dated 9,530 EUR/m2 title and description are active while the H1 and URL are unchanged.
- Public commercial proof: the five catalog prices and the five expected checkout routes remain present.
- Public browser smoke at 390 by 844 and 1440 by 1000: no horizontal overflow and no console errors on About, Paris and pricing.
- Rollback: revert merge commit `c9aaa8b6` through the standard `main` workflow if a material regression is observed.

## Monitoring

- Remeasure aligned GSC windows on 27 September, 4 October and 18 October 2026.
- Repeat an unpersonalized entity-recognition test after indexing.
- No ranking, CTR or generative-engine citation outcome is guaranteed by this delivery.
