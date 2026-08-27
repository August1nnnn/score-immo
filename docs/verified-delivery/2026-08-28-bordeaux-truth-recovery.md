# Score-Immo - Récupération Bordeaux par la vérité des données

Date : 2026-08-28

Propriétaire : Codex

Base Git : `1464d99574b5c5188eea5ea3e6a7a94503afdcae`

Autorité : GO PROD explicite renouvelé par Augustin

## Pourquoi ce sous-lot existe

La page `/blogs/villes/prix-immobilier-bordeaux-quartiers-tendances` produit déjà une forte demande organique, mais la transforme mal : 3 clics, 2 427 impressions et une position moyenne 13,55 sur la fenêtre GSC courante de 28 jours, contre 3 clics, 2 093 impressions et une position 9,38 sur la fenêtre précédente.

Le contenu antérieur mêlait chiffres de marché, négociation, délais, population étudiante, emploi, DPE et projets locaux sans périmètre reproductible suffisant. Changer à nouveau le title aurait ajouté du bruit alors que la priorité était d'établir une base factuelle stable.

## Décision

- Conserver exactement l'URL, la canonical, le title, la meta description et l'identifiant historique de l'article.
- Recalculer les prix à partir des fichiers communaux DVF géolocalisés 2024 et 2025.
- Séparer appartements et maisons.
- Utiliser les huit périmètres officiels de Bordeaux Métropole au lieu de regroupements éditoriaux non définis.
- Publier la taille de chaque échantillon, la méthode, les limites et la date de révision.
- Ne présenter aucune valeur DVF comme un prix d'annonce en temps réel ou une mesure de négociation.
- Garder deux passages mesurables vers l'analyseur Score-Immo avec la campagne exacte de l'article.

## Sources scellées

| Source | Empreinte SHA-256 ou URL de référence |
|---|---|
| DVF géolocalisées Bordeaux 2024, commune 33063 | `324758454af115f15c596b13efa5356ab96ff8c6547446048de82e30dbcf71f1` |
| DVF géolocalisées Bordeaux 2025, commune 33063 | `db2ad0e849169489aabdf949b0651cbb74691de4b3a05837a548b1031707a262` |
| Périmètres officiels des quartiers, Bordeaux Métropole | `23c06e7a766403faf8ccc4e5404564309d655e08a59e6935a2970c49430e3616` |
| Présentation et calendrier DVF | https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres |
| Schéma DVF géolocalisé | https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres-geolocalisees |
| Contexte communal | https://www.insee.fr/fr/statistiques/1405599?geo=COM-33063&lang=fr |

Les fichiers CSV portent une date de modification serveur du 18 mai 2026. Les résultats complets, empreintes et limites sont conservés dans `docs/evidence/2026-08-28-bordeaux-dvf-summary.json`. Le script `scripts/analyze-bordeaux-dvf.py`, sans dépendance tierce, reproduit le calcul à partir de ces trois fichiers sources et son option `--verify-evidence` compare chaque empreinte et chaque valeur publiée au fichier scellé.

## Méthode reproductible

Périmètre : commune de Bordeaux, code INSEE 33063.

Une ligne est retenue lorsque :

- la nature de mutation est `Vente` ;
- la mutation contient exactement un local résidentiel ;
- le type est `Appartement` ou `Maison` ;
- la surface réelle bâtie est strictement positive ;
- le prix calculé `valeur_fonciere / surface_reelle_bati` est compris entre 500 et 15 000 euros par mètre carré ;
- le point géographique appartient à un des huit quartiers officiels de Bordeaux.

Les médianes sont calculées par année, type de bien et quartier. Le même filtre est appliqué aux millésimes 2024 et 2025.

## Résultats scellés

