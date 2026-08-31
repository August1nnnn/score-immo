# Baromètre et bannière cookies : design de production

Date : 31 août 2026

Propriétaires : Augustin, décision produit ; Codex, implémentation site web

Source initiale : `origin/main` au SHA `7c72c7b4ecfad999894fee2386b1acd467178c49`

Autorité : `GO PROD BAROMÈTRE + COOKIES` reçu le 31 août 2026

## Objectif

Faire du Baromètre Score-Immo une synthèse immédiatement compréhensible, vérifiable et citable, puis rendre le recueil du consentement lisible et compact sur tous les écrans.

La refonte doit préserver les signaux SEO en cours d'observation, la confidentialité du corpus, le comportement fail-closed de l'analytics et l'isolation complète du build iOS.

## Source de vérité et baseline

| Surface | Source de vérité | Preuve au 31 août 2026 | Hors périmètre |
|---|---|---|---|
| Code public | dépôt `August1nnnn/score-immo`, `origin/main` | branche isolée depuis `7c72c7b` | dépôts, worktrees et artefacts iOS |
| Page | `src/pages/barometre/index.astro` et collection `barometre` | 16 fiches en août, 113 fiches au total | moteur de score et contenu source des fiches |
| Consentement | `CookieBanner.astro` et `public/consent.js` | choix partagé, analytics bloqué avant acceptation, conservation 13 mois | changement de finalité ou ajout de traceur |
| Déploiement | `.github/workflows/deploy.yml` | push sur `main`, Cloudflare Pages, IndexNow après succès | déploiement Wrangler manuel |
| Mesure | GSC `sc-domain:score-immo.fr` | données finales au 29 août | promesse de classement ou de trafic |

Baseline locale : 172 tests sur 172, vérité éditoriale verte, 316 pages construites, 12 340 liens internes et 37 redirections vérifiés, zéro vulnérabilité npm.

## Diagnostic confirmé

- la page actuelle répète les trois meilleures fiches dans la liste complète ;
- la première donnée détaillée arrive après un long bloc introductif ;
- aucune distribution de score, comparaison par type, répartition DPE ou couverture régionale n'est visible ;
- la formulation doit décrire un échantillon d'annonces analysées, jamais le marché immobilier français ;
- la bannière cookies live utilise une surface translucide, mesure 960 x 184 px sur desktop et 358 x 274 px sur un viewport mobile 390 x 844 ;
- ses trois actions passent sur deux lignes en mobile et le refus est visuellement moins accessible que l'acceptation.

## Options étudiées

### Option A : retouche CSS uniquement

Risque faible, mais ne résout ni la hiérarchie de l'information, ni la citabilité, ni la duplication des cartes.

### Option B : page analytique statique et interactions progressives

Le HTML contient toute l'information et reste utilisable sans JavaScript. Un script local ajoute recherche, filtres, tri et copie de citation. Des exports mensuels immuables JSON et CSV alimentent le balisage Dataset. Cette option offre le meilleur rapport impact, simplicité et rollback.

### Option C : tableau de bord client dynamique

Plus flexible, mais ajoute une dépendance runtime, un risque de rendu, une complexité d'accessibilité et un coût de maintenance inutiles pour 16 fiches.

Décision : option B.

## Architecture retenue

### Incrément 1 : Baromètre

1. Un helper pur calcule uniquement des agrégats descriptifs d'une édition homogène : médiane, étendue, distribution des scores, types de biens, DPE et nombre de fiches par région.
2. Le premier écran conserve le title, la description, le canonical et le H1 actuels, mais place la conclusion, la taille de l'échantillon, le score moyen, la médiane et les limites avant la ligne de flottaison.
3. Un panneau analytique affiche une distribution accessible, une comparaison maisons et appartements, le DPE de l'échantillon et la couverture régionale. Chaque valeur affiche son `n`.
4. Un explorateur remplace les blocs dupliqués. Toutes les fiches restent présentes dans le HTML ; recherche, filtres et tri constituent une amélioration progressive.
5. Un bloc de citation visible fournit la référence exacte de l'édition, une copie en un clic et deux exports statiques mensuels.
6. Les endpoints `/barometre/editions/YYYY-MM.json` et `.csv` sont produits au build depuis une projection allowlistée. Ils sont publics, CORS, non indexables, hors sitemap et sans PII.
7. Le Dataset visible et JSON-LD partage les mêmes chiffres et expose `identifier`, `version`, `dateModified`, `keywords` et `distribution`. Aucune licence n'est inventée.
8. La FAQ et l'ItemList restent le miroir du contenu visible.

