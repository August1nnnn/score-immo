# ScoreImmo safe site optimization - design

Date: 2026-08-18
Owner: Codex
Base: `7f7d4cdc1bd2ceb403a6dda192170ed7c15b01c1`
Risk: high, because the work changes a public SEO and real-estate information surface
Status: authorized for implementation; publication remains gated by all acceptance checks

## Objective

Improve ScoreImmo as far as the current evidence safely permits. Every shipped change must fix a reproduced defect or add an editorial link whose relevance was independently verified. No ranking promise, inferred market fact, speculative security change, or broad automatic linking rule is allowed.

## Verified baseline

- `HEAD`, `origin/main`, the successful deployment workflow and the live homepage and sitemap all identify the same commit.
- The clean baseline passes 42 tests, the content-truth check, a 304-page production build and integrity checks over 12,056 internal links.
- The complete generated graph has no indexable orphan, dead end, broken internal link, link to redirect or broken fragment.
- Google URL Inspection covered all 303 sitemap URLs: 287 are indexed, 14 are not indexed for discovery or quality reasons, and 2 noindex pages are incorrectly present in the sitemap.
- Fresh Google Search Console data through 2026-08-16 records 256 clicks and 27,560 impressions over 28 days. It does not justify broad rewrites of pages that still perform.
- Seven representative live pages are identical to the local build. Local mobile Lighthouse scores range from 94 to 99 for performance, with zero blocking time and negligible layout shift.

## Implementation scope

### 1. Indexing and route hygiene

- Exclude `/pages/efficity` and `/pages/llms-txt` from the sitemap because both are intentionally noindex.
- Move the Efficity robots directive into the document head through `BaseLayout`, leaving one unambiguous directive.
- Exclude handles with dedicated static Astro pages from the legacy dynamic page generator. This removes seven deterministic route-conflict warnings without changing their public URLs or rendered implementations.
- Extend built-site integrity checks so a sitemap containing a noindex page or a page containing multiple robots directives fails verification.

### 2. Public copy and form correctness

- Replace the ambiguous generic AnalyzerBox copy with the canonical paid-first wording already defined by the repository: `Démo complète gratuite` and `Rapport personnalisé dès 2,99 €`.
- Restore native URL validation in AnalyzerBox by removing `novalidate` and add consent-gated form instrumentation that never records the submitted listing URL. Give the top and end placements distinct bounded identifiers so analytics cannot merge their events.
- Replace the four corrupted calculator meta descriptions with short summaries derived only from their visible purpose.
- Remove the invisible homepage FAQ structured data. On the pricing page, generate visible FAQ content and FAQ JSON-LD from one Unicode source so both surfaces remain identical. Expose each accordion panel through linked ARIA state and keep hidden answers out of the accessibility tree.
- Replace two obsolete `claude.ai` privacy links in the legal notice with the existing first-party privacy route. Leave the unconfirmed legal identity and hosting statements unchanged and flag them for owner review.
- Add the missing H1 to Contact and Privacy, normalize Privacy section headings, and preserve their existing legal copy.
- Correct the deterministic Barometer gender agreements, use the visible article author in the author meta tag, and preserve `ScoreImmo` as the fallback.
- Build Barometer meta descriptions from complete sentences only. Append the existing verdict only when it fits in full under 160 characters; never cut a word or sentence.
- Fix HTML-to-description extraction so removed tags leave spaces instead of concatenating words.
- Correct the identified missing accents on the tools hub and four homepage labels without any global replacement.

### 3. Accessibility defects

- Replace the failing orange score text and Thomas Varin avatar color with already established accessible palette values.
- Make the mobile menu state explicit with `aria-expanded`, `aria-controls`, `aria-hidden` and `inert`, support Escape, keep focus inside the open drawer and restore focus on close.
- Use H2 for blog-card titles directly below each hub H1 while preserving the existing card style.

### 4. Barometer data containment

- Correct Cayenne's region to `Guyane`, supported by the official French geographic API and its otherwise valid `97300` postal code.
- Remove four generated fiches whose locality and postal code conflict with the official commune data: La Roche-Guyon, Maxéville, Nancy and Sons-et-Ronchères. Their location-dependent details cannot be safely repaired from the published files. They produced zero Google clicks and four total impressions over the last 90 days.
- Record the deterministic aggregate effect: `/barometre/region/france` disappears because all three members were invalid, and `/barometre/region/bourgogne-franche-comte` disappears because its remaining count falls below the existing minimum of three. Exact GSC API queries for 2026-05-19 through 2026-08-16 report zero clicks and zero impressions for both region routes.
- Add a fail-closed generation guard for the known rejected source slugs and for generic `France` regions, so the defects cannot silently return on the next refresh.
- Do not redirect the removed fiches to the Barometer hub, because that would recreate a soft-404 pattern. The existing custom 404 is the truthful response until the source reports are regenerated.

### 5. Curated internal linking

- Add ten contextual links across six exact editorial pairs: DPE and DPE vierge, negotiation and agency fees, volunteer syndic and general-meeting minutes, Bordeaux and its right bank, Strasbourg and its micro-neighbourhoods, Pinel and Denormandie.
- Add no automatic related-content component. The corpus has no sufficiently precise tag vocabulary and automatic matching would create weak or duplicate links.
- Do not change titles, dates, numeric claims or article freshness metadata in this lot.

