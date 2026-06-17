# ScoreImmo — Conversion mandataire (site → /iad) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Câbler le site Astro à la machine de conversion mandataire déjà construite dans l'app (`/iad`, plan `pro_mandataire`, co-branding) pour transformer l'activation pro en conversion payante.

**Architecture:** Site-only. On reframe le palier Premium en « Pro / Mandataire » sur la page Tarifs, on rend l'axe pro visible dans la navigation, et on re-route toutes les surfaces pro vers `app.score-immo.fr/iad` au lieu du produit acheteur `/app`. Aucune modif de l'app.

**Tech Stack:** Astro 4 + Cloudflare Pages. Pas de test runner unitaire → la vérification de chaque tâche = `npm run build` vert + assertions `grep` + inspection de contenu.

## Global Constraints

- **DA intacte** : aucun changement de palette/typo/structure visuelle au-delà du contenu textuel + réutilisation des classes/variables CSS existantes (`--si-*`, `.si-btn`, `.si-pricing-*`, `.pro-*`).
- **Accents FR obligatoires** : tout texte FR ajouté parfaitement accentué. ⚠️ `check_accents.py` ne scanne PAS les `.astro` → contrôle manuel.
- **0 em-dash** (`—`) introduit. Utiliser des entités HTML existantes du fichier (`&middot;`, `&euro;`, `&eacute;`...).
- **Pull-before-push** : `git pull origin main` avant édition (déjà fait, repo up to date sur `main`).
- **CTA acheteur inchangés** : Header « Analyser une annonce », home, footer « Accéder à l'outil » restent sur `app.score-immo.fr/app`.
- **CTA pro** : `app.score-immo.fr/iad`, utm `utm_source=site&utm_medium=<surface>`.
- **Déploiement** : `deploy.yml` actif → push sur `main` = build + deploy CF Pages. Vérif live obligatoire.
- **Prix Pro** : 79 €/mois, 1er mois à 1 €. Pas de 4e palier (on reframe Premium).

---

### Task 1: Tarifs — reframer le palier Premium en « Pro / Mandataire »

**Files:**
- Modify: `src/components/sections/Pricing.astro` (carte Premium ~lignes 236-277 ; JSON-LD offer Premium ~lignes 35-41 et FAQ ~ligne 63)
- Modify: `src/pages/pages/tarifs.astro` (title/description + JSON-LD offer « Premium » ~lignes 5-6, 41-56)

**Interfaces:**
- Produces: une carte tarifaire `Pro / Mandataire` (79 €) dont le CTA pointe `https://app.score-immo.fr/go/checkout/pro_mandataire`. Task 2 ajoute un bloc juste sous la grille (`</div>` de fermeture `.si-pricing-grid` ligne 279).

- [ ] **Step 1: Reframer l'en-tête de la carte (titre + sous-titre)**

Dans `src/components/sections/Pricing.astro`, remplacer le bloc en-tête de la carte Premium :

```html
          <h3 style="font-family:var(--si-font-heading);font-weight:700;font-size:1.125rem;">Premium</h3>
          <p style="font-size:0.8125rem;color:var(--si-muted-foreground);margin-top:0.25rem;">Pour les professionnels de l'immobilier.</p>
```

par :

```html
          <h3 style="font-family:var(--si-font-heading);font-weight:700;font-size:1.125rem;">Pro / Mandataire</h3>
          <p style="font-size:0.8125rem;color:var(--si-muted-foreground);margin-top:0.25rem;">Pour les mandataires et agents immobiliers.</p>
```

- [ ] **Step 2: Ajouter une feature closing + adapter le wording pro**

Toujours dans la carte, remplacer la 1re feature :

```html
            <strong>Analyses illimit&eacute;es</strong>
```

par :

```html
            <strong>Analyses illimit&eacute;es</strong> &middot; d&eacute;crochez plus de mandats
```

Et remplacer la note de bas de carte :

```html
        <p style="font-size:0.75rem;color:var(--si-muted-foreground);margin-top:auto;padding-top:1rem;">Annulable en 1 clic.</p>
```

par :

