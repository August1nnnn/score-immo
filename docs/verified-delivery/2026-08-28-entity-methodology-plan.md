# Entité et méthodologie Score-Immo, plan d'implémentation

## Contraintes globales

- Source de départ : `origin/main` au SHA `3c480d67080f9045cb1d6e81914feff33828c243`.
- Marque canonique visible et structurée : `Score-Immo`.
- Identifiant Organization : `https://score-immo.fr/#organization`.
- Aucune modification du moteur de score applicatif.
- Aucune statistique de volume non assortie d'une définition vérifiable.
- Aucun tiret cadratin ni demi-cadratin dans les surfaces publiques touchées.
- Déploiement uniquement après suite complète verte et revue du diff.

## Tâche 1 : contrats d'entité et de méthodologie

Fichiers :

- créer `tests/entity-methodology.test.mjs` ;
- contrôler `src/data/entity.ts`, `src/layouts/BaseLayout.astro`, les gabarits structurés, les deux nouvelles pages, le pied de page et les redirections.

Étapes :

- [x] écrire les assertions avant les fichiers de production ;
- [x] exécuter `node --test tests/entity-methodology.test.mjs` et constater l'échec attendu ;
- [x] conserver la sortie RED dans le rapport de preuve.

## Tâche 2 : entité canonique

Fichiers :

- créer `src/data/entity.ts` ;
- modifier `src/data/homepage-jsonld.ts` ;
- modifier `src/layouts/BaseLayout.astro` ;
- modifier les gabarits `src/pages/blogs/[blog]/[slug].astro`, `src/pages/blogs/[blog]/index.astro`, `src/pages/pro.astro`, `src/pages/barometre/index.astro`, `src/pages/barometre/[slug].astro` et `src/pages/barometre/region/[slug].astro` ;
- modifier `src/components/Header.astro`, `src/components/Footer.astro` et les composants de marque globaux strictement nécessaires.

Étapes :

- [x] implémenter le module et les références `@id` ;
- [x] passer les tests ciblés ;
- [x] vérifier que les assertions visibles restent bornées et que les offres payantes ne changent pas.

## Tâche 3 : pages institutionnelles et consolidation

Fichiers :

- créer `src/pages/a-propos.astro` ;
- créer `src/pages/methodologie.astro` ;
- créer `src/lib/redirected-articles.ts` ;
- modifier les deux gabarits de blog et `public/_redirects` ;
- modifier les pages Baromètre pour expliciter les instantanés datés ;
- modifier `src/components/Footer.astro`.

Étapes :

- [x] publier les faits visibles, les sources, les limites et la politique de correction ;
- [x] exclure l'ancien handle de formule du build et du hub ;
- [x] ajouter les règles 301 directes ;
- [x] vérifier le build, le sitemap et le fichier de redirections généré.

## Tâche 4 : vérification et revue

Commandes attendues :

- [x] `node --test tests/entity-methodology.test.mjs` ;
- [x] `npm test` ;
- [x] `npm run test:content-truth` ;
- [x] `npm run build` ;
- [x] `npm run test:site-integrity` ;
- [x] parse JSON-LD des pages construites `index`, `a-propos`, `methodologie`, un article, le Baromètre et Pro ;
- [x] contrôle du sitemap et des redirections ;
- [x] `git diff --check` ;
- [x] scan de secrets et revue de toutes les modifications ;
- [x] revue de conformité au design, puis revue qualité séparée.

## Tâche 5 : production et preuve

- [ ] committer et pousser la branche autorisée ;
- [ ] créer une PR avec les preuves ;
- [ ] attendre les garde-fous verts et vérifier le SHA ;
- [ ] fusionner la PR ;
- [ ] attendre le workflow Cloudflare et IndexNow ;
- [ ] contrôler en production les statuts, contenus visibles, canonicals, JSON-LD, sitemap et 301 ;
- [ ] créer le dossier de preuve et mettre à jour la mémoire canonique ;
- [ ] envoyer le checkpoint sans secret sur le bus Codex/Claude.

Rollback : annuler le commit de fusion. Aucune migration ou donnée externe n'est à restaurer.
