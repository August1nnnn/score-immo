# Entité et méthodologie Score-Immo, 28 août 2026

## Mission

Rendre l'identité et la méthode de Score-Immo cohérentes, vérifiables et compréhensibles par les utilisateurs, Google, Bing et les moteurs génératifs.

Le changement doit produire deux pages institutionnelles indexables, relier les principales données structurées à une seule organisation et retirer de l'index la page qui décrit une ancienne formule de calcul.

## Source de vérité

| Surface | Source retenue | Preuve | Exclusion explicite |
|---|---|---|---|
| Marque | `Score-Immo` | domaine, mentions légales et objet Wikidata Q140289914 | `ScoreImmo` et `Score Immo` restent uniquement des noms alternatifs structurés |
| Éditeur | Augustin Foucheres, entrepreneur individuel, SIREN 890 838 709 | mentions légales corrigées et Annuaire des entreprises | aucun fondateur, dirigeant ou expert non vérifié n'est ajouté |
| Organisation | `https://score-immo.fr/#organization` | identifiant déjà utilisé sur la page d'accueil et les auteurs | les organisations anonymes sans `@id` ne sont plus produites par les gabarits principaux |
| Site | `https://score-immo.fr/#website` | schéma de la page d'accueil | aucune variante de domaine n'est créée |
| Application | `https://score-immo.fr/#application` | schéma de la page d'accueil, URL fonctionnelle `https://app.score-immo.fr/app` | l'application web reste distincte du futur projet App Store |
| Score actuel | moteur `scoringService.ts` de `Score-Immo/scoreimmo-app` sur `origin/main` au SHA `461fa427` | grilles par catégorie, disponibilité par section et repondération explicites | l'ancienne grille à cinq axes 40/20/15/15/10 n'est plus présentée comme la méthode courante |
| Baromètre | fichiers datés de `src/content/barometre` | chaque fiche contient `date_analyse`, `score_global` et cinq `score_sections` | ces instantanés historiques ne sont pas présentés comme des rapports recalculés avec le moteur courant |
| Sources | producteurs et jeux publics reliés depuis la page Méthodologie | DVF, ADEME, Géorisques, INSEE, GPU, BAN, Éducation nationale, DGFIP, ATMO et OpenStreetMap | OpenStreetMap est qualifié de source ouverte, pas d'administration française |

Baseline locale avant changement : `origin/main` au SHA `3c480d67080f9045cb1d6e81914feff33828c243`, worktree propre, 103 tests sur 103 verts le 28 août 2026.

## Périmètre

### Inclus

- créer une source TypeScript partagée pour le nom, les identifiants et le schéma Organization ;
- inclure cette organisation canonique sur toutes les pages via le layout global ;
- faire référencer l'organisation canonique par les articles, les hubs, le Baromètre et la page Pro ;
- utiliser `Score-Immo` dans le chrome global, les métadonnées par défaut et les schémas principaux ;
- publier `/a-propos` avec la définition du service, l'éditeur, les limites et les liens institutionnels ;
- publier `/methodologie` avec sources, calcul courant, disponibilité, repondération, confiance, échantillons, Baromètre et politique de correction ;
- rediriger en 301 l'ancienne page de formule `/blogs/guides/score-scoreimmo-methode-evaluation` vers `/methodologie` et l'exclure des pages générées et du sitemap ;
- relier le pied de page aux deux nouvelles pages ;
- remplacer dans le schéma applicatif la quantité non démontrée par une formulation bornée sur des sources disponibles selon le bien ;
- documenter le rollback et les preuves de production.

### Exclus

- réécrire les 168 articles pour modifier chaque occurrence historique de la marque ;
- recalculer les fiches du Baromètre avec le moteur actuel ;
- modifier le moteur de score de l'application ;
- déposer une marque ou engager une procédure contre un tiers ;
- soumettre une application iOS dans ce lot ;
- publier une réutilisation data.gouv.fr.

## Architecture choisie

`src/data/entity.ts` porte les constantes canoniques et le bloc Organization. `BaseLayout.astro` émet ce bloc sur chaque page. Les autres schémas utilisent uniquement le même `@id` pour leur auteur, créateur, éditeur ou fournisseur.

