# File éditoriale GSC (générée par stack-2026/scripts/gsc_keyword_queue.py)

Chaque fichier `<date>-<NN>.json` est UNE tâche issue de la demande réelle Search Console (28 jours).
La routine quotidienne traite le plus petit fichier restant, puis le déplace dans `done/` dans le même commit.

- `type: "refresh"` : une page se positionne déjà (4-20) sur ce groupe de requêtes. Enrichir CETTE page
  (`target_url` ou `target_slug`) : nouvelle section H2, FAQ, chiffres sourcés, sans changer son slug.
  Ne jamais créer une nouvelle URL concurrente.
- `type: "new"` : demande sans page dédiée. Un nouvel article qui vise `target_query` et couvre le `cluster`.
  Avant d'écrire, vérifier qu'aucun article existant ne traite déjà le sujet (sinon transformer en refresh).
- `cluster` : requêtes réelles (impressions, position) à couvrir naturellement dans titres, H2 et FAQ.
