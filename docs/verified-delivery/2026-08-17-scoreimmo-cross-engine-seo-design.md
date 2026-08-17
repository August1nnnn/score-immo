# ScoreImmo cross-engine SEO focus - design

Date: 2026-08-17
Owner: Codex
Risk: high (public SEO surface, financial/real-estate content)
Status: approved for local implementation; publication is a separate gate

## Objective

Improve the existing ScoreImmo pages that already earn impressions on Google and Bing, without creating new pages, changing URLs that carry traffic, or publishing unverified market figures.

## Evidence baseline

The last final day shared by both engines is 2026-08-15.

| Engine | Window | Clicks | Impressions | CTR |
|---|---:|---:|---:|---:|
| Google | 2026-07-19 to 2026-08-15 | 262 | 25,591 | 1.02% |
| Google | previous 28 days | 362 | 28,957 | 1.25% |
| Bing | 2026-07-19 to 2026-08-15 | 86 | 2,951 | 2.91% |
| Bing | previous 28 days | 69 | 2,102 | 3.28% |

Google is declining, while Bing clicks and impressions are growing. The DPE guide is the clearest cross-engine constraint: it lost 31 Google clicks, but its latest four Bing weeks produced 39 clicks and 1,438 impressions at an average position of 5. The implementation must preserve its successful Bing title signal.

## Scope

1. Preserve the DPE `meta_title`, while aligning the visible article title with the observed `grille DPE 2026` intent and shortening its description.
2. Separate the negotiation cluster by intent. Keep `/marge-negociation-immobilier-2026` as the owner of current percentages and regional benchmarks; reframe the higher-volume long guide around the procedural intent `négocier le prix d'un bien immobilier`, its method, offer, and arguments.
3. Reframe the Bordeaux title and snippet around prices by neighbourhood, without changing or adding market figures.
4. Turn `/blogs/villes` into a substantive editorial hub with descriptive H2 sections and explicit links to priority city pages and buying guides. Do not add an unsourced comparative price table.
5. Consolidate the two first-purchase guides onto the stronger ten-error URL. The shorter five-error page adds no material topic not already covered by the survivor, so it will be removed from generation and redirected permanently.
6. Keep the Paris title and data unchanged until its arrondissement dataset can be refreshed from an authoritative source.

## Out of scope

- Karmastro.
- New articles or city pages.
- Rewriting, refreshing, or stamping market statistics without source verification.
- Production deployment, merge, or IndexNow submission in this implementation phase.
- Global navigation or application conversion changes.

## URL and indexing decisions

- Keep every priority URL stable.
- Redirect `/blogs/guides/erreurs-a-eviter-premier-achat-immobilier` to `/blogs/guides/premier-achat-immobilier-erreurs-eviter` with HTTP 301.
- Remove the duplicate JSON source so Astro no longer generates it and the sitemap integration no longer lists it.
- Do not canonicalize the duplicate while leaving a crawlable 200 page.
- Keep both negotiation URLs indexable because they have distinct target intents and both already earn clicks. In the current 28-day Google window, the procedural guide has 3,664 impressions and 32 clicks at position 7.38, while the benchmark page has 281 impressions and 7 clicks at position 4.45. On Bing's latest four weekly samples, they have respectively 102/4 at position 5.24 and 18/2 at position 3.44.

## Safety constraints

- Do not introduce new prices, percentages, legal claims, dates, or market forecasts.
- Do not change `updated_at` or `last_reviewed` for metadata-only edits.
- Preserve the DPE `meta_title` exactly because it is already performing on Bing.
- Preserve the Paris article unchanged.
- Validate JSON parsing, redirects, route generation, sitemap output, tests, and a production build before handoff.

## Success measurement

After publication, compare the same URLs and query families at J+14 and J+28:

- Google: clicks, impressions, CTR, and average position.
- Bing: clicks, impressions, CTR, and weekly page/query trends.
- Indexing: the duplicate URL redirects once to the survivor and disappears from the sitemap.

The change is considered directionally successful if consolidation is technically complete and at least one target page improves clicks or CTR without a material DPE decline on Bing. Rankings are an observation metric, not a release-time acceptance test.

## Rollback

Revert the change commit on the feature branch, rebuild, and redeploy through the existing GitHub workflow. A rollback must restore the duplicate source only together with removal of its redirect; partial rollback is not allowed.
