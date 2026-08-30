import assert from "node:assert/strict";
import test from "node:test";
import {
  extractLiveBarometreSlugs,
  verifyLiveBarometreParity,
} from "../scripts/verify-live-barometre.mjs";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://score-immo.fr/barometre</loc></url>
  <url><loc>https://score-immo.fr/barometre/fiche-a</loc></url>
  <url><loc>https://score-immo.fr/barometre/fiche-b</loc></url>
  <url><loc>https://score-immo.fr/barometre/region/occitanie</loc></url>
</urlset>`;
const manifest = JSON.stringify({
  schema_version: 1,
  reports: [
    { slug: "fiche-a" },
    { slug: "fiche-b" },
  ],
});

test("extractLiveBarometreSlugs conserve seulement les fiches detail", () => {
  assert.deepEqual(extractLiveBarometreSlugs(sitemap), ["fiche-a", "fiche-b"]);
});

test("verifyLiveBarometreParity exige une parite exacte et des HEAD 200", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method ?? "GET"]);
    if (url.endsWith("/sitemap-0.xml")) return new Response(sitemap, { status: 200 });
    if (url.endsWith("/barometre-manifest.json")) {
      return new Response(manifest, { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(null, { status: 200 });
  };

  const result = await verifyLiveBarometreParity({
    expectedSlugs: ["fiche-b", "fiche-a"],
    fetchImpl,
  });

  assert.deepEqual(result, { checked: 2 });
  assert.deepEqual(calls, [
    ["https://score-immo.fr/sitemap-0.xml", "GET"],
    ["https://score-immo.fr/barometre-manifest.json", "GET"],
    ["https://score-immo.fr/barometre/fiche-a", "HEAD"],
    ["https://score-immo.fr/barometre/fiche-b", "HEAD"],
  ]);
});

test("verifyLiveBarometreParity refuse les slugs manquants ou inattendus", async () => {
  const fetchImpl = async (url) => (
    url.endsWith("/sitemap-0.xml")
      ? new Response(sitemap, { status: 200 })
      : new Response(manifest, { status: 200, headers: { "content-type": "application/json" } })
  );
  await assert.rejects(
    verifyLiveBarometreParity({ expectedSlugs: ["fiche-a"], fetchImpl }),
    /missing=0; unexpected=fiche-b/,
  );
  await assert.rejects(
    verifyLiveBarometreParity({ expectedSlugs: ["fiche-a", "fiche-b", "fiche-c"], fetchImpl }),
    /missing=fiche-c; unexpected=0/,
  );
});

test("verifyLiveBarometreParity refuse une fiche qui ne repond pas 200", async () => {
  const fetchImpl = async (url) => (
    url.endsWith("/sitemap-0.xml")
      ? new Response(sitemap, { status: 200 })
      : url.endsWith("/barometre-manifest.json")
        ? new Response(manifest, { status: 200, headers: { "content-type": "application/json" } })
        : new Response(null, { status: url.endsWith("fiche-b") ? 404 : 200 })
  );
  await assert.rejects(
    verifyLiveBarometreParity({ expectedSlugs: ["fiche-a", "fiche-b"], fetchImpl }),
    /fiche-b \(404\)/,
  );
});

test("verifyLiveBarometreParity refuse un manifeste incomplet", async () => {
  const fetchImpl = async (url) => (
    url.endsWith("/sitemap-0.xml")
      ? new Response(sitemap, { status: 200 })
      : new Response(JSON.stringify({ schema_version: 1, reports: [{ slug: "fiche-a" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
  );
  await assert.rejects(
    verifyLiveBarometreParity({ expectedSlugs: ["fiche-a", "fiche-b"], fetchImpl }),
    /manifest.*missing=fiche-b/i,
  );
});
