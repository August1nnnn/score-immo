import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const article = readJson(
  "src/content/articles/villes/prix-immobilier-bordeaux-quartiers-tendances.json",
);
const evidence = readJson(
  "docs/evidence/2026-08-28-bordeaux-dvf-summary.json",
);
const stripHtml = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const formatFrenchInteger = (value) =>
  value.toLocaleString("fr-FR").replace(/\u202f/g, " ");

test("the Bordeaux recovery preserves the proven search signal", () => {
  assert.equal(article.id, "749465207109");
  assert.equal(
    article.title,
    "Prix immobilier Bordeaux 2026 : prix au m² par quartier",
  );
  assert.equal(article.meta_title, article.title);
  assert.equal(article.handle, "prix-immobilier-bordeaux-quartiers-tendances");
  assert.equal(
    article.meta_description,
    "Prix immobilier à Bordeaux en 2026 : comparez les quartiers, les tendances, les appartements et les maisons à partir des données DVF disponibles.",
  );
});

test("the Bordeaux guide publishes the reproducible DVF result", () => {
  const text = stripHtml(article.body_html);
  const current = evidence.years["2025"];
  const previous = evidence.years["2024"];

  assert.equal(article.last_reviewed, "2026-08-28");
  assert.equal(article.updated_at, "2026-08-28");
  assert.equal(article.word_count, stripHtml(article.body_html).split(" ").length);
  assert.ok(article.word_count >= 1400);

  assert.match(
    text,
    new RegExp(`4 121 €/m².{0,100}${formatFrenchInteger(current.apartments.n)}`),
  );
  assert.match(
    text,
    new RegExp(`4 855 €/m².{0,100}${formatFrenchInteger(current.houses.n)}`),
  );
  assert.match(
    text,
    new RegExp(`4 222 €/m².{0,100}${formatFrenchInteger(previous.apartments.n)}`),
  );
  assert.match(
    text,
    new RegExp(`4 961 €/m².{0,100}${formatFrenchInteger(previous.houses.n)}`),
  );
  assert.match(text, /4 516 mutations/);
  assert.match(text, /moins de 500 €/);
  assert.match(text, /plus de 15 000 €/);
  assert.match(text, /exactement un logement/);
  assert.match(text, /ne contient ni le prix initial de l'annonce ni la remise négociée/);
  assert.match(text, /ne contient pas le DPE/);
  assert.match(text, /huit quartiers officiels/);
});

test("the eight official neighbourhood medians match the sealed evidence", () => {
  const text = stripHtml(article.body_html);

  assert.equal(Object.keys(evidence.neighbourhoods_2025).length, 8);
  for (const [name, values] of Object.entries(evidence.neighbourhoods_2025)) {
    assert.match(text, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const median = formatFrenchInteger(values.apartments.median_eur_m2);
    assert.match(text, new RegExp(`${median} €/m²`));
  }
});

test("unsupported Bordeaux claims cannot return", () => {
  const publicCopy = `${article.tldr.join(" ")} ${article.summary_html} ${article.body_html}`;

  for (const unsupported of [
    /68% des acquéreurs/i,
    /85 000 étudiants/i,
    /12 400 ventes/i,
    /23% d'emplois supplémentaires/i,
    /78 jours/i,
    /28% de passoires/i,
    /25 000€ et 45 000€/i,
    /2 800 logements attendus/i,
    /prime de 8%/i,
    /180M€/i,
    /35€\/m²\/an/i,
    /Bordeaux reste 5% moins chère/i,
    /décote moyenne obtenue est de 3,8%/i,
    /plus prometteurs/i,
    /meilleur ratio offre\/demande/i,
    /données DVF consolidées par l'INSEE/i,
  ]) {
    assert.doesNotMatch(publicCopy, unsupported);
  }

  assert.doesNotMatch(publicCopy, /[—–]/);
});

test("Bordeaux sources point to the exact official datasets", () => {
  const urls = article.sources.map(({ url }) => url);
  for (const expected of [
    evidence.years["2024"].source_url,
    evidence.years["2025"].source_url,
    evidence.neighbourhood_source.source_url,
    "https://www.insee.fr/fr/statistiques/1405599?geo=COM-33063&lang=fr",
    "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
  ]) {
    assert.ok(urls.includes(expected), expected);
  }
});
