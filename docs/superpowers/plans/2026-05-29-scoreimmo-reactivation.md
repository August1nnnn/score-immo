# ScoreImmo — Plan de réactivation (SEO + funnel + rétention)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Récupérer le trafic SEO déjà acquis (14,5k impressions/mois → 0,6 % CTR) et réparer les 3 fuites du funnel ScoreImmo (SERP→clic, attribution aveugle, rétention one-and-done).

**Architecture:** Deux repos. (1) Site Astro `score-immo` (`/Users/lestoilettesdeminette/scoreimmo all/score-immo/`) déployé sur CF Pages — on y agit sur les metas, le contenu des pages à fort volume, et les UTM des liens sortants. (2) App React/Vite Lovable (`/Users/lestoilettesdeminette/scoreimmo all/scoreimmo app/`) + Supabase `afvtxiklivnmakqixkml` — on y répare la capture d'attribution, les events funnel, et la séquence email de rétention. **App = Lovable : commit+push GitHub puis sync manuel par Augustin.**

**Tech Stack:** Astro 6, contenu JSON (`src/content/articles/{guides,villes,quartiers}/*.json` avec champs `meta_title`/`meta_description`/`body_html`), CF Pages, IndexNow. App : React 18 + TS + Supabase (auth, 35 edge functions Deno, Stripe, Resend).

**Baseline mesurée (29/05/2026) — à re-mesurer en fin de chaque phase :**
| Métrique | Départ | Source |
|----------|--------|--------|
| CTR GSC global | 0,59 % | `scripts/gsc_pull_queries_pages.py` |
| Clics/mois | 86 (mai) | GSC |
| Impressions/mois | 14 537 | GSC |
| Lignes user_attribution | 9 / 131 users | Supabase |
| Rétention ≥2 rapports | 15 % (16/107) | Supabase reports |
| Abonnés actifs | 1 | Supabase subscriptions |

> ⚠️ **Pull before push obligatoire** sur les 2 repos avant toute modif (CLAUDE.md). Ne pas toucher la DA sans validation.

---

## Phase 0 — CTR : récupérer le trafic déjà gagné

**Constat nuancé (vérifié 29/05) :** les titres Paris/Bordeaux sont déjà bons (chiffres + année) mais restent à 0,5 % CTR en **position 9-12**. Le vrai plafond = position page-2 + SERP zéro-clic (AI Overviews sur « dpe », « prix m2 ville »). Donc deux leviers : (A) réécrire les metas réellement faibles, (B) restructurer le contenu des pages fort-volume pour gagner le featured snippet / la citation IA ET remonter en top 5.

> Pour le levier B, s'appuyer sur la méthodo des skills `mkt-ai-seo` (GEO/AEO) et `seo-geo` : réponse directe citable en tête, passages auto-portants, FAQ schema, tableaux.

### Task 0.1 — Réécrire la meta du guide DPE (meta faible confirmée)

**Files:**
- Modify: `src/content/articles/guides/dpe-comprendre-classes-energetiques.json` (champs `meta_title`, `meta_description`)

- [ ] **Step 1 — Pull before push**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo/" && git fetch origin && git status -sb
```
Expected: `## main...origin/main` sans « behind ».

- [ ] **Step 2 — Lire la meta actuelle (avant)**

Actuel :
- `meta_title`: « DPE Classes Énergétiques : Comprendre de A à G en 2026 »
- `meta_description`: « Les classes énergétiques du DPE déterminent en grande partie la valeur d'un bien immobilier en 2026. » (générique, sans bénéfice ni curiosité)

- [ ] **Step 3 — Réécrire (après)**

```json
"meta_title": "DPE de A à G : ce que chaque classe coûte ou rapporte (2026)",
"meta_description": "Classes DPE A à G expliquées : impact réel sur le prix, les loyers et l'interdiction de location. Tableau complet + estimez votre bien gratuitement."
```
Contrainte : `meta_title` ≤ 60 car, `meta_description` ≤ 155 car (et < 200 strict, cf. [[feedback-astro-description-max-200-strict]]).

