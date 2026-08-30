# Visibilité durable et Baromètre Score-Immo, 30 août 2026

> Avenant du 30 août 2026 : une décision utilisateur postérieure remplace la
> synchronisation par PR par une synchronisation automatique après consentement
> explicite dans l'app. Les mêmes contrôles de contenu, build, intégrité et
> parité restent fail-closed avant tout commit automatisé, et le déploiement
> passe par le workflow existant. Les formulations conservatrices plus bas sont
> la trace du design initial.

## Mission

Rendre le Baromètre public frais, reproductible, honnête sur son échantillon et utile au parcours d'analyse d'annonce, puis corriger les incohérences éditoriales qui affaiblissent la confiance dans l'écosystème Score-Immo.

Le lot doit préserver le modèle paid-first, les URL existantes, les signaux SEO encore en observation et la séparation avec les travaux App Store.

## Autorité et sources de vérité

Le `ok go` d'Augustin du 30 août 2026 autorise les modifications locales, la PR, le déploiement du site, la synchronisation read-only du Baromètre et la publication du corpus de test conforme décrit ci-dessous.

| Surface | Source retenue | Preuve au 30 août 2026 | Exclusions |
|---|---|---|---|
| Site public | `August1nnnn/score-immo`, `origin/main` au SHA `597088e7755247d007e043a0d00fa4eb30dba9fa` | worktree neuf, 111 tests verts, contrôle de vérité vert, build de 298 pages et 11 709 liens verts | worktree App Store juridique et ses fichiers modifiés |
| Données publiées | `public.barometre_reports` avec `publie=true` et `source_report_id` non nul | 101 lignes réelles de juin, dont 4 géographies déjà rejetées par le site, soit 97 fiches statiques | huit anciennes lignes seed sans rapport source |
| Candidats août | `public.reports` | 15 rapports `test`, `success`, complets, non supprimés et rattachés à l'unique compte administrateur | cinq rapports `buy`, rapports échoués/partiels et tout rapport utilisateur sans opt-in |
| Consentement futur | `reports.barometre_optin=true` | champ réel du schéma applicatif | aucun consentement implicite ou reconstruit |
| Mesure | GSC `sc-domain:score-immo.fr` | 1-27 août : 268 clics, 26 657 impressions, CTR 1,005 %, position 13,90 | aucun effet SEO futur présumé |
| Déploiement | `.github/workflows/deploy.yml` après fusion dans `main` | contrat du dépôt | aucun déploiement Wrangler manuel |

## Baseline et cause racine

- Le hub `/barometre` est indexé, canonicalisé et recrawlé par Google le 30 août 2026.
- Il reçoit 1 clic pour 184 impressions sur les 27 jours disponibles.
- Le HTML, le Dataset et les fiches exposent juin 2026 comme dernière édition.
- Le script applicatif mensuel est hardcodé sur `2026-06`.
- Le générateur statique existe, mais aucun workflow ne le synchronise.
- Quatre lignes invalides restent publiées en base et rendent le générateur actuel inutilisable, même si elles sont absentes du site. La fiche réelle de Cayenne possède en plus une région `France` en base alors que son instantané statique a déjà été corrigé en `Guyane` : elle doit être réparée, pas retirée.
- Les fiches de juin utilisent cinq sections historiques ; les rapports d'août utilisent la grille résidentielle courante de treize sections. Une moyenne qui mélange silencieusement les deux méthodes serait trompeuse.

## Périmètre

### Inclus

- rendre la curation mensuelle paramétrable, déterministe, idempotente et `dry-run` par défaut ;
- n'accepter que les rapports de test administrateur ou les rapports explicitement opt-in ;
- publier les 15 rapports de test administrateur complets d'août sans exposer adresse, URL, identifiant utilisateur ou donnée brute ;
- rendre non publiées les quatre lignes à géographie invalide déjà exclues du site ;
- corriger de façon ciblée la région de Cayenne en `Guyane`, avec contrôle du code postal `97300` ;
- synchroniser les JSON statiques depuis la vue publique avec une clé publishable dédiée ;
- ajouter un workflow quotidien qui ouvre ou met à jour une PR, sans fusion
  automatique, et contrôle la parité des URL utilisées par l'app ;