```html
        <p style="font-size:0.75rem;color:var(--si-muted-foreground);margin-top:auto;padding-top:1rem;">Rapport &agrave; votre marque. Annulable en 1 clic.</p>
```

- [ ] **Step 3: Re-router le CTA de la carte vers le checkout pro_mandataire**

Remplacer :

```html
        <a href="https://app.score-immo.fr/go/checkout/premium" class="si-btn si-btn-secondary si-pricing-cta" style="width:100%;justify-content:center;margin-top:1rem;">
          Commencer pour 1&euro;
        </a>
```

par :

```html
        <a href="https://app.score-immo.fr/go/checkout/pro_mandataire" class="si-btn si-btn-secondary si-pricing-cta" style="width:100%;justify-content:center;margin-top:1rem;">
          Commencer pour 1&euro;
        </a>
```

- [ ] **Step 4: Mettre à jour le JSON-LD de Pricing.astro (offer + FAQ)**

Dans `src/components/sections/Pricing.astro`, l'offer `name: "Premium (illimite)"` (~ligne 35) → `name: "Pro Mandataire (illimite)"`. Dans la réponse FAQ « Quel plan choisir ? » (~ligne 63), remplacer la mention :

```
Premium (1 EUR le premier mois, puis 79 EUR/mois) est illimit&eacute; avec PDF brand&eacute; et mode Achat/Vente, id&eacute;al pour les professionnels.
```

par :

```
Pro Mandataire (1 EUR le premier mois, puis 79 EUR/mois) est illimit&eacute; avec PDF brand&eacute; &agrave; votre logo et mode Achat/Vente, con&ccedil;u pour les mandataires.
```

(idem pour la 2e occurrence FAQ ~ligne 471 si présente — appliquer le même remplacement.)

- [ ] **Step 5: Mettre à jour tarifs.astro (meta + JSON-LD)**

Dans `src/pages/pages/tarifs.astro`, remplacer dans le JSON-LD :

```javascript
        "name": "Premium",
        "price": "79",
        "priceCurrency": "EUR",
        "description": "Analyses illimitées, 1€ le premier mois, sans engagement",
```

par :

```javascript
        "name": "Pro Mandataire",
        "price": "79",
        "priceCurrency": "EUR",
        "description": "Analyses illimitées, PDF brandé à votre logo, mode Achat/Vente, 1€ le premier mois, sans engagement",
```

La `description` de page (ligne 6) liste « Premium 79€/mois » → remplacer ce segment par « Pro Mandataire 79€/mois ».

- [ ] **Step 6: Build**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: build termine avec exit 0, 0 erreur.

- [ ] **Step 7: Vérifier le contenu compilé**

Run: `grep -rn "Pro / Mandataire\|go/checkout/pro_mandataire" src/components/sections/Pricing.astro`
Expected: les 2 motifs présents (titre carte + CTA).
Run: `grep -rn "Premium" src/components/sections/Pricing.astro src/pages/pages/tarifs.astro`
Expected: plus aucune occurrence « Premium » résiduelle dans la carte/JSON-LD reframés (sauf éventuel commentaire technique neutre).

- [ ] **Step 8: Commit**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo"
git add src/components/sections/Pricing.astro src/pages/pages/tarifs.astro
git commit -m "feat(tarifs): reframe Premium -> Pro / Mandataire (checkout pro_mandataire + JSON-LD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Tarifs — bloc « Vous êtes mandataire ? » → /iad

**Files:**
- Modify: `src/components/sections/Pricing.astro` (insérer après la fermeture de `.si-pricing-grid` ~ligne 279, avant le `<p>` « 1ère analyse offerte » ligne 281)

**Interfaces:**
- Consumes: la grille tarifaire reframée de Task 1.
- Produces: rien que d'autres tâches consomment.

- [ ] **Step 1: Insérer le bloc mandataire**

Dans `src/components/sections/Pricing.astro`, juste après la balise fermante `</div>` de `.si-pricing-grid` (ligne 279) et AVANT le paragraphe « 1ère analyse offerte », insérer :

