# Score-Immo - Lot 2 récupération de la demande existante

Date de décision : 2026-08-27  
Propriétaire : Codex  
Autorité : GO PROD explicite d'Augustin le 2026-08-27  
Base Git : `9e876e8756f4cb5d55908b57392f09784d335283`

## Objectif et vérité mesurée

Ce lot doit récupérer la demande SEO déjà visible avant de produire de nouvelles pages. Les décisions sont fondées sur GSC, le dernier export Bing valide, GA4 et les événements internes. Les chiffres ci-dessous sont des observations, pas des projections.

### Google Search Console, 28 jours au 25 août 2026 contre les 28 jours précédents

| Surface | Période courante | Période précédente | Diagnostic |
|---|---:|---:|---|
| Site | 280 clics, 27 396 impressions, CTR 1,02 %, position 13,72 | 328 clics, 27 014 impressions, CTR 1,21 %, position 9,61 | La demande reste visible, mais la position moyenne recule. |
| Guide DPE | 20 clics, 2 667 impressions, position 16,97 | 63 clics, 3 577 impressions, position 10,13 | Baisse engagée vers le 18 juillet, avant le changement du 17 août. Le title du 17 août n'est donc pas la cause initiale. |
| Négociation procédurale | 33 clics, 3 435 impressions, CTR 0,96 %, position 7,15 | 47 clics, 3 666 impressions, CTR 1,28 %, position 7,36 | Position stable, perte de CTR. Seulement neuf jours de données après le title du 17 août : nouveau changement interdit avant une fenêtre complète. |
| Négociation benchmark | 5 clics, 355 impressions, position 4,35 | 6 clics, 170 impressions, position 4,28 | Visibilité en hausse, CTR en baisse. Aucune double URL observée sur les requêtes exactes accessibles. La cannibalisation reste une hypothèse d'intention, pas un fait confirmé. |
| Bordeaux | 3 clics, 2 427 impressions, position 13,55 | 3 clics, 2 093 impressions, position 9,38 | Très forte exposition et CTR faible. Le title du 17 août est trop récent pour être jugé. Le corps contient encore des chiffres insuffisamment traçables : pas d'amplification avant nettoyage. |
| Guide analyser une annonce | 9 clics, 237 impressions, CTR 3,80 %, position 8,51 | 6 clics, 189 impressions, CTR 3,17 %, position 9,39 | Progression réelle. La homepage capte déjà l'intention actionnelle `analyse annonce immobilière`; le guide doit clairement posséder l'intention pédagogique avant visite. |

### Bing, dernier export valide disponible

Période de 28 jours terminée le 15 août 2026 : 86 clics, 2 951 impressions, CTR 2,91 %. Le cluster DPE représente 39 clics et 1 438 impressions, position moyenne 5,00. Les requêtes de négociation ressortent également. La clé API actuelle renvoie `InvalidApiKey`; l'export sera rafraîchi après régénération ou OAuth 2.0 dans Bing Webmaster Tools.

### Signaux produit et correction d'interprétation

- GA4, du 29 juillet au 25 août : 26 sessions Bing, dont 19 engagées.
- Événements internes : 23 parcours Bing, aucun événement `analyzer_submit`, checkout, paiement ou rapport.
- Cause de mesure confirmée : les formulaires d'analyse intégrés aux articles émettent `form_submit`, alors que la homepage émet `analyzer_submit` manuellement.
- Conséquence : le zéro Bing vers l'analyse ne prouve pas un rejet produit. Le contrat d'événement doit être corrigé avant toute conclusion sur le trafic Bing.

## Mémoire de décision par URL

### `/blogs/guides/dpe-comprendre-classes-energetiques`

- CONFIRMÉ : chute de position antérieure au changement éditorial du 17 août.
- OBSERVÉ : `dpe classes a g` est passé d'une position moyenne 15,40 à 29,06.
- HYPOTHÈSE : autorité, adéquation du contenu et manque de sources primaires explicites contribuent au recul.
- DÉCISION : garder le title actuel pendant l'enquête, puis nettoyer les affirmations et renforcer les sources officielles dans un sous-lot dédié.

### `/blogs/guides/negocier-prix-immobilier-techniques-arguments`

