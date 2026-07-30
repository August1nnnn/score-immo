import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import test from "node:test";

const root = process.cwd();

function source(path) {
  return readFileSync(join(root, path), "utf8");
}

function sourceFiles(directory) {
  const result = [];
  for (const entry of readdirSync(join(root, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...sourceFiles(path));
    } else if ([".astro", ".json", ".ts", ".txt"].includes(extname(entry.name))) {
      result.push(path);
    }
  }
  return result;
}

const publicFiles = [
  ...sourceFiles("src"),
  ...sourceFiles("public"),
].filter((path) => !path.includes("/test/") && !path.includes("/tests/"));

const partnerPaths = new Set([
  "src/components/sections/LandingEfficity.astro",
  "src/pages/pages/efficity.astro",
]);

test("the pricing page exposes the four canonical paid offers", () => {
  const pricing = source("src/components/sections/Pricing.astro");

  for (const expected of [
    "Analyse unique",
    "2,99",
    "Découverte",
    "9,99",
    "Recherche",
    "29",
    "Premium",
    "79",
    "/go/checkout/unit",
    "/go/checkout/discovery",
    "/go/checkout/search",
    "/go/checkout/premium",
    "/r/demo",
  ]) {
    assert.match(pricing, new RegExp(expected.replace("/", "\\/"), "i"));
  }
});

test("public copy never promises a free personalized report", () => {
  const forbidden = [
    /(?:premi[eè]re|1[eè]re)\s+analyse\s+(?:est\s+)?(?:offerte|gratuite)/iu,
    /analyser une annonce gratuitement/iu,
    /c['’]est gratuit pour (?:votre|ta) premi[eè]re analyse/iu,
  ];
  const violations = [];

  for (const path of publicFiles) {
    const contents = source(path);
    for (const pattern of forbidden) {
      if (pattern.test(contents)) {
        violations.push(`${relative(root, join(root, path))}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("standard public offers never advertise a one-euro first month", () => {
  const forbidden = [
    /1(?:er|e|è|ère)?\s+mois\s+(?:à|a)\s+1\s*(?:€|euro)/iu,
    /1\s*(?:€|euro)\s+le\s+premier\s+mois/iu,
    /commencer pour 1\s*(?:€|&euro;)/iu,
    /aucun paiement maintenant/iu,
  ];
  const violations = [];

  for (const path of publicFiles) {
    if (partnerPaths.has(path)) continue;
    const contents = source(path);
    for (const pattern of forbidden) {
      if (pattern.test(contents)) {
        violations.push(`${path}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("structured data uses the canonical paid-first formula", () => {
  const homepage = source("src/data/homepage-jsonld.ts");
  const tariffs = source("src/pages/pages/tarifs.astro");

  assert.match(homepage, /"name": "Analyse unique"[\s\S]*?"price": "2\.99"/);
  assert.doesNotMatch(homepage, /"name": "Gratuit"[\s\S]*?"price": "0"/);
  assert.match(tariffs, /"name": "Analyse unique"[\s\S]*?"price": "2\.99"/);
  assert.match(tariffs, /Rapport personnalisé dès 2,99/);
});

test("the Efficity exception stays explicit but never grants a free report", () => {
  const partner = source("src/components/sections/LandingEfficity.astro");

  assert.match(partner, /Offre exclusive Efficity/i);
  assert.match(partner, /1er mois à 1 euro/i);
  assert.doesNotMatch(
    partner,
    /(?:premi[eè]re|1[eè]re)\s+analyse\s+(?:est\s+)?(?:offerte|gratuite)/iu,
  );
  assert.doesNotMatch(partner, /analyser une annonce gratuitement/iu);
});
