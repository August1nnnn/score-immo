# Plan exécutable, visibilité et Baromètre Score-Immo

## État au 30 août 2026

- tâches 1 à 6 : terminées et vérifiées ;
- tâche 7, contrôles locaux : terminée ;
- tâche 7, contrôle des pages live existantes : terminé ;
- tâche 8, contrôle du manifeste live : en attente du déploiement ;
- tâche 7, PR, déploiement et smoke test live final : en cours ;
- preuve : `docs/verified-delivery/2026-08-30-visibility-barometre-evidence.md`.

## Contraintes globales

- Source initiale : `origin/main` au SHA `597088e7755247d007e043a0d00fa4eb30dba9fa`.
- Branche : `codex/visibility-barometre-20260830`.
- Aucun fichier du worktree App Store juridique n'est modifié.
- Aucune donnée client non opt-in, adresse exacte, URL d'annonce, e-mail, identifiant utilisateur ou secret ne peut être publiée.
- Toutes les écritures de base sont précédées d'un snapshot, d'un dry-run et d'une transaction de validation.
- Aucune automatisation ne fusionne ou ne déploie seule.

### Tâche 1 : contrat de curation mensuelle

Fichiers :

- créer `scripts/barometre-curation.mjs` ;
- créer `scripts/curate-barometre-month.mjs` ;
- créer `tests/barometre-curation.test.mjs`.

Étapes :

1. écrire les tests RED pour l'éligibilité, l'opt-in, le rôle admin, les collisions, la projection sans PII, les 13 sections, les dates et l'idempotence ;
2. exécuter `node --test tests/barometre-curation.test.mjs` et confirmer les échecs attendus ;
3. implémenter le module pur et le CLI dry-run ;
4. faire passer le test ciblé, puis `npm test` ;
5. exécuter le dry-run réel d'août et vérifier 15 lignes ;
6. inspecter le manifeste, le diff et les champs interdits.

Rollback : supprimer les deux scripts et le test avant toute écriture externe.

### Tâche 2 : générateur statique et fraîcheur

Fichiers :

- modifier `scripts/barometre-supabase.mjs` ;
- modifier `scripts/gen-barometre.mjs` ;
- étendre `tests/barometre-api-key.test.mjs` ;
- créer `scripts/barometre-public-data.mjs` et `tests/barometre-public-data.test.mjs`.

Étapes :

1. écrire les tests RED pour la requête allowlistée, l'unicité, la date exacte, la méthode et le refus d'une source trop ancienne ;
2. implémenter la projection minimale et les validateurs ;
3. faire passer les tests ciblés et complets ;
4. vérifier que le générateur actuel échoue avant la correction des quatre lignes invalides ;
5. ne modifier aucune donnée avant snapshot et validation de la tâche 1.

Rollback : restaurer les deux scripts depuis le commit précédent.

### Tâche 3 : publication d'août et synchronisation des JSON

Surfaces : Supabase `barometre_reports` et `src/content/barometre`.

Étapes :

1. capturer le snapshot `0600` pré-mutation et les comptes de contrôle ;
2. exécuter la transaction dry-run avec `ROLLBACK` ;
3. appliquer la transaction : dépublier quatre lignes invalides, réparer Cayenne en `Guyane` et insérer les 15 lignes d'août ;
4. vérifier les comptes, l'unicité, les sources et la lecture RLS anonyme ;
5. exécuter le générateur avec la clé publishable ;
6. vérifier 112 JSON et zéro champ interdit.

Rollback : rendre `publie=false` les 15 lignes d'août ; restaurer le snapshot seulement si les invariants montrent un écart.

### Tâche 4 : présentation par édition et méthode

Fichiers :

- créer `src/lib/barometre-editions.ts` ;
- créer `tests/barometre-editions.test.mjs` ;
- modifier `src/content.config.ts` ;
- modifier `src/pages/barometre/index.astro` ;
- modifier `src/pages/barometre/[slug].astro` ;
- modifier `src/pages/barometre/region/[slug].astro` ;
- modifier `src/pages/methodologie.astro` si nécessaire pour décrire les deux méthodes.

Étapes :

