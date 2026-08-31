import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildEditionInsights } from "../src/lib/barometre-insights.ts";
import {
  buildEditionExport,
  serializeEditionCsv,
} from "../src/lib/barometre-edition-export.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const entry = (overrides = {}) => ({
  slug: "lyon-appartement-50m2-250k-2026-08",
  mois: "2026-08",
  methodology_version: "current-category-grid-2026-08",
  ville: "Lyon",
  code_postal: "69003",
  region: "Auvergne-Rhône-Alpes",
  type_bien: "appartement",
  surface: 50,
  prix_demande: 250000,
  prix_m2: 5000,
  score_global: 60,
  score_sections: {
    prix: 6,
    dpe: 7,
    risques: 5,
    urbanisme: 8,
    environnement: 7,
  },
  dpe: "C",
  points_forts: ["Point fort, vérifié"],
  alertes_cles: ["Alerte \"à contrôler\""],
  verdict: "Instantané indicatif.",
  is_edito: false,
  edito_label: null,
  date_analyse: "2026-08-15",
  source_kind: "admin-test",
  sample_policy: "all-eligible-monthly-reports",
  details: { adresse: "interdite" },
  user_id: "interdit",
  url_annonce: "https://example.invalid/interdit",
  ...overrides,
});

test("les insights décrivent une édition homogène avec médiane, distribution et tailles de groupes", () => {
  const fiches = [
    entry({ slug: "a", score_global: 62, dpe: "A", prix_m2: 2000 }),
    entry({ slug: "b", score_global: 66, dpe: "C", prix_m2: 3000 }),
    entry({ slug: "c", score_global: 68, type_bien: "maison", dpe: "F", prix_m2: 1500, region: "Corse" }),
    entry({ slug: "d", score_global: 81, type_bien: "maison", dpe: "F", prix_m2: 2500, region: "Corse" }),
  ];

  const result = buildEditionInsights(fiches);

  assert.deepEqual(
    {
      count: result.count,
      averageScore: result.averageScore,
      medianScore: result.medianScore,
      minimumScore: result.minimumScore,
      maximumScore: result.maximumScore,
    },
    { count: 4, averageScore: 69, medianScore: 67, minimumScore: 62, maximumScore: 81 },
  );
  assert.equal(result.scoreBands.find(({ key }) => key === "60-69").count, 3);
  assert.equal(result.scoreBands.find(({ key }) => key === "80-100").count, 1);
  assert.deepEqual(
    result.propertyTypes.map(({ key, count, medianScore, medianPriceM2 }) => ({ key, count, medianScore, medianPriceM2 })),
    [
      { key: "appartement", count: 2, medianScore: 64, medianPriceM2: 2500 },
      { key: "maison", count: 2, medianScore: 74.5, medianPriceM2: 2000 },
    ],
  );
  assert.equal(result.dpe.find(({ label }) => label === "F").count, 2);
  assert.deepEqual(result.regions, [
    { name: "Auvergne-Rhône-Alpes", count: 2 },
    { name: "Corse", count: 2 },
  ]);
});

test("les insights refusent de mélanger deux mois ou deux méthodes", () => {
  assert.throws(
    () => buildEditionInsights([entry(), entry({ slug: "autre", mois: "2026-07" })]),
    /édition homogène/i,
  );
  assert.throws(
    () => buildEditionInsights([entry(), entry({ slug: "autre", methodology_version: "legacy-five-section-2026-06" })]),
    /édition homogène/i,
  );
});

test("l'export mensuel est stable, allowlisté et ne diffuse aucune donnée interne", () => {
  const dataset = buildEditionExport([entry()], "https://score-immo.fr");

  assert.equal(dataset.schema_version, 1);
  assert.equal(dataset.edition, "2026-08");
  assert.equal(dataset.count, 1);
  assert.deepEqual(Object.keys(dataset.reports[0]).sort(), [
    "alertes_cles",
    "date_analyse",
    "dpe",
    "id",
    "points_forts",
    "prix_demande_eur",
    "prix_demande_m2_eur",
    "region",
    "score_global",
    "sections_visibles",
    "surface_m2",
    "type_bien",
    "url",
    "ville",
  ]);
  const serialized = JSON.stringify(dataset);
  for (const forbidden of ["adresse", "user_id", "url_annonce", "details", "source_kind", "sample_policy"]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "i"));
  }
  assert.equal(dataset.downloads.json, "https://score-immo.fr/barometre/editions/2026-08.json");
  assert.equal(dataset.downloads.csv, "https://score-immo.fr/barometre/editions/2026-08.csv");
});

test("le CSV mensuel est déterministe et échappe les cellules dangereuses", () => {
  const dataset = buildEditionExport([entry({ ville: "=2+2" })], "https://score-immo.fr");
  const csv = serializeEditionCsv(dataset);

  assert.match(csv, /^id,ville,region,type_bien,/);
  assert.match(csv, /,'=2\+2,/);
  assert.match(csv, /"Point fort, vérifié"/);
  assert.match(csv, /"Alerte ""à contrôler"""/);
  assert.equal(csv.endsWith("\n"), true);
});

test("le hub préserve le signal SEO et rend l'analyse, l'exploration et la citation visibles", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /Baromètre immobilier : \$\{total\} annonces/);
  assert.match(hub, /<h1[^>]*>Le Baromètre immobilier Score-Immo<\/h1>/);
  assert.match(hub, /data-barometre-insights/);
  assert.match(hub, /data-barometre-explorer/);
  assert.match(hub, /type="search"/);
  assert.match(hub, /data-barometre-count[^>]*aria-live="polite"/);
  assert.match(hub, /data-barometre-reset/);
  assert.match(hub, /data-copy-citation/);
  assert.match(hub, /\/barometre\/editions\/\$\{latestEdition\.month\}\.json/);
  assert.match(hub, /'@type': 'DataDownload'/);
  assert.match(hub, /distribution:/);
  assert.doesNotMatch(hub, /Les meilleures notes de l'édition/);
});

test("les routes d'édition sont statiques, publiques, CORS et exclues de l'index", () => {
  const jsonRoute = read("src/pages/barometre/editions/[month].json.ts");
  const csvRoute = read("src/pages/barometre/editions/[month].csv.ts");
  const headers = read("public/_headers");
  const astroConfig = read("astro.config.mjs");

  for (const route of [jsonRoute, csvRoute]) {
    assert.match(route, /export const prerender = true/);
    assert.match(route, /getStaticPaths/);
    assert.match(route, /buildEditionExport/);
  }
  assert.match(jsonRoute, /application\/json/);
  assert.match(csvRoute, /text\/csv/);
  assert.match(headers, /\/barometre\/editions\/\*/);
  assert.match(headers, /Access-Control-Allow-Origin: \*/);
  assert.match(headers, /X-Robots-Tag: noindex/);
  assert.match(astroConfig, /pathname\.startsWith\('\/barometre\/editions\/'\)/);
});
