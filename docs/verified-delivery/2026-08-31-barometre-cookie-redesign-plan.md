# Plan exécutable : Baromètre et bannière cookies

Date : 31 août 2026

Branche initiale : `codex/barometre-cookie-redesign-20260831`

## Contraintes globales

- partir de `origin/main` au SHA `7c72c7b4ecfad999894fee2386b1acd467178c49` ;
- ne modifier aucun dépôt, artefact, réglage ou fichier iOS ;
- préserver URL, canonical, title, description et H1 du Baromètre ;
- ne modifier ni les données Supabase, ni le moteur de score, ni le comportement de consentement ;
- ne publier aucune extrapolation au marché français ;
- produire deux incréments, revues, PR et rollbacks indépendants ;
- déployer uniquement par le workflow GitHub existant après fusion dans `main`.

## Tâche 1 : contrats des agrégats et exports

Fichiers :

- créer `src/lib/barometre-insights.ts` ;
- créer `src/lib/barometre-edition-export.js` ;
- créer `tests/barometre-redesign.test.mjs`.

Étapes :

1. écrire les tests RED sur médiane paire, distribution, groupes de types, DPE, régions, refus des éditions mélangées, allowlist et échappement CSV ;
2. exécuter `node --test tests/barometre-redesign.test.mjs` et obtenir l'échec d'import attendu ;
3. implémenter les deux helpers sans dépendance externe ;
4. rejouer le test ciblé, puis les tests Baromètre affectés ;
5. inspecter les sorties du corpus réel et confirmer 16 fiches, 8 régions, moyenne 68, médiane 67, minimum 62 et maximum 81.

Rollback : retirer les deux helpers et le test avant intégration.

## Tâche 2 : routes de téléchargement mensuelles

Fichiers :

- créer `src/pages/barometre/editions/[month].json.ts` ;
- créer `src/pages/barometre/editions/[month].csv.ts` ;
- modifier `public/_headers` ;
- modifier `astro.config.mjs` ;
- étendre `tests/barometre-redesign.test.mjs` et `scripts/check-built-links.mjs` si nécessaire.

Étapes :

1. écrire le contrat RED pour les routes, CORS, noindex, exclusion sitemap et noms de fichiers ;
2. implémenter les routes pré-rendues depuis la collection statique ;
3. construire le site et vérifier les quatre fichiers d'édition attendus pour juin et août ;
4. parser le JSON, le CSV et le sitemap ;
5. scanner les exports pour les clés interdites.

Rollback : retirer les routes et leurs règles d'en-têtes.

## Tâche 3 : nouvelle expérience Baromètre

Fichier : `src/pages/barometre/index.astro`.

Étapes :

1. étendre le test RED avec les régions sémantiques, faits visibles, explorateur, citation, téléchargements et parité Dataset ;
2. remplacer la page actuelle par le rendu analytique statique ;
3. ajouter recherche, filtres, tri, réinitialisation et copie via un script local sans `innerHTML` ;
4. conserver toutes les fiches dans le HTML et ne masquer qu'après interaction ;
5. vérifier la grammaire française, les limites et l'absence de claims nationaux ;
6. exécuter le test ciblé, les tests SEO/GEO, la suite complète et le build.

Rollback : revert du fichier et des helpers de l'incrément.

## Tâche 4 : preview et revue Baromètre

Étapes :

1. lancer le preview Astro local ;
2. mesurer 320, 390, 768 et 1440 px, tester les filtres, la copie, le clavier et le mode sans JavaScript ;
3. prendre des captures plein écran desktop et mobile ;
4. lancer Lighthouse mobile et desktop, puis une trace performance ;
5. parser tous les JSON-LD et vérifier la parité visible ;
6. exécuter `npm test`, `npm run test:content-truth`, `npm run build`, `npm run test:site-integrity`, `npm audit --omit=dev`, `git diff --check` et un scan de secrets ;
7. effectuer une revue conformité puis qualité, corriger toute finding Critical ou Important et rejouer les preuves.

Rollback : aucune mutation externe avant la revue finale.

## Tâche 5 : livraison Baromètre

Étapes :

1. resynchroniser `origin/main` et rebaser seulement si l'intégration est propre ;
2. commit de l'incrément Baromètre ;
3. push, PR, checks, fusion et déploiement par le workflow existant ;
4. vérifier publiquement HTTP, title, canonical, H1, Dataset, JSON, CSV, filtres, responsive et chemins critiques ;
5. consigner SHA, run, rollback et preuve live dans le rapport et Obsidian.

Rollback : revert du commit de fusion et vérification publique du retour à l'artefact précédent.

## Tâche 6 : contrat et implémentation cookies

Fichiers :

- modifier `src/components/CookieBanner.astro` ;
- créer `tests/cookie-banner-ux.test.mjs`.

Étapes :

1. écrire les tests RED sur opacité, absence de flou, grille trois colonnes, 44 px, labels, région accessible et invariance du script ;
2. exécuter le test ciblé et confirmer l'échec attendu ;
3. implémenter le nouveau markup et CSS sans toucher `public/consent.js` ;
4. rejouer le test ciblé et `tests/measurement-contract.test.mjs` ;
5. construire puis mesurer 320, 360, 390, 768 et 1440 px, zoom 200 %, clavier, accepter, refuser et rouvrir.

Rollback : revert du composant unique.

## Tâche 7 : revue et livraison cookies

Étapes :

1. exécuter la chaîne complète de tests, build, intégrité, audit de secrets et diff ;
2. effectuer une contre-revue conformité et qualité ;
3. commit, push, PR, checks, fusion et déploiement séparés ;
4. vérifier la bannière en production sans consentement existant et tester le réglage depuis le footer ;
5. vérifier une page Baromètre et une page éditoriale sans régression ;
6. mettre à jour le rapport versionné et Obsidian.

Rollback : revert du second commit de fusion, sans toucher l'incrément Baromètre.

## Couverture

Les tâches couvrent la hiérarchie visuelle, les données descriptives, la citabilité, les exports, l'exploration, le responsive, l'accessibilité, le consentement, la sécurité, le SEO, la performance, l'isolation iOS, le déploiement progressif et les deux rollbacks. Le plan ne contient aucun placeholder ni opération destructive.