```html
    <!-- Bloc mandataires : passe le relais a la landing /iad qui convertit -->
    <aside class="si-reveal si-reveal-delay-2" style="margin-top:2.5rem;padding:1.75rem;border-radius:var(--si-radius-xl,1rem);background:linear-gradient(135deg,var(--si-primary,#0F172A),#1e293b);color:#fff;text-align:center;">
      <p style="font-family:var(--si-font-heading,'DM Sans',sans-serif);font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--si-accent,#3B82F6);margin:0 0 0.5rem;">Vous &ecirc;tes mandataire ?</p>
      <h3 style="font-family:var(--si-font-heading,'DM Sans',sans-serif);font-size:clamp(1.25rem,3vw,1.6rem);font-weight:700;margin:0 0 0.75rem;color:#fff;">Un seul mandat d&eacute;croch&eacute; rembourse des ann&eacute;es d'abonnement</h3>
      <p style="max-width:40rem;margin:0 auto 1.5rem;line-height:1.6;color:rgba(255,255,255,0.9);font-size:0.98rem;">&Agrave; 79&nbsp;&euro;/mois, remettez un rapport objectif &agrave; votre marque qui transforme la n&eacute;gociation de prix en discussion de donn&eacute;es. C'est l'outil pens&eacute; pour les mandataires.</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;">
        <a class="si-btn si-btn-primary" href="https://app.score-immo.fr/iad?utm_source=site&amp;utm_medium=tarifs_pro" style="justify-content:center;">Tester gratuitement</a>
        <a class="si-btn" href="/pro" style="justify-content:center;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.25);">En savoir plus</a>
      </div>
    </aside>
```

- [ ] **Step 2: Build**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: exit 0.

- [ ] **Step 3: Vérifier**

Run: `grep -n "Vous &ecirc;tes mandataire\|iad?utm_source=site&amp;utm_medium=tarifs_pro" src/components/sections/Pricing.astro`
Expected: les 2 motifs présents.

- [ ] **Step 4: Commit**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo"
git add src/components/sections/Pricing.astro
git commit -m "feat(tarifs): bloc 'Vous etes mandataire' -> landing /iad (ROI + CTA)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Header — lien « Pro / Mandataires » (desktop + mobile)

**Files:**
- Modify: `src/components/Header.astro` (frontmatter ligne 1-6, nav desktop lignes 14-20, drawer mobile lignes 43-68)

**Interfaces:**
- Produces: un item de nav `Pro / Mandataires` → `/pro`, actif quand `path` commence par `/pro` ou contient `/blogs/pro`.

- [ ] **Step 1: Ajouter la détection d'état actif pro dans le frontmatter**

Dans `src/components/Header.astro`, après la ligne `const isTarifs = path.includes('/pages/tarifs');`, ajouter :

```javascript
const isPro = path.startsWith('/pro') || path.includes('/blogs/pro');
```

- [ ] **Step 2: Ajouter le lien dans la nav desktop**

Remplacer :

```html
      <a href="/pages/tarifs" class={isTarifs ? 'active' : ''}>Tarifs</a>
    </nav>
```

par :

```html
      <a href="/pages/tarifs" class={isTarifs ? 'active' : ''}>Tarifs</a>
      <a href="/pro" class={isPro ? 'active' : ''}>Pro / Mandataires</a>
    </nav>
```

- [ ] **Step 3: Ajouter le lien dans le drawer mobile**

Dans le drawer, après le bloc `<a href="/pages/tarifs">…Tarifs</a>` (lignes 56-59) et avant `<a href="/barometre">`, insérer :

```html
    <a href="/pro">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>
      Pro / Mandataires
    </a>
```

- [ ] **Step 4: Build**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: exit 0.

- [ ] **Step 5: Vérifier (desktop + mobile présents)**

Run: `grep -c 'href="/pro"' src/components/Header.astro`
Expected: `2` (un dans la nav desktop, un dans le drawer mobile).

- [ ] **Step 6: Commit**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo"
git add src/components/Header.astro
git commit -m "feat(nav): lien 'Pro / Mandataires' -> /pro (desktop + mobile)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: BlogNav — fix état actif + onglet « Mandataires »

