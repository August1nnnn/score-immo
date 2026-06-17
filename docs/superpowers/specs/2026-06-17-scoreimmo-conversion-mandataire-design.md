# ScoreImmo — Conversion mandataire : câbler le site à la machine pro existante

**Date :** 2026-06-17
**Repo :** `August1nnnn/score-immo` (site Astro + Cloudflare Pages)
**Périmètre :** site Astro **uniquement** (l'app Lovable n'est pas modifiée)
**Objectif :** transformer l'activation pro (rapports générés) en **conversion payante** vers le plan `pro_mandataire`.

---

## 1. Contexte & diagnostic

ScoreImmo a un axe « mandataire » dont **toute la machine de conversion existe déjà côté app** (`app.score-immo.fr`, repo Lovable) :

- `/iad` — landing mandataire complète et léchée (PDF brandé, mode Vente « Décrochez le mandat », CTA essai gratuit).
- `pro_mandataire` — plan Stripe réel (`STRIPE_PRICE_PRO_MANDATAIRE`, illimité, `is_pro`), confirmé dans `supabase/functions/stripe-webhook/index.ts`.
- `/me/agent` (AgentProfilePage) + `PrintCover` — co-branding (logo/nom) et PDF brandé.
- Campagnes cold actives (edge functions SAFTI/IAD/agences, SMS/email) qui poussent les mandataires vers l'app.

**Le problème n'est pas l'app, c'est le site.** Le trafic pro (cold + SEO) atterrit sur l'app **générique acheteur** (`/app`), génère un rapport (activation observée) mais **ne rencontre jamais l'offre mandataire** :

