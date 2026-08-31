# Baromètre et bannière cookies : preuves de livraison

Date : 31 août 2026

Autorité : `GO PROD BAROMÈTRE + COOKIES`

## Incrément 1 : Baromètre, validation locale

Source initiale : `origin/main` au SHA `7c72c7b4ecfad999894fee2386b1acd467178c49`

Branche : `codex/barometre-cookie-redesign-20260831`

### Développement dirigé par les contrats

- le premier lancement de `node --test tests/barometre-redesign.test.mjs` a échoué sur l'import des helpers absents, comme attendu ;
- les contrats couvrent l'homogénéité d'une édition, la médiane, la distribution, les types de biens, le DPE, les régions, l'allowlist publique, la non-divulgation de champs internes, les routes statiques, CORS, noindex et l'exclusion du sitemap ;
- une contre-revue sécurité a ajouté un cas RED d'injection de formule dans le CSV, puis le sérialiseur a été renforcé avant retour au vert ;
- résultat ciblé final : 6 tests sur 6.

### Vérité des chiffres et de la publication

- édition courante : `2026-08`, méthode `current-category-grid-2026-08` ;
- échantillon : 16 fiches dans 8 régions ;
- score moyen : 68/100 ; médiane : 67/100 ; plage : 62 à 81/100 ;
- types : 10 appartements et 6 maisons ;
- DPE : A 2, B 1, C 3, D 5, E 3, F 2 ;
- chaque agrégat décrit explicitement l'échantillon et n'est jamais présenté comme un indicateur du marché français ;
- le title, la description, le canonical, l'URL et le H1 de la page précédente sont préservés à l'identique ;
- les 16 fiches apparaissent une fois dans l'explorateur et restent présentes sans JavaScript ;
- le JSON et le CSV d'août contiennent chacun exactement 16 projections allowlistées ;
- les exports ne contiennent aucune adresse exacte, URL d'annonce, identité utilisateur, donnée brute ou clé interne ;
- les exports mensuels sont hors sitemap et sont configurés pour recevoir CORS et `X-Robots-Tag: noindex` sur Cloudflare.

### Chaîne de validation fraîche

| Gate | Résultat |
|---|---|
| `npm test` | 179/179 PASS après rebase sur `origin/main` |
| `npm run test:content-truth` | PASS |
| `npm run build` | 317 pages après rebase, PASS |
| `npm run test:site-integrity` | 317 HTML, 12 383 liens internes, 37 redirections, PASS |
| `npm audit --omit=dev` | 0 vulnérabilité |
| contrôle JSON/CSV et clés interdites | PASS |
| contrôle sitemap | endpoints d'édition absents, PASS |
| scan de motifs de secrets | aucun résultat |
| `git diff --check` | PASS |

### Mesures navigateur

| Surface | Résultat |
|---|---|
| Lighthouse mobile | accessibilité 100, bonnes pratiques 100, SEO 100, navigation agentique 100 |
| Lighthouse desktop | accessibilité 100, bonnes pratiques 100, SEO 100, navigation agentique 100 |
| trace mobile locale | LCP 104 ms, CLS 0, sans throttling |
| CLS desktop après préchargement ciblé | 0,0005 |
| 320 px | largeur document 320 px, 16 cartes, H1 unique, aucun débordement document |
| 390, 768 et 1440 px | aucun débordement document |
| filtres | maisons 6, recherche Cannes 1, DPE F 2, tri croissant depuis 62, reset 16 |
| copie de citation | statut accessible `Citation copiée.` |
| console finale à 320 px | aucune erreur, aucun avertissement, aucune issue |

### Revue conformité et qualité

- aucune surface iOS, Supabase, paiement, juridique ou moteur de score n'a été modifiée ;
- aucune nouvelle dépendance ou requête externe n'a été ajoutée ;
- les interactions n'utilisent ni `innerHTML` ni interpolation de saisie dans du HTML ;
- les exports utilisent une projection explicite et un sérialiseur CSV protégé contre les formules ;
- les deux fontes critiques sont préchargées uniquement sur le Baromètre, ce qui évite une modification globale ;
- les téléchargements disposent de types MIME explicites et de `nosniff` ;
- aucun finding Critical ou Important ne reste ouvert avant intégration.

Rollback de l'incrément : revert du commit de fusion Baromètre, puis redéploiement par le workflow GitHub normal.
