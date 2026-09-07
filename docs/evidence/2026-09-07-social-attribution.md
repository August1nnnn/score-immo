# Attribution des campagnes, 7 septembre 2026

Objectif autorisé par Augustin : améliorer l’identification des sources sociales et publicitaires, sans modifier les budgets ni le paiement.

Source : vitrine August1nnnn/score-immo, origin/main c585693. Worktree isolé propre avant intervention. Application Score-Immo/scoreimmo origin/main 177c7aa : capture d’acquisition et filtrage OAuth déjà présents. Aucun changement app/auth/checkout dans ce lot.

Constat : public/ga4.js supprime toute query de page_location sans transmettre les champs campagne. GA4 affichait 332 sessions du 10 août au 6 septembre, dont 3 meta/paid_social; revenu attribué à accounts.google.com. Ce constat ne prouve pas une perte unique de toutes les visites manquantes (consentement et délais peuvent intervenir).

Plan :
1. Reproduction par tests isolés GA4 (5 échecs attendus avant correction).
2. Transmettre les UTM validés via campaign_source/medium/name/content/term seulement avec consentement audience, et les seuls gclid/gbraid/wbraid courants via page_location avec consentement publicitaire. Ne jamais transmettre email, annonce ou paramètres arbitraires.
3. Exclure les référents techniques OAuth/Stripe/Supabase côté vitrine; vérifier les réglages GA4 avant toute modification.
4. Tests ciblés, suite, build, revue indépendante, PR puis vérification publique.

Risque moyen : attribution erronée ou fuite de query. Tests positifs/négatifs, aucune collecte supplémentaire sans consentement. Rollback : revert du commit de ce lot via PR puis workflow deploy.yml, si query privée fuit ou suivi/chargement casse. Propriétaire Codex/Augustin. Pas de mutation de données historiques.

Acceptation : campagne sociale visible dans page_view et config GA4; IDs Google absents sans accord publicitaire; aucun page_view sans accord audience; consentement tardif sans doublon; référents OAuth ignorés; navigation vitrine vers app conservée.

Limites : chiffres historiques non reconstruits; achat réel non effectué pour test; attribution installation iOS distincte, pas de nouveau SDK ni tracking natif introduit.

Mesure : comparer GA4 source/support et événements clés à partir du déploiement après 48 heures, puis sept jours. Checkpoint conseillé au 10 et 15 septembre, pas de tâche automatique créée.

Résultats locaux : 7 régressions dédiées passent (5 échecs initiaux, puis 2 nouveaux échecs reproduits sur transitions de consentement). Suite finale 265/265; build 319 pages; intégrité 12 794 liens internes et 37 redirections validée. Revue indépendante : défauts de configuration périmée corrigés, aucun point bloquant restant.

GA4 : liste initiale des référents à ignorer vide. Règle ajoutée par expression régulière exacte : `^(accounts\.google\.com|appleid\.apple\.com|checkout\.stripe\.com|billing\.stripe\.com|afvtxiklivnmakqixkml\.supabase\.co)$`. Retour arrière : supprimer cette seule règle dans Flux Web > Paramètres balise > Référents à ignorer. Les moteurs Google et les réseaux sociaux restent comptabilisés.

Liens de référence pour les profils et futures descriptions, toujours vers la home :
- YouTube : https://score-immo.fr/?utm_source=youtube&utm_medium=organic_social&utm_campaign=profil
- Facebook : https://score-immo.fr/?utm_source=facebook&utm_medium=organic_social&utm_campaign=profil
- Instagram : https://score-immo.fr/?utm_source=instagram&utm_medium=organic_social&utm_campaign=profil
- TikTok : https://score-immo.fr/?utm_source=tiktok&utm_medium=organic_social&utm_campaign=profil
Pour une vidéo : utm_campaign=videos_septembre_2026 et utm_content=video_01 (numéro exact). Aucun lien ancien prétendu modifié par ce document.