### 6. Build footprint

- Import only the Latin Fontsource files already needed by French pages. This removes unused Cyrillic, Greek and Vietnamese build artifacts without changing font families, weights or the Latin glyph set.

### 7. Verification hardening

- Repair `audit_standards.py` so Astro file-format builds scan every `*.html` file instead of only the homepage.
- Report exact routes rather than collapsing file-format pages to `/pages` or `/blogs`.
- Treat heading, canonical, title, description, OpenGraph and image-alt findings as failing evidence. Keep Organization JSON-LD informational because it is not required on every page.

### 8. Retired-route Pages Functions tombstones

Post-deployment verification exposed a Cloudflare Pages custom-domain cache defect outside the built artifact. The immutable deployment `3fdb5cdd.score-immo.pages.dev` and `score-immo.pages.dev` return the intended 404 for all six retired routes, while the apex custom domain still serves four deleted assets with an increasing one-week `Age`. Exact-URL purge, prefix purge and the Pages-documented zone purge all completed successfully without evicting those four assets. No further cache purge is allowed.

- Add six exact Pages Function routes, one for each retired path. Do not add a wildcard, dynamic slug handler, broad `_routes.json` entry, DNS rule or cache rule.
- Keep the shared response helper outside `functions/` so it cannot create an unintended Function route.
- Fetch only the fixed `/404` presentation asset through `env.ASSETS.fetch(new URL('/404', request.url))`. Never forward the incoming request headers, cookies, query, body or path.
- Reconstruct every response as HTTP 404 and independently force `Cache-Control: no-store` plus `X-Robots-Tag: noindex, follow`. Remove inherited `Age`, validator and surrogate/CDN cache headers that could contradict the tombstone.
- Handle every HTTP method. HEAD returns no body; GET, POST and OPTIONS remain deterministic 404 responses.
- If the asset binding is absent, throws or returns a status other than 200 or 404, fail closed to a minimal local 404 document. Never call `context.next()` or pass through to the stale asset.
- Cloudflare project evidence on 2026-08-18 confirms `uses_functions=true`, production `usage_model=standard` and an active Workers Paid subscription. The project's `fail_open=true` therefore cannot expose the stale asset through exhaustion of the Workers Free daily quota.
- Use pinned `wrangler@4.123.0` for local Pages routing tests. Deployment remains gated by a fresh independent review and the exact-SHA production workflow.

## Explicitly out of scope

- DNS, TLS or hosting changes for `score-immo.com`, because repository code cannot fix the demonstrated upstream routing problem and ownership has not been established.
- CSP tightening, because the current policy is not a demonstrated vulnerability and safe removal requires report-only telemetry.
- Rehosting Unsplash images without verified per-image licence rights.
- Cache-policy changes for stable asset names without a complete fingerprinting migration.
- Automatic Search Console reindexing, Bing submission, checkout calls or form submissions.
- Broad article rewrites, new legal or fiscal statements, new prices, forecasts or freshness dates.
- The public legal notice still contains `[PRÉNOM NOM]` and names Shopify as host. Both defects predate this lot. The repository proves Cloudflare Pages deployment but does not prove the publisher identity or authorize publication of a personal identity, so this lot does not guess or rewrite those legal statements. Owner-supplied legal facts remain required for a separate correction.

## Acceptance criteria

1. New acceptance tests fail on the clean baseline for every intended invariant, then pass after implementation.
2. All repository tests, content truth, production build, standards audit and built-site integrity checks pass from fresh artifacts.
3. The build emits no route-conflict warning.
4. The sitemap contains no noindex or removed Barometer URL.
5. Every generated page contains exactly one robots directive and all canonical URLs remain self-consistent.
6. The four removed Barometer fiches and the two resulting region routes are absent from the build and return the existing custom 404 when deployed. Exact Function tombstones must return 404/noindex/no-store for GET, HEAD, POST and OPTIONS, with or without a trailing slash or query string, even when the presentation asset fails.
7. All ten curated links resolve directly, occur once in the intended source and introduce no broken fragment or redirect target.
8. Lighthouse accessibility passes on the Barometer hub, an author article and the mobile navigation interaction; browser tests prove the pricing accordion ARIA state and focus behavior.
9. Homepage FAQ JSON-LD is absent unless a matching FAQ is visible; pricing FAQ text and JSON-LD are generated from one source.
10. Every indexable generated page has exactly one H1, all 97 remaining Barometer descriptions are complete and at most 160 characters, and the standards audit reports the exact number of checked pages.
11. `git diff --check`, secret scanning and an independent diff review pass.
12. A published commit is accepted only after the deployment workflow succeeds and live checks prove the intended artifact is served.

## Rollback

The application optimization was delivered as one scoped commit after local verification. Its rollback remains a Git revert followed by the existing deployment workflow. The four removed Barometer JSON files remain recoverable from Git history; restoring them also restores the two derived region routes. No external database row is changed.

The exact Function tombstones are a containment control for stale infrastructure state. Reverting them before the old one-week assets have expired is not a safe functional rollback because it can expose the cached 200 responses again. If a tombstone itself fails, keep or repair the exact-route handler; do not remove it until all apex variants have returned the origin 404 beyond the maximum prior cache TTL. The tombstones do not mutate data and affect no valid route.
