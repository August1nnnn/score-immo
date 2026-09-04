# Présence visible du site dans l'admin

Demande autorisée après audit du5septembre : inclure site et app dans un live réellement actualisé. Source site main6924032 ; backend app migrations20260905003000/003100/003200 testées séparément. Ce lot ajoute un heartbeat distinct des pages vues, toutes30s, visible et consentement accepté seulement. Session pseudonyme existante réutilisée, path public borné240, device grossier, aucune identité utilisateur ni contenu de formulaire.

L'endpoint exige Origin canonique, cookie de consentement, JSON et schéma exact. Il impose source marketing et utilise la clé serveur existante ; aucun accès direct aux tables côtéclient. Refus consentement/masquage/pagehide arrêtent et annulent les requêtes. Le live admin expire les données en90s ; la table éphémère est purgée opportunistement au-delà1jour. Les heartbeats ne modifient pas le nombre de pages vues.

RED/GREEN API et VM client,233tests site verts, build317pages, intégrité12387liens. Smoke navigateur réel du build : premierheartbeat, secondaprès30s, aucunhidden60s, reprisevisible puis arrêtrefus60s, zéroerreurJS, appelsinterceptés. Revue indépendante favorable. Déploiement backend d'abord, puis workflow GitHub site ; après publication canari depuis navigateur consenti, vérification lecture RPCadmin et expiration. BannièresiOS et onglets préservés.

Rollback : revert du commit site et workflowdeploy.yml ; backendadditif peut resterinactif. Aucun changement de consentement imposé aux visiteurs. Le compteur représente des sessions activesvisibles, pas un nombre garanti de personnes physiques.