- [ ] **Step 4 — Vérifier le JSON valide**

```bash
python3 -c "import json;json.load(open('src/content/articles/guides/dpe-comprendre-classes-energetiques.json'));print('JSON OK')"
```
Expected: `JSON OK`

### Task 0.2 — Restructurer le `body_html` DPE pour « dpe classes a g » (942 imp, pos 30)

**Files:**
- Modify: `src/content/articles/guides/dpe-comprendre-classes-energetiques.json` (champ `body_html`)

- [ ] **Step 1 — Ajouter une réponse directe citable en tête de l'article**

Insérer en tout début de `body_html`, avant le premier `<h2>`, un bloc TL;DR scoré (pattern qui a fonctionné sur petfoodrate, cf. mémoire GSC) :

```html
<div class="tldr"><p><strong>Les 7 classes DPE (A à G) en bref :</strong> A = très performant (&lt; 70 kWh/m²/an), G = passoire thermique (&gt; 420). Depuis 2025, les G sont interdits à la location ; F en 2028, E en 2034. Une classe perdue = en moyenne −5 à −15 % sur le prix de vente.</p></div>
<h2 id="tableau-classes-dpe">Tableau des classes DPE de A à G</h2>
<table>...(tableau A→G : seuils kWh, GES, impact location, impact prix)...</table>
```

- [ ] **Step 2 — Ajouter un bloc FAQ avec schema (capter le People-Also-Ask)**

Vérifier si le template injecte déjà FAQPage JSON-LD à partir d'une section FAQ. Sinon, ajouter 4-5 Q/R (`<h3>` question + `<p>` réponse) :  « C'est quoi un DPE classe A à G ? », « Quelle classe DPE est interdite à la location ? », « Comment passer de F à E ? ».

```bash
grep -rl "FAQPage" src/ | head
```
Si présent → suivre le pattern existant. Si absent → noter pour Task 0.5 (schema).

- [ ] **Step 3 — Vérifier JSON + build local**

```bash
python3 -c "import json;json.load(open('src/content/articles/guides/dpe-comprendre-classes-energetiques.json'));print('JSON OK')"
npm run build 2>&1 | tail -5
```
Expected: `JSON OK` puis build sans erreur (capturer le vrai exit code, cf. [[feedback-deploy-recent-local-build-exit-masked]]).

### Task 0.3 — Audit + réécriture des metas du top-15 pages fort-volume

**Files:**
- Modify: pages identifiées par le pull GSC (villes/quartiers/guides à imp ≥ 200 et CTR < 1 %).

- [ ] **Step 1 — Régénérer la liste fraîche**

```bash
cd /Users/lestoilettesdeminette/stack-2026 && python3 scripts/gsc_pull_queries_pages.py && python3 -c "
import json;d=json.load(open('scripts/_out/score-immo_gsc_28d.json'))
for p in d['top_pages']:
    if p['impressions']>=200 and p['ctr']<1.0:
        print(f\"{p['impressions']:>5} imp | CTR {p['ctr']:.2f}% | pos {p['position']:.1f} | {p['url']}\")"
```

- [ ] **Step 2 — Pour chaque page listée : ouvrir le JSON, juger la meta**

Règle de tri : si `meta_title` contient déjà chiffre+année et est ≤ 60 car → **NE PAS toucher la meta** (le problème est la position, pas le titre → Task 0.4). Sinon réécrire selon pattern « [chiffre] + [année] + [bénéfice/curiosité] ».

- [ ] **Step 3 — Valider tous les JSON modifiés**

```bash
for f in $(git diff --name-only | grep '\.json$'); do python3 -c "import json;json.load(open('$f'))" && echo "OK $f"; done
```

### Task 0.4 — Cibler le top-5 sur 3 pages page-2 à fort volume (levier ranking)

**Files:**
- Modify: `src/content/articles/guides/dpe-comprendre-classes-energetiques.json` (pos 23), + 2 pages villes pos > 10 à fort volume issues de 0.3.

