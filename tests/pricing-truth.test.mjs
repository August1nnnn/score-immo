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

test("the pricing page exposes the five canonical paid offers", () => {
  const pricing = source("src/components/sections/Pricing.astro");

  for (const expected of [
    "Analyse unique",
    "2,99",
    "Pack 5",
    "9,99",
    "Pack 10",
    "19,99",
    "/go/checkout/pack_10",
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

  assert.doesNotMatch(pricing, /Comparateur de biens/i);
});

test("the default social card uses the canonical data and source counts", () => {
  const socialCard = source("public/assets/og-default.svg");

  assert.match(socialCard, /Score-Immo/);
  assert.match(socialCard, /230\+ points potentiels · 10 sources/);
  assert.doesNotMatch(socialCard, /9 sources officielles/);
});

test("the homepage distinguishes data points from automatic checks", () => {
  const stats = source("src/components/sections/Stats.astro");

  assert.match(stats, /250\+/);
  assert.match(stats, /contr(?:ô|&ocirc;)les automatiques sur plus de 230 points potentiels selon le bien/i);
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

test("one-off offers precede a separate subscription section at every viewport", () => {
  const pricing = source("src/components/sections/Pricing.astro");
  const unit = pricing.indexOf('<!-- Analyse unique -->');
  const pack = pricing.indexOf('<!-- Pack 5 -->');
  const packTen = pricing.indexOf('<!-- Pack 10 -->');
  const subscriptions = pricing.indexOf('id="si-subscriptions"');
  const search = pricing.indexOf('<!-- Pass Recherche');
  assert.ok(unit < pack && pack < packTen && packTen < subscriptions && subscriptions < search, 'subscriptions must follow the three one-off offers');
  assert.match(pricing.slice(unit, pack), /si-pricing-primary/);
  assert.match(pricing.slice(unit, pack), /si-btn si-btn-primary si-pricing-cta/);
  assert.doesNotMatch(pricing.slice(search), /si-pricing-popular|Populaire|autant de biens que tu veux/);
  assert.doesNotMatch(pricing, /order:\s*-1|repeat\(4,\s*1fr\)/);
});

test("the public professional offer never routes through the exclusive IAD offer", () => {
  const pricing = source("src/components/sections/Pricing.astro");
  assert.doesNotMatch(pricing, /app\.score-immo\.fr\/iad/);
  assert.match(pricing, /href="https:\/\/app\.score-immo\.fr\/go\/checkout\/premium"/);
});

test("pricing feature descriptions distinguish simulations from sourced observations", () => {
  const pricing = source("src/components/sections/Pricing.astro");
  assert.doesNotMatch(pricing, /sur les loyers m\\u00e9dians|cartographie PPBE en d\\u00e9cibels|Donn\\u00e9es directes ADEME|10 \\u00e0 20%/);
  assert.match(pricing, /hypothèses/);
  assert.match(pricing, /diagnostic/);
});

test("active sales surfaces use the new catalog without rewriting historic purchases", () => {
  const files = ['src/components/AnalyzerBox.astro','src/components/sections/Hero.astro','src/components/sections/CTA.astro','src/components/sections/Pricing.astro','src/pages/pages/tarifs.astro','src/data/homepage-jsonld.ts','src/data/pages/cgv.json','src/data/pages/outils.json','public/llms.txt'];
  for (const file of files) {
    assert.doesNotMatch(source(file), /4,99|"4\.99"|checkout\/(?:unit_v2|pack_3)(?:"|\?)|pack de 3|3 rapports|3 analyses/i, file);
  }
  assert.match(source('src/data/pages/cgv.json'), /achats antérieurs restent inchangés/);
});
