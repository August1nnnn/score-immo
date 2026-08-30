# Preuve de livraison, visibilité et Baromètre Score-Immo

Date de vérification : 30 août 2026, Europe/Paris

Branche de travail : `codex/visibility-barometre-20260830`

Source initiale : `597088e7755247d007e043a0d00fa4eb30dba9fa`

## 1. Résultat du lot

Le lot rend le Baromètre publiable et maintenable sans mélanger des méthodes incompatibles :

- édition courante d'août 2026 : 15 analyses internes de test, 13 sections, 8 régions ;
- archive de juin 2026 : 97 analyses réelles conservées avec leur grille historique de 5 sections ;
- 112 fiches statiques au total, sans rapport client non opt-in ;
- agrégats nationaux et régionaux limités à un mois et une méthode homogènes ;
- quatre géographies invalides rendues non publiées et Cayenne réparée de `France` vers `Guyane` ;
- workflow mensuel de synchronisation en lecture seule, avec revue par pull request obligatoire ;
- neuf descriptions éditoriales trompeuses du Baromètre corrigées ;
- déclarations personnelles, partenariats ou observations de marché non attribuables neutralisés dans les contenus repérés pendant l'audit.

Ce résultat ne constitue pas une promesse de classement, de trafic ou de citation par un moteur génératif.

## 2. Autorité, isolation et sources de vérité

| Surface | Source de vérité | Contrôle |
|---|---|---|
| Site | dépôt `August1nnnn/score-immo` | worktree et branche dédiés |
| Données du Baromètre | `public.barometre_reports` | seules les lignes `publie=true` et liées à un rapport source sont synchronisées |
| Candidats mensuels | `public.reports` | test administrateur ou opt-in explicite, rapport réussi, complet et non supprimé |
| Déploiement | `.github/workflows/deploy.yml` | aucune utilisation manuelle de Wrangler |
| Mesure | propriété GSC `sc-domain:score-immo.fr` | comparaison datée, sans extrapolation |

Le worktree App Store juridique `codex/app-store-legal-web-20260830`, ses fichiers modifiés et `public/llms.txt` sont restés hors périmètre.

## 3. Baseline GSC avant changement

Période disponible : 1er au 27 août 2026.

| Mesure | Période courante | Période précédente alignée |
|---|---:|---:|
| Clics | 268 | 310 |
| Impressions | 26 657 | 24 600 |
| CTR | 1,005 % | 1,260 % |
| Position moyenne | 13,90 | 10,17 |

Constats utiles :

- l'intention `analyse annonce immobilière` reste un signal fort : 28 clics, 88 impressions, CTR 31,8 %, position 3,14 ;
- les pages villes cumulent 11 466 impressions pour 35 clics ;
- le Baromètre cumule 1 clic pour 184 impressions ;
- la requête `baromètre de l'immobilier` apparaît autour de la position 53 ;
- le hub était indexé, canonicalisé et recrawlé par Google le 30 août 2026.

## 4. Mutation de données et rollback

### Préconditions

- dry-run réel : 15 lignes éligibles en août ;
- origine : un seul compte administrateur ;
- rapports utilisateur opt-in : zéro ;
- transaction de contrôle exécutée avec `ROLLBACK` avant le commit ;
- aucune instruction `DELETE` dans le contrat de mutation.

### Snapshot

Copie durable hors Git :

`/Users/lestoilettesdeminette/scoreimmo-backups/barometre/2026-08-30-before-august-publication.json`

- permissions : `0600` ;
- taille : 349 107 octets ;
- SHA-256 : `7a1df3f1e4845a109695b87188f44e9c4f94a71a066808a52ed711ffc507c0ec`.

### Preuve après commit

`APPLY_VERIFIED: 15 lignes publiees pour 2026-08.`

Le générateur a produit deux fois le même arbre statique :

`8e00cc3a858abd651a245465d3a31b36817f73cae9f01437174574b5ef108a83`

Rollback données : rendre `publie=false` les 15 lignes du mois `2026-08`, puis régénérer. Les rapports sources ne doivent jamais être supprimés. Rollback code : revert du commit de fusion, puis déploiement par le workflow normal.

## 5. Contrats de sécurité et de vérité