- [ ] **Step 1 — Enrichir contenu + maillage interne** vers la page cible depuis 3-4 articles frères (liens contextuels descendants), pour concentrer le PageRank interne. Vérifier les ancres (github-slugger, cf. [[feedback-toc-anchor-slugify-mismatch]]).
- [ ] **Step 2 — Fraîcheur** : mettre à jour `updated_at` + `last_reviewed` à la date du jour (signal de fraîcheur GSC).
- [ ] **Step 3 — Build + valider.**

### Task 0.5 — Déployer + réindexer

- [ ] **Step 1 — Commit groupé**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo/"
git add src/content/articles/
git commit -m "seo(ctr): réécriture metas + restructuration DPE pour featured snippet (Phase 0 réactivation)"
git push origin main
```

- [ ] **Step 2 — Vérifier le déploiement CF Pages LIVE (200)**

```bash
sleep 60 && curl -s -o /dev/null -w "%{http_code}\n" https://score-immo.fr/blogs/guides/dpe-comprendre-classes-energetiques
```
Expected: `200`. (Vérifier qu'un article frère ET la page modifiée répondent 200, cf. leçon deploy local cassé.)

- [ ] **Step 3 — IndexNow + réindexation GSC**

Soumettre les URLs modifiées via IndexNow (clé `SCOREIMMO_INDEXNOW_KEY` dans `.env.master`) et demander l'inspection/réindexation dans GSC.

**Critère de succès Phase 0 (mesure à J+21, 19/06/2026) :** CTR global > 1,5 % ; clics/mois > 200 ; « dpe classes a g » < pos 15.

---

## Phase 1 — Attribution : arrêter de piloter à l'aveugle

**Constat (vérifié) :** `user_attribution` = 9 lignes pour 131 inscrits → la capture est cassée. Sans elle, impossible de mesurer l'effet de la Phase 0.

### Task 1.1 — Propager les UTM sur tous les liens site→app

**Files:**
- Modify: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/sections/CTA.astro`, `src/components/sections/Hero.astro`, `src/components/sections/ArticleSection.astro`, `src/components/sections/GuideHub.astro`, `src/components/sections/Pricing.astro`

- [ ] **Step 1 — Ajouter les UTM aux liens `app.score-immo.fr/app`**

Pattern : `https://app.score-immo.fr/app?utm_source=site&utm_medium=<emplacement>&utm_campaign=<contexte>`
- Header/Footer : `utm_medium=nav`
- Hero : `utm_medium=hero`
- CTA section : `utm_medium=cta`
- ArticleSection (CTA in-article) : `utm_medium=blog&utm_campaign=` + slug de l'article (via la prop du composant)

