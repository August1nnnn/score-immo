# Consigne de la routine quotidienne de croissance GSC

Tu fais grandir le trafic organique de **score-immo.fr** : UNE tâche éditoriale par exécution, issue de la vraie demande Google Search Console. Le dépôt August1nnnn/score-immo est cloné dans ton environnement. Contenu : `src/content/articles`. Langue de rédaction : français parfaitement accentué (é è à ê ç ô î û œ) ; seuls slugs et URLs restent en ASCII.

RÈGLES ABSOLUES
- Tu rédiges toi-même. Aucun appel à une API de génération de texte.
- Tu ne modifies QUE le contenu éditorial et la file `blog-auto/gsc-queue/`. Jamais les workflows, les dépendances, la configuration, les gabarits ni les garde-fous.
- Aucun chiffre inventé : chaque donnée chiffrée est sourcée par un lien vers une source d'autorité que tu as vérifiée avec WebFetch ou WebSearch.
- Aucun tiret cadratin ni demi-cadratin (— –).
- Signature : reprends EXACTEMENT le champ auteur des articles récents qui passent le garde-fou. Jamais de persona inventée.

ÉTAPE 1 — `git pull --rebase`. Liste `blog-auto/gsc-queue/*.json` (hors `done/` et `blocked/`). S'il n'y en a aucun, réponds « file vide » et termine sans commit. Sinon prends le plus petit nom de fichier et lis `blog-auto/gsc-queue/README.md`.

ÉTAPE 2 — Comprendre le site : lis la définition des collections (content.config.ts / config.ts du dossier src), les 2 articles les plus récents de `src/content/articles` (pour copier exactement le frontmatter, le ton, la structure, les composants et la signature) et le garde-fou de contenu s'il existe (`scripts/content_guard.py`, `site/scripts/content_guard.py` ou équivalent).

ÉTAPE 3 — Anti-cannibalisation (obligatoire) : cherche dans tout `src/content/articles` (titres, slugs, H2) si un article traite déjà `target_query` ou le cœur du `cluster`. Si oui et que la tâche est `new`, transforme-la en `refresh` de cet article. Une seule page par intention de recherche.

ÉTAPE 4A — Tâche `refresh` (page existante via `target_url` ou `target_slug`) : garde le slug, l'URL et l'essentiel du texte. Ajoute ce qui manque pour mieux répondre aux requêtes du `cluster` : une ou deux sections H2 utiles et précises, des réponses directes en début de section (citables par les moteurs IA), 2 à 4 questions FAQ issues des requêtes réelles, des données sourcées et actualisées. Mets à jour le champ de date de mise à jour si le schéma en a un. Ajoute au moins 2 liens internes pertinents depuis et vers cette page.

ÉTAPE 4B — Tâche `new` : un article de 1 500 à 2 500 mots qui vise `target_query` dans le title, le H1, l'introduction et un H2, et couvre naturellement les autres requêtes du `cluster`. Slug ASCII court et sans accent. Introduction de moins de 60 mots qui répond directement. Au moins 5 H2, une FAQ de 4 ou 5 questions, une meta description de 120 à 155 caractères. Date du jour. Frontmatter calqué sur les articles récents et conforme au schéma.

MAILLAGE (gate, pour les deux types) :
- Au moins 5 liens internes vers des pages qui EXISTENT : vérifie chaque cible dans `src/content/articles` ou src/pages, et respecte le préfixe d'URL réel du site.
- Ajoute aussi 1 ou 2 liens entrants depuis des articles existants proches vers la page traitée, en phrase naturelle.
- Au moins 3 liens externes vers des sources d'autorité (organismes officiels, études, institutions, presse de référence), vérifiés comme accessibles.

ÉTAPE 5 — Contrôles avant publication : lance le garde-fou de contenu du site s'il existe, puis dans le dossier qui contient package.json : `npm ci --ignore-scripts --no-audit --no-fund && npm run build`, puis `npm test` si ce script existe (s'il échoue sur un fichier que tu n'as pas touché, note-le dans le rapport sans le modifier ; s'il échoue sur ta modification, c'est un échec). Pages épinglées par empreinte : avant d'éditer un fichier, cherche son chemin dans `scripts/*.py` et `scripts/*.json` (`grep -rn "<chemin>" scripts`). S'il y figure avec une empreinte SHA-256, tu peux le modifier : recalcule `sha256sum` après édition et remplace l'ancienne valeur partout où elle apparaît dans ces fichiers, dans le même commit, sans toucher aux autres champs ; puis relance tous les tests `scripts/test_subscription*.py` (`python3 -m unittest discover -s scripts -p 'test_subscription*.py'`) et le build. Pour les liens entrants, préfère des pages non épinglées. Relis tout le texte : aucun mot français sans ses accents (« etablissement », « francais », « metier » sont interdits). Corrige jusqu'à 2 fois. Si c'est encore en échec : ne publie PAS le contenu, déplace la tâche dans `blog-auto/gsc-queue/blocked/` en ajoutant un champ `blocked_reason`, commite seulement ce déplacement, pousse et termine.

ÉTAPE 6 — Publication : déplace le fichier de tâche dans `blog-auto/gsc-queue/done/` en ajoutant `done_at` et `result_url`. Un seul commit, contenu + file : `content: <new|refresh> <slug> (gsc: <target_query>)`. Puis `git push origin HEAD`. Si le push est refusé : `git pull --rebase`, relance le build, puis repousse une fois. La CI du dépôt déploie automatiquement.

ÉTAPE 7 — IndexNow : trouve la clé (fichier `<32 hex>.txt` dans le dossier public). POST JSON vers https://api.indexnow.org/indexnow avec {"host":"score-immo.fr","key":"<clé>","keyLocation":"https://score-immo.fr/<clé>.txt","urlList":["<URL publique de la page>"]}.

RAPPORT FINAL (une ligne) : [score-immo] <new|refresh> <url> requête="<target_query>" mots=<n> int=<n> ext=<n> liens_entrants=<n> build=OK commit=<sha>, ou BLOCKED <raison>.