- CONFIRMÉ : position stable autour de 7, baisse de CTR.
- OBSERVÉ : elle reste la seule URL visible dans les données accessibles sur les requêtes `marge de négociation immobilier 2026` et `de combien peut-on négocier le prix d'une maison`.
- HYPOTHÈSE : son intitulé procédural ne reflète pas encore complètement la demande chiffrée.
- DÉCISION : gel du title jusqu'à une fenêtre complète après le 17 août. Renforcer ensuite la séparation des intentions avec la page benchmark, sans inventer une cannibalisation simultanée.

### `/blogs/guides/marge-negociation-immobilier-2026`

- CONFIRMÉ : position moyenne 4,35 et impressions en hausse.
- OBSERVÉ : peu de requêtes détaillées sont exposées par GSC à cause des seuils de confidentialité.
- DÉCISION : conserver cette page comme propriétaire des taux et benchmarks, après vérification de la méthodologie et des sources.

### `/blogs/villes/prix-immobilier-bordeaux-2026-quartiers`

- CONFIRMÉ : 2 427 impressions, 3 clics, recul de position.
- OBSERVÉ : la page apparaît autour de la position 10 sur plusieurs requêtes `par quartier`, mais beaucoup plus bas sur le terme générique.
- DÉCISION : ne pas changer à nouveau le title du 17 août. Nettoyer d'abord chaque chiffre et libellé de provenance, puis renforcer l'intention quartier.

### `/blogs/guides/analyser-annonce-immobiliere-comme-pro`

- CONFIRMÉ : le guide progresse alors que la homepage est forte sur la requête actionnelle.
- DÉCISION : la homepage reste propriétaire de l'action `analyser une annonce immobilière`; le guide devient la checklist pédagogique `comment analyser une annonce avant la visite`.
- CHANGEMENT DU PREMIER INCRÉMENT : title, H1 et description distinctifs, sans nouveau chiffre non sourcé.

## Premier incrément déployable

1. Normaliser les soumissions des formulaires d'analyse d'article vers `analyzer_submit`.
2. Conserver le tracking manuel validé de la homepage et empêcher tout doublon.
3. Transmettre le handle de l'article dans `utm_campaign`, avec validation stricte et sans donnée personnelle.
4. Renommer le guide d'analyse pour posséder l'intention `avant visite`, sans changer son URL.
5. Vérifier tests, build, contenu, liens, HTML rendu et absence de tirets cadratins dans le texte visible.

## Hors périmètre de cet incrément

- Pas de remboursement, crédit, e-mail, appel ou interview client sans autorisation distincte.
- Pas de changement supplémentaire des titles DPE, négociation ou Bordeaux avant fenêtre et données suffisantes.
- Pas d'amplification de chiffres locaux ou propriétaires insuffisamment sourcés.
- Pas de secret Bing ou Stripe dans Git, les notes ou les journaux.

## Critères de réussite et retour arrière

- Une soumission valide depuis un article produit exactement un `analyzer_submit`, jamais `form_submit`.
- La homepage continue de produire exactement son événement manuel après validation.
- L'application reçoit `utm_source=site`, le medium de surface et un `utm_campaign` égal au handle validé.
- L'URL canonique du guide reste inchangée et la build ne contient qu'un H1.
- Retour arrière : revert du commit du lot. Aucun schéma, donnée financière ou secret n'est modifié.

## Preuves d'exécution du premier incrément

- Les cinq tests de contrat ajoutés ou resserrés ont d'abord échoué sur la base intacte : aucun événement qualifié pour l'analyseur d'article, absence de campagne, absence de garde contre le doublon homepage et ancien positionnement du guide.
- Après implémentation, les tests ciblés passent : 30 sur 30.
- Suite complète : 89 sur 89.
- Contrôle de vérité éditoriale : vert.
- Build Astro : 297 pages générées.
- Intégrité du site construit : 10 999 liens internes et 34 redirections, contrôle vert.
- HTML construit du guide : un title, un H1, deux formulaires `data-analyzer-form` et deux campagnes égales au handle canonique.
- HTML construit de la homepage : un seul formulaire d'analyse, marqué pour conserver son tracking manuel sans doublon.
- `git diff --check` : vert.