- afficher les statistiques de la dernière édition sans les mélanger aux archives ;
- afficher cinq sections sur les fiches historiques et treize sections sur les fiches courantes ;
- repositionner les hubs régionaux sur les annonces analysées, avec agrégats bornés à une édition homogène ;
- corriger les liens éditoriaux qui décrivent à tort le Baromètre comme un observatoire local des prix, loyers ou délais ;
- neutraliser les déclarations d'expérience personnelle incompatibles avec une attribution à l'organisation ;
- produire une preuve SEO/GEO, un test de désambiguïsation d'entité et des checkpoints GSC.

### Exclus

- publier automatiquement un rapport client ;
- exposer une adresse exacte, une URL d'annonce, un e-mail, un identifiant utilisateur ou un JSON brut ;
- modifier le moteur de score, les paiements, les comptes, les crédits ou les achats intégrés ;
- modifier les pages juridiques ou `public/llms.txt` actuellement travaillés par le chantier App Store ;
- modifier le title ou le H1 du guide DPE avant la fin de sa fenêtre de réindexation ;
- garantir un classement, une citation IA, un volume de trafic ou une conversion.

## Architecture choisie

### 1. Curation gated et fail-closed

Un module pur transforme uniquement des lignes éligibles en lignes `barometre_reports`. Le CLI mensuel :

- exige un mois `YYYY-MM` ;
- interroge la base via le Management API avec `SUPABASE_PAT` chargé au runtime ;
- accepte `report_mode='test'` seulement si le propriétaire possède le rôle `admin` ;
- accepte un autre mode seulement si `barometre_optin=true` ;
- exige `success`, non supprimé, ville, code postal, surface, prix, score et rapport structuré ;
- dédoublonne par rapport source et refuse toute collision de slug ;
- ne sélectionne pas selon le score : toutes les lignes conformes du mois sont publiées ;
- produit un manifeste sans PII en dry-run ;
- n'écrit qu'avec `--apply`, dans une transaction qui vérifie les invariants avant commit.

### 2. Contenu statique versionné

Le générateur public continue de lire uniquement `barometre_reports` via RLS et clé publishable. Il conserve les instantanés historiques, récupère la date exacte lorsqu'elle est publiée dans `details_json.publication`, valide unicité, méthode, mois et fraîcheur, puis écrit les JSON déterministes.

### 3. Synchronisation par PR

Le workflow quotidien utilise uniquement la clé publishable. Il régénère, teste
et construit le site. S'il existe un diff, il pousse une branche d'automatisation
et ouvre ou met à jour une PR. S'il n'existe aucun diff à réviser, il exige une
égalité exacte entre la base, le manifeste et le sitemap live, puis un statut
HTTP 200 pour chaque fiche. Lorsqu'il vient de créer un diff, cette vérification
live est différée jusqu'au déploiement, car la production ne peut pas encore
contenir le changement. Il ne fusionne ni ne déploie automatiquement.

### 4. Instantané public commun au site et à l'app

Le build pré-rend `/barometre-manifest.json` depuis la même collection que les
fiches. La projection est explicite et exclut détails, provenance, adresse, URL
d'annonce et identifiants utilisateur. Elle est versionnée, validée avec les
mêmes invariants que l'app, accessible en CORS sans cookie, non indexable et
absente du sitemap. Le contrôle d'intégrité exige une bijection exacte entre ses
slugs et les pages générées.

### 5. Présentation homogène