1. écrire les tests RED sur le mélange juin/août, le choix de la dernière édition, les 5/13 sections et l'agrégat régional homogène ;
2. implémenter le helper pur ;
3. adapter le hub, les fiches et les régions sans changer URL ni canonical ;
4. vérifier contenu visible et JSON-LD sur hub, une fiche juin, une fiche août et une région multi-édition ;
5. exécuter tests ciblés, suite complète et build.

Rollback : revert des gabarits et du helper ; les JSON restent des données statiques réversibles.

### Tâche 5 : vérité éditoriale

Fichiers : articles identifiés par le test, plus `scripts/check-content-truth.mjs` ou un test dédié.

Étapes :

1. écrire le test RED interdisant les huit descriptions trompeuses et les déclarations personnelles connues ;
2. réécrire uniquement les phrases concernées, en langage institutionnel et borné ;
3. conserver les liens seulement lorsqu'ils servent le lecteur ;
4. exécuter test ciblé, vérité éditoriale et suite complète ;
5. inspecter chaque diff éditorial.

Rollback : restaurer individuellement les articles concernés.

### Tâche 6 : workflow de synchronisation par PR

Fichiers :

- créer `.github/workflows/barometre-sync.yml` ;
- créer `scripts/verify-live-barometre.mjs` ;
- créer `tests/barometre-live-parity.test.mjs` ;
- créer ou étendre un test de contrat workflow.

Étapes :

1. écrire le test RED : clé publishable seulement, permissions minimales, PR
   obligatoire, aucune fusion, fraîcheur et parité live contrôlées ;
2. implémenter le workflow idempotent ;
3. installer la clé publishable comme secret du dépôt sans imprimer sa valeur ;
4. en l'absence de diff, vérifier quotidiennement l'égalité exacte entre base,
   manifeste et sitemap, puis le statut HTTP 200 des fiches ; si un diff vient
   d'ouvrir une PR, différer ce contrôle jusqu'au déploiement ;
5. exécuter un `workflow_dispatch` après fusion et vérifier qu'il ne crée aucun diff parasite ;
6. contrôler les permissions et logs non secrets.

Rollback : retirer le schedule ou revert du workflow, puis supprimer le secret si le pipeline est abandonné.

### Tâche 7 : revue, déploiement et preuve live

Étapes :

1. revue séparée conformité spec et qualité/sécurité ;
2. corriger toute finding Critical ou Important, puis rejouer les contrôles ;
3. exécuter `npm test`, `npm run test:content-truth`, `npm run build`, `npm run test:site-integrity`, JSON-LD, secret scan et `git diff --check` ;
4. exécuter Lighthouse mobile sur accueil, Baromètre et fiche août ;
5. resynchroniser avec `origin/main` et vérifier l'absence de conflit App Store ;
6. commit, push, PR et contrôle des checks ;
7. fusion, contrôle Cloudflare/IndexNow et smoke live ;
8. lancer le test d'entité sans nom et consigner ses limites ;
9. mettre à jour Obsidian et la preuve versionnée ;
10. programmer les re-mesures GSC à J+7, J+14 et J+28.

Rollback : annuler le commit de fusion ; si la donnée d'août est en cause, rendre ses lignes `publie=false` avant la nouvelle génération.

### Tâche 8 : contrat atomique avec l'app

Fichiers :

- créer `src/lib/barometre-manifest.js` ;
- créer `src/pages/barometre-manifest.json.ts` ;
- modifier `public/_headers`, `astro.config.mjs` et le contrôle d'intégrité ;
- étendre le moniteur live et ses tests.

Étapes :

1. écrire les tests RED sur la projection publique, les formats adversariaux,
   les doublons, CORS, noindex et l'exclusion du sitemap ;
2. pré-rendre le manifeste depuis la collection statique avec un schéma
   versionné et une allowlist stricte ;
3. faire échouer le build si le manifeste et les fiches ne sont pas en bijection ;
4. étendre le moniteur quotidien à la parité base, manifeste, sitemap et HTTP ;
5. déployer le site avant l'app et vérifier une requête CORS depuis l'origine
   native, sans credentials.

Rollback : revert du manifeste et de ses contrôles, puis conserver l'app
actuelle tant que l'endpoint public n'est pas disponible.

## Couverture des critères

Chaque critère du design est couvert par au moins une tâche. Le plan ne contient ni placeholder, ni interface indéfinie, ni action destructive non réversible.
