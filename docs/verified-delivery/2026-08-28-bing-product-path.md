# Passage Bing vers le produit, 28 août 2026

## Objectif

Fermer le point Lot 2 « ajouter un passage vers le produit sur les entrées Bing DPE et locales » sans modifier les URLs, canonicals, titles, H1 ou contenus de fond récemment livrés.

## Signal de départ

Sur la fenêtre Bing Webmaster du 29 juillet au 25 août 2026 :

- guide DPE : 1 388 impressions, 27 clics, position 4,97 ;
- `ou-habiter-pres-de-lyon` : 33 impressions, 1 clic, position 4,79 ;
- `meilleurs-quartiers-acheter-paris` : 7 impressions, 2 clics, position 4,29 ;
- `meilleurs-quartiers-acheter-marseille` : 7 impressions, 2 clics, position 4,71 ;
- page ville Marseille : 7 impressions, 1 clic, position 4,86.

Ces pages avaient déjà deux analyseurs partagés, en haut et en fin d'article. Le correctif de mesure du lot précédent avait déjà transformé leur soumission en `analyzer_submit` et propagé le handle de l'article dans `utm_campaign`.

## Audit live avant modification

Les cinq pages répondent en production avec :

- deux formulaires `data-analyzer-form` ;
- `utm_medium=blog_top` et `utm_medium=blog_end` ;
- un `utm_campaign` égal au handle de la page ;
- une action vers `https://app.score-immo.fr/app` ;
- le script `/track.js?v=20260827-lot2`, qui émet `analyzer_submit` sur ces formulaires.

Le passage produit était donc fonctionnel et mesurable. Deux écarts publics subsistaient dans le composant partagé : l'orthographe `ScoreImmo`, ambiguë pour l'entité, et la promesse absolue `100% indépendant`.

## Modification bornée

- remplacer `ScoreImmo` par la marque canonique `Score-Immo` dans les quatre variantes visibles du composant ;
- remplacer `100% indépendant` par `analyse conçue du côté de l'acheteur` ;
- conserver exactement les formulaires, destinations, UTM, prix, positions dans la page et événements de mesure.

## TDD et vérifications

Le test de contrat a été ajouté avant l'implémentation. Il a d'abord échoué sur l'ancienne marque, puis réussi après la modification.

Résultats préproduction :

- test ciblé : 2 sur 2 ;
- suite complète : 103 sur 103 ;
- contrôle de vérité éditoriale : vert ;
- build Astro : 297 pages ;
- intégrité : 10 976 liens internes et 34 redirections, vert ;
- les cinq pages construites contiennent chacune deux analyseurs, deux occurrences de `Score-Immo`, deux formulations côté acheteur, le bon `utm_campaign`, zéro `ScoreImmo` dans la phrase concernée et zéro `100% indépendant` ;
- `git diff --check` : vert ;
- aucun tiret cadratin ou demi-cadratin dans les deux fichiers modifiés.

## Risque et rollback

Le changement est limité à une copie visible partagée. Il ne modifie aucun contrat de données, événement, formulaire, URL ou métadonnée SEO.

Rollback : annuler le commit de ce lot. Le retour arrière restaure uniquement les deux anciennes formulations ; aucune migration ni donnée externe n'est impliquée.

## Gate de production

Après fusion et déploiement Cloudflare :

1. vérifier le SHA fusionné et le workflow de déploiement ;
2. contrôler les cinq pages live ;
3. confirmer les deux formulaires, les UTM et le script de mesure ;
4. confirmer la marque canonique et l'absence de la promesse absolue ;
5. laisser les événements naturels alimenter la baseline, sans soumission synthétique d'annonce.

