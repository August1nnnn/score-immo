# ScoreImmo — Blog Auto v2 (queue-only, 0 € Anthropic)

Pipeline de publication SEO/GEO du blog ScoreImmo (Astro + CF Pages).

**Changement vs v1** : la génération de contenu ne passe **plus** par l'API Anthropic
payante (qui tombait en `HTTP 400 "credit balance too low"`). Elle est faite par une
**Routine claude.ai** (incluse dans l'abo Max), exactement comme commandeici v2 et karmastro.

## Architecture

```
blog-auto/articles.json (plan éditorial : index, title, blog, category, scheduled_datetime…)
  → blog-auto/publish.py  (GH Actions, cron, mode queue-only)
      • prend le prochain article échu non publié
      • pré-récupère une image Unsplash (clé Unsplash, pas Anthropic)
      • écrit blog-auto/queue/{index}.json  (spec + instructions + schéma)
      • commit + push
        → Routine claude.ai (abo Max) poll blog-auto/queue/*.json
            • génère le JSON article selon prompts/article-scoreimmo.md
            • écrit src/content/articles/{blog}/{slug}.json
            • passe l'entrée published:true dans articles.json
            • supprime le spec queue
            • commit + push → deploy.yml → CF Pages
```

## Fichiers

- `articles.json` — plan éditorial (schéma inchangé : `index, title, keywords, blog,
  category, author, author_handle, scheduled_date, scheduled_datetime, published, slug`).
- `publish.py` — **queue-only**. Aucun appel Claude/Anthropic. Stdlib seule (+ Unsplash).
- `prompts/article-scoreimmo.md` — **contrat de génération** (persona, standards, schéma JSON).
- `queue/{index}.json` — specs consommés par la Routine claude.ai.
- `.github/workflows/blog-auto.yml` — cron `17 6 / 43 7 / 29 8 * * 1-5` UTC, runner self-hosted.

## Routine claude.ai à configurer (action user)

Créer une Routine (claude.ai → Settings → Routines), pattern repris de karmastro /
commandeici v2. Config :

- **Cron** : `0 7 * * 1-5` (07h00 UTC, après les fenêtres du workflow GH qui posent les specs).
- **Accès repo** : `August1nnnn/score-immo` (lecture/écriture, mêmes droits que la routine commandeici).
- **Prompt de la routine** :

  > Tu maintiens le blog ScoreImmo. Lis le repo `August1nnnn/score-immo`, dossier
  > `blog-auto/queue/`. Pour **chaque** fichier `*.json` présent :
  > 1. Lis le spec et `blog-auto/prompts/article-scoreimmo.md`.
  > 2. Génère l'article en suivant STRICTEMENT ce contrat (Léa Moreau, 3500+ mots,
  >    HTML pur, TL;DR 4 bullets, FAQ 5Q, 5+ sources officielles FR, 5+ liens internes,
  >    1+ CTA app.score-immo.fr, **zéro tiret cadratin**, **accents FR parfaits**,
  >    aucune fabrication de chiffre YMYL).
  > 3. Écris le JSON dans `output_path` (schéma dans le contrat), en recopiant le champ
  >    `image` du spec tel quel.
  > 4. Passe l'entrée `index` correspondante à `published:true` (+ `published_at`) dans
  >    `blog-auto/articles.json`.
  > 5. Supprime le spec `blog-auto/queue/{index}.json`.
  > 6. Commit + push sur `main` (message `chore(blog): publish <slug>`).
  > Si la queue est vide, ne fais rien.

## Réamorcer / réalimenter le plan

Ajouter des entrées dans `articles.json` (champs ci-dessus, `published:false`, slug auto).
Le `scheduled_datetime` (passé ou échu) déclenche la mise en queue par `publish.py`.

## Pourquoi v2

- v1 appelait `api.anthropic.com` → **HTTP 400 "credit balance too low"** = compte API à sec.
- v2 = génération sur l'abo Max via Routine → 0 € API, même qualité, même schéma de sortie.
- Alternative si on recharge l'API un jour : restaurer l'ancien `publish.py` (git history).