- [ ] **Step 2 — Grep de contrôle**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo/" && grep -rIo "app\.score-immo\.fr/app[^\"' ]*" src/components/ | grep -c "utm_source"
```
Expected: nombre = nombre de liens `/app` (tous taggés).

- [ ] **Step 3 — Build + deploy + vérif 200** (voir Task 0.5 Step 2).

### Task 1.2 — Réparer la capture d'attribution dans l'app

**Files:**
- Modify (app, Lovable) : composant racine / hook d'init auth qui crée le profil ; fonction `detectNetworkFromEmail` voisine de la logique localStorage existante.

- [ ] **Step 1 — Pull before push (repo app)**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/scoreimmo app/" && git pull origin main
```

- [ ] **Step 2 — Au premier hit anonyme : stocker `utm_*` + `referrer` + `landing_page` en localStorage** (s'ils ne le sont pas déjà), comme c'est déjà fait pour `?ref=` (parrainage).

- [ ] **Step 3 — À la création du profil : INSERT dans `user_attribution`** avec les valeurs du localStorage (aujourd'hui ce INSERT manque → 9 lignes seulement).

- [ ] **Step 4 — Vérification (après sync Lovable + quelques inscriptions réelles)**

```bash
# via Management API Supabase, comme la baseline
SELECT count(*) FROM user_attribution WHERE created_at > '2026-06-01';
```
Expected: ratio lignes/nouveaux profils > 80 %.

### Task 1.3 — Compléter les events funnel

**Files:** app — là où sont émis `pricing_page_view`, `checkout_initiated` (table `conversion_events`).

- [ ] **Step 1 — Vérifier/émettre les events manquants** : `signup`, `report_generated`, `paywall_shown` (1 seul aujourd'hui → sous-tracké), `paid`.
- [ ] **Step 2 — Vérification SQL** : les 4 events apparaissent dans `conversion_events` après tests.

**Critère de succès Phase 1 :** > 80 % des nouvelles inscriptions attribuées ; funnel `signup → report → pricing_view → checkout → paid` visible bout-en-bout.

---

## Phase 2 — Rétention : casser le « one-and-done »

**Constat (vérifié) :** 91/107 users (85 %) = 1 seul rapport. Infra email déjà présente (`send-email`, `email-cron`, Resend).

### Task 2.1 — Séquence email post-1er-rapport

**Files:** app — edge function `email-cron` (logique de batch) + templates ; table `user_email_preferences` (respect opt-out).

- [ ] **Step 1 — Définir la séquence** : J+0 « votre rapport + score expliqué », J+2 « comparez un 2e bien (1 crédit offert) », J+7 « baromètre [ville de leur 1er rapport] ».
- [ ] **Step 2 — Implémenter le ciblage** : users avec exactement 1 rapport, non désinscrits, créés depuis > 0j.
- [ ] **Step 3 — Garde-fou** : skip profils sans email / anonymes (cf. commit `2c978b4` déjà en place).
- [ ] **Step 4 — Vérification** : `email_logs` montre les envois ; un compte test reçoit bien la séquence.

### Task 2.2 — Réévaluer le crédit récurrent (levier rétention vs conversion)

- [ ] **Step 1 — Contexte** : le commit `14 mars` a *retiré* le crédit hebdo pour pousser la conversion. Résultat : conversion toujours ~0 ET rétention morte. Hypothèse à tester : un crédit récurrent léger ramène les users (habitude) sans tuer la conversion.
- [ ] **Step 2 — Proposer un A/B test** (cf. skill `mkt-ab-test-setup`) avant de trancher : cohorte avec 1 crédit/semaine vs sans.

**Critère de succès Phase 2 :** part des users ≥ 2 rapports : 15 % → > 30 %.

---

## Phase 3 — Conversion in-app (après volume + rétention)

**Constat :** 58 `pricing_page_view` → 10 `checkout_initiated` → ~1 payant. 4 plans visibles + packs cachés = surcharge de choix possible.

### Task 3.1 — Diagnostiquer le décrochage checkout
- [ ] Analyser les 10 `checkout_initiated` non aboutis (étape de sortie).
- [ ] Revue paywall via skill `mkt-paywall-upgrade-cro` : réduire le nombre de plans affichés, clarifier l'offre d'appel (1€ 1er mois).

**Critère de succès Phase 3 :** `checkout_initiated → paid` > 20 %.

---

## Phase 4 — Placeholders produit (selon priorité)
- `/compare` (comparateur — rétention naturelle) ; export PDF (bouton « coming soon »).

---

## Hors-scope / décisions actées
- ❌ Pas de relance prospection B2B cold (4503 emails, 0 conversion, domaine brûlé — acté 22/04/2026).
- ❌ Pas de nouvelles pages SEO avant d'avoir réparé le CTR des pages existantes.

## Self-review (writing-plans)
- Couverture spec : les 4 axes du diagnostic (CTR, attribution, rétention, conversion) → Phases 0-3 ; placeholders → Phase 4. ✅
- Placeholders interdits : chaque task a des chemins exacts + commandes de vérif. Les tasks app (Lovable) décrivent le fichier/zone sans pseudo-code inventé car le code exact dépend de l'inspection live du repo app au moment de l'exécution — signalé explicitement, pas un trou silencieux.
- Cohérence : champs JSON (`meta_title`/`meta_description`/`body_html`/`updated_at`/`last_reviewed`) cohérents entre tasks ; tables Supabase (`user_attribution`/`conversion_events`/`email_logs`) cohérentes.
