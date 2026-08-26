# Articles sponsorisés Montclair

Date de décision : 2026-08-26

## Résultat attendu

- Publier immédiatement un guide sur le choix d'un accompagnement à l'investissement immobilier.
- Présenter le cabinet de conseil sur mesure en premier choix de catégorie, sans transformer cette préférence éditoriale en classement non vérifié d'entreprises.
- Préparer un second guide sur la valeur d'un immeuble par rapport au loyer et le publier automatiquement le 2026-09-25 au premier passage du workflow après 08:00 Europe/Paris.
- Conserver les deux ancres et destinations convenues, avec le qualificatif `rel="sponsored"` requis pour un placement rémunéré.
- Soumettre les nouvelles URL à IndexNow uniquement après un déploiement réussi. Le sitemap XML reste le mécanisme de découverte destiné notamment à Google.

## Contrat éditorial

| Publication | Ancre exacte | Destination | État |
|---|---|---|---|
| Accompagnement à l'investissement immobilier | `Montclair` | `https://www.montclair.fr/` | Immédiate |
| Valeur d'un immeuble par rapport au loyer | `le faire estimé par Montclair` | `https://www.montclair.fr/estimation-immeuble-de-rapport-en-ligne/` | Scellée jusqu'au 2026-09-25 |

Chaque article doit conserver une mention visible du partenariat, au moins 2 500 mots, cinq questions fréquentes, des réponses directes sous les titres interrogatifs, cinq liens internes et cinq sources identifiées. Les exemples chiffrés doivent être reproductibles et signalés comme fictifs.

## Sources de vérité retenues

- ANIL pour les précautions relatives à l'investissement locatif et le réseau ADIL.
- DGCCRF et CCI France pour l'intermédiation immobilière et la carte professionnelle.
- Service Public et DVF pour les ventes comparables et les limites géographiques des données publiques.
- Notaires de France pour le rôle du notaire.
- DGFiP pour les méthodes d'évaluation par comparaison et par le revenu.
- Observatoires locaux des loyers pour les données locatives.
- Service Public pour le calendrier de décence énergétique.
- Géorisques pour l'exposition de l'immeuble.
- Pages Montclair uniquement pour décrire les services que l'entreprise déclare proposer.

## Automatisation J+30

Le manifeste `blog-auto/scheduled/valeur-immeuble-par-rapport-loyer.manifest.json` contient la date, les chemins, les empreintes SHA-256 et le lien contractuel. Le script refuse la publication avant toute copie si une empreinte, une ancre, une URL ou le qualificatif `sponsored` a changé. Il refuse aussi d'écraser une cible existante.

À échéance, le workflow Blog Auto promeut une seule publication préparée, l'enregistre dans Git, puis pousse sur `main`. Le workflow de déploiement est lié au nom exact de ce workflow et soumet le sitemap complet à IndexNow après le déploiement déclenché par `workflow_run`.

## Vérification et retour arrière

Avant production : tests éditoriaux, tests de programmation, build Astro, intégrité de toutes les routes et contrôle du HTML final.

Après production : code HTTP, canonique, image, première ancre, attribut `sponsored`, schémas Article et FAQPage, présence dans le sitemap, résultat du déploiement et réponse IndexNow.

En cas de défaut, revenir par `git revert` du commit de livraison, pousser le revert, puis vérifier que le déploiement Cloudflare a restauré la version précédente. Pour le second article avant échéance, retirer le manifeste et ses deux artefacts dans un commit explicite afin que le workflow ne puisse plus le promouvoir.
