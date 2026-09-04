# Lancement iOS, version 2, 4 septembre 2026

Propriétaire : Codex. Demande : ajouter les liens de téléchargement sur le site et annoncer la sortie aux 50 dernières adresses ayant réalisé un rapport.

Source : August1nnnn/score-immo, origin/main bf89ccf, worktree isolé propre. Application Apple : fr.scoreimmo.app, identifiant 6806366573. Le 4 septembre à 21:12 UTC, la fiche FR renvoie 404 et iTunes lookup renvoie resultCount=0. Publication des liens conditionnée à une fiche publique vérifiable ; aucune redirection vers l'homonyme 6760734770.

Livrable site : lien secondaire sous le formulaire d'accueil, lien menu mobile et pied de page global, Smart App Banner Safari. Conserver la charte, les CTA d'analyse et les tarifs existants. URL centralisée. Pas de redirection forcée ni nouveau traceur. Une détection locale iOS est utilisée uniquement par le nouveau prompt.

Fichiers : src/data/ios-app.ts, src/components/AppStoreLink.astro, src/components/sections/Hero.astro, src/components/Header.astro, src/components/Footer.astro, src/layouts/BaseLayout.astro.

Validation : baseline npm test ; npm test, npm run build et npm run test:site-integrity après modification ; contrôler HTML produit et rendu mobile/desktop. Revue indépendante avant livraison. Autorisation actualisée : Augustin demande maintenant explicitement la mise en ligne des petits popups iOS et l’envoi du mail au lot. Publication site autorisée via deploy.yml après vérifications. Les exclusions mail et preuves d’éligibilité restent contrôlées séparément. Recontrôler Apple avant publication, site public après déploiement.

Rollback : retirer les seuls ajouts de ce lot par revert du commit, puis deploy.yml ; référence initiale bf89ccf. Déclencheur : lien invalide, débordement mobile, régression du formulaire.

Mail : produire aperçu HTML et texte, sélectionner jusqu'à 50 e-mails distincts classés par dernier rapport abouti, vérifier suppressions et préférences. Données personnelles hors Git dans répertoire privé 0700, fichiers 0600. Aucun envoi avant contrôle du lot, du désabonnement, du lien Apple et de l'autorisation exacte par destinataire prévue par AGENTS.md. Aucun cron installé dans cette préparation. Le mail ne doit pas présenter un téléchargement gratuit comme des rapports gratuits.

## Résultat de préparation

Le lien exact fourni par Augustin est https://apps.apple.com/fr/app/score-immo-analyse-immobili%C3%A8re/id6806366573. Fiche publique HTTP 200 avec titre et développeur corrects. URL intégrée au site et au mail.

222 tests passent ; build Astro 7.2.0 de 317 pages ; 12 387 liens internes vérifiés ; contrôle géométrique de 18 rendus sans débordement. Deux points de revue indépendante corrigés : nom accessible des liens et contraste du mail. Dossier privé complet hors Git : /Users/lestoilettesdeminette/scoreimmo-deliverables/ios-launch-20260904/README.md.

50 adresses uniques extraites, 3 désabonnées, 0 éligible selon les préférences marketing enregistrées. Zéro envoi, zéro cron, zéro publication. Le mail est un brouillon avec désabonnement par réponse ; les liens personnels signés et le one-click sont un prérequis de toute version d'envoi. Autorisation exacte par adresse encore absente.

## Extension popup et mise en ligne autorisée

Invitation compacte non modale iPhone/iPad, y compris iPadOS Macintosh tactile. Safari iOS utilise la Smart App Banner native existante ; les autres navigateurs iOS reçoivent un prompt intégré. Attendre 8 secondes et l’absence de saisie, de menu ouvert et de panneau cookies ; fermeture par bouton et Échap, exclusion 7 jours, au plus une apparition par session. Stockage bloqué : aucune erreur applicative. Aucun focus capturé, aucun scroll bloqué.

Tests : logique ciblage/délai/stockage/fermeture en RED puis GREEN ; tests de comportement navigateur, géométrie 320/390 et desktop, absence Android et Safari (custom), bannière native dans HTML. Build et suite sur artifact final. Revue indépendante, PR, checks CI puis fusion et déploiement normal. Vérifications publiques des liens et du script final.

Audience : les 47 sans opposition n’ont aucune ligne de préférences ; les 3 lignes existantes sont désabonnées. Ne pas confondre absence d’opt-in avec retrait explicite. Ne pas écrire de consentement à la place des utilisateurs. Ne pas remplacer les 3 exclus par des adresses plus anciennes sans demande. Le contrôle d’accord externe est demandé à Augustin pendant la livraison du site.

## Vérification finale popup

233/233 tests passent dont 11 scénarios navigateur ; build Astro 7.2.0 de 317 pages, intégrité 12 387 liens, géométrie 18 rendus sans débordement. Revue indépendante corrigée : Chromium installé avant les tests dans les deux workflows qui les exécutent (SEO et Baromètre).

Augustin confirme explicitement les accords préexistants des 47 adresses non désabonnées, non historisés en base. Cette attestation est conservée dans le dossier privé du lot sans inventer de date de consentement ni réactiver les 3 désabonnés. La demande actuelle autorise l’envoi ponctuel au lot préparé après exclusions ; elle ne crée aucune autorisation permanente pour d’autres campagnes.