**Files:**
- Modify: `src/components/sections/BlogNav.astro` (frontmatter ligne 1-2, breadcrumb ligne 12, tabs lignes 16-37)

**Interfaces:**
- Produces: une barre d'onglets où **un seul** onglet porte `si-guide-nav-tab-active` (selon le path), + un onglet `Mandataires` → `/blogs/pro`.

- [ ] **Step 1: Calculer le path et l'helper actif dans le frontmatter**

Remplacer le frontmatter vide :

```
---
---
```

par :

```
---
const path = Astro.url.pathname;
const cls = (href: string) =>
  `si-guide-nav-tab${path === href || path.startsWith(href + '/') ? ' si-guide-nav-tab-active' : ''}`;
---
```

- [ ] **Step 2: Remplacer les classes en dur des onglets**

Remplacer chacune des 4 ouvertures d'onglet (qui ont toutes `si-guide-nav-tab-active` en dur) par l'appel à `cls(...)` :

```html
      <a href="/pages/guide" class={cls('/pages/guide')}>
        Tous les articles
      </a>
      <a href="/blogs/guides" class={cls('/blogs/guides')}>
```
```html
      <a href="/blogs/villes" class={cls('/blogs/villes')}>
```
```html
      <a href="/blogs/quartiers" class={cls('/blogs/quartiers')}>
```

(remplacer respectivement `class="si-guide-nav-tab  si-guide-nav-tab-active"` et les 3 `class="si-guide-nav-tab si-guide-nav-tab-active"` par les `class={cls(...)}` correspondants, en conservant le contenu interne — labels + svg — de chaque onglet.)

- [ ] **Step 3: Ajouter l'onglet Mandataires**

Après l'onglet Quartiers (sa balise `</a>` fermante, ligne ~36), avant `</div>` de `.si-guide-nav`, insérer :

```html
      <a href="/blogs/pro" class={cls('/blogs/pro')}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>
        Mandataires
      </a>
```

- [ ] **Step 4: Build**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: exit 0.

- [ ] **Step 5: Vérifier (plus aucune classe active en dur, onglet pro présent)**

Run: `grep -n "si-guide-nav-tab-active" src/components/sections/BlogNav.astro`
Expected: présent UNIQUEMENT dans l'helper `cls` du frontmatter (1 occurrence), aucune en dur sur les `<a>`.
Run: `grep -n 'href="/blogs/pro"' src/components/sections/BlogNav.astro`
Expected: 1 occurrence.

- [ ] **Step 6: Commit**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo"
git add src/components/sections/BlogNav.astro
git commit -m "fix(blognav): etat actif calcule depuis le path + onglet Mandataires

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: CTA pro → /iad + ligne ROI

**Files:**
- Modify: `src/components/ProValueCTA.astro` (ligne 5 `appUrl` + insertion ROI avant `.si-pro-cta-actions` ligne 15)
- Modify: `src/pages/pro.astro` (ligne 7 `appUrl` + insertion ROI dans le bloc pricing ~ligne 97)

**Interfaces:**
- Consumes: rien.
- Produces: toutes les surfaces pro pointent `app.score-immo.fr/iad`.

- [ ] **Step 1: Re-router ProValueCTA vers /iad**

Dans `src/components/ProValueCTA.astro`, remplacer :

```javascript
const appUrl = 'https://app.score-immo.fr/app?utm_source=site&utm_medium=pro_cta';
```

par :

```javascript
const appUrl = 'https://app.score-immo.fr/iad?utm_source=site&utm_medium=pro_cta';
```

- [ ] **Step 2: Ajouter la ligne ROI dans ProValueCTA**

Remplacer :

```html
  <div class="si-pro-cta-actions">
```

par :

```html
  <p class="si-pro-cta-roi" style="margin:0 0 1rem;font-size:0.95rem;color:rgba(255,255,255,0.92);"><strong style="color:#fff;">Un seul mandat d&eacute;croch&eacute; rembourse des ann&eacute;es d'abonnement.</strong> &Agrave; 79&nbsp;&euro;/mois, l'analyse factuelle transforme la n&eacute;go en discussion de donn&eacute;es.</p>
  <div class="si-pro-cta-actions">
```

