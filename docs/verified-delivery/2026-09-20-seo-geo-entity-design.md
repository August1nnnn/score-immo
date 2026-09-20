# Score-Immo SEO/GEO and entity disambiguation: design

## Goal and non-goals

The goal is to improve the clarity of the official Score-Immo entity and the click appeal of one proven high-impression page without changing URLs, product behavior, prices, the scoring engine, customer data or the visual identity.

This increment does not create backlinks, testimonials, press coverage, reviews or new product claims. It does not alter payments, analytics consent, application code, databases, email or the Barometre corpus.

## Current behavior and evidence

- GSC final data through 18 September 2026 records 304 clicks and 30,568 impressions over 28 days, with a 0.99% CTR and average position 14.73.
- The Paris guide recorded 2,422 impressions, 2 clicks, 0.08% CTR and average position 7.85 from 7 to 18 September. In the preceding aligned period it recorded 2,101 impressions, 11 clicks, 0.52% CTR and average position 10.36.
- The canonical entity exposes `ScoreImmo` and `Score Immo` as unqualified alternate names. Search results expose unrelated real-estate services under the same or a near-identical name.
- The public About page already exposes the verified publisher, SIREN, method and legal pages. The Organization schema already points to the exact official domain and corroborated social profiles.

## Constraints and invariants

- Preserve every public URL and canonical.
- Preserve the paid-first catalog: 2.99 EUR for one report, 9.99 EUR for five, 19.99 EUR for ten, 29 EUR per month for 60 and 79 EUR per month for unlimited use.
- Preserve the Paris article body, primary source, H1 and search intent.
- Keep Wikidata Q140289914 because its official website statement resolves to `score-immo.fr`.
- Do not claim leadership, uniqueness, affiliation, customer volume or independent validation.
- Do not name or attack unrelated homonyms on the public site.
- Do not use em or en dashes in new public copy.

## Options considered and trade-offs

1. Create a separate identity page. Rejected because the About page already owns this intent and a new page would duplicate it.
2. Remove every unhyphenated mention. Rejected because users and GSC legitimately use those lexical variants, and Wikidata itself currently uses the unhyphenated label.
3. Keep lexical variants but qualify the canonical entity with exact legal and domain identifiers. Chosen because it preserves real brand demand while giving crawlers facts that distinguish the service.

## Chosen architecture

- Extend the shared Organization JSON-LD with a visible, fact-mirrored `disambiguatingDescription`, `legalName` and SIREN `identifier`.
- Extend the About page with a short visible official-identity section that states the canonical spelling, domains and publisher and explains that similarly named services are not automatically affiliated.
- Mirror the same bounded identity facts in `llms.txt`.
- Update only the Paris meta title and description with the already sourced April 2026 Notaires du Grand Paris benchmark and the actual comparison content.
- Add regression tests before production changes.

## Security and privacy model

Only already-public business identity facts are used. No personal customer data, authenticated URL, credential, private metric or unpublished report is added. Existing consent and analytics code remains unchanged.

## Test strategy

- RED/GREEN source tests for structured identity, visible mirror text, llms identity and Paris metadata.
- Existing full unit suite and content-truth checks.
- Astro production build and built-link integrity.
- JSON-LD parsing and public-page marker checks.
- Dependency audit followed by a bounded Astro patch upgrade and compatible lockfile refresh; require zero reported vulnerabilities and the complete regression suite before rollout.
- Secret and diff scans.

## Rollout, rollback and monitoring

Deploy through the existing GitHub Actions workflow on `main`. Roll back by reverting the delivery commit and allowing the same workflow to redeploy. Roll back if build/integrity checks fail, canonical/price output changes, the public pages do not expose the expected markers or critical paths regress.

GSC impact must be remeasured on aligned windows at J+7 (27 September), J+14 (4 October) and J+28 (18 October 2026). Entity recognition must be manually retested without personalization after indexing; no citation outcome is promised.

## Acceptance criteria

1. Official entity facts are identical in visible copy and JSON-LD.
2. The Organization remains connected to its exact official website and verified publisher.
3. Paris metadata is factual, bounded and within normal snippet lengths.
4. No URL, H1, product price, paid-first rule or article body changes.
5. Full tests, build, integrity, JSON-LD, secret and live checks pass.

## Open decisions

None.
