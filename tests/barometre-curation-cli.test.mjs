import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManifest,
  buildMutationSql,
  parseArguments,
  sqlLiteral,
} from "../scripts/curate-barometre-month.mjs";

const publicRow = {
  mois: "2026-08",
  ville: "Labege",
  code_postal: "31670",
  region: "Occitanie",
  type_bien: "appartement",
  surface: 63,
  prix_demande: 252000,
  score_global: 74,
  score_sections: { prix: 7.2 },
  dpe: "C",
  alertes_cles: [],
  points_forts: ["Bonne note de desserte dans la grille analysée"],
  verdict: "Instantane indicatif.",
  is_edito: false,
  slug: "labege-appartement-63m2-252k-2026-08",
  publie: true,
  source_report_id: "11111111-1111-4111-8111-111111111111",
  details_json: { publication: { source_kind: "admin-test" } },
};

test("le CLI est en dry-run par defaut", () => {
  assert.deepEqual(parseArguments(["--month", "2026-08"]), {
    month: "2026-08",
    apply: false,
    confirm: null,
    snapshot: null,
  });
});

test("le mode apply exige snapshot absolu et confirmation chiffree", () => {
  assert.throws(
    () => parseArguments(["--month", "2026-08", "--apply"]),
    /snapshot/i,
  );
  assert.throws(
    () => parseArguments([
      "--month", "2026-08", "--apply", "--snapshot", "relative.json", "--confirm", "2026-08:1",
    ]),
    /absolu/i,
  );
  assert.deepEqual(parseArguments([
    "--month", "2026-08", "--apply",
    "--snapshot", "/tmp/scoreimmo-barometre-before.json",
    "--confirm", "2026-08:1",
  ]), {
    month: "2026-08",
    apply: true,
    confirm: "2026-08:1",
    snapshot: "/tmp/scoreimmo-barometre-before.json",
  });
});

test("sqlLiteral neutralise les apostrophes et encode les structures", () => {
  assert.equal(sqlLiteral("Cote d'Azur"), "'Cote d''Azur'");
  assert.equal(sqlLiteral(null), "NULL");
  assert.equal(sqlLiteral(true), "TRUE");
  assert.equal(sqlLiteral({ label: "d'ici" }), "'{\"label\":\"d''ici\"}'::jsonb");
  assert.equal(sqlLiteral(["l'un", "deux"]), "ARRAY['l''un','deux']::text[]");
});

test("la transaction depublie les geographies invalides et insere sans DELETE", () => {
  const sql = buildMutationSql([publicRow], { commit: true });
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /UPDATE public\.barometre_reports SET publie = FALSE/);
  assert.match(sql, /SET region = 'Guyane'/);
  assert.match(sql, /cayenne-appartement-29m2-105k/);
  assert.match(sql, /INSERT INTO public\.barometre_reports/);
  assert.match(sql, /COMMIT;$/);
  assert.doesNotMatch(sql, /\bDELETE\b/i);
  assert.match(sql, /source_report_id/);
  assert.match(sql, /collision/i);

  const rollbackSql = buildMutationSql([publicRow], { commit: false });
  assert.match(rollbackSql, /ROLLBACK;$/);
});

test("le manifeste de console ne contient aucun identifiant ni detail brut", () => {
  const manifest = buildManifest({
    month: "2026-08",
    rows: [publicRow],
    rejected: [{ id: "secret-report-id", reason: "missing-optin" }],
  });
  assert.deepEqual(manifest, {
    month: "2026-08",
    eligibleCount: 1,
    rejectedCounts: { "missing-optin": 1 },
    rows: [{
      slug: publicRow.slug,
      ville: "Labege",
      code_postal: "31670",
      type_bien: "appartement",
      score_global: 74,
      source_kind: "admin-test",
    }],
  });
  assert.doesNotMatch(JSON.stringify(manifest), /secret-report-id|11111111/);
});