- [ ] **Step 3: Re-router pro.astro vers /iad**

Dans `src/pages/pro.astro`, remplacer :

```javascript
const appUrl = 'https://app.score-immo.fr/app?utm_source=site&utm_medium=pro_landing';
```

par :

```javascript
const appUrl = 'https://app.score-immo.fr/iad?utm_source=site&utm_medium=pro_landing';
```

- [ ] **Step 4: Ajouter la ligne ROI dans le bloc « L'offre Pro » de pro.astro**

Remplacer :

```html
        <p>Une offre pensée pour les professionnels, avec rapport co-brandé et analyses illimitées. Découvrez le détail et les tarifs sur notre <a href="/pages/tarifs">page tarifs</a>, ou commencez par tester l'outil gratuitement.</p>
```

par :

```html
        <p><strong>Un seul mandat décroché rembourse des années d'abonnement.</strong> Une offre pensée pour les mandataires, avec rapport co-brandé à votre marque et analyses illimitées à 79&nbsp;€/mois. Découvrez le détail sur notre <a href="/pages/tarifs">page tarifs</a>, ou commencez par tester l'outil gratuitement.</p>
```

- [ ] **Step 5: Build**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: exit 0.

- [ ] **Step 6: Vérifier (0 surface pro vers /app, ROI présent)**

Run: `grep -n "app.score-immo.fr/iad" src/components/ProValueCTA.astro src/pages/pro.astro`
Expected: 2 occurrences (une par fichier).
Run: `grep -n "app.score-immo.fr/app" src/components/ProValueCTA.astro src/pages/pro.astro`
Expected: AUCUNE occurrence.
Run: `grep -rn "rembourse des ann" src/components/ProValueCTA.astro src/pages/pro.astro`
Expected: 2 occurrences (ROI dans les 2 fichiers).

- [ ] **Step 7: Commit**

```bash
cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo"
git add src/components/ProValueCTA.astro src/pages/pro.astro
git commit -m "feat(pro): CTA pro -> landing /iad + argument ROI (mandat vs abo)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Audit final + déploiement + vérif live (verification-before-completion)

**Files:** aucun fichier modifié — vérification, deploy, contrôle live.

**Interfaces:**
- Consumes: l'ensemble des Tasks 1-5.

- [ ] **Step 1: Build complet propre**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && npm run build`
Expected: exit 0, 0 erreur, 0 warning bloquant.

- [ ] **Step 2: Audit — 0 CTA pro résiduel vers /app**

Run: `grep -rn "app.score-immo.fr/app" src/components/ProValueCTA.astro src/pages/pro.astro src/components/sections/Pricing.astro`
Expected: AUCUNE occurrence (les surfaces pro sont toutes sur `/iad` ou checkout).

- [ ] **Step 3: Audit — destinations pro correctes**

Run: `grep -rn "score-immo.fr/iad\|go/checkout/pro_mandataire" src/`
Expected: au moins 4 occurrences (`/iad` dans ProValueCTA, pro.astro, bloc tarifs ; checkout `pro_mandataire` dans la carte).

- [ ] **Step 4: Audit — BlogNav état actif & onglet pro**

