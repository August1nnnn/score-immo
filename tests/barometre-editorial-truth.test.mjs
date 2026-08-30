import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../src/content/articles/", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8")).body_html;

test("les liens editoriaux decrivent le Barometre comme un corpus d'annonces datees", () => {
  const files = [
    "pro/combien-gagne-mandataire-immobilier-2026.json",
    "pro/comment-estimer-bien-immobilier-mandataire-debutant.json",
    "pro/credibilite-mandataire-rapport-analyse-rassure-client.json",
    "pro/decrocher-mandat-exclusif-methode-arguments.json",
    "pro/devenir-mandataire-immobilier-2026-guide-complet.json",
    "pro/estimation-locative-convaincre-investisseur.json",
    "pro/fiabiliser-estimation-ventes-dvf-comparables.json",
    "pro/iad-safti-capifrance-efficity-quel-reseau-mandataire-choisir.json",
    "pro/meilleurs-outils-mandataire-immobilier-debutant-2026.json",
  ];
  const forbidden = /(?:tendances précises et fiables sur les prix|tendances de fond sur les prix et les loyers|vision claire des prix et des délais|vision macro de votre secteur|prédigéré DVF par ville|médiane DVF en euros par mètre carré)/i;
  for (const file of files) {
    const body = read(file);
    assert.match(body, /href="\/barometre"/, file);
    assert.doesNotMatch(body, forbidden, file);
  }
});

test("les articles institutionnels ne revendiquent plus les experiences personnelles non verifiees", () => {
  const cases = [
    ["guides/diagnostic-amiante-plomb-2026-obligations-impact-prix.json", /mon expérience d'ancienne chargée de mission au CGEDD|Mes analyses des données|notaires partenaires|Décote réelle constatée|décote à la transaction est généralement|surcoûts peuvent représenter 15 à 30%/i],
    ["guides/garantie-decennale-immobilier-couverture-recours-dedales.json", /mon expérience d'ancienne analyste|Dans mon expérience d'analyse des litiges|En tant qu'analyste habituée|j'observe régulièrement/i],
    ["pro/combien-gagne-mandataire-immobilier-2026.json", /Mon expérience me fait dire/i],
    ["pro/cout-demarrage-mandataire-immobilier-pack-royalties.json", /j'ai vu trop de carrières/i],
    ["pro/credibilite-mandataire-rapport-analyse-rassure-client.json", /Je me souviens de mes débuts|Après huit ans sur le terrain/i],
    ["pro/decrocher-mandat-exclusif-methode-arguments.json", /j'ai appliqué pendant des années|Dans cet article, je ne vais pas|Je vais partager avec vous/i],
    ["pro/mandataire-ou-agent-immobilier-differences.json", /après ces années sur le terrain|J'ai connu d'excellents mandataires/i],
    ["pro/pige-immobiliere-2026-trouver-mandats.json", /mon expérience montre/i],
    ["pro/se-lancer-immobilier-sans-diplome.json", /chemin que j'ai emprunté|J'ai connu des titulaires|Mon premier parrain|Pour ma première estimation/i],
    ["quartiers/meilleurs-quartiers-acheter-grenoble-2026.json", /j'ai épluché les fichiers DVF|j'observe régulièrement des écarts/i],
    ["quartiers/meilleurs-quartiers-acheter-reims-2026.json", /j'ai croisé trois sources|J'utilise ici les noms/i],
    ["quartiers/meilleurs-quartiers-acheter-strasbourg.json", /30% de nos clients strasbourgeois/i],
    ["villes/prix-immobilier-reims-2026-champagne-tgv-paris.json", /mon expérience d'analyste marché immobilier depuis 2016|erreurs récurrentes que j'observe/i],
  ];
  for (const [file, pattern] of cases) assert.doesNotMatch(read(file), pattern, file);
});

test("la methodologie publique expose selection, consentement et non-melange", () => {
  const source = readFileSync(new URL("../src/pages/methodologie.astro", import.meta.url), "utf8");
  for (const expected of [
    "15 analyses internes de test",
    "sans sélection selon leur score",
    "Aucun rapport client n'a été publié",
    "opt-in Baromètre explicite",
    "retire l'adresse exacte, l'URL de l'annonce, l'identifiant du compte",
    "une édition et une méthode homogènes",
  ]) assert.ok(source.includes(expected), expected);
});
