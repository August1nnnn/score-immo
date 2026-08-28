# Preuves de livraison, entité et méthodologie Score-Immo

## Références

- Base du site avant changement : `3c480d67080f9045cb1d6e81914feff33828c243`.
- Source applicative du score : `Score-Immo/scoreimmo-app`, `origin/main` au SHA `461fa427cdc4b08e646f69ae39cff60241cb7288`.
- Rollback : annuler le commit de fusion de ce lot. Aucune migration ni donnée externe n'est concernée.

## TDD

- RED : `node --test tests/entity-methodology.test.mjs` a produit 8 échecs sur 8 avant la création des pages, du module d'entité et des redirections.
- GREEN ciblé : 8 tests sur 8.
- GREEN complet : 111 tests sur 111.

## Vérifications locales fraîches

Exécutées le 28 août 2026 dans le worktree isolé `entity-methodology-20260828` :

- `npm ci` : 407 dépendances installées depuis le lockfile, 0 vulnérabilité signalée ;
- `npm test` : 111 réussites, 0 échec ;
- `npm run test:content-truth` : réussi ;
- `npm run build` : 298 pages construites ;
- `npm run test:site-integrity` : 298 fichiers HTML, 11 709 liens internes et 35 redirections contrôlés ;
- parsing de 28 blocs JSON-LD sur 7 pages représentatives : réussi ;
- `/a-propos` et `/methodologie` : présents dans le build et le sitemap ;
- ancienne page de formule : absente du build et du sitemap ;
- variantes accentuée et non accentuée : redirections directes vers `/methodologie` ;
- `git diff --check` : réussi ;
- scan des lignes ajoutées : aucun secret détecté, aucun tiret cadratin ou demi-cadratin ajouté ;
- scan des surfaces institutionnelles et commerciales hors corpus éditorial historique : aucun superlatif ciblé ni assimilation de toutes les sources à des sources officielles.

## Revue de conformité

- Une seule entité porte `Score-Immo`, le domaine canonique et `https://score-immo.fr/#organization`.
- Les schémas principaux référencent cet identifiant au lieu de recréer des organisations concurrentes.
- Les cinq grilles publiques reprennent les poids du moteur applicatif courant.
- Les données manquantes, la normalisation, la couverture, le DPE non confirmé et la référence de prix de secours sont documentés.
- Le Baromètre est présenté comme un ensemble d'instantanés datés et non comme une mesure exhaustive du marché.
- Les 230 points et 250 contrôles sont qualifiés comme potentiels et dépendants du bien.
- OpenStreetMap est identifié comme une base ouverte et contributive, pas comme une administration française.

## Revue qualité

- Les offres et les routes de paiement n'ont pas changé.
- Aucun moteur de score, compte, paiement ou donnée personnelle n'a été modifié.
- Les liens historiques vers l'ancienne formule ont été remplacés par la nouvelle URL canonique.
- Les métadonnées, la carte sociale, le chrome global et les principales surfaces visibles emploient `Score-Immo`.
- Le premier build a échoué avant compilation faute de dépendances dans le worktree. Après `npm ci`, le build et tous les contrôles ont réussi sans modification fonctionnelle liée à cet incident.

## Production

- PR principale : `#7`, livraison `678394c944876b618397d06e2e63c09bcf901b45`, fusion `727dc41bbe30661736f7f755d83e136aa20f80aa`.
- Correctif de ponctuation détecté au contrôle live : PR `#8`, livraison `378fac7`, fusion `16cbd7827f34b807791c8decc0f90d45209743e6`.
- Garde-fous `main` : runs `33129472140` et `33129642611`, réussis.
- Déploiements Cloudflare Pages et IndexNow : runs `33129472134` et `33129642642`, réussis.
- Vérification HTTP réelle : homepage, À propos, Méthodologie, Pro, Baromètre, fiche Lyon et guide d'analyse répondent 200 avec leur canonical et l'organisation partagée.
- Les deux variantes de l'ancienne formule répondent 301 avec `Location: /methodologie`.
- Le sitemap répond 200, contient `/a-propos` et `/methodologie`, et ne contient pas l'ancienne page.
- Tous les blocs JSON-LD des sept pages live contrôlées sont syntaxiquement valides.
- Le contrôle final de la page Pro confirme `Score-Immo Pro · Pour les mandataires` et l'absence de l'ancienne ponctuation.

La fusion avec suppression de branche a bien fusionné la PR `#7`, puis a échoué uniquement lors de l'opération Git locale, car un autre worktree utilisait déjà `main`. La fusion distante et le déploiement n'ont pas été affectés. La PR `#8` a ensuite été fusionnée sans suppression locale de branche.

## Mémoire et App Store

- Mémoire canonique mise à jour : `/Users/lestoilettesdeminette/Documents/Obsidian Vault/Score Immo - vérité des données et plan croissance - 2026-08-27.md`.
- Pointeur mis à jour : `/Users/lestoilettesdeminette/codex-context/projects/scoreimmo/data-truth-growth-plan-2026-08-27.md`.
- Dossier d'antériorité et préflight App Store : `/Users/lestoilettesdeminette/codex-context/projects/scoreimmo/evidence/2026-08-28-app-store-prior-use.md`.
- Nom prévu pour une future soumission : `Score-Immo`, avec le tiret.
