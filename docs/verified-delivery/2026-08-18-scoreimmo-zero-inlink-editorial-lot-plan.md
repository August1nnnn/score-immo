# ScoreImmo : plan exécutable du lot de maillage éditorial complet

## Contraintes globales

- Base exacte : `cb9bfec010f15cd733fc32611b3118b20b9f17f5`.
- Ne modifier aucun contenu métier, title, H1, canonical, prix ou chiffre YMYL.
- Conserver les 670 arêtes baseline et ajouter exactement 44 cibles distinctes.
- Ne pas déployer, pousser ou notifier IndexNow sans autorisation séparée.

## Tâche 1 : garde-fou source en échec

Fichiers :

- créer `tests/internal-link-lot2.test.mjs` ;
- cible future `src/lib/curated-internal-links-lot2.js`.

Étapes :

1. Déclarer dans le test les 44 routes baseline sans lien entrant.
2. Exiger 44 règles, 44 cibles uniques, des sources et cibles existantes, des ancres descriptives et une occurrence exacte après application.
3. Exécuter `node --test tests/internal-link-lot2.test.mjs` et constater l'échec dû au module absent.

## Tâche 2 : règles déterministes du lot

Fichiers :

- créer `src/lib/curated-internal-links-lot2.js` ;
- modifier `src/lib/curated-internal-links.js`.

Étapes :

1. Ajouter les 44 couples de la matrice avec un point d'insertion unique.
2. Fusionner les règles dans le transformateur existant.
3. Exécuter le test focalisé, puis `npm test`.
4. Vérifier le diff et l'absence de lien dupliqué ou d'ancre imbriquée.

## Tâche 3 : preuve par le build et le graphe

Commandes :

- `npm run test:content-truth`
- `npm run build`
- `npm run test:site-integrity`
- `python3 scripts/audit_standards.py`
- `node /private/tmp/scoreimmo-graph-audit.mjs dist /private/tmp/scoreimmo-graph-lot2-final.json`

Résultats attendus :

- 299 pages ;
- 0 article sans lien entrant article ou contextuel ;
- 714 arêtes article vers article au minimum, avec exactement 44 nouvelles arêtes et 0 suppression ;
- toutes les invariantes d'intégrité du design au vert.

## Tâche 4 : revue et reprise

1. Comparer les arêtes baseline et finales par source, cible et ancre.
2. Relire les 44 phrases rendues avec leur paragraphe voisin.
3. Vérifier `git diff --check`, le statut Git et la liste exacte des fichiers.
4. Mettre à jour la note canonique ScoreImmo avec les résultats locaux et le rollback.
5. Présenter le lot local et attendre une autorisation explicite avant commit, push ou déploiement.