- Le hub principal décrit la dernière édition et sépare clairement les archives.
- Les agrégats et le Dataset portent uniquement sur une édition homogène.
- Les fiches reconnaissent la méthode par leurs sections : cinq historiques ou treize courantes.
- Les pages régionales conservent leurs URL, mais calculent leurs agrégats sur la dernière édition de la région comportant au moins trois fiches.
- Les archives restent accessibles et datées ; elles ne sont jamais présentées comme recalculées.

## Risques, sécurité et rollback

Classe de risque : élevée, car le lot combine SEO public, automatisation GitHub et écriture bornée dans une table publique. Il ne touche ni PII publiée, ni paiement, ni authentification.

| Risque | Prévention | Détection | Réponse / rollback |
|---|---|---|---|
| publication d'un rapport client sans accord | test admin ou `barometre_optin=true`, projection allowlist | tests adversariaux et manifeste sans PII | transaction annulée, lignes nouvelles rendues `publie=false` |
| fuite d'adresse, URL ou identifiant | mapping explicite, aucun spread du rapport brut | scan des JSON, HTML et diff | bloquer la PR et dépublier le mois |
| doublon ou collision SEO | source et slug contrôlés avant écriture | tests d'unicité et requête post-apply | rollback transaction ou dépublication ciblée |
| agrégat mélangeant deux méthodes | calcul par mois/méthode homogène | tests sur fixture juin + août | revert du lot site |
| automatisation qui déploie seule | PR obligatoire, aucune auto-fusion | audit du workflow | désactiver le schedule ou revert du workflow |
| app partageant une fiche absente du site | l'app lit l'instantané déployé atomiquement avec les pages | bijection manifeste/pages au build et contrôle quotidien base/manifeste/sitemap/HTTP | fusionner la PR contrôlée ou dépublier la ligne concernée |
| conflit avec App Store | fichiers juridiques et `llms.txt` interdits | diff final et resynchronisation `main` | rebase, résolution sans prendre leurs changements |
| perte SEO | URL et canonical conservées, contenu plus précis | GSC à J+7, J+14 et J+28 | rollback seulement sur perte matérielle confirmée |

Rollback code : annuler le commit de fusion du lot. Rollback données : rendre `publie=false` les lignes du mois `2026-08` ajoutées par le manifeste ; ne jamais supprimer les rapports sources. Un snapshot `0600` des lignes Baromètre antérieures est conservé hors Git avant l'écriture.

## Critères d'acceptation

- dry-run d'août : exactement 15 lignes éligibles, une seule origine administrateur, zéro client non opt-in ;
- aucune valeur interdite dans les sorties publiques : adresse exacte, URL d'annonce, utilisateur, token, données brutes ;
- les quatre géographies invalides ne sont plus publiées ;
- le site contient 112 fiches réelles : 97 archives conformes de juin et 15 fiches d'août ;
- le hub affiche août 2026 comme dernière édition et borne chaque agrégat à cette édition ;
- les fiches août affichent les treize sections courantes, les fiches juin gardent leurs cinq sections historiques ;
- aucun score moyen régional ne mélange des éditions ou méthodes différentes ;
- le workflow quotidien n'utilise qu'une clé publishable, vérifie les pages live
  utilisées par l'app et ne fusionne jamais automatiquement ;
- le manifeste public contient exactement les 112 fiches, exclut les champs
  internes, accepte CORS sans cookie, reste non indexable et absent du sitemap ;
- les liens éditoriaux ne décrivent plus le Baromètre comme une source de tendances locales exhaustives ;
- tests complets, vérité éditoriale, build, liens, JSON-LD, mobile, Lighthouse, secrets, diff et statut Git verts ;
- PR, déploiement Cloudflare et IndexNow verts, puis HTTP/canonical/contenu live vérifiés ;
- mémoire Obsidian, rollback, preuve et dates de re-mesure enregistrés.

## Décisions ouvertes

Aucune. L'architecture conservative et la publication du corpus d'août sont autorisées par le GO du 30 août 2026.
