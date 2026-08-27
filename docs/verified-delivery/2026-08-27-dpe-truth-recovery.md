# Score-Immo - Récupération du guide DPE par la vérité des données

Date : 2026-08-27  
Propriétaire : Codex  
Base Git : `6f230f805d55755a4e79f2c750eabef793f1f9f2`  
Autorité : GO PROD explicite du 2026-08-27

## Pourquoi ce sous-lot existe

Le guide `/blogs/guides/dpe-comprendre-classes-energetiques` est passé de 63 clics, 3 577 impressions et une position moyenne 10,13 à 20 clics, 2 667 impressions et une position 16,97 sur deux fenêtres GSC consécutives de 28 jours terminées le 25 août 2026.

La baisse commence vers le 18 juillet, avant l'alignement du H1 réalisé le 17 août. Un nouveau changement de title ne traiterait donc pas la cause observée et détruirait la lisibilité de la mesure. Le risque principal du contenu existant était ailleurs : chiffres de parc, coûts annuels, durées de vente, décotes et citations non reliés à une méthodologie ou à une source précise.

## Décision

- Conserver URL, canonical, title et meta description.
- Remplacer le corps par une réponse plus courte, exacte et vérifiable.
- Distinguer la grille générale des exceptions de petite surface et d'altitude.
- Expliquer le changement électrique 2026 sans promettre un reclassement individuel.
- Séparer interdiction de location, droit de vendre et audit énergétique.
- Remplacer toute décote universelle par les deux observations nationales clairement attribuées aux Notaires.
- Remplacer les coûts théoriques par la fourchette conventionnelle du DPE, les factures, l'audit et les devis.

## Sources de vérité utilisées

| Fait | Source primaire |
|---|---|
| Double seuil, méthode, validité, numéro ADEME | https://www.ecologie.gouv.fr/politiques-publiques/diagnostic-performance-energetique-dpe |
| Seuils généraux, petites surfaces et altitude | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049446315 |
| Coefficient électrique de 2,3 à 1,9 au 1er janvier 2026 | https://www.ecologie.gouv.fr/presse/evolution-du-calcul-du-dpe-1er-janvier-2026-favoriser-lelectrification-du-chauffage |
| Estimation 850 000 et attestation officielle | https://www.ecologie.gouv.fr/actualites/evolutions-du-calcul-du-dpe-reponses-vos-questions |
| Décence énergétique des baux en métropole | https://www.service-public.fr/particuliers/vosdroits/F35978/0_1?idFicheParent=F2042 |
| Audit énergétique à la vente | https://www.service-public.fr/particuliers/vosdroits/F37110 |
| Vérification du numéro et attestation | https://observatoire-dpe-audit.ademe.fr/accueil |
| Valeur verte des transactions 2024 | https://www.notaires.fr/fr/article/la-valeur-verte-des-logements-vendus-en-2024 |
| Écarts classe G par rapport à D | https://www.immobilier.notaires.fr/fr/articles/conseils-et-actualites/actualites/des-transactions-sous-linfluence-de-letiquette-energie |

## Corrections matérielles

Le contenu retiré ne doit pas réapparaître sans preuve datée et méthode :

- décote générique de 5 à 15 % par classe ;
- fourchettes de chauffage inventées par lettre et énergie ;
- répartition nationale par classe sans date ni périmètre ;
- délais moyens de vente par classe ;
- affirmation que 40 % des logements auraient été dégradés ;
- fausse citation ADEME datée 2026 ;
- étude ScoreImmo DVF 2025-2026 sans échantillon ni protocole ;
- budgets de travaux présentés comme universels ;
- dates ou périmètres erronés de l'audit énergétique.

La donnée des Notaires est désormais bornée : transactions anciennes 2024, comparaison avec la classe D, moyenne nationale et aucune utilisation comme estimation individuelle.

## Gate de livraison

- Test de régression rouge sur le contenu ancien, vert sur le nouveau.
- Sources spécifiques, aucune homepage générique utilisée comme preuve.
- Zéro tiret cadratin ou demi-cadratin dans le contenu visible.
- `last_reviewed` et `updated_at` au 27 août 2026.
- `word_count` égal au texte visible construit.
- Tests complets, contrôle de vérité, build et intégrité des liens verts.
- Après déploiement : HTTP 200, canonical inchangée, title inchangé, H1 unique, tableaux et sources visibles.

## Preuves d'exécution locales

État avant implémentation : le test de vérité DPE conservait le title éprouvé, mais échouait sur les faits bornés, les affirmations non démontrées et les sources spécifiques. Le contrôle a donc bien été rouge sur le contenu antérieur avant de devenir vert.

État final du 27 août 2026 :

- `npm test` : 93 tests sur 93 réussis ;
- `npm run test:content-truth` : réussi ;
- `npm run build` : 297 pages construites ;
- `npm run test:site-integrity` : 297 HTML, 10 990 liens internes, 34 redirections, contrôle réussi ;
- `git diff --check` : réussi ;
- HTML DPE construit : un title, un canonical, un H1, deux analyseurs avec la campagne `dpe-comprendre-classes-energetiques`, trois liens éditoriaux approuvés et aucun tiret cadratin ou demi-cadratin ;
- JSON-LD FAQ : exactement cinq questions éditoriales. Le bloc produit n'est plus absorbé comme une fausse sixième question grâce à un extracteur borné avant le CTA ou le prochain H2 ;
- portée du correctif d'extraction : sur les 168 articles, 39 contenaient après leur FAQ un CTA ou une section ultérieure que l'ancien parseur ajoutait à tort au JSON-LD. La nouvelle borne retire uniquement ces éléments postérieurs et conserve les questions éditoriales ;
- recherche des anciennes assertions à risque dans le HTML construit : aucun résultat.

Le passage de 10 999 à 10 990 liens internes provient du retrait du corps ancien et de ses nombreuses affirmations. Les trois relations éditoriales explicitement approuvées pour cette page sont conservées une seule fois chacune et le contrôle global de résolution reste vert.

## Retour arrière

Un revert du commit restaure le contenu antérieur. Il n'y a ni migration, ni secret, ni donnée client, ni mutation financière.
