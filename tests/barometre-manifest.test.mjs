import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { buildBarometreManifest } from "../src/lib/barometre-manifest.js";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function fixture(overrides = {}) {
  return {
    slug: "toulouse-appartement-52m2-245k-2026-08",
    mois: "2026-08",
    ville: "Toulouse",
    code_postal: "31000",
    region: "Occitanie",
    type_bien: "appartement",
    surface: 52,
    prix_demande: 245000,
    score_global: 71,
    score_sections: {
      actualites: 6, commerces: 8, cout: 7, dpe: 5, ecoles: 9,
      environnement: 8, population: 7, prix: 8, rendement: 6,
      risques: 6, taxe_fonciere: 5, transports: 9, urbanisme: 9,
    },
    dpe: "C",
    alertes_cles: ["Une alerte"],
    points_forts: ["Un point fort"],
    verdict: "Analyse synthétique.",
    is_edito: false,
    edito_label: null,
    methodology_version: "current-category-grid-2026-08",
    details: { private: "must never ship" },
    source_kind: "admin-test",
    ...overrides,
  };
}

const partialCurrentScores = {
  prix: 8,
  dpe: 5,
  risques: 6,
  environnement: 8,
  urbanisme: 9,
};

test("le manifeste expose uniquement le contrat public, trié et versionné", () => {
  const manifest = buildBarometreManifest([
    fixture({ slug: "z-fiche" }),
    fixture({ slug: "a-fiche" }),
  ]);

  assert.equal(manifest.schema_version, 1);
  assert.deepEqual(manifest.reports.map(({ slug }) => slug), ["a-fiche", "z-fiche"]);
  assert.deepEqual(Object.keys(manifest.reports[0]).sort(), [
    "alertes_cles", "code_postal", "dpe", "edito_label", "id", "is_edito",
    "mois", "points_forts", "prix_demande", "publie", "region", "score_global",
    "score_sections", "slug", "surface", "type_bien", "verdict", "ville",
  ]);
  assert.equal(manifest.reports[0].id, "a-fiche");
  assert.equal(manifest.reports[0].publie, true);
  assert.equal("details" in manifest.reports[0], false);
  assert.equal("source_kind" in manifest.reports[0], false);
});

test("le manifeste préserve une grille courante partielle sans créer les notes absentes", () => {
  const [report] = buildBarometreManifest([
    fixture({ score_sections: partialCurrentScores }),
  ]).reports;

  assert.deepEqual(report.score_sections, partialCurrentScores);
  assert.equal("transports" in report.score_sections, false);
});

test("le manifeste conserve la grille historique exacte de cinq sections", () => {
  const legacyScores = {
    prix: 7,
    dpe: 8,
    risques: 6,
    urbanisme: 5,
    environnement: 7,
  };
  const [report] = buildBarometreManifest([fixture({
    mois: "2026-06",
    methodology_version: "legacy-five-section-2026-06",
    score_sections: legacyScores,
  })]).reports;

  assert.deepEqual(report.score_sections, legacyScores);
});

test("le manifeste refuse les slugs dangereux ou dupliqués", () => {
  assert.throws(() => buildBarometreManifest([fixture({ slug: "../secret" })]), /slug/i);
  assert.throws(() => buildBarometreManifest([fixture(), fixture()]), /duplicate/i);
});

test("le manifeste refuse plusieurs éditos dans la même édition", () => {
  assert.throws(() => buildBarometreManifest([
    fixture({ slug: "edito-a", is_edito: true }),
    fixture({ slug: "edito-b", is_edito: true }),
  ]), /editorial/i);
});

test("le manifeste refuse tout instantané que l'app rejetterait", () => {
  for (const invalid of [
    fixture({ mois: "2026-13" }),
    fixture({ code_postal: "31" }),
    fixture({ region: "France" }),
    fixture({ dpe: null }),
    fixture({ surface: 0 }),
    fixture({ prix_demande: Number.NaN }),
    fixture({ score_global: 101 }),
    fixture({ alertes_cles: [null] }),
    fixture({ score_sections: { prix: 8, dpe: 5, risques: 6, environnement: 8 } }),
    fixture({ score_sections: { ...fixture().score_sections, extra: 5 } }),
    fixture({ methodology_version: "legacy-five-section-2026-06" }),
  ]) assert.throws(() => buildBarometreManifest([invalid]), /invalid/i);
});

test("la route et les en-têtes rendent le manifeste public mais non indexable", () => {
  const route = read("src/pages/barometre-manifest.json.ts");
  const headers = read("public/_headers");
  const astroConfig = read("astro.config.mjs");
  const globalRule = /^\/\*\n(?:[ \t]+.*(?:\n|$))*/m.exec(headers)?.[0] ?? "";
  const manifestRule = /^\/barometre-manifest\.json\n(?:[ \t]+.*(?:\n|$))*/m.exec(headers)?.[0] ?? "";
  assert.match(route, /buildBarometreManifest/);
  assert.match(route, /getCollection\('barometre'\)/);
  assert.match(manifestRule, /Access-Control-Allow-Origin: \*/);
  assert.match(manifestRule, /X-Robots-Tag: noindex/);
  assert.doesNotMatch(globalRule, /X-Robots-Tag/i);
  assert.match(globalRule, /X-Content-Type-Options: nosniff/);
  assert.doesNotMatch(manifestRule, /X-Content-Type-Options/i);
  assert.match(manifestRule, /Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(astroConfig, /['"]\/barometre-manifest\.json['"]/);
});

test("le manifeste couvre exactement les instantanés Baromètre suivis", () => {
  const contentUrl = new URL("src/content/barometre/", root);
  const files = readdirSync(contentUrl).filter((name) => name.endsWith(".json"));
  const entries = files.map((name) => JSON.parse(read(`src/content/barometre/${name}`)));
  const manifest = buildBarometreManifest(entries);

  assert.equal(manifest.reports.length, files.length);
  assert.deepEqual(
    manifest.reports.map(({ slug }) => slug),
    entries.map(({ slug }) => slug).sort(),
  );
});
