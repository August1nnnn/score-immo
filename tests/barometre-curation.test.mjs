import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBarometreRow,
  curateReports,
  isEligibleReport,
  slugify,
  validateMonth,
} from "../scripts/barometre-curation.mjs";

const REPORT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function report(overrides = {}) {
  return {
    id: REPORT_ID,
    user_id: USER_ID,
    owner_is_admin: true,
    report_mode: "test",
    status: "success",
    deleted_at: null,
    created_at: "2026-08-18T14:32:10.000Z",
    barometre_optin: false,
    city: "Labege",
    postal_code: "31670",
    surface: 63,
    price: 252000,
    score_total: 74,
    score_breakdown_json: {
      actualites: 60,
      commerces: 70,
      cout: 80,
      dpe: 90,
      ecoles: 50,
      environnement: 75,
      population: 65,
      prix: 72,
      rendement: 68,
      risques: 84,
      taxe_fonciere: 61,
      transports: 77,
      urbanisme: 55,
    },
    report_json: {
      listing: {
        property_type: "Appartement T3",
        address: "12 rue tres precise, 31670 Labege",
        listing_url: "https://example.test/annonce-secrete",
      },
      market: {
        medianLocal: 3900,
        pricePosition: "dans la moyenne locale",
      },
      energy: {
        dpe: "C",
        ges: "A",
      },
      rental: {
        grossYield: 4.8,
        rentEstimate: 1040,
      },
      acquisition: {
        notaryFees: 20160,
      },
      tax: {
        propertyTax: 1120,
      },
      history: {
        summary: "Prix stable depuis trois mois",
      },
      demographics: {
        summary: "Bassin residentiel dynamique",
      },
      neighborhood: {
        summary: "Commerces et transports accessibles",
      },
      risk_summary: {
        level: "modere",
        summary: "Alerte argile a verifier",
      },
      strengths: ["DPE C", "Transports accessibles"],
      alerts: ["Rendement a confirmer"],
      verdict: "Annonce a approfondir apres verification des pieces.",
      internal_token: "do-not-publish",
    },
    ...overrides,
  };
}

test("validateMonth accepte uniquement un mois civil YYYY-MM", () => {
  assert.equal(validateMonth("2026-08"), "2026-08");
  for (const value of ["2026-8", "2026-13", "2026-00", "08-2026", ""]) {
    assert.throws(() => validateMonth(value), /mois/i);
  }
});

test("un rapport test appartient obligatoirement a un administrateur", () => {
  assert.equal(isEligibleReport(report()).eligible, true);
  assert.deepEqual(isEligibleReport(report({ owner_is_admin: false })), {
    eligible: false,
    reason: "test-owner-not-admin",
  });
});

test("un rapport non-test exige un opt-in explicite", () => {
  assert.deepEqual(
    isEligibleReport(
      report({ report_mode: "buy", owner_is_admin: false, barometre_optin: false }),
    ),
    { eligible: false, reason: "missing-optin" },
  );
  assert.equal(
    isEligibleReport(
      report({ report_mode: "buy", owner_is_admin: false, barometre_optin: true }),
    ).eligible,
    true,
  );
});

test("les rapports supprimes, non aboutis ou incomplets sont rejetes", () => {
  const cases = [
    [report({ status: "failed" }), "status-not-success"],
    [report({ deleted_at: "2026-08-19T10:00:00.000Z" }), "deleted"],
    [report({ city: null }), "missing-city"],
    [report({ postal_code: null }), "missing-postal-code"],
    [report({ surface: 0 }), "invalid-surface"],
    [report({ price: null }), "invalid-price"],
    [report({ score_total: null }), "invalid-score"],
    [report({ score_breakdown_json: {} }), "incomplete-score-grid"],
    [report({ report_json: {} }), "missing-structured-report"],
  ];

  for (const [candidate, reason] of cases) {
    assert.deepEqual(isEligibleReport(candidate), { eligible: false, reason });
  }
});