1. Le `Header` n'a aucun lien vers `/pro` ni `/blogs/pro` (axe invisible hors SEO + footer).
2. La page Tarifs n'expose pas le plan `pro_mandataire` : 3 paliers pensés acheteur, le co-branding promis sur `/pro` est noyé dans « Premium 79 € ».
3. **Tous les CTA pro pointent vers `/app`** (produit acheteur) au lieu de `/iad` (landing mandataire qui convertit).
4. Le paywall parle « analyses/mois », pas ROI (« un mandat = des milliers d'€ »).
5. `BlogNav` n'a pas d'onglet « Mandataires » et a un bug : tous les onglets portent `si-guide-nav-tab-active` en dur.

**Symptôme utilisateur constaté :** « le cold convertit en rapports, mais pas de conversion réelle (payante) ». Cause mécanique : activation sur le produit acheteur, jamais d'exposition à l'offre pro.

**Stratégie :** ne rien reconstruire. **Câbler le site à la machine `/iad` existante** et aligner l'offre.

---

## 2. Décisions de cadrage (validées)

| Décision | Choix retenu |
|---|---|
| Périmètre | **Site Astro d'abord.** App non touchée (rename in-app = follow-up flaggé). |
| Offre Pro sur Tarifs | **Pas de 4e palier.** Le Premium (79 €) est **reframé en « Pro / Mandataire »** + bloc dédié « Vous êtes mandataire ? » → `/iad`. |
| Prix Pro affiché | **79 €/mois** (1er mois à 1 €) — identique à l'actuel Premium, pas de nouveau prix. |
| Destination CTA pro | **`app.score-immo.fr/iad`** (la landing mandataire existante). |

---

## 3. Design détaillé (4 correctifs)

### Correctif 1 — Offre Pro sur la page Tarifs

**Fichiers :** `src/components/sections/Pricing.astro`, `src/pages/pages/tarifs.astro`

- **Reframe de la 3e carte** (actuelle « Premium (illimité) » 79 €) en **« Pro / Mandataire »** :
  - Kicker/label orienté mandataire ; sous-titre « Pour les mandataires et agents ».
  - Features mises en avant pro : **Analyses illimitées · PDF brandé à ton logo · Mode Achat & Vente · Profil Match · Support prioritaire**.
  - Argument closing court : « Décroche le mandat avec une analyse factuelle ».
  - **Prix inchangé** : 79 €/mois, 1er mois à 1 €, sans engagement.
- **Nouveau bloc « Vous êtes mandataire ? »** sous la grille acheteur :
  - 1 ligne ROI (cf. Correctif 4) + CTA primaire vers `app.score-immo.fr/iad?utm_source=site&utm_medium=tarifs_pro` + CTA secondaire « En savoir plus » → `/pro`.
- **JSON-LD** : dans `tarifs.astro` et `Pricing.astro`, l'offer `name: "Premium"` / `"Premium (illimite)"` → **`"Pro Mandataire"`**, description alignée (illimité, PDF brandé, mode Achat/Vente). Prix, devise, URL inchangés.
- Découverte (9,99 €) et Recherche (29 €) : **récit acheteur strictement inchangé**.

**Contrainte DA :** aucune modification visuelle de structure/couleurs au-delà du contenu textuel + le nouveau bloc qui réutilise les classes/variables CSS existantes (`--si-*`). Pas de nouveau composant lourd.

### Correctif 2 — Visibilité dans la navigation

**Fichiers :** `src/components/Header.astro`, `src/components/sections/BlogNav.astro`

- **Header (desktop nav + drawer mobile)** : ajouter un lien **« Pro / Mandataires » → `/pro`**, avec état `active` quand `path` commence par `/pro` ou `/blogs/pro`. Position : après « Tarifs » (ou avant, à caler en implémentation pour rester lisible mobile). Le CTA principal « Analyser une annonce » reste inchangé.
- **BlogNav** :
  - **Fix du bug** : chaque onglet ne doit recevoir `si-guide-nav-tab-active` **que** si son href correspond au `path` courant. Aujourd'hui les 4 onglets l'ont en dur → calcul depuis `Astro.url.pathname`.
  - **Nouvel onglet « Mandataires » → `/blogs/pro`** (avec icône cohérente, ex. mallette/briefcase).
  - Compléter le breadcrumb (actuellement le `<span>` actif est vide).

### Correctif 3 — CTA pro → `/iad`

**Fichiers :** `src/components/ProValueCTA.astro`, `src/pages/pro.astro` (+ vérifier `AnalyzerBox` injecté sur `/pro`)

- Remplacer la destination des **surfaces pro** : `https://app.score-immo.fr/app?...` → **`https://app.score-immo.fr/iad?...`**, en conservant/normalisant les `utm` :
  - `ProValueCTA.astro` : `utm_medium=pro_cta` → cible `/iad`.
  - `pro.astro` : `appUrl` (`utm_medium=pro_landing`) → cible `/iad`. Le bloc tarifs interne de `/pro` qui renvoyait vers `/pages/tarifs` reste, mais le CTA « Tester gratuitement » pointe `/iad`.
- **Ne pas toucher** les CTA **acheteur** : Header « Analyser une annonce », home, footer « Accéder à l'outil » restent sur `/app`.
- Cohérence utm : `utm_source=site`, `utm_medium=<surface>` (`pro_cta`, `pro_landing`, `tarifs_pro`).

### Correctif 4 — Argument ROI (bas de funnel pro)

**Fichiers :** `src/pages/pro.astro`, `src/components/ProValueCTA.astro`

- Ajouter une **ligne ROI explicite** juste avant le CTA pro, ton factuel (pas de promesse chiffrée de revenus garantie — formulation prudente) :
  - Ex. « Un seul mandat décroché rembourse des années d'abonnement. À 79 €/mois, l'analyse factuelle transforme la négo en discussion de données. »
- Objectif : réchauffer avant le passage de relais vers `/iad` (qui porte le pitch ROI complet). Pas de duplication lourde du contenu de `/iad`.
- Respect accents FR obligatoires (CLAUDE.md) ; pas d'em-dash.

---

## 4. Hors périmètre (follow-up flaggé)

À traiter dans une itération **séparée** (repo Lovable `scoreimmo app`, pull-before-push app obligatoire) :

- Renommer **Premium → Pro / Mandataire** dans `src/pages/PricingPage.tsx` (in-app) pour éviter le décalage de label site vs app.
- Copy paywall ROI pour les utilisateurs pro (`PremiumPaywall`/`UpgradeBanner`).

**Risque si non fait :** léger décalage de wording (site dit « Pro », app dit « Premium »). Acceptable à court terme ; à synchroniser rapidement.

---

## 5. Interfaces & contraintes

- **Pas de nouveau composant lourd** : réutilisation des classes/variables CSS existantes (`--si-*`, `.si-btn`, `.pro-*`).
- **DA intacte** : aucun changement de palette, typo, structure visuelle hors contenu + bloc Tarifs pro qui réutilise le style existant.
- **Pull-before-push** (CLAUDE.md) : `git pull origin main` avant édition (fait).
- **Déploiement** : `deploy.yml` actif → push sur `main` déclenche le build + deploy CF Pages. Vérif live obligatoire après.

---

## 6. Critères de succès (mesurables)

1. **Build vert** (`npm run build`, exit 0).
2. **0 CTA pro** ne pointe encore vers `/app` (grep = 100 % `/iad` sur surfaces pro).
3. Lien « Pro / Mandataires » visible dans Header desktop **et** mobile.
4. `BlogNav` : un **seul** onglet actif selon le path + onglet « Mandataires » présent.
5. Page Tarifs : carte « Pro / Mandataire » (79 €) + bloc « Vous êtes mandataire ? » → `/iad`. JSON-LD cohérent (offer « Pro Mandataire »).
6. **Accents FR** : contrôle **manuel** des `.astro` modifiés (⚠️ `check_accents.py` ne globe que `.md/.mdx`, pas les `.astro` — blind spot connu). Tout texte FR ajouté = parfaitement accentué.
7. **0 em-dash** introduit.
8. **Live** : après deploy, `/`, `/pro`, `/pages/tarifs`, `/blogs/pro` répondent 200 et les CTA pro résolvent vers `/iad`.

---

## 7. Audit final (verification-before-completion)

Avant de déclarer terminé, **exécuter et constater la sortie** :

- `npm run build` → exit 0.
- `grep -rn "app.score-immo.fr/app" src/` sur surfaces pro → aucune résiduelle.
- `grep -rn "iad" src/components/ProValueCTA.astro src/pages/pro.astro` → présent.
- Inspection BlogNav : état actif calculé, onglet Mandataires présent.
- Contrôle accents **manuel** des `.astro` touchés (check_accents aveugle sur `.astro`).
- Sweep em-dash (`grep -rn "—" src/` sur fichiers touchés) → 0.
- Post-deploy : curl/visite des 4 URLs → 200 + CTA pro = `/iad`.

Aucune affirmation « c'est fait » sans la preuve de commande correspondante.
