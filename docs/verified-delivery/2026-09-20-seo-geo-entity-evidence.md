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

Pending merge and live verification.

## Monitoring

- Remeasure aligned GSC windows on 27 September, 4 October and 18 October 2026.
- Repeat an unpersonalized entity-recognition test after indexing.
- No ranking, CTR or generative-engine citation outcome is guaranteed by this delivery.
