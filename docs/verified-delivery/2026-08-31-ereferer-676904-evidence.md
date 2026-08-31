# Preuve de livraison, eReferer 676904

## Identité du lot

- Date : 31 août 2026.
- Branche : `codex/ereferer-676904-20260831`.
- Base initiale : `origin/main` au SHA `7c72c7b`.
- URL cible :
  `https://score-immo.fr/blogs/guides/promesse-vente-vs-contrat-vente-suisse`.
- Rollback : revert du commit de publication, puis contrôle du redéploiement.

## Contrat capturé

- Proposition eReferer : `676904`.
- Titre : `Promesse de vente vs contrat de vente en Suisse : différences et
  engagements légaux`.
- Ancre : `les appartements en vente chez Comptoir immobilier à Montreux`.
- Destination :
  `https://comptoir-immo.ch/vente/appartement/Vaud/Montreux/`.
- Montant affiché : 8,90 euros.
- Brouillon reçu : 1 662 mots, aucune image et un lien.

## TDD, contenu et image

- RED : le test ciblé échoue sur `the article must exist` avant création.
- GREEN : `node --test tests/ereferer-676904-content.test.mjs`, 1/1.
- Article final : 2 374 mots calculés sur le texte HTML visible.
- Maillage : 6 liens internes éditoriaux, chacun distinguant explicitement le
  droit français du droit suisse lorsque nécessaire.
- Liens externes éditoriaux : 1 lien partenaire et 2 sources officielles.
- Lien partenaire : premier lien du corps, ancre et destination exactes,
  `rel="noopener"`, sans valeur `sponsored`, conformément au contrat eReferer
  actif déjà appliqué au lot 676824.
- FAQ : 6 questions visibles et 6 entrées `FAQPage`.
- Illustration : génération originale par l'outil imagegen intégré, réunion
  immobilière chez un notaire, sans texte, marque, drapeau ni document lisible.
- Fichier final : WebP local, 1200 x 630 px, 78 Ko, SHA-256
  `b438e10318c530dae31ec8572e76baac3538da918ab9ece30e71df882018dd88`.
- Texte alternatif : `Acheteurs et notaire comparant une promesse et un contrat
  de vente immobilière en Suisse`.

## Contrôles locaux

| Contrôle | Résultat |
|---|---|
| `npm test` | 173/173 tests verts |
| `npm run test:content-truth` | vert |
| `npm run build` | 317 pages construites |
| `npm run test:site-integrity` | 317 HTML, 12 380 liens internes, 37 redirections, vert |
| `python3 scripts/audit_standards.py` | 317 pages, 0 défaut dans toutes les catégories |
| contrôle HTML ciblé | H1, canonical, indexabilité, image, 1 lien partenaire, 2 citations, Article, FAQPage, sitemap, vert |
| destinations externes | 3/3 en HTTP 200 |
| `git diff --check` | vert |

## Contrôle navigateur local

- Desktop : viewport observé 1920 x 1027, document et article sans débordement,
  image complète 1200 x 630, tableau contenu dans les 768 px du corps.
- Mobile : émulation 390 x 844, largeur document 390 px, aucun débordement,
  image affichée à 358 px, tableau de 358 px lisible sur trois colonnes.
- Lien : visible, premier lien du corps, texte, destination et `rel` exacts.
- La prévisualisation locale tente aussi de précharger l'image sur le domaine de
  production à cause du canonical absolu du gabarit existant. Cette requête est
  logiquement refusée tant que l'image n'existe pas en production ; l'image
  locale réellement affichée charge correctement. Le contrôle live doit confirmer
  la disparition de ce signal après déploiement.

## Jalons externes

- Le lien partenaire, Fedlex et la page officielle vaudoise répondent HTTP 200.
- L'action eReferer `Accepter` a ouvert le formulaire demandant l'URL publique.
- Barrière respectée : aucune URL n'est transmise avant le déploiement et le
  contrôle de production.

## Publication et production

- Commit d'artefact : `e881d53d9dd391a84e13833391f47050ff289dfd`.
- PR : `#16`, fusionnée le 31 août 2026.
- Commit de fusion : `6d3e4aa7d7f4c363e8db570004da779470df875f`.
- Garde-fous SEO `33402252488` : succès sur le SHA de fusion.
- Déploiement Cloudflare Pages `33402252454` : succès en 1 min 24 s.
- Étapes de build, validation des routes, déploiement, collecte des URL et
  notification IndexNow : succès.

## Vérification publique

Vérifiée le 31 août 2026 après le déploiement :

- page, image et sitemap : HTTP 200 ;
- page : 45 620 octets, image WebP : 79 796 octets ;
- canonical exact, robots `index, follow`, un H1 ;
- image complète de 1200 x 630 px ;
- lien partenaire unique, premier lien du corps, ancre, destination et
  `rel="noopener"` exacts ;
- Article avec `wordCount` 2 374 et deux citations ;
- FAQPage avec six questions ;
- URL présente dans le sitemap ;
- desktop 1440 x 900 et mobile 390 x 844 sans débordement ;
- tableau contenu dans le corps sur les deux viewports ;
- aucun message d'erreur, avertissement ou issue dans la console live.

## Clôture eReferer

- POST `/bo/exchange-site-proposals-validate` : HTTP 200.
- Réponse : `result=success`, proposition `676904`, publication validée.
- Gain crédité : 8,90 euros ; solde observé de 46,52 à 55,42 euros.
- Onglet `À publier` : aucun résultat après rechargement.
- Onglet `Terminés` : URL exacte affichée, rédaction `par le webmaster`, date
  `31/08/2026`, prix `8.9€`.

## État final

`PROD_VERIFIED` pour la page publique et `VALIDÉE` dans eReferer. L'effet SEO
ou commercial au-delà du crédit contractuel n'est pas encore mesuré.