test("la projection publique est allowlistee et ne contient aucune PII", () => {
  const row = buildBarometreRow(report(), { month: "2026-08" });

  assert.deepEqual(Object.keys(row).sort(), [
    "alertes_cles",
    "code_postal",
    "details_json",
    "dpe",
    "is_edito",
    "mois",
    "points_forts",
    "prix_demande",
    "publie",
    "region",
    "score_global",
    "score_sections",
    "slug",
    "source_report_id",
    "surface",
    "type_bien",
    "verdict",
    "ville",
  ].sort());
  assert.equal(row.source_report_id, REPORT_ID);
  assert.equal(row.details_json.publication.analyzed_at, "2026-08-18");
  assert.equal(row.details_json.publication.methodology_version, "current-category-grid-2026-08");
  assert.equal(row.details_json.publication.source_kind, "admin-test");
  assert.equal(row.details_json.publication.sample_policy, "all-eligible-monthly-reports");
  assert.equal(row.details_json.energie.dpe, "C");
  assert.equal(row.details_json.rendement.brut, 4.8);
  assert.equal(row.details_json.quartier.commerces, null);
  assert.equal(row.details_json.risques.count, null);

  const serialized = JSON.stringify(row);
  for (const forbidden of [
    "12 rue tres precise",
    "annonce-secrete",
    USER_ID,
    "internal_token",
    "do-not-publish",
    "report_json",
    "listing_url",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
});

test("les treize notes sont converties de 0-100 vers 0-10", () => {
  const row = buildBarometreRow(report(), { month: "2026-08" });
  assert.equal(Object.keys(row.score_sections).length, 13);
  assert.equal(row.score_sections.dpe, 9);
  assert.equal(row.score_sections.environnement, 7.5);
  assert.equal(row.score_sections.prix, 7.2);
});

test("la source et la collision de slug sont fail-closed", () => {
  assert.throws(
    () => curateReports([report()], {
      month: "2026-08",
      existingRows: [{ source_report_id: REPORT_ID, slug: "deja-la" }],
    }),
    /source deja publiee/i,
  );

  const expectedSlug = buildBarometreRow(report(), { month: "2026-08" }).slug;
  assert.throws(
    () => curateReports([report()], {
      month: "2026-08",
      existingRows: [{ source_report_id: "another-source", slug: expectedSlug }],
    }),
    /collision de slug/i,
  );
});

test("la curation est exhaustive, deterministe et independante de l'ordre", () => {
  const second = report({
    id: "33333333-3333-4333-8333-333333333333",
    city: "Nimes",
    postal_code: "30000",
    created_at: "2026-08-19T09:10:00.000Z",
    score_total: 62,
  });
  const rejected = report({
    id: "44444444-4444-4444-8444-444444444444",
    status: "failed",
  });

  const firstRun = curateReports([second, rejected, report()], {
    month: "2026-08",
    existingRows: [],
  });
  const secondRun = curateReports([report(), rejected, second], {
    month: "2026-08",
    existingRows: [],
  });

  assert.deepEqual(firstRun.rows, secondRun.rows);
  assert.equal(firstRun.rows.length, 2);
  assert.deepEqual(firstRun.rejected, [{
    id: "44444444-4444-4444-8444-444444444444",
    reason: "status-not-success",
  }]);
});

test("slugify reste stable et normalise les accents", () => {
  assert.equal(slugify("Seyssuel Maison 87 m2 2026-08"), "seyssuel-maison-87m2-2026-08");
  assert.equal(slugify("Chenove Appartement 41 m²"), "chenove-appartement-41m2");
});

test("les codes postaux corses 20xxx sont rattaches a la Corse", () => {
  const row = buildBarometreRow(report({
    city: "Porto-Vecchio",
    postal_code: "20137",
  }), { month: "2026-08" });
  assert.equal(row.region, "Corse");
});
