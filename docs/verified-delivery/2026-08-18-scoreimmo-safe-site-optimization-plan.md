# ScoreImmo safe site optimization - implementation plan

Design: `docs/verified-delivery/2026-08-18-scoreimmo-safe-site-optimization-design.md`

## Task 1 - Add executable acceptance tests

- Assert that noindex routes are explicitly excluded from the sitemap.
- Assert that dedicated static handles are excluded from the dynamic legacy route.
- Assert the Efficity page receives its robots directive from `BaseLayout` and the body component contains none.
- Assert AnalyzerBox uses the canonical paid-first wording, native required URL validation, distinct placement identifiers and privacy-safe instrumentation.
- Assert all four calculator descriptions are plain text, relevant and at most 160 characters.
- Assert homepage FAQ schema is not hidden, pricing FAQ has a single shared source and complete ARIA state, legal privacy links are first-party, and Contact and Privacy have one H1.
- Assert Barometer grammar and complete-sentence descriptions, article author metadata, description spacing, blog-hub heading order and corrected visible accents.
- Assert accessible colors and mobile-menu state and keyboard controls.
- Assert rejected Barometer sources are absent, Cayenne is assigned to Guyane and the generator blocks their return.
- Assert the ten curated links exist exactly once and point to existing article routes.
- Assert only Latin Fontsource entry points are imported.
- Assert the standards audit scans all generated HTML files and fails on indexable heading defects.

Run the focused tests before implementation and retain the expected failures as RED evidence.

## Task 2 - Repair indexing and route generation

- Update `astro.config.mjs` sitemap filtering.
- Update the legacy page `getStaticPaths` filter.
- Pass `noindex` to the Efficity layout and remove the invalid body meta.
- Extend `scripts/check-built-links.mjs` with robots and sitemap indexability checks.

## Task 3 - Repair conversion copy, metadata and accessibility

- Update AnalyzerBox copy, native validation and instrumentation.
- Replace four calculator descriptions without changing calculator logic or structured data.
- Align FAQ structured data with visible content and repair the two first-party privacy links.
- Repair missing H1 elements, heading order, metadata authorship, grammatical agreements, description spacing and the bounded accent list.
- Apply the two measured contrast corrections.
- Implement the mobile-menu accessibility state machine and keyboard behavior.

## Task 4 - Contain invalid Barometer data

- Remove the four invalid JSON sources.
- Correct only Cayenne's region.
- Add explicit fail-closed checks to the manual Barometer generator.
- Verify and document the two resulting aggregate route removals (`France` and `Bourgogne-Franche-Comté`) and their exact zero-click, zero-impression 90-day GSC evidence.
- Do not touch Supabase or any other external data source.

## Task 5 - Add the curated internal links

- Insert only the ten approved contextual links.
- Parse every changed JSON file after editing.
- Verify the exact source-to-destination edge set in the generated build.

## Task 6 - Reduce unused font build assets

- Change Fontsource entry points to the Latin subsets for the same families and weights.
- Compare generated font count and size before and after.
- Verify French accented text visually and in generated HTML.

## Task 7 - Full local verification

Run from a fresh production build:

1. Focused acceptance tests.
2. `npm test`.
3. `npm run test:content-truth`.
4. `npm run build` with the exit code preserved.
5. `npm run test:site-integrity`.
6. `python3 scripts/audit_standards.py`.
7. JSON parsing, sitemap/robots/canonical checks and graph audit.
8. Full-corpus standards audit with exact page count.
9. Lighthouse and browser interaction checks for the mobile menu, pricing accordion, AnalyzerBox validation and unique placement identifiers.
10. Secret scan, `git diff --check`, scope review and independent adversarial review.

## Task 8 - Publication and fresh live evidence

- Fetch immediately before publication and stop on divergence.
- Commit only the reviewed files.
- Push the verified commit through the existing GitHub deployment path.
- Observe the exact workflow to completion.
- Verify live status, canonical, robots, sitemap exclusions, corrected metadata, four removed fiches, two removed derived region routes, form validation, menu and accordion semantics, and representative links.
- Record deployed SHA, workflow, checks, rollback and known limits in the Obsidian checkpoint.

No result is marked complete from a local build alone.
