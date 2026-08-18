# ScoreImmo : suppression des articles sans lien entrant éditorial

Date : 18 août 2026
Propriétaire : Codex
Environnement : dépôt local sur le commit `cb9bfec010f15cd733fc32611b3118b20b9f17f5`

## Objectif

Donner au moins un lien entrant article vers chacun des 44 articles qui n'en reçoivent actuellement aucun, sans créer de lien artificiel, de doublon dans une même source, de cible cassée ou de modification d'intention de recherche.

## Périmètre

Inclus :

- 44 liens contextuels, exactement un par cible actuellement à zéro lien entrant article ;
- ancres descriptives et distinctes de formulations génériques comme « cliquez ici » ou « guide dédié » ;
- règles déterministes appliquées dans le rendu des articles ;
- tests source, build complet et comparaison du graphe avant et après.

Exclus :

- déploiement, push et notification IndexNow sans autorisation séparée ;
- fusion, redirection ou réécriture des articles dont les intentions sont proches ;
- liens automatisés par similarité lexicale ;
- modification des hubs, du Baromètre ou des données métier.

## Baseline reproductible

- Commit : `cb9bfec010f15cd733fc32611b3118b20b9f17f5`.
- `npm test` : 66 tests réussis, 0 échec.
- `npm run build` : 299 pages.
- Graphe : 167 articles, 670 arêtes article vers article, 618 arêtes contextuelles, 44 articles sans lien entrant, 2 articles sans lien sortant, composante fortement connexe éditoriale maximale de 73 articles.
- Intégrité : 0 cible manquante, 0 fragment cassé, 0 lien vers une page `noindex`, 0 dérive sitemap, 0 page indexable orpheline et profondeur maximale de 2.
- Rapport baseline : `/private/tmp/scoreimmo-graph-lot2-baseline.json`.

## Matrice approuvée par la demande utilisateur

| Source | Cible | Ancre prévue |
|---|---|---|
| Prix immobilier Annecy | Achat immobilier en montagne | spécificités d'un achat immobilier à la montagne |
| Acheter au dernier étage | Acheter en rez-de-jardin | acheter un appartement en rez-de-jardin |
| Financer les travaux | Acheter avec travaux | acheter un appartement avec travaux |
| Lire un plan cadastral | Acheter un duplex | questions à poser avant d'acheter un duplex |
| Acheter à deux | Acheter en indivision | règles de l'achat en indivision |
| Investissement locatif | Acheter un logement déjà loué | acheter un logement déjà loué |
| Checklist de visite | Maison avec piscine | points à contrôler avant d'acheter une maison avec piscine |
| Ancien ou neuf | Acheter en VEFA | pièges à éviter lors d'un achat en VEFA |
| MaPrimeRénov 2026 | Aides rénovation 2026 | aides à la rénovation énergétique en 2026 |
| Estimation immobilière | Calcul de la plus-value | calcul de la plus-value immobilière à la revente |
| Comprendre le DPE | Carnet d'information du logement | carnet d'information du logement |
| Checklist de visite | Checklist de contre-visite | checklist de contre-visite immobilière |
| Prix immobilier Tours | Crédit jeune couple à Tours | crédit immobilier d'un jeune couple à Tours |
| Dossier DDT | Diagnostic bruit ENSA | diagnostic bruit ENSA |
| Dossier DDT | Diagnostic gaz | diagnostic gaz avant un achat immobilier |
| Dossier DDT | Risque de mérule | risque de mérule avant l'achat |
| Dossier DDT | Diagnostic termites | diagnostic termites |
| DPE collectif | Fiabilité du DPE collectif | fiabilité du DPE collectif d'un appartement |
| Acheter un logement déjà loué | Garantie loyers impayés | garantie loyers impayés |
| Analyser une annonce | Home staging virtuel | pièges du home staging virtuel |
| Taxe foncière 2026 | Impact de la taxe foncière | impact de la taxe foncière sur le budget d'achat |
| Investir à Paris | Impact des transports | impact des transports en commun sur les prix immobiliers |
| Score ScoreImmo | Méthode d'analyse ScoreImmo | méthode d'analyse immobilière de ScoreImmo |
| Simulation de capacité | Prêt relais | fonctionnement du prêt relais |
| Conditions du PTZ | Simulation PTZ | simulation d'éligibilité au PTZ 2026 |
| Investissement locatif | SCPI fixe ou variable | SCPI à capital fixe ou variable |
| Comprendre le PLU | Transformer un local commercial | transformer un local commercial en habitation |
| Investissement locatif | Viager 2026 | fonctionnement du viager en 2026 |
| Garantie décennale | Vices cachés | recours en cas de vice caché immobilier |
| Règlement de copropriété | Visite cave et parking | visiter une cave ou un parking en copropriété |
| Devenir mandataire | Dix erreurs de débutant | 10 erreurs qui font perdre des mandats |
| Estimer un bien | Fiabiliser avec les ventes DVF | fiabiliser une estimation avec les ventes DVF comparables |
| Prospection immobilière | Notoriété locale | développer sa notoriété locale de mandataire |
| Mandataire ou agent | Réseau ou agence | réseau de mandataires ou agence immobilière |
| Devenir mandataire | Immobilier sans diplôme | se lancer dans l'immobilier sans diplôme |
| Prix immobilier Dijon | Quartiers de Dijon | meilleurs quartiers où acheter à Dijon |
| Prix immobilier Grenoble | Quartiers de Grenoble | meilleurs quartiers où acheter à Grenoble |
| Prix immobilier Lille | Quartiers de Lille | meilleurs quartiers où acheter à Lille |
| Prix immobilier Montpellier | Quartiers de Montpellier | meilleurs quartiers où acheter à Montpellier |
| Prix immobilier Rennes | Quartiers de Rennes | meilleurs quartiers où acheter à Rennes |
| Prix immobilier Toulouse | Quartiers étudiants de Toulouse | quartiers étudiants où investir à Toulouse |
| Prix immobilier Nantes | Quartiers qui montent à Nantes | quartiers nantais qui montent |
| Prix immobilier Paris | Marché du luxe à Paris | marché immobilier de luxe à Paris |
| Investissement locatif | Tendances immobilières des villes | tendances immobilières 2026 dans les villes françaises |