Les pages institutionnelles sont des routes Astro racine. Elles rendent leurs informations critiques dans le HTML visible. Le JSON-LD complète ce contenu sans ajouter d'assertion absente de la page.

L'ancienne page de formule devient une redirection Cloudflare permanente. Son handle est exclu de `getStaticPaths` et des hubs pour qu'elle ne figure plus dans le sitemap. La règle accentuée historique pointe elle aussi directement vers `/methodologie` afin d'éviter une chaîne de redirections.

## Méthode publiée

Pour un logement résidentiel, la grille source contient 13 sections dont les poids totalisent 100 : prix 18, DPE 12, risques 12, transports 10, commerces 8, environnement 8, urbanisme 7, écoles 5, profil socio-démographique 5, taxe foncière 5, rendement 4, coût d'acquisition 3 et actualités locales 3.

Les terrains, locaux commerciaux, immeubles et parkings utilisent des grilles propres. Une section sans donnée suffisamment autoritative est exclue du total. Les poids des sections conservées sont alors normalisés sur 100. La page doit donc expliquer à la fois le poids source, le poids effectif et la couverture du score.

L'indice de confiance A, B ou C dépend de la précision géographique et de la couverture réussie des enrichissements pertinents. Une classe DPE seulement rapprochée au code postal n'est pas notée comme si elle correspondait avec certitude au logement.

## Risques et contrôles

| Risque | Prévention | Détection | Réponse |
|---|---|---|---|
| nouvelle contradiction avec l'application | méthode copiée depuis le code `origin/main` et version datée | test de contrat sur les 13 poids résidentiels et la repondération | revert du lot et correction de la source avant republication |
| perte SEO de l'ancienne page | 301 unique, exclusion du sitemap, remplacement des liens contrôlés | test redirection et contrôle sitemap/build | revert de la redirection si statut ou cible incorrects |
| données structurées dupliquées ou incohérentes | un seul module canonique et un seul `@id` | tests source plus parsing du build | revert du lot |
| assertion juridique non vérifiée | reprise stricte des mentions légales validées | test des champs visibles et absence de profils inventés | correction immédiate et nouvelle publication |
| confusion Baromètre/moteur courant | encadré visible sur les instantanés historiques | tests du texte visible et des liens de méthode | retrait de la formulation ambiguë |
| régression navigation/mobile | liens ajoutés uniquement au pied de page | build, intégrité des liens et smoke mobile | revert du lot |

Classe de risque : moyenne. Le changement touche des pages publiques et les données structurées globales, sans migration, paiement, compte utilisateur ni donnée personnelle.

## Critères d'acceptation

- `/a-propos` et `/methodologie` sont dans le build, le sitemap et la production avec HTTP 200 ;
- l'organisation canonique porte le nom `Score-Immo`, l'URL officielle, l'identifiant stable et les noms alternatifs ;
- les schémas Article, Dataset, Service et Baromètre principaux référencent `https://score-immo.fr/#organization` ;
- aucune organisation principale nommée `ScoreImmo` sans identifiant canonique ne subsiste dans les gabarits structurés ciblés ;
- la page Méthodologie expose la grille résidentielle exacte, le principe des grilles par catégorie, l'exclusion des données non fiables, la repondération, la confiance et les limites ;
- l'ancienne URL de formule répond en 301 vers `/methodologie` et ne figure pas dans le sitemap ;
- le Baromètre explique qu'il contient des instantanés datés produits avec la grille visible sur chaque fiche ;
- les sources sont cliquables et leur statut public, officiel ou ouvert est décrit sans amalgame ;
- tous les tests, le contrôle de vérité, le build, le parse JSON-LD, l'intégrité des liens et `git diff --check` sont verts ;
- aucun secret, tiret cadratin ou tiret demi-cadratin n'est ajouté aux surfaces publiques modifiées.

## Déploiement et rollback

Le déploiement passe par une PR vers `main`, puis le workflow Cloudflare Pages et IndexNow existant. La version de rollback est `3c480d67080f9045cb1d6e81914feff33828c243`. En cas de statut non 200, schéma JSON invalide, navigation cassée ou redirection incorrecte, annuler le commit de fusion du lot puis attendre et vérifier le nouveau déploiement.

## Décisions ouvertes

Aucune pour ce lot. Le chantier App Store est documenté séparément après la preuve de production.
