# Score-Immo - Séparation et vérité du cluster négociation

Date : 2026-08-28

Propriétaire : Codex

Base Git : `29c2f86ee0eca70f1934269830bd2256f7fdeb42`

Autorité : GO PROD explicite renouvelé par Augustin

## Pourquoi ce sous-lot existe

La page procédurale `/blogs/guides/negocier-prix-bien-immobilier-guide-complet` obtient 33 clics, 3 435 impressions, 0,96 % de CTR et une position moyenne 7,15 sur la fenêtre GSC courante, contre 47 clics, 3 666 impressions, 1,28 % de CTR et une position 7,36 sur la fenêtre précédente. La position est stable et le CTR recule.

Son title a été changé le 17 août 2026. Au moment de la décision initiale, neuf jours de données seulement étaient disponibles. Le sous-lot conserve donc exactement ce title, sa meta description, l'URL, la canonical et l'identifiant.

La page benchmark `/blogs/guides/marge-negociation-immobilier-2026` obtient 5 clics et 355 impressions à la position 4,35, contre 6 clics et 170 impressions à la position 4,28. Aucune requête accessible dans GSC ne présentait simultanément les deux URL. Une cannibalisation n'est donc pas affirmée comme fait. En revanche, les contenus se chevauchaient et plusieurs statistiques étaient non démontrées.

Le dernier export Bing valide, arrêté au 15 août 2026, contient des requêtes de négociation. La clé actuelle reste refusée avec `InvalidApiKey`, donc aucune donnée Bing plus récente n'est annoncée.

## Décision d'intention

| URL | Intention propriétaire | Décision metadata |
|---|---|---|
| `/marge-negociation-immobilier-2026` | Benchmark daté, taux par zone et type, périmètre et limites | Corriger le title non démontré `5 à 10% selon la région` par le fait exact `5,1 % au T1` |
| `/negocier-prix-bien-immobilier-guide-complet` | Procédure : budget, comparables, devis, offre, contre-proposition, financement | Conserver le title et l'extrait du 17 août pour ne pas casser la fenêtre de mesure |

Les deux pages se relient avec des ancres descriptives. La première ne devient pas un guide de tactiques et la seconde ne duplique pas le tableau des taux.

## Source chiffrée retenue

Le bilan Laforêt du T1 2026, publié à partir des transactions de ses 720 agences, indique :

- 5,1 % au niveau national ;
- 3,4 % à Paris ;
- 5,1 % en Île-de-France ;
- 5,4 % en régions ;
- 5,7 % pour les maisons ;
- 4,1 % pour les appartements ;
- 8 transactions sur 10 négociées dans le réseau ;
- 103 jours de délai moyen de vente.

Chaque reprise précise qu'il s'agit d'un benchmark du réseau Laforêt, pas du recensement exhaustif de toutes les ventes françaises. La preuve structurée est conservée dans `docs/evidence/2026-08-28-negotiation-cluster-sources.json`.

## Frontières de donnée

- DVF contient le prix de mutation, mais pas le prix initial de l'annonce. La base ne calcule donc pas la remise négociée.
- Les comparables DVF aident à construire une fourchette, mais doivent être corrigés des différences de type, surface, emplacement, état et dépendances.
- La valeur verte des Notaires compare des prix de transaction selon la classe énergétique. Elle ne mesure pas une négociation entre annonce et acte.
- L'ancienneté d'une annonce est un signal de questionnement, pas la preuve d'un prix excessif ou d'une urgence du vendeur.
- Un DPE, un procès-verbal ou un diagnostic devient un argument seulement après lecture du document et, lorsque nécessaire, chiffrage par devis.
- Une offre d'achat peut engager son auteur. Aucune somme ne doit être versée au stade de l'offre.
- Un accord de principe bancaire n'est pas une offre de prêt ferme.

## Assertions retirées

Le contenu ne doit pas réintroduire sans preuve définie : remise moyenne de 10 % dans l'ancien, 68 % de biens surévalués, probabilités de succès, barème selon l'ancienneté, citation de `Maître Dubois`, 78 % de transactions avec agent, analyse Score-Immo de 15 000 transactions, marge de 5,2 % attribuée à DVF, décote DPE automatique de 10 à 20 %, baisse nationale de 4 % ou échelle automatique de contre-proposition.

## Preuve TDD et vérification locale

- Test ciblé initial : 0 réussite, 4 échecs contre les contenus antérieurs.
- Test ciblé final : 4 tests sur 4 réussis.
- `npm test` : 102 tests sur 102 réussis.
- `npm run test:content-truth` : réussi.
- `npm run build` : 297 pages construites.
- `npm run test:site-integrity` : 297 HTML, 10 976 liens internes, 34 redirections, réussi.
- HTML benchmark : title factuel, canonical inchangée, un H1, cinq FAQ, quatre sources exactes, deux analyseurs avec la campagne de l'article et un lien vers le guide procédural.
- HTML procédural : title et meta description conservés, canonical inchangée, un H1, cinq FAQ, six sources exactes, deux analyseurs avec la campagne de l'article et un lien vers le benchmark.
- Aucun ancien chiffre retiré ni tiret cadratin ou demi-cadratin dans les deux pages construites.
- `git diff --check` : réussi.

## Gates après déploiement

- PR et garde-fous verts.
- Garde-fous `main`, Cloudflare et IndexNow verts.
- Deux URL live en HTTP 200 et indexables.
- Title procédural inchangé et title benchmark exact.
- Canonical et H1 conformes.
- Table Laforêt et limites DVF visibles.
- Cinq FAQ, sources spécifiques, deux analyseurs et campagnes exactes sur chaque page.
- Aucune assertion retirée.

## Mesure après livraison

- Ne pas modifier à nouveau le title procédural avant une fenêtre GSC complète de 28 jours après le 17 août.
- Comparer les mêmes deux fenêtres GSC page par page et requête par requête.
- Rafraîchir Bing uniquement après régénération de la clé ou OAuth 2.0.
- Traiter la cannibalisation comme hypothèse tant qu'aucune requête ne montre les deux URL en concurrence.

## Retour arrière

Un revert du commit de livraison restaure les deux contenus et l'ancienne règle de maillage. Il n'existe aucune migration, aucun secret, aucune donnée client et aucune mutation financière dans ce sous-lot.
