import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const pageBody = (path) => JSON.parse(read(path)).body_html;

function listJsonFiles(directory) {
  return readdirSync(new URL(directory, root), { withFileTypes: true }).flatMap(
    (entry) => {
      const nested = `${directory}${entry.name}`;
      if (entry.isDirectory()) return listJsonFiles(`${nested}/`);
      return entry.name.endsWith(".json") ? [nested] : [];
    },
  );
}

test("legal notices expose the verified publisher and current infrastructure", () => {
  const legal = pageBody("src/data/pages/mentions-legales.json");

  for (const expected of [
    "Augustin Foucheres",
    "entrepreneur individuel",
    "890 838 709",
    "890 838 709 00032",
    "78 avenue des Champs-Élysées",
    "Cloudflare, Inc.",
    "101 Townsend St.",
    "IONOS SE",
  ]) {
    assert.match(legal, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.doesNotMatch(legal, /\[PRÉNOM NOM\]|Shopify|TRIXI|claude\.ai/i);
});

test("privacy policy names the controller and actual core processors", () => {
  const privacy = pageBody("src/data/pages/politique-de-confidentialite.json");

  for (const expected of [
    "Augustin Foucheres",
    "890 838 709",
    "78 avenue des Champs-Élysées",
    "Cloudflare",
    "Supabase",
    "Stripe",
    "Resend",
    "Google Analytics",
  ]) {
    assert.match(privacy, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.doesNotMatch(privacy, /\[PRÉNOM NOM\]|Shopify|TRIXI|claude\.ai/i);
});

test("sales terms use the same verified publisher identity and address", () => {
  const cgv = pageBody("src/data/pages/cgv.json");

  assert.match(cgv, /Augustin Foucheres/);
  assert.match(cgv, /entrepreneur individuel/);
  assert.match(cgv, /890 838 709/);
  assert.match(cgv, /78 avenue des Champs-Élysées/);
  assert.doesNotMatch(cgv, /75 avenue des Champs-Élysées/i);
});

test("structured identity uses the canonical brand without an unsupported leadership claim", () => {
  const entity = read("src/data/entity.ts");
  const homepageJsonLd = read("src/data/homepage-jsonld.ts");

  assert.match(entity, /BRAND_NAME = ['"]Score-Immo['"]/);
  assert.match(entity, /ALTERNATE_NAMES = \[['"]ScoreImmo['"], ['"]Score Immo['"]\]/);
  assert.match(entity, /plateforme française d'analyse de biens immobiliers à partir de données publiques/i);
  assert.match(entity, /ORGANIZATION_ID/);
  assert.match(homepageJsonLd, /"publisher": \{ "@id": ORGANIZATION_ID \}/);
  assert.match(homepageJsonLd, /"creator": \{ "@id": ORGANIZATION_ID \}/);
  assert.doesNotMatch(`${entity}\n${homepageJsonLd}`, /Premier outil français|"foundingDate": "2025"/i);
});

test("high-visibility copy avoids unsupported superiority and usage claims", () => {
  const surfaces = [
    "public/assets/og-default.svg",
    "src/components/sections/BehindScenes.astro",
    "src/components/sections/LandingEfficity.astro",
  ].map(read).join("\n");
  const dpe = pageBody("src/content/articles/guides/acheter-bien-classe-dpe-f-2026.json");

  assert.doesNotMatch(surfaces, /le plus complet de France|aucun concurrent/i);
  assert.doesNotMatch(dpe, /plus de 50 000 annonces analysées|plus de 2 000 projets/i);
});

test("editorial responsibility never relies on the three unverified biographies", () => {
  const unsupportedNames = /Camille Renard|Léa Moreau|Thomas Varin/;
  const articleFiles = listJsonFiles("src/content/articles/");

  assert.equal(articleFiles.length, 170);
  for (const path of articleFiles) {
    const article = JSON.parse(read(path));
    assert.equal(article.author, "Score-Immo", path);
    assert.equal(article.author_handle, "scoreimmo", path);
    assert.doesNotMatch(JSON.stringify(article), unsupportedNames, path);
  }

  const authorProfiles = readdirSync(new URL("src/content/authors/", root))
    .filter((name) => name.endsWith(".json"));
  assert.deepEqual(authorProfiles, []);

  const method = read("src/pages/pages/auteurs/index.astro");
  const barometer = read("src/pages/barometre/[slug].astro");
  assert.match(method, /Méthode éditoriale Score-Immo/);
  assert.doesNotMatch(method, unsupportedNames);
  assert.doesNotMatch(barometer, /@type': 'Person|getEntry\('authors'/);
});
