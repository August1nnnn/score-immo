# ScoreImmo SEO/GEO visibility optimization

Date: 2026-07-30
Owner: Augustin / Codex
Status: implementation in progress

## Objective

Increase qualified visibility and paid-report acquisition from Google and AI
assistants without adding unverifiable claims or weakening the paid-first model.

## Baseline

Google Search Console, 2026-04-29 to 2026-07-28:

- 752 clicks, 68.7k impressions, 1.1% CTR, average position 9.6.
- Homepage: 167 clicks / 1,260 impressions.
- DPE guide: 135 / 9,995.
- Negotiation guide: 101 / 7,877.
- Paris price guide: 45 / 12,422.
- City-price hub: 11 / 4,760.
- Indexed pages: 291.
- Not indexed: 97, including 55 canonical alternates, 20 noindex pages and
  13 pages crawled but not indexed.

Google generative-AI report, 2026-07-01 to 2026-07-28:

- 964 impressions across 59 pages.
- Leading pages: Paris prices 157, negotiation 145, DPE 128, Bordeaux prices
  86 and Annecy prices 53.

Bing Webmaster Tools AI Performance, 2026-04-30 to 2026-07-29:

- 4.4k citations across Microsoft Copilots and partners.
- 87 cited pages, with an average of 12 unique pages cited per day.
- Leading pages: DPE guide 1.1k citations, Pinel guide 702, negotiation guide
  257, Paris neighborhoods 221 and voluntary property manager guide 190.
- Leading grounding queries: “loi pinel 2026” 560 citations, “classe dpe”
  271, “syndic benevole” 174 and “classification dpe 2026” 64.
- Classic Bing search currently reports no measurable clicks or impressions.

The existing GEO base is strong: crawl permissions for search/AI bots,
Article, Dataset, FAQPage, BreadcrumbList, visible TL;DR blocks, named authors,
citations and first-party methodology. Google does not require special AI
schema or a special AI file. Indexability, useful text, internal links,
matching structured data and page experience remain the source of truth.

## Problems to solve

1. High-impression pages have low CTR despite first-page average positions.
2. The homepage rotating H1 produces a late LCP candidate around 2.6 seconds.
3. AI-assistant referrals are classified as generic referrals or “other”.
4. Verified OpenAI crawler visits are stored but hidden from the admin.
5. `llms.txt` has stale claims: 9 instead of 10 sources and a wrong barometer
   hostname.
6. Lighthouse reports contrast and heading-order accessibility failures.

## Changes

Marketing repository:

- Make the homepage H1 stable while keeping rotating examples inside the input.
- Align the public accent token with WCAG AA contrast for white text.
- Version the shared stylesheet URL so the corrected accessibility tokens
  bypass the previous Cloudflare/browser cache immediately.
- Fix the demo mockup heading hierarchy.
- Align `llms.txt` with the canonical 10-source claim and marketing URLs.
- Rewrite the Paris title around the queries that already generate impressions.
- Strengthen the city hub title, visible summary and description around
  “évolution prix immobilier par ville”.

Application repository:

- Add a dedicated AI-assistant acquisition channel.
- Recognize ChatGPT, Perplexity, Claude, Copilot, Gemini and Meta AI referrers.
- Keep verified OpenAI bot traffic outside human analytics while exposing a
  separate, clearly labeled visibility card.
- Show AI human sessions, verified OpenAI crawler views and their top pages.

## Measurement and targets

Remeasure on 2026-08-13 and 2026-08-27:

- Overall organic CTR target: at least 1.5%.
- Paris page CTR target: at least 0.8% without losing average position.
- City hub CTR target: at least 0.6% without losing average position.
- Homepage lab LCP target: below 1.5 seconds on a warm static deployment.
- AI attribution: no known assistant referrer classified as “other”.
- Continue tracking Google AI impressions and the number of cited pages.
- Bing AI target: preserve at least 87 cited pages and grow citations without
  reducing citation share on the leading DPE and negotiation topics.

Conversions must be segmented by landing page and acquisition channel. Bot
hits are visibility signals, never visitors or conversions.

## Verification

- RED/GREEN tests for public SEO invariants and AI channel classification.
- Marketing and app production builds.
- Lighthouse mobile on homepage and a leading editorial page.
- Production checks for title, canonical, robots, `llms.txt`, structured data
  and admin analytics.

## Risk and rollback

- Title changes can temporarily alter rankings. Roll back only if a 28-day
  comparison shows a material position loss without CTR gain.
- AI referrer classification changes reporting only, not attribution storage.
- Bot rows remain excluded from all human funnel metrics.
- Revert the two repository commits independently if needed.

## Verification results

- Marketing tests: 27 passed.
- AI attribution tests: 10 passed.
- Marketing and application production builds: passed.
- Homepage Lighthouse mobile: 100 accessibility, 100 best practices, 100 SEO,
  100 agentic browsing.
- Paris article Lighthouse mobile: 100 accessibility, 100 best practices,
  100 SEO, 100 agentic browsing.
- Homepage observed local LCP: 189 ms, down from the 2.595 s baseline.
- Marketing commit `dccfa51` deployed successfully through Cloudflare Pages;
  the cache-busting follow-up is deployed separately after final live audit.
- Application commit `3ea00a8` published through Lovable and verified on
  `app.score-immo.fr/admin`.
- The live AI visibility card initially reports 0 human AI-referral sessions
  and 229 verified OpenAI reads: 221 ChatGPT-User and 8 OAI-SearchBot. These
  reads remain excluded from visitors, funnels and conversions.
- Production homepage Lighthouse after the first deployment: performance 98,
  best practices 100, SEO 100, LCP 2.005 s, CLS 0.005, TBT 0 ms. Its
  accessibility score of 96 exposed the stale unversioned stylesheet and
  triggered the cache-busting follow-up.
- The full application test suite retains two unrelated pre-existing failures
  in `validateListingURL.test.ts` for SeLoger search and PAP list URLs. The
  changed analytics tests pass.
