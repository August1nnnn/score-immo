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

À compléter après fusion et vérification HTTP réelle.
