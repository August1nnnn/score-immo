import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFreshLatestEdition,
  normalizePublishedRows,
} from "../scripts/barometre-public-data.mjs";

const currentScores = {
  actualites: 6,
  commerces: 7,
  cout: 8,
  dpe: 9,
  ecoles: 5,
  environnement: 7.5,
  population: 6.5,
  prix: 7.2,
  rendement: 6.8,
  risques: 8.4,
  taxe_fonciere: 6.1,
  transports: 7.7,
  urbanisme: 5.5,
};

function row(overrides = {}) {
  return {
    mois: "2026-08",
    ville: "Labege",
    code_postal: "31670",
    region: "Occitanie",
    type_bien: "appartement",
    surface: 63,
    prix_demande: 252000,
    score_global: 74,
    score_sections: currentScores,
    dpe: "C",
    alertes_cles: [],
    points_forts: [],
    verdict: "Instantane indicatif.",
    is_edito: false,
    edito_label: null,
    slug: "labege-appartement-63m2-252k-2026-08",
    source_report_id: "11111111-1111-4111-8111-111111111111",
    details_json: {
      publication: {
        analyzed_at: "2026-08-18",
        methodology_version: "current-category-grid-2026-08",
        source_kind: "admin-test",
        sample_policy: "all-eligible-monthly-reports",
      },
      marche: { median_m2: 3900 },
    },
    ...overrides,
  };
}

test("les lignes courantes conservent la date exacte et la grille de treize sections", () => {
  const [fiche] = normalizePublishedRows([row()]);
  assert.equal(fiche.date_analyse, "2026-08-18");
  assert.equal(fiche.methodology_version, "current-category-grid-2026-08");
  assert.equal(Object.keys(fiche.score_sections).length, 13);
  assert.equal(fiche.prix_m2, 4000);
  assert.equal(fiche.details.publication, undefined);
  assert.equal(fiche.source_report_id, undefined);
});

test("les fiches historiques gardent la methode cinq sections sans reecriture", () => {
  const [fiche] = normalizePublishedRows([row({
    mois: "2026-06",
    slug: "fixture-historique",
    source_report_id: "22222222-2222-4222-8222-222222222222",
    score_sections: {
      prix: 7,
      dpe: 8,
      risques: 6,
      urbanisme: 5,
      environnement: 7,
    },
    details_json: { marche: { median_m2: 3800 } },
  })]);
  assert.equal(fiche.date_analyse, "2026-06-01");
  assert.equal(fiche.methodology_version, "legacy-five-section-2026-06");
  assert.equal(Object.keys(fiche.score_sections).length, 5);
});

test("les collisions de slug ou de source arretent la generation", () => {
  assert.throws(
    () => normalizePublishedRows([row(), row({
      source_report_id: "33333333-3333-4333-8333-333333333333",
    })]),
    /slug duplique/i,
  );
  assert.throws(
    () => normalizePublishedRows([row(), row({
      slug: "autre-slug",
    })]),
    /source dupliquee/i,
  );
});

test("une edition courante sans provenance, avec date incoherente ou mauvaise grille est rejetee", () => {
  assert.throws(
    () => normalizePublishedRows([row({ details_json: {} })]),
    /provenance/i,
  );
  assert.throws(
    () => normalizePublishedRows([row({
      details_json: {
        publication: {
          analyzed_at: "2026-07-31",
          methodology_version: "current-category-grid-2026-08",
          source_kind: "admin-test",
          sample_policy: "all-eligible-monthly-reports",
        },
      },
    })]),
    /date.*mois/i,
  );
  assert.throws(
    () => normalizePublishedRows([row({ score_sections: { prix: 7 } })]),
    /treize sections/i,
  );
});

test("une geographie generique ou un DPE invalide est refuse", () => {
  assert.throws(() => normalizePublishedRows([row({ region: "France" })]), /geographie/i);
  assert.throws(() => normalizePublishedRows([row({ dpe: "H" })]), /DPE/i);
});

test("le controle de fraicheur s'applique au workflow de synchronisation", () => {
  const current = normalizePublishedRows([row()]);
  assert.equal(
    assertFreshLatestEdition(current, { referenceDate: "2026-08-30", maxAgeDays: 62 }),
    "2026-08",
  );
  const stale = normalizePublishedRows([row({
    mois: "2026-06",
    slug: "fixture-historique",
    source_report_id: "22222222-2222-4222-8222-222222222222",
    score_sections: { prix: 7, dpe: 8, risques: 6, urbanisme: 5, environnement: 7 },
    details_json: {},
  })]);
  assert.throws(
    () => assertFreshLatestEdition(stale, { referenceDate: "2026-08-30", maxAgeDays: 62 }),
    /trop ancienne/i,
  );
});