## Architecture choisie

Les règles du lot seront isolées dans `src/lib/curated-internal-links-lot2.js`, puis fusionnées avec les règles existantes par `src/lib/curated-internal-links.js`. Chaque règle contient une source, une cible, une ancre, un point d'insertion unique et le HTML inséré ou remplacé.

Ce choix conserve les contenus JSON d'origine, rend le lot réversible en supprimant un seul module et permet aux tests de contrôler la matrice complète. Le rendu échoue si un point d'insertion n'est plus unique ou si la source contient déjà plusieurs fois la cible.

## Risques et protections

Classe de risque : élevée pour le SEO, faible pour les données et moyenne pour le code partagé.

| Risque | Protection | Détection | Réponse |
|---|---|---|---|
| Lien hors sujet | Matrice manuelle et phrase située dans un passage lié | Relecture de chaque source et de chaque ancre | Retirer la règle concernée |
| Suroptimisation | Une nouvelle occurrence par cible, ancres naturelles | Comptage exact des href et audit des ancres | Reformuler ou supprimer l'occurrence |
| Cannibalisation | Aucun changement de title, H1, canonical ou cible principale | Diff limité aux règles et tests | Audit de consolidation séparé |
| Lien cassé | Vérification de l'existence de chaque fichier cible et build | Tests source et `test:site-integrity` | Bloquer le lot |
| Dérive du contenu | Point d'insertion strictement unique | Exception au build si le texte source change | Mettre à jour la règle après revue |
| Régression globale du graphe | Comparaison JSON baseline et résultat | Crawler complet après build | Revenir au baseline local |

## Critères d'acceptation

1. Les 44 cibles baseline reçoivent chacune exactement un nouveau lien article contextuel.
2. Le graphe final contient 0 article sans lien entrant article et 0 article sans lien entrant contextuel.
3. Aucune arête baseline n'est supprimée.
4. Aucun href n'est dupliqué dans une même source par le lot.
5. Les ancres prévues sont présentes exactement une fois et ne sont pas génériques.
6. Le build conserve 0 cible manquante, 0 fragment cassé, 0 ancre imbriquée, 0 page indexable orpheline, 0 dérive sitemap et une profondeur maximale inférieure ou égale à 2.
7. Les tests complets, le contrôle de vérité du contenu, le build, l'intégrité du site et l'audit des standards réussissent.
8. Aucun commit, push ou déploiement n'est effectué dans ce lot local sans nouvelle autorisation.

## Rollback

Avant commit, retirer l'import et la fusion du lot 2, supprimer le module et le test du lot. Après un éventuel déploiement autorisé, créer un revert du commit du lot et repasser par le workflow Cloudflare. Aucun reset ni réécriture d'historique.
