import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { applyCuratedInternalLinks } from "../src/lib/curated-internal-links.js";
import { LOT_2_LINKS } from "../src/lib/curated-internal-links-lot2.js";

const root = new URL("../", import.meta.url);

const BASELINE_ZERO_INLINK_TARGETS = [
  "/blogs/guides/achat-immobilier-montagne-specificites",
  "/blogs/guides/acheter-appartement-rez-de-jardin",
  "/blogs/guides/acheter-appartement-travaux-budget-aides",
  "/blogs/guides/acheter-duplex-questions-a-poser",
  "/blogs/guides/acheter-indivision-regles-eviter-conflits",
  "/blogs/guides/acheter-logement-deja-loue",
  "/blogs/guides/acheter-maison-piscine-points-controle",
  "/blogs/guides/acheter-vefa-pieges-a-eviter",
  "/blogs/guides/aides-renovation-energetique-2026-acheteur",
  "/blogs/guides/calcul-plus-value-immobiliere-revente",
  "/blogs/guides/carnet-information-logement-cil",
  "/blogs/guides/checklist-contre-visite-immobiliere",
  "/blogs/guides/credit-immobilier-jeune-couple-tours-2026",
  "/blogs/guides/diagnostic-bruit-ensa-achat",
  "/blogs/guides/diagnostic-gaz-achat-immobilier",
  "/blogs/guides/diagnostic-merules-risques-achat",
  "/blogs/guides/diagnostic-termites-obligatoire-interpreter",
  "/blogs/guides/fiabilite-dpe-collectif-appartement",
  "/blogs/guides/garantie-loyer-impaye-gli-investissement-locatif",
  "/blogs/guides/home-staging-virtuel-pieges-acheteur",
  "/blogs/guides/impact-taxe-fonciere-budget-achat",
  "/blogs/guides/impact-transports-en-commun-prix-immobilier",
  "/blogs/guides/methode-analyse-immobiliere-scoreimmo",
  "/blogs/guides/pret-relais-acheter-avant-vendre",
  "/blogs/guides/ptz-2026-simulation-conditions-eligibilite",
  "/blogs/guides/scpi-capital-fixe-ou-variable",
  "/blogs/guides/transformer-local-commercial-en-habitation-guide",
  "/blogs/guides/viager-fonctionnement-bon-plan-2026",
  "/blogs/guides/vices-caches-immobilier-protection-recours",
  "/blogs/guides/visite-cave-parking-achat-copropriete",
  "/blogs/pro/10-erreurs-font-perdre-mandats-mandataire-debutant",
  "/blogs/pro/fiabiliser-estimation-ventes-dvf-comparables",
  "/blogs/pro/notoriete-locale-mandataire-avis-clients-reseaux-recommandat",
  "/blogs/pro/reseau-mandataires-ou-agence-immobiliere",
  "/blogs/pro/se-lancer-immobilier-sans-diplome",
  "/blogs/quartiers/meilleurs-quartiers-acheter-dijon-2026",
  "/blogs/quartiers/meilleurs-quartiers-acheter-grenoble-2026",
  "/blogs/quartiers/meilleurs-quartiers-acheter-lille",
  "/blogs/quartiers/meilleurs-quartiers-acheter-montpellier",
  "/blogs/quartiers/meilleurs-quartiers-acheter-rennes",
  "/blogs/quartiers/meilleurs-quartiers-etudiants-investir-toulouse",
  "/blogs/quartiers/quartiers-qui-montent-nantes-2026",
  "/blogs/villes/marche-immobilier-luxe-paris-2026",
  "/blogs/villes/tendances-immobilier-2026-villes",
].sort();

function articlePath(key) {
  return new URL(`src/content/articles/${key}.json`, root);
}

function article(key) {
  return JSON.parse(readFileSync(articlePath(key), "utf8"));
}

function keyFromRoute(route) {
  return route.replace(/^\/blogs\//, "");
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("lot 2 covers every baseline article with zero editorial inlinks exactly once", () => {
  assert.equal(LOT_2_LINKS.length, 44);
  assert.deepEqual(
    LOT_2_LINKS.map(({ href }) => href).sort(),
    BASELINE_ZERO_INLINK_TARGETS,
  );
});
test("lot 2 uses valid contextual source-target pairs and bounded source density", () => {
  const pairs = new Set();
  const perSource = new Map();

  for (const { from, href, anchorText } of LOT_2_LINKS) {
    const targetKey = keyFromRoute(href);
    const pair = `${from} -> ${href}`;

    assert.equal(pairs.has(pair), false, `duplicate pair: ${pair}`);
    pairs.add(pair);
    assert.notEqual(from, targetKey, `self-link: ${pair}`);
    assert.equal(existsSync(articlePath(from)), true, `missing source: ${from}`);
    assert.equal(existsSync(articlePath(targetKey)), true, `missing target: ${href}`);
    assert.ok(anchorText.length >= 12, `anchor too short: ${pair}`);
    assert.doesNotMatch(anchorText, /^(?:ici|cliquez ici|en savoir plus|article|guide|guide dédié)$/i, pair);

    perSource.set(from, (perSource.get(from) || 0) + 1);
  }

  for (const [source, additions] of perSource) {
    assert.ok(additions <= 4, `${source} receives ${additions} new links`);
  }
});

test("lot 2 renders each approved descriptive anchor exactly once", () => {
  for (const { from, href, anchorText } of LOT_2_LINKS) {
    const before = article(from).body_html;
    const after = applyCuratedInternalLinks(from, before);
    const expectedAnchor = `<a href="${href}">${anchorText}</a>`;

    assert.equal(count(before, `href="${href}"`), 0, `pre-existing link: ${from} -> ${href}`);
    assert.equal(count(after, `href="${href}"`), 1, `${from} -> ${href}`);
    assert.equal(count(after, expectedAnchor), 1, `${from} -> ${anchorText}`);
  }
});