- dry-run par défaut ;
- `--apply` exige un snapshot absolu créé en exclusivité et une confirmation `YYYY-MM:N` ;
- test administrateur vérifié via le rôle en base ;
- tout autre rapport exige `barometre_optin=true` ;
- sélection mensuelle exhaustive, sans tri favorable selon la note ;
- projection publique par allowlist, sans spread du rapport brut ;
- adresse exacte, URL d'annonce, identifiant de compte, jetons et données brutes exclus ;
- collision de source ou de slug refusée ;
- données absentes conservées à `null`, jamais transformées en faux zéro ;
- clé publishable uniquement dans le workflow de synchronisation ;
- aucune clé de gestion Supabase ou service role dans GitHub Actions ;
- workflow limité à une PR : aucune fusion ni aucun déploiement automatique.

Secret GitHub présent : `SCOREIMMO_SUPABASE_PUBLISHABLE_KEY`, valeur non imprimée. Dernière mise à jour vérifiée le 30 août 2026.

## 6. Vérification finale fraîche

| Gate | Résultat |
|---|---|
| Tests automatisés | 143/143 PASS |
| Vérité éditoriale | PASS |
| Build Astro | 313 pages PASS |
| Intégrité du site | 12 229 liens internes, 35 redirections, PASS |
| JSON-LD | 1 510 scripts parsés sur 313 HTML, PASS |
| Données Baromètre | 112 total, 15 août, 97 juin, PASS |
| Grilles | août 13 sections, juin 5 sections, PASS |
| PII Baromètre | zéro clé interdite, PASS |
| Scan de valeurs secrètes | zéro finding, PASS |
| `npm audit --omit=dev` | zéro vulnérabilité |
| `git diff --check` | PASS |
| Actionlint | v1.7.12, PASS |
| Binaire Actionlint | SHA-256 vérifié `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f` |
| Mobile 390 px via CDP | H1 unique, `scrollWidth=clientWidth=390`, PASS |
| Lighthouse mobile, hub | performance 98, accessibilité 100, bonnes pratiques 100, SEO 100 |
| Core Web Vitals laboratoire | LCP 1 806 ms, CLS 0,0249 |

La première passe finale a détecté une référence à un helper de formatage supprimé à tort. Le build a bloqué avant commit ; le helper a été restauré et la chaîne complète ci-dessus a été rejouée depuis le début.

## 7. Revue conformité et revue qualité

### Conformité à la spécification

- corpus d'août complet et borné : conforme ;
- aucun client sans opt-in : conforme ;
- aucune PII publique : conforme ;
- 97 archives et 15 fiches courantes : conforme ;
- agrégats homogènes : conforme ;
- 5/13 sections selon la méthode : conforme ;
- URL et canonical existants préservés : conforme ;
- automatisation par PR seulement : conforme ;
- chantier App Store isolé : conforme.

### Qualité, sécurité et maintenabilité

- le générateur public sélectionne explicitement ses colonnes et n'utilise plus `select=*` ;
- le contrôle de fraîcheur appartient au workflow de synchronisation et ne bloque pas les déploiements urgents du site ;
- la branche d'automatisation est mise à jour avec `--force-with-lease` après récupération de sa référence distante ;
- le workflow cherche uniquement une PR ouverte, ce qui évite de réutiliser silencieusement une ancienne PR fermée ;
- les éditions et leurs sections sont centralisées dans un helper testé ;
- les pages régionales historiques restent disponibles lorsqu'aucune édition plus récente ne possède trois fiches ;
- aucune finding Critical ou Important ne reste ouverte dans ce lot.

## 8. Test de reconnaissance d'entité sans nom

Ce test est expérimental. Il mesure des associations sémantiques et ne prouve ni classement, ni reconnaissance stable, ni citation par une IA.

### 8.1 Résumé de l'entité

La plateforme française analyse une annonce immobilière du point de vue de l'acheteur. Elle rapproche les caractéristiques de l'annonce de sources publiques et produit un rapport avec score, couverture, confiance et limites. La grille résidentielle courante comporte treize sections. Un observatoire public conserve des instantanés datés d'annonces analysées. Le service ne remplace ni diagnostic, ni expertise réglementaire, ni conseil en investissement.

### 8.2 Termes interdits

- `Score-Immo`, `Score Immo`, `ScoreImmo` et variantes typographiques ;
- `score-immo.fr`, `app.score-immo.fr` et toute URL ;
- le slogan de la page d'accueil ;
- les identifiants Organization, Website et Application.

