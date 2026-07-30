# ScoreImmo paid formulas — source of truth

Date: 2026-07-30

## Mission

Align every public ScoreImmo surface with the paid-first product already enforced
by the application. A visitor must never understand that a personalized report is
free or that the standard subscriptions start at one euro.

## Canonical public offers

| Offer | Price | Billing | Entitlement |
| --- | ---: | --- | --- |
| Analyse unique | 2.99 EUR | One-time | 1 personalized report |
| Découverte | 9.99 EUR | One-time | 5 personalized reports |
| Recherche | 29 EUR | Monthly | 60 reports per month |
| Premium | 79 EUR | Monthly | Unlimited reports, branded PDF, Achat/Vente modes |

The free experience is the static complete demo at
`https://app.score-immo.fr/r/demo`. It does not generate or unlock a personalized
report.

## Public wording rules

- Say “Démo complète gratuite” when describing the no-payment experience.
- Say “Rapport personnalisé dès 2,99 €” at conversion points.
- Never advertise a free first personalized analysis, a free weekly report, a
  standard first month at one euro, or “no payment now” on a paid checkout CTA.
- Account creation may be described as free only when it does not imply that it
  unlocks an unpaid personalized report.

## Partner exceptions

- Efficity keeps its contracted one-euro first month and lifetime discount.
- IAD keeps its dedicated partner price.
- Partner pages must clearly label those prices as exclusive partner offers.
- Partner pages still must not promise a free personalized report.

## Surfaces

- Marketing homepage, pricing page, Pro page, generic CTA components.
- SEO article CTAs, tools hub, legal terms, press kit.
- Product/FAQ structured data used by search engines and AI crawlers.
- Application signup and pricing copy.

## Verification and rollback

- Source tests reject legacy public claims and assert all four canonical offers.
- Existing content-truth tests, application security tests and production builds
  must remain green.
- Production verification checks homepage, pricing, Pro, tools, one SEO article,
  the static demo and all four checkout routes.
- Roll back by reverting the dedicated marketing and application commits. The
  pre-change marketing reference is `9a7f52bcd74644725e688abb17b66ed9901085f8`;
  the pre-change application reference is `5b016d8`.
