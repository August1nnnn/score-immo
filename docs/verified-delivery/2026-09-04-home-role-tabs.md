# Onglets Acheteur, Vendeur et Agent, correctif du 4 septembre 2026

Périmètre autorisé : restaurer les onglets de la section « Un marché où tout le monde avance à l'aveugle ». Travail local isolé, sans commit ni publication par l'implémenteur. Source synchronisée : origin/main 3b103bc, branche codex/home-role-tabs-20260904. Instructions : CLAUDE.md et méthode verified-delivery.

Reproduction publique sur https://score-immo.fr/ : après refus des cookies, cliquer Vendeur puis Agent immobilier. Les deux contenus restent cachés, Acheteur reste visible et le navigateur relève deux erreurs `switchProblemTab is not defined`. Les argumentaires des trois rôles sont déjà présents dans Problem.astro.

Cause : les attributs onclick attendent une fonction globale alors que le script Astro appartient à un module. Choix : attacher directement les événements dans le composant, sans exposer de fonction globale. Les contenus, cartes et couleurs existants sont conservés. Onglets associés aux panneaux via ARIA, un onglet sélectionné/focalisable à la fois ; flèches gauche/droite et Home/End ; cibles tactiles 44 px et respect de la réduction des animations.

Fichiers : src/components/sections/Problem.astro, tests/home-role-tabs.test.mjs. Les tests chargent le HTML statique du composant et exécutent son script réel comme module. Trois tests RED observés avant correction, trois GREEN ensuite. L'intégration Astro compilée est contrôlée séparément dans le navigateur.

Preuves locales du 4 septembre 2026, vers 23:42 Europe/Paris :

- `node --test tests/home-role-tabs.test.mjs` : 3 tests réussis (clics à 320/1440 px, panneaux exclusifs, état ARIA, navigation clavier).
- `npm test` : 236 réussis, aucun échec ni test ignoré.
- `npm run build` : 317 pages produites.
- `npm run test:site-integrity` : 12 387 liens internes, 37 redirections, aucun échec.
- Navigateur sur dist servi localement : 320, 390 et 1440 px, trois rôles cliquables, clavier fonctionnel, aucun débordement horizontal ni erreur JavaScript.
- Captures inspectées : /tmp/home-role-tabs-320.png, /tmp/home-role-tabs-390.png, /tmp/home-role-tabs-1440.png.
- `git diff --check` : aucune erreur.

Risque limité au composant d'accueil ; aucune donnée personnelle, API ou mesure supplémentaire. Rollback si les onglets régressent après publication : revenir sur le seul commit du correctif, puis laisser deploy.yml republier. Référence antérieure : 3b103bc. Codex pilote la revue indépendante, l'intégration et le contrôle public des trois onglets après déploiement. Aucun résultat de production corrigée n'est revendiqué dans cette note.
