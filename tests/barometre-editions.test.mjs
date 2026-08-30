import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateEdition,
  groupByEdition,
  scoreSectionCountRange,
  sectionsForScoreGrid,
  sectionsForMethod,
  selectLatestEdition,
  selectLatestRegionalEdition,
} from "../src/lib/barometre-editions.ts";

function fiche(overrides = {}) {
  return {
    slug: "fixture-aout",
    mois: "2026-08",
    methodology_version: "current-category-grid-2026-08",
    score_global: 70,
    prix_m2: 4000,
    region: "Occitanie",
    date_analyse: "2026-08-18",
    score_sections: {
      actualites: 6, commerces: 8, cout: 7, dpe: 5, ecoles: 9,
      environnement: 8, population: 7, prix: 8, rendement: 6,
      risques: 6, taxe_fonciere: 5, transports: 9, urbanisme: 9,
    },
    ...overrides,
  };
}

const historical = fiche({
  slug: "fixture-juin",
  mois: "2026-06",
  methodology_version: "legacy-five-section-2026-06",
  score_global: 90,
  prix_m2: 9000,
  date_analyse: "2026-06-01",
});

test("la derniere edition est selectionnee sans melanger les archives", () => {
  const latest = selectLatestEdition([historical, fiche()]);
  assert.equal(latest.month, "2026-08");
  assert.equal(latest.methodology, "current-category-grid-2026-08");
  assert.deepEqual(latest.fiches.map((item) => item.slug), ["fixture-aout"]);
});

test("les editions sont groupees par mois et methode", () => {
  const groups = groupByEdition([
    historical,
    fiche(),
    fiche({ slug: "fixture-aout-2", score_global: 60 }),
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].month, "2026-08");
  assert.equal(groups[0].fiches.length, 2);
  assert.equal(groups[1].month, "2026-06");
});

test("un agregat refuse deux editions ou methodes melangees", () => {
  assert.throws(() => aggregateEdition([historical, fiche()]), /homogène/i);
  const aggregate = aggregateEdition([
    fiche(),
    fiche({ slug: "fixture-aout-2", score_global: 60, prix_m2: 2000 }),
  ]);
  assert.deepEqual(aggregate, {
    count: 2,
    avgScore: 65,
    avgPriceM2: 3000,
    regions: 1,
    latestAnalysisDate: "2026-08-18",
  });
});

test("les definitions de section suivent la methode cinq ou treize axes", () => {
  assert.equal(sectionsForMethod("legacy-five-section-2026-06").length, 5);
  assert.equal(sectionsForMethod("current-category-grid-2026-08").length, 13);
  assert.throws(() => sectionsForMethod("unknown"), /méthode/i);
});

test("les sections visibles suivent uniquement les notes présentes dans une grille courante partielle", () => {
  const scores = { prix: 8, dpe: 5, risques: 6, environnement: 8, urbanisme: 9 };
  assert.deepEqual(
    sectionsForScoreGrid("current-category-grid-2026-08", scores).map(({ key }) => key),
    ["prix", "dpe", "risques", "environnement", "urbanisme"],
  );
  assert.equal(
    sectionsForScoreGrid("current-category-grid-2026-08", scores)
      .some(({ key }) => key === "transports"),
    false,
  );
});

test("la plage de sections d'une édition reflète les grilles exactes et partielles", () => {
  const partial = fiche({
    slug: "fixture-partielle",
    score_sections: { prix: 8, dpe: 5, risques: 6, environnement: 8, urbanisme: 9 },
  });

  assert.deepEqual(scoreSectionCountRange([fiche(), partial]), { minimum: 5, maximum: 13 });
  assert.deepEqual(scoreSectionCountRange([fiche()]), { minimum: 13, maximum: 13 });
});

test("une page regionale retient la derniere edition ayant assez de fiches", () => {
  const rows = [
    historical,
    historical && fiche({
      slug: "juin-2",
      mois: "2026-06",
      methodology_version: "legacy-five-section-2026-06",
      date_analyse: "2026-06-01",
    }),
    fiche(),
  ];
  const selected = selectLatestRegionalEdition(rows, { minCount: 2 });
  assert.equal(selected.month, "2026-06");
  assert.equal(selected.fiches.length, 2);

  const currentEnough = selectLatestRegionalEdition([
    ...rows,
    fiche({ slug: "aout-2" }),
  ], { minCount: 2 });
  assert.equal(currentEnough.month, "2026-08");
  assert.equal(currentEnough.fiches.length, 2);
});
