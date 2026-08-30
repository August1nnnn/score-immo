import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  fetchPublishedBarometreRows,
  getBarometrePublishableKey,
} from "../scripts/barometre-supabase.mjs";

const source = readFileSync(
  new URL("../scripts/gen-barometre.mjs", import.meta.url),
  "utf8",
);

test("barometre generation accepts only the dedicated publishable key", () => {
  assert.equal(
    getBarometrePublishableKey({
      SCOREIMMO_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_test ",
    }),
    "sb_publishable_test",
  );
  assert.equal(
    getBarometrePublishableKey({
      SCOREIMMO_SUPABASE_PUBLISHABLE_KEY: "eyJ.legacy.key",
    }),
    null,
  );
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});

test("barometre generation fails before network access when the key is absent", () => {
  const result = spawnSync(process.execPath, ["scripts/gen-barometre.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { PATH: process.env.PATH },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SCOREIMMO_SUPABASE_PUBLISHABLE_KEY/);
});

test("barometre generation emits the exact query with apikey only", async () => {
  const calls = [];
  const rows = await fetchPublishedBarometreRows({
    publishableKey: "sb_publishable_test",
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return Response.json([{ slug: "fixture" }]);
    },
  });

  assert.deepEqual(rows, [{ slug: "fixture" }]);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, "/rest/v1/barometre_reports");
  assert.equal(url.searchParams.get("publie"), "eq.true");
  assert.equal(url.searchParams.get("source_report_id"), "not.is.null");
  assert.equal(url.searchParams.get("order"), "mois.desc,score_global.desc");
  assert.equal(
    url.searchParams.get("select"),
    "mois,ville,code_postal,region,type_bien,surface,prix_demande,score_global,score_sections,dpe,alertes_cles,points_forts,verdict,is_edito,edito_label,slug,source_report_id,details_json",
  );
  assert.notEqual(url.searchParams.get("select"), "*");
  assert.deepEqual(calls[0].options.headers, {
    apikey: "sb_publishable_test",
  });
});