| Millésime | Type | Échantillon | Médiane | Q1 | Q3 |
|---|---|---:|---:|---:|---:|
| 2024 | Appartements | 2 856 | 4 222 €/m² | 3 520 €/m² | 5 000 €/m² |
| 2024 | Maisons | 862 | 4 961 €/m² | 4 058 €/m² | 5 913 €/m² |
| 2025 | Appartements | 3 421 | 4 121 €/m² | 3 462 €/m² | 4 881 €/m² |
| 2025 | Maisons | 1 095 | 4 855 €/m² | 4 033 €/m² | 5 909 €/m² |

À filtre constant, les médianes 2025 reculent de 2,4 % pour les appartements et de 2,1 % pour les maisons par rapport à 2024. La page publie aussi les échantillons et médianes 2025 pour chacun des huit quartiers officiels.

## Limites publiées

- DVF contient le prix de mutation, mais pas le prix initial de l'annonce. Elle ne mesure donc pas la remise négociée.
- DVF ne décrit ni le DPE, ni l'état intérieur, ni les travaux nécessaires.
- La valeur foncière peut inclure des dépendances qui ne sont pas isolées dans le ratio.
- Les mutations groupant plusieurs locaux résidentiels sont exclues afin d'éviter une attribution artificielle du prix.
- Les publications ultérieures peuvent compléter un millésime historique. Toute mise à jour doit relancer le script et conserver les nouvelles empreintes.

## Assertions retirées

Les valeurs suivantes ne doivent pas réapparaître sans source datée, définition et méthode : négociation à 68 %, 85 000 étudiants, 12 400 ventes, 23 % des emplois, délai de 78 jours, 28 % de logements F ou G, coûts de projets ou d'aménagement, frais d'acquisition et rendements prédictifs présentés comme propres à Bordeaux.

## Preuves TDD et vérification locale

- Test ciblé initial : 1 réussite et 4 échecs contre l'article antérieur, portant sur les résultats bornés, les huit quartiers, les assertions non démontrées et les sources exactes.
- Test ciblé final : 5 tests sur 5 réussis.
- Première chaîne complète : 98 tests réussis et contrôle de vérité réussi ; le build a ensuite refusé un identifiant devenu numérique par erreur. Aucun déploiement n'a eu lieu.
- Correctif : restauration de l'identifiant canonique chaîne `749465207109` et ajout d'une assertion de non-régression.
- Chaîne complète finale : `npm test`, 98 tests sur 98 réussis ; `npm run test:content-truth`, réussi ; `npm run build`, 297 pages ; `npm run test:site-integrity`, 297 HTML, 10 984 liens internes, 34 redirections, réussi.
- Recalcul indépendant : l'option `--verify-evidence docs/evidence/2026-08-28-bordeaux-dvf-summary.json` valide toutes les empreintes, tailles d'échantillon, médianes, quartiles, variations et valeurs par quartier publiées. Les compteurs de rejet supplémentaires restent dans la sortie brute du script et ne sont pas présentés comme des champs du fichier éditorial.
- HTML construit : title et canonical uniques et inchangés, un H1, cinq questions FAQ dans le JSON-LD, sept sources officielles, deux formulaires d'analyse et deux campagnes exactes, lien éditorial Rive Droite présent une fois, huit quartiers et médianes publiés, aucune assertion retirée et aucun tiret cadratin ou demi-cadratin.
- `git diff --check` : réussi.

## Gates après déploiement

- PR verte et commit de fusion identifié.
- Garde-fous de la branche principale, déploiement Cloudflare et IndexNow verts.
- Page live en HTTP 200 et indexable.
- URL, canonical, title, meta description et H1 conformes.
- Médianes, échantillons, huit quartiers, méthode, limites et sept références visibles.
- Deux formulaires contenant la campagne `prix-immobilier-bordeaux-quartiers-tendances`.
- Aucun ancien chiffre à risque ni tiret cadratin ou demi-cadratin.

## Retour arrière

Un revert du commit de livraison restaure le contenu précédent. Il n'existe aucune migration, aucun secret, aucune donnée client et aucune mutation financière dans ce sous-lot.
