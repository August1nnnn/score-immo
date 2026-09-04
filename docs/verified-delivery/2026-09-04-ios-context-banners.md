# Bannières iOS intégrées, 4 septembre 2026

Correction demandée par Augustin : proposer deux choix dans le contenu des pages, « Analyser une annonce » et « Télécharger l’app sur iOS », à la place du popup personnalisé. Source synchronisée : origin/main 1792560 ; worktree et branche codex/ios-context-banners-20260904. Instructions CLAUDE.md et méthode verified-delivery appliquées. Ce lot est préparé localement, sans commit ni publication par l'implémenteur.

Choix retenu : composant statique IOSContextBanner.astro dans le flux du document, avant le pied de page sur les pages utilisant BaseLayout. Sur les articles, le composant remplace le formulaire de fin d'article à l'intérieur de si-article-footer et la bannière globale est désactivée explicitement. Le formulaire de début d'article et la priorité du premier lien éditorial restent en place. ArticleSection.astro est un composant legacy inutilisé, laissé intact.

Les CTA dirigent vers /app avec utm_source=site et utm_medium=ios_banner par défaut ; en fin d'article, les UTM existants blog_end et campaign=handle sont conservés. Le lien Apple utilise IOS_APP_URL sans modification. Les liens du hero, du menu mobile et du footer ainsi que le Smart App Banner natif Safari sont conservés. Aucun script, timer, détection de navigateur, stockage ou overlay n'est ajouté à la bannière. Le composant popup, son helper et ses 11 tests devenus obsolètes sont retirés.

Critères vérifiés : une bannière par page à layout partagé ; placement dans le contenu de fin d'article sans doublon global ; deux destinations exactes ; visibilité desktop/Android et sans JavaScript ; liens accessibles de hauteur minimale 44 px ; aucune régression du formulaire d'analyse de début d'article.

Preuves locales du 4 septembre vers 23:55 Europe/Paris :

- RED : `SCOREIMMO_TEST_DIST=../home-role-tabs-20260904/dist node --test tests/browser/ios-context-banners.test.mjs` sur l'ancien build donne les six échecs attendus liés à l'absence de bannière ; le test du formulaire existant passe.
- GREEN : `node --test tests/browser/ios-context-banners.test.mjs` passe 7/7 sur le nouveau build. Les clics externes sont interceptés dans le navigateur, aucun appel réel vers l'application ou Apple par ces tests.
- `npm test` : 225 réussis, 0 échec, 0 ignoré.
- `npm run build` : 317 pages.
- `npm run test:site-integrity` : 12 387 liens internes et 37 redirections, aucun échec.
- Rendus home et article contrôlés à 320, 390 et 1440 px. Bannière mobile : 288 px de largeur dans un viewport 320 px ; article desktop : 768 px. Aucun débordement horizontal.
- Captures inspectées : /tmp/ios-context-banner-home-320.png et /tmp/ios-context-banner-article-1440.png ; autres captures disponibles avec suffixes 320/390/1440.
- `git diff --check` : aucun problème.

Les sept tests de build sont exécutés par SEO guardrails après compilation, avec Chromium installé par l'étape existante. Aucun secret ou contenu d'article modifié. Risque : régression d'un lien de conversion ou apparition de deux bannières ; couvert par les tests du HTML compilé. Revue indépendante et mise en ligne pilotées par Codex. Rollback : revert du seul commit de ce lot et déploiement via deploy.yml, référence antérieure 1792560. Après publication, vérifier une home, un article standard et un article à priorité du premier lien. L'audit administrateur demandé ensuite n'est pas commencé dans ce lot.