### Incrément 2 : bannière cookies

1. Le comportement de `public/consent.js` ne change pas.
2. La surface devient blanche et opaque, sans dépendance au flou d'arrière-plan.
3. Le texte est raccourci sans changer la finalité, la liberté du choix ou la durée de 13 mois.
4. `Refuser`, `Détails` et `Accepter` occupent une grille unique de trois colonnes de 320 px à 1440 px.
5. Refus et acceptation ont le même niveau, la même hauteur et la même surface cliquable. Chaque action mesure au moins 44 px de haut.
6. Le focus clavier est visible et le composant est nommé comme région de consentement.

## Sécurité, confidentialité et vérité

- aucun appel externe ou cookie supplémentaire ;
- aucune donnée Supabase modifiée ;
- projection d'export explicite, sans spread de l'objet source ;
- aucune adresse exacte, URL d'annonce, identité utilisateur, jeton ou donnée brute ;
- aucun HTML construit à partir de la recherche utilisateur ;
- le filtrage utilise des attributs statiques et `hidden` ;
- aucun axe de score quasi constant n'est présenté comme conclusion comparative ;
- aucun agrégat n'est présenté comme statistique nationale ;
- aucune licence de réutilisation n'est ajoutée sans décision propriétaire.

## Critères d'acceptation observables

### Baromètre

- URL, canonical, title, description et H1 principal inchangés ;
- un H1 unique et une hiérarchie Hn valide ;
- les 16 fiches d'août sont présentes exactement une fois dans l'explorateur ;
- score moyen, médiane, minimum, maximum, DPE, types et régions correspondent aux fichiers source ;
- les contrôles filtrent et trient sans erreur, avec compteur `aria-live` et bouton de réinitialisation ;
- sans JavaScript, les 16 fiches et les faits essentiels restent visibles ;
- les exports JSON et CSV contiennent exactement les 16 projections allowlistées ;
- le CSV échappe correctement guillemets, virgules et retours de ligne ;
- le JSON-LD est valide et ne contient que des faits visibles ;
- aucun débordement horizontal à 320, 390, 768 ou 1440 px ;
- accessibilité, SEO, bonnes pratiques et agentic browsing ne régressent pas ;
- performance laboratoire sans régression matérielle du LCP ou du CLS.

### Cookies

- fond calculé `rgb(255, 255, 255)` et aucun `backdrop-filter` ;
- trois actions sur une seule ligne à 320, 360, 390, 768 et 1440 px ;
- chaque action mesure au moins 44 px de haut ;
- refus et acceptation ont la même hauteur et la même largeur dans leur grille ;
- hauteur maximale ciblée : 220 px à 390 x 844 et 132 px à 1440 x 900 ;
- aucun débordement horizontal, y compris à zoom 200 % ;
- accepter et refuser conservent le contrat existant ;
- le bouton de pied de page rouvre toujours la bannière.

## Risques et rollback

Classe de risque : élevée pour le SEO public, moyenne pour le composant de consentement global.

| Risque | Prévention | Détection | Rollback |
|---|---|---|---|
| perte du ciblage actuel | métadonnées, canonical, URL et H1 conservés | diff HTML, smoke live, GSC J+7/J+14 | revert de l'incrément Baromètre |
| chiffre trompeur | helper homogène testé, `n` et limites visibles | tests fixture plus comparaison au corpus réel | revert du helper et de la page |
| fuite dans les exports | allowlist, tests adversariaux, scan du build | test de clés interdites et inspection finale | retirer les routes puis redéployer |
| interaction inaccessible | HTML complet sans JS, contrôles natifs, tests clavier | audit navigateur et Lighthouse | désactiver le script, conserver le HTML |
| consentement moins accessible | choix symétriques, 44 px, focus visible | mesures multi-viewport et clavier | revert de l'incrément cookies |
| collision avec iOS | worktree site dédié, aucun fichier juridique ou app | audit final des chemins modifiés | arrêter avant push et resynchroniser |

Chaque incrément est un commit et une PR autonomes. Le second ne part en production qu'après smoke test public du premier. Le rollback est le revert du commit de fusion concerné suivi du workflow normal.

## Monitoring

- vérifier Cloudflare, IndexNow, HTTP, canonical, contenu, exports, filtres et consentement après chaque déploiement ;
- re-mesurer GSC les 6, 13 et 27 septembre 2026 avec fenêtres alignées ;
- ne conclure sur aucun effet SEO avant données consolidées.

## Décisions ouvertes

Aucune. La licence des exports reste volontairement absente jusqu'à une future décision explicite.