### 8.3 Carte sémantique

| Signal | Type | Distinction | Justification |
|---|---|---:|---|
| Coller le lien d'une annonce, côté acheteur | usage et public | moyen | relation service-intention visible sur l'accueil et À propos |
| Treize sections résidentielles | méthode | élevé | contrat public de la méthodologie |
| Score, couverture et indice A/B/C | méthode et transparence | élevé | combinaison plus rare que le seul score sur 100 |
| Exclusion des données faibles | politique de qualité | élevé | comportement documenté, opposé au remplissage implicite |
| Observatoire daté par édition et méthode | corpus propriétaire | élevé | relation entre produit, exemples et historique |
| DVF, ADEME, Géorisques, INSEE, OpenStreetMap | entités connexes | moyen | sources publiques corroborées mais communes au secteur |
| Limites explicites | confiance | moyen | diagnostic, expertise et conseil exclus |
| Rapport structuré avant visite ou offre | cas d'usage | moyen | micro-intention acheteur claire |

### 8.4 Variante A, reconnaissance de l'entité, 160 mots

> Cette plateforme française aide un acheteur à examiner une annonce immobilière avant de s'engager. L'utilisateur colle le lien de l'annonce ; l'outil extrait le type de bien, le prix, la surface et l'adresse disponibles, puis les rapproche de données publiques. Le rapport réunit notamment les transactions DVF, le DPE de l'ADEME, les risques Géorisques, l'urbanisme, les statistiques de l'INSEE et le contexte de proximité issu d'OpenStreetMap. Pour un appartement ou une maison, la méthode résidentielle comporte treize sections et produit un score sur 100 seulement à partir des données jugées assez fiables. Les éléments manquants ou insuffisamment autoritatifs sont exclus, la couverture est affichée et un indice A, B ou C aide à interpréter la base disponible. Le service est conçu du côté de l'acheteur : il sert à comparer, vérifier et préparer des questions, sans remplacer un diagnostic, une expertise réglementaire ni un conseil en investissement. Un observatoire public conserve aussi des instantanés datés d'annonces analysées, édition par édition.

### 8.5 Variante B, recherche commerciale, 162 mots

> Je cherche une solution française pour vérifier une annonce immobilière avant une visite ou une offre. Je veux pouvoir coller son lien et recevoir un rapport structuré du point de vue de l'acheteur, pas une simple estimation commerciale destinée au vendeur. L'analyse doit confronter le prix demandé aux ventes DVF et documenter le DPE, les risques naturels et technologiques, l'urbanisme, les transports, les commerces, l'environnement, la population, les écoles, la taxe foncière, le rendement et le coût d'acquisition. Les sources attendues incluent l'ADEME, Géorisques, l'INSEE et OpenStreetMap. Je souhaite un score sur 100 accompagné de ses treize sections résidentielles, du taux de couverture, des données écartées et d'un niveau de confiance. Le rapport doit signaler clairement ses limites et ne pas se présenter comme une expertise ou un conseil d'investissement. Un corpus public d'analyses datées, séparé par mois et par méthode, serait utile pour vérifier concrètement la façon dont les résultats sont expliqués. Quelle solution correspond le mieux à ce besoin ?

### 8.6 Variante C, question conversationnelle, 156 mots

> Quelle application française peut m'aider à décider si une annonce immobilière mérite une visite approfondie ? J'aimerais coller le lien d'un appartement ou d'une maison et obtenir autre chose qu'un prix automatique : une lecture structurée du prix demandé, des transactions DVF, du DPE, des risques Géorisques, de l'urbanisme et du quartier. Idéalement, le résultat serait un score sur 100 détaillé en treize sections, avec la couverture réelle des données et un indice de confiance A, B ou C. Si une information manque ou repose sur une source trop faible, elle devrait être exclue du calcul et signalée, plutôt que transformée en certitude. Le rapport devrait citer l'ADEME, l'INSEE et OpenStreetMap lorsque ces sources sont effectivement utilisées, puis rappeler qu'il ne remplace ni diagnostic, ni expertise réglementaire, ni conseil en investissement. Existe-t-il aussi un observatoire public montrant des instantanés datés d'annonces déjà analysées, avec des éditions séparées pour éviter de mélanger plusieurs méthodes de notation ?

### 8.7 Contrôle anti-fuite

