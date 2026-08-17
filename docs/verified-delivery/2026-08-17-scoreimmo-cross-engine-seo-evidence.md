# ScoreImmo cross-engine SEO focus - verification evidence

Date: 2026-08-17
Branch: `codex/scoreimmo-seo-focus-20260817`
Base: `origin/main` at `adbee9414f8db964b643cbdea6f3adfba129bce8`
Record type: pre-deployment evidence pack; the published commit and live checks are recorded in the shared project checkpoint after deployment

## Source evidence

- Google Search Console final window through 2026-08-15: 262 clicks, 25,591 impressions, 1.02% CTR over 28 days.
- Bing Webmaster final window through 2026-08-15: 86 clicks, 2,951 impressions, 2.91% CTR over 28 days.
- Bing DPE page, latest four weekly samples: 39 clicks, 1,438 impressions, position 5.00. Its existing `meta_title` was preserved exactly.
- Negotiation cluster, Google 28 days:
  - procedural guide: 32 clicks, 3,664 impressions, position 7.38;
  - benchmark page: 7 clicks, 281 impressions, position 4.45.
- Negotiation cluster, Bing latest four weekly samples:
  - procedural guide: 4 clicks, 102 impressions, position 5.24;
  - benchmark page: 2 clicks, 18 impressions, position 3.44.

These results justify preserving both negotiation URLs and assigning them different intents.

## RED/GREEN evidence

- Initial acceptance run: 6 tests, 1 passed and 5 failed on the intended missing behavior.
- Contrast review guard: failed before replacing `--si-muted` with `--si-muted-foreground`.
- Internal-link guard: failed while two links still targeted the redirected first-purchase URL.
- Final focused run: 6/6 passed.

## Final verification

| Check | Result |
|---|---|
| `npm test` | 38/38 passed |
| `npm run test:content-truth` | passed |
| `npm run build` | passed, 303 pages |
| Generated redirect | exact 301 rule present |
| Duplicate generated HTML | absent |
| Duplicate sitemap URL | absent |
| Survivor sitemap URL | present |
| Old internal links in generated output | absent outside `_redirects` |
| Priority H1/title and hub H2 checks | passed |
| `git diff --check` | passed |

The build emits seven pre-existing route-conflict warnings for the four calculators, Efficity, Guide, and Tarifs. Clean `origin/main` emitted the same seven warnings and built 304 pages; the expected one-page reduction is the removed duplicate.

## Scope review

- No Karmastro file changed.
- No dependency or lockfile changed.
- No article body or freshness field changed for DPE, negotiation, Bordeaux, Paris, or the surviving first-purchase guide.
- The only article-body change is the mechanical replacement of two old internal URLs in the counter-visit checklist.
- No new market value, percentage, legal statement, or forecast was introduced.

## Rollback readiness

The work is isolated in `/Users/lestoilettesdeminette/scoreimmo-seo-focus-20260817` and delivered as one scoped commit. Rollback after publication is a revert of that commit followed by the existing deployment workflow; the duplicate source and its redirect must be rolled back together.
