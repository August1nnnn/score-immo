# Preuve de livraison, eReferer 676824

## Identité du lot

- Date : 31 août 2026.
- Branche : `codex/ereferer-676824-20260831`.
- Base initiale : `origin/main` au SHA `c6e29d2`.
- URL cible : `https://score-immo.fr/blogs/guides/faut-il-etre-en-cdi-pour-investir-immobilier`.
- Rollback : revert du commit de publication, puis contrôle du redéploiement.

## Contrat capturé

- Proposition eReferer : `676824`.
- Titre : `Faut-il être en CDI pour investir dans l'immobilier ?`.
- Ancre : `obtenir un prêt immobilier sans CDI`.
- Destination :
  `https://www.investir-epargne.fr/credit-immobilier-sans-cdi-quelles-alternatives-pour-les-non-salaries/`.
- Montant affiché : 8,90 euros.
- Exigences du site : au moins 300 mots, 1 à 3 images, au plus 3 liens
  externes dans le contenu éditorial.

## TDD et contenu

- RED : le test ciblé échoue sur `the article must exist` avant création.
- GREEN : `node --test tests/ereferer-676824-content.test.mjs`, 1/1.
- Article : 1 896 mots calculés sur le texte HTML visible.
- Maillage : 6 liens internes éditoriaux.
- Liens externes éditoriaux : 1 lien partenaire et 2 sources officielles.
- Partenariat : mention visible et `rel="sponsored noopener"`.
- FAQ : 5 questions visibles, reprises dans `FAQPage`.
- Illustration : WebP local, 1200 x 630 px, 51 Ko, texte alternatif contrôlé
  après inspection visuelle.

## Contrôles locaux du 31 août 2026

| Contrôle | Résultat |
|---|---|
| `npm test` | 172/172 tests verts |
| `npm run test:content-truth` | vert |
| `npm run build` | 316 pages construites |
| `npm run test:site-integrity` | 316 HTML, 12 340 liens internes, 37 redirections, vert |
| `python3 scripts/audit_standards.py` | 0 défaut dans toutes les catégories |
| `git diff --check` | vert |

Le HTML construit contient un H1, un canonical exact, les schémas Organization,
Article, BreadcrumbList, WebPage et FAQPage, le `wordCount` 1896, deux citations
officielles et l'URL dans le sitemap. Il ne contient pas de `noindex`.

## Contrôle navigateur local

Chromium headless a chargé la page en HTTP 200 à 1440 x 900 et 390 x 844.
Dans les deux vues : largeur du document égale au viewport, image complète,
lien partenaire visible avec l'ancre et le `rel` exacts, mention de transparence
visible, aucune erreur console ou page.

## Jalons externes

- Proposition acceptée sur eReferer le 31 août 2026 via l'action exacte de la
  ligne 676824 ; réponse HTTP 200 de
  `/bo/exchange-site-proposals-accept`.
- État obtenu : formulaire `Valider la publication de l'article` demandant
  l'URL publique.
- Barrière respectée : aucune URL n'est transmise avant le déploiement et le
  contrôle HTTP de production.

La preuve finale du SHA fusionné, du workflow, du HTML live et du statut
eReferer est conservée dans la note projet Obsidian après observation de la
production.