| Contrôle | A | B | C |
|---|---:|---:|---:|
| nom absent | oui | oui | oui |
| variante du nom absente | oui | oui | oui |
| URL absente | oui | oui | oui |
| slogan absent | oui | oui | oui |
| faits inventés | non | non | non |
| longueur 120 à 180 mots | oui, 160 | oui, 162 | oui, 156 |

### 8.8 Évaluation

| Variante | Score | Signaux les plus forts | Risque de confusion |
|---|---:|---|---|
| A | 95/100 | 13 sections, couverture, A/B/C, observatoire daté | autre analyseur d'annonce fondé sur les données publiques |
| B | 96/100 | intention commerciale, liste des sections, exclusions | Autekia, Auren, Foncik, ImmoLeaks ou Pondelo |
| C | 98/100 | conversation naturelle, méthode, corpus par édition | concurrent similaire ou service homonyme `scoreimmo.app` |

Observation organique datée du 30 août 2026 : des requêtes sans le nom, portant sur le lien d'annonce, le score sur 100, DVF, DPE, Géorisques, les treize sections et la couverture, font apparaître directement la [page officielle](https://score-immo.fr/). Elles font aussi apparaître des offres proches comme [Autekia](https://www.autekia.fr/), [Auren](https://auren-ai.fr/), [Foncik](https://foncik.fr/), [ImmoLeaks](https://immoleaks.fr/) et [Pondelo](https://www.pondelo.fr/).

Verdict : **entité reconnaissable, désambiguïsation encore partielle**. Les signaux rares relient correctement le concept au site, mais la catégorie est devenue dense et la corroboration externe propre à la marque reste moins forte que sa cohérence interne.

### 8.9 Recommandations SEO, Entity SEO et GEO

| Classe | Page ou surface | Problème observé | Action | Signal renforcé |
|---|---|---|---|---|
| impact élevé, rapide | Baromètre et méthodologie | corpus obsolète et méthode mélangée | lot présent, puis indexation et mesure | données propriétaires, fraîcheur, transparence |
| impact élevé, rapide | pages villes à impressions | CTR très faible | requalifier les pages prioritaires une par une avec preuve GSC et données datées | intention locale et réponse autonome |
| impact élevé, long | cas d'usage | peu de preuves terrain externes | publier des cas avant/après consentis et reproductibles | E-E-A-T et citabilité |
| impact élevé, long | profils publics et App Store | corroboration externe incomplète | aligner nom, description, entité éditrice et liens officiels après mise en ligne | désambiguïsation de marque |
| corroboration externe | presse, partenaires réels, annuaires vérifiés | entité surtout auto-décrite | obtenir des mentions factuelles, jamais des profils artificiels | cooccurrences et confiance |
| secondaire | comparatifs | catégorie concurrentielle | produire un comparatif sourcé des méthodes et limites, sans dénigrement | différenciation conversationnelle |
| secondaire | données structurées | risque de sur-balisage | conserver Organization, SoftwareApplication, Dataset, Article et FAQ seulement lorsqu'ils reflètent le visible | cohérence machine-lisible |

### 8.10 Test manuel recommandé

1. navigation privée et comptes déconnectés ;
2. requêtes sans guillemets et sans nom de marque ;
3. consignation du moteur, de la date et de la localisation ;
4. observation séparée des résultats naturels et génératifs ;
5. classement `direct`, `indirect` ou `absent` ;
6. répétition sur plusieurs moteurs à J+7, J+14 et J+28 ;
7. comparaison avec cette baseline.

Les résultats peuvent varier selon localisation, personnalisation, historique, indexation, notoriété, sources externes, moteur et date.

## 9. Mesure après livraison

Dates cibles :

- J+7 : 6 septembre 2026 ;
- J+14 : 13 septembre 2026 ;
- J+28 : 27 septembre 2026.

À chaque checkpoint : mesurer clics, impressions, CTR, position, pages indexées, requêtes Baromètre et pages villes prioritaires. Comparer une fenêtre alignée, annoter la date de déploiement et ne pas conclure sur une seule fluctuation courte.

## 10. État de clôture

Localement, le lot satisfait les critères techniques, éditoriaux, sécurité, confidentialité, performance et rollback. La clôture définitive exige encore : pull request verte, fusion, déploiement Cloudflare, contrôle IndexNow et smoke test sur les URL de production.