Run: `grep -c "si-guide-nav-tab-active" src/components/sections/BlogNav.astro`
Expected: `1` (uniquement dans l'helper `cls`).
Run: `grep -c 'href="/blogs/pro"' src/components/sections/BlogNav.astro`
Expected: `1`.

- [ ] **Step 5: Audit — Header pro visible (desktop + mobile)**

Run: `grep -c 'href="/pro"' src/components/Header.astro`
Expected: `2`.

- [ ] **Step 6: Audit — accents FR (manuel) sur les .astro touchés**

Run: `grep -rnE "decroch[^e]|mandataire|negoci|donnee|rembours" src/components/ProValueCTA.astro src/pages/pro.astro src/components/sections/Pricing.astro src/components/Header.astro src/components/sections/BlogNav.astro`
Inspecter visuellement : tout mot FR doit être accentué (`décroché`, `négo`, `données`, `remboursé`). ⚠️ `check_accents.py` est aveugle aux `.astro`, d'où le contrôle manuel.

- [ ] **Step 7: Audit — 0 em-dash introduit**

Run: `grep -rn "—" src/components/ProValueCTA.astro src/pages/pro.astro src/components/sections/Pricing.astro src/components/Header.astro src/components/sections/BlogNav.astro src/pages/pages/tarifs.astro`
Expected: AUCUNE occurrence.

- [ ] **Step 8: Push (déclenche deploy.yml)**

Run: `cd "/Users/lestoilettesdeminette/scoreimmo all/score-immo" && git push origin main`
Expected: push OK ; le workflow `deploy.yml` se déclenche.

- [ ] **Step 9: Attendre le deploy et vérifier le statut du workflow**

Run: `gh run list --repo August1nnnn/score-immo --workflow deploy.yml --limit 1`
Expected: dernier run `completed / success`.

- [ ] **Step 10: Vérif live — pages 200**

Run: `for u in / /pro /pages/tarifs /blogs/pro; do echo -n "$u -> "; curl -s -o /dev/null -w "%{http_code}\n" "https://score-immo.fr$u"; done`
Expected: chaque URL renvoie `200`.

- [ ] **Step 11: Vérif live — CTA pro résolvent vers /iad + carte Pro présente**

Run: `curl -s "https://score-immo.fr/pro" | grep -o "app.score-immo.fr/iad" | head -1`
Expected: motif trouvé.
Run: `curl -s "https://score-immo.fr/pages/tarifs" | grep -o "Pro / Mandataire\|go/checkout/pro_mandataire\|tarifs_pro" | sort -u`
Expected: les 3 motifs présents.

- [ ] **Step 12: Vérif live — le checkout pro_mandataire résout (risque env Stripe)**

Run: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://app.score-immo.fr/go/checkout/pro_mandataire"`
Expected: redirection/200 vers une page checkout (PAS une page d'erreur plan invalide).
⚠️ **Si erreur** (env `STRIPE_PRICE_PRO_MANDATAIRE` non configuré en prod) : repointer le CTA de la carte sur `go/checkout/premium` (Task 1 Step 3) en attendant, et signaler à l'utilisateur de configurer le price ID Stripe.

- [ ] **Step 13: Rapport final**

Confirmer à l'utilisateur, **preuves à l'appui** (sorties des steps ci-dessus) : build vert, 0 résidu `/app` sur surfaces pro, nav pro visible, BlogNav corrigé, Tarifs reframée, deploy success, 4 URLs 200, CTA live vers `/iad`, checkout `pro_mandataire` fonctionnel (ou fallback appliqué). Aucune affirmation « c'est fait » sans la commande + sa sortie.

---

## Self-Review (writing-plans)

**1. Spec coverage** — chaque correctif du spec a sa tâche :
- Correctif 1 (offre Pro Tarifs) → Task 1 + Task 2 ✅
- Correctif 2 (visibilité nav) → Task 3 (Header) + Task 4 (BlogNav) ✅
- Correctif 3 (CTA pro → /iad) → Task 5 ✅
- Correctif 4 (ROI) → Task 5 (steps 2, 4) + Task 2 (bloc) ✅
- Audit verification-before-completion → Task 6 ✅
- Hors périmètre (rename app PricingPage) → noté, non planifié ici (volontaire) ✅

**2. Placeholder scan** — aucun « TBD/TODO/à compléter » ; chaque step de code montre l'avant/après exact. ✅

**3. Type/wording consistency** — checkout key `pro_mandataire` cohérent (Task 1 ↔ Task 6 step 3/12) ; helper `cls()` défini Task 4 step 1 et utilisé steps 2-3 ; URLs `/iad` cohérentes Task 2/5/6 ; ROI « Un seul mandat décroché rembourse des années d'abonnement » réutilisé à l'identique (Task 2, 5). ✅

**Risque connu** : dépendance à l'env Stripe `STRIPE_PRICE_PRO_MANDATAIRE` pour le checkout pro — couvert par Task 6 step 12 + fallback documenté.
