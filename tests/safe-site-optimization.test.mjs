import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { findNestedAnchors } from "../scripts/html-link-integrity.mjs";
import { buildBarometreMetaDescription } from "../src/lib/barometre-meta-description.js";
import { applyCuratedInternalLinks } from "../src/lib/curated-internal-links.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function descriptionFrom(path) {
  const source = read(path);
  const match = source.match(/const description = ("(?:\\.|[^"\\])*");/);
  assert.ok(match, `${path} must declare a static description`);
  return JSON.parse(match[1]);
}

function article(path) {
  return JSON.parse(read(`src/content/articles/${path}.json`));
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("noindex pages are absent from the sitemap and have one robots source", () => {
  const config = read("astro.config.mjs");
  const efficityPage = read("src/pages/pages/efficity.astro");
  const efficityBody = read("src/components/sections/LandingEfficity.astro");
  const middleware = read("functions/_middleware.ts");

  assert.match(config, /\/pages\/efficity/);
  assert.match(config, /\/pages\/llms-txt/);
  assert.match(efficityPage, /<BaseLayout[^>]*noindex/);
  assert.doesNotMatch(efficityBody, /<meta\s+name=["']robots["']/i);
  assert.match(middleware, /NOINDEX_PATHS/);
  assert.match(middleware, /['"]\/pages\/efficity['"]/);
  assert.match(middleware, /['"]\/pages\/llms-txt['"]/);
  assert.match(
    middleware,
    /response\.status === 404\s*\|\|\s*NOINDEX_PATHS\.has\(normalizedPath\)/,
  );
});

test("legacy dynamic pages exclude every dedicated static implementation", () => {
  const route = read("src/pages/pages/[slug].astro");
  for (const handle of [
    "calculateur-capacite-emprunt",
    "calculateur-frais-de-notaire",
    "calculateur-mensualite-credit",
    "calculateur-rendement-locatif",
    "efficity",
    "guide",
    "tarifs",
  ]) {
    assert.match(route, new RegExp(`['\"]${handle}['\"]`), handle);
  }
});

test("article analyzer is truthful, natively validated and privacy-safe", () => {
  const analyzer = read("src/components/AnalyzerBox.astro");

  assert.match(analyzer, /Démo complète gratuite/);
  assert.match(analyzer, /Rapport personnalisé dès 2,99 €/);
  assert.doesNotMatch(analyzer, /Gratuit pour commencer/);
  assert.doesNotMatch(analyzer, /<form[^>]*\bnovalidate\b/);
  assert.match(analyzer, /<input[\s\S]*type="url"[\s\S]*required/);
  assert.match(analyzer, /const formId[\s\S]{0,160}medium/);
  assert.match(analyzer, /data-form-id=\{formId\}/);
  assert.doesNotMatch(analyzer, /data-form-id="article_analyzer"/);
  assert.doesNotMatch(analyzer, /listing_url|\.value/);
});

test("calculator descriptions are human-readable and relevant", () => {
  const calculators = new Map([
    ["capacite-emprunt", /capacité d'emprunt/i],
    ["frais-de-notaire", /frais de notaire/i],
    ["mensualite-credit", /mensualité/i],
    ["rendement-locatif", /rendement locatif/i],
  ]);

  for (const [handle, subject] of calculators) {
    const description = descriptionFrom(`src/pages/pages/calculateur-${handle}.astro`);
    assert.ok(description.length >= 70 && description.length <= 160, handle);
    assert.match(description, subject, handle);
    assert.doesNotMatch(description, /(?:<|>|class=|\bdiv\b)/i, handle);
  }
});

test("FAQ structured data is visible and generated from the same pricing source", () => {
  const homepage = read("src/data/homepage-jsonld.ts");
  const pricing = read("src/components/sections/Pricing.astro");
  const pricingPage = read("src/pages/pages/tarifs.astro");

  assert.doesNotMatch(homepage, /["']@type["']:\s*["']FAQPage["']/);
  assert.match(pricing, /const pricingFaq\s*=/);
  assert.match(pricing, /mainEntity:\s*pricingFaq\.map/);
  assert.match(pricing, /\{pricingFaqItems\.map/);
  assert.match(pricing, /aria-expanded="false"/);
  assert.match(pricing, /aria-controls=\{panelId\}/);
  assert.match(pricing, /aria-labelledby=\{triggerId\}/);
  assert.match(pricing, /\shidden/);
  assert.match(read("public/assets/scoreimmo-interactions.js"), /setAttribute\(['"]aria-expanded['"]/);
  assert.match(read("src/layouts/BaseLayout.astro"), /scoreimmo-interactions\.js\?v=20260818/);
  assert.doesNotMatch(pricing, /["']@type["']:\s*["']Product["']/);
  assert.match(pricingPage, /["']@type["']:\s*["']Product["']/);
  assert.doesNotMatch(pricing.split('---')[1], /&(?:eacute|egrave|ecirc|agrave|ocirc|ccedil);/i);
  assert.doesNotMatch(pricing, /\b(?:vous|vos|votre|collez|copiez|remettez)\b/i);
  assert.doesNotMatch(pricing, /D&eacute;cidez/i);
});

test("legal privacy links and verified publisher fields are first-party", () => {
  const legal = JSON.parse(read("src/data/pages/mentions-legales.json")).body_html;
  const route = read("src/pages/pages/[slug].astro");

  assert.equal(count(legal, 'href="/pages/politique-de-confidentialite"'), 1);
  assert.match(legal, /Augustin Foucheres/);
  assert.match(legal, /890 838 709/);
  assert.doesNotMatch(legal, /\[PRÉNOM NOM\]|claude\.ai/i);
  assert.doesNotMatch(route, /claude\.ai/i);
});

test("contact and privacy pages expose a single logical heading hierarchy", () => {
  const route = read("src/pages/pages/[slug].astro");

  assert.match(route, /page\.handle === 'contact'[\s\S]{0,180}<h1>Contactez-nous<\/h1>/);
  assert.match(route, /page\.handle === 'politique-de-confidentialite'[\s\S]{0,180}<h1>Politique de confidentialité<\/h1>/);
  assert.match(route, /replaceAll\('<h3>', '<h2>'\)/);
  assert.match(route, /replaceAll\('<\/h3>', '<\/h2>'\)/);
});

test("page metadata and Barometer wording preserve human grammar", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  const legacyPage = read("src/pages/pages/[slug].astro");
  const fiche = read("src/pages/barometre/[slug].astro");
  const hub = read("src/pages/blogs/[blog]/index.astro");

  assert.match(layout, /articleMeta\?\.author\s*\|\|\s*['"]ScoreImmo['"]/);
  assert.match(legacyPage, /replace\(\/<\[\^>\]\*>\/g,\s*['"] ['"]\)/);
  assert.match(fiche, /typeAgreement/);
  assert.match(fiche, /indefiniteArticle/);
  assert.match(fiche, /\$\{typeAgreement\}/);
  assert.match(hub, /<h2 class="si-blog-card-title">/);
  assert.doesNotMatch(hub, /<h3 class="si-blog-card-title">/);
});

test("Barometer descriptions keep complete sentences instead of cutting words", () => {
  const fiche = read("src/pages/barometre/[slug].astro");
  assert.match(fiche, /buildBarometreMetaDescription/);
  assert.doesNotMatch(fiche, /description[\s\S]{0,220}\.slice\(0,\s*160\)/);

  const contentDir = new URL("src/content/barometre/", root);
  let baseFallbacks = 0;
  for (const filename of readdirSync(contentDir).filter((name) => name.endsWith(".json"))) {
    const data = JSON.parse(read(`src/content/barometre/${filename}`));
    const description = buildBarometreMetaDescription(data);
    const base = buildBarometreMetaDescription({ ...data, verdict: "" });
    const full = `${base} ${String(data.verdict || "").replace(/\s+/g, " ").trim()}`.trim();
    assert.ok(description.length <= 160, filename);
    assert.ok(description === base || description === full, filename);
    if (description === base && full !== base) baseFallbacks += 1;
  }
  assert.ok(baseFallbacks > 0);
});

test("bounded visible French copy keeps required accents", () => {
  const tools = read("src/pages/pages/[slug].astro");
  const demo = read("src/components/sections/DemoMockup.astro");
  const features = read("src/components/sections/Features.astro");

  for (const text of [
    "Outils de simulation immobilière",
    "met à disposition",
    "capacité d'emprunt",
    "Mensualité de crédit",
    "coût total de l'achat",
    "dès 2,99 euros",
  ]) assert.match(tools, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(demo, /Quartier estimé/);
  assert.match(demo, /Prix affiché/);
  assert.match(features, /Coût total/);
  assert.match(features, /Taxe foncière/);
});

test("measured contrast defects use the established accessible palette", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /s >= 40 \? '#B45309'/);
});

test("mobile menu exposes state, blocks closed focus and supports keyboard closure", () => {
  const header = read("src/components/Header.astro");

  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="si-mobile-drawer"/);
  assert.match(header, /id="si-mobile-drawer"[^>]*aria-hidden="true"[^>]*inert/);
  assert.match(header, /setAttribute\(['"]aria-expanded['"]/);
  assert.match(header, /\.inert\s*=/);
  assert.match(header, /event\.key === ['"]Escape['"]/);
  assert.match(header, /event\.key === ['"]Tab['"]/);
  assert.match(header, /btn\?\.focus\(\)/);
});

test("invalid Barometer geography is removed and guarded from regeneration", () => {
  const rejected = [
    "la-roche-guyon-appartement-45m2-99k",
    "maxeville-appartement-74m2-97k",
    "nancy-appartement-47m2-96k",
    "sons-et-roncheres-maison-92m2-25k",
  ];
  for (const slug of rejected) {
    assert.equal(
      existsSync(new URL(`src/content/barometre/${slug}.json`, root)),
      false,
      slug,
    );
  }

  const cayenne = JSON.parse(
    read("src/content/barometre/cayenne-appartement-29m2-105k.json"),
  );
  assert.equal(cayenne.region, "Guyane");

  const generator = read("scripts/gen-barometre.mjs");
  for (const slug of rejected) assert.match(generator, new RegExp(slug));
  assert.match(generator, /region[\s\S]{0,120}France/);
});

test("curated article relationships are present once in each approved direction", () => {
  const edges = [
    ["guides/dpe-comprendre-classes-energetiques", "/blogs/guides/acheter-bien-dpe-vierge-risques"],
    ["guides/negocier-prix-bien-immobilier-guide-complet", "/blogs/guides/frais-agence-immobiliere-negocier"],
    ["guides/frais-agence-immobiliere-negocier", "/blogs/guides/negocier-prix-bien-immobilier-guide-complet"],
    ["guides/syndic-benevole-avantages-limites-conditions-legales", "/blogs/guides/analyser-pv-ag-copropriete-avant-achat"],
    ["guides/analyser-pv-ag-copropriete-avant-achat", "/blogs/guides/syndic-benevole-avantages-limites-conditions-legales"],
    ["villes/prix-immobilier-bordeaux-quartiers-tendances", "/blogs/quartiers/bordeaux-rive-droite-immobilier"],
    ["villes/prix-immobilier-strasbourg-marche-frontalier", "/blogs/quartiers/micro-quartiers-strasbourg-achat-authentique"],
    ["quartiers/micro-quartiers-strasbourg-achat-authentique", "/blogs/villes/prix-immobilier-strasbourg-marche-frontalier"],
    ["guides/loi-pinel-2026-conditions-plafonds-alternatives", "/blogs/guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser"],
    ["guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser", "/blogs/guides/loi-pinel-2026-conditions-plafonds-alternatives"],
    ["guides/achat-immobilier-montagne-specificites", "/blogs/villes/prix-immobilier-annecy-2026-lac-frontiere-suisse-tension"],
    ["quartiers/meilleurs-quartiers-acheter-lyon", "/blogs/quartiers/ou-habiter-pres-de-lyon"],
    ["quartiers/meilleurs-quartiers-acheter-reims-2026", "/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris"],
    ["guides/investissement-locatif-rentabilite-fiscalite-villes", "/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris"],
    ["guides/visite-immobiliere-checklist-points-verifier", "/blogs/guides/acheter-appartement-dernier-etage"],
    ["guides/terrain-constructible-plu-permis-pieges-cadastre", "/blogs/guides/etude-de-sol-g1-obligatoire-achat-terrain"],
    ["guides/dossier-diagnostic-technique-ddt-checklist-acheteur", "/blogs/guides/diagnostic-assainissement-non-collectif-achat"],
    ["guides/copropriete-charges-pieges-detecter-achat", "/blogs/guides/syndic-benevole-avantages-limites-conditions-legales"],
    ["quartiers/meilleurs-quartiers-acheter-rennes", "/blogs/villes/prix-immobilier-rennes-boom-breton"],
    ["villes/prix-immobilier-paris-marche-plancher", "/blogs/quartiers/meilleurs-quartiers-acheter-paris"],
    ["quartiers/meilleurs-quartiers-acheter-lille", "/blogs/villes/prix-immobilier-lille-metropole-sous-cotee"],
    ["guides/dpe-comprendre-classes-energetiques", "/blogs/guides/dpe-2026-impact-reel-prix-vente-d-bien"],
  ];

  for (const [from, to] of edges) {
    const html = applyCuratedInternalLinks(from, article(from).body_html);
    assert.equal(count(html, `href="${to}"`), 1, `${from} -> ${to}`);
  }

  const rules = read("src/lib/curated-internal-links.js");
  assert.doesNotMatch(rules, /contrôle que le calendrier est réaliste\. Consultez/);
  assert.match(rules, /contrôle que le calendrier est réaliste\. Consulte/);
});

test("priority internal links use the approved contextual anchors", () => {
  const anchors = [
    ["guides/achat-immobilier-montagne-specificites", "/blogs/villes/prix-immobilier-annecy-2026-lac-frontiere-suisse-tension", "marché immobilier d'Annecy"],
    ["quartiers/meilleurs-quartiers-acheter-lyon", "/blogs/quartiers/ou-habiter-pres-de-lyon", "où habiter près de Lyon"],
    ["quartiers/meilleurs-quartiers-acheter-reims-2026", "/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris", "marché immobilier de Reims"],
    ["guides/investissement-locatif-rentabilite-fiscalite-villes", "/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris", "Reims"],
    ["guides/visite-immobiliere-checklist-points-verifier", "/blogs/guides/acheter-appartement-dernier-etage", "achat au dernier étage"],
    ["guides/terrain-constructible-plu-permis-pieges-cadastre", "/blogs/guides/etude-de-sol-g1-obligatoire-achat-terrain", "<strong>étude géotechnique préalable de type G1</strong>"],
    ["guides/dossier-diagnostic-technique-ddt-checklist-acheteur", "/blogs/guides/diagnostic-assainissement-non-collectif-achat", "<strong>Assainissement non collectif</strong>"],
    ["guides/copropriete-charges-pieges-detecter-achat", "/blogs/guides/syndic-benevole-avantages-limites-conditions-legales", "conditions et limites d'un syndic bénévole"],
    ["quartiers/meilleurs-quartiers-acheter-rennes", "/blogs/villes/prix-immobilier-rennes-boom-breton", "prix immobilier à Rennes"],
    ["villes/prix-immobilier-paris-marche-plancher", "/blogs/quartiers/meilleurs-quartiers-acheter-paris", "meilleurs quartiers où acheter à Paris"],
    ["quartiers/meilleurs-quartiers-acheter-lille", "/blogs/villes/prix-immobilier-lille-metropole-sous-cotee", "prix immobilier à Lille"],
    ["guides/dpe-comprendre-classes-energetiques", "/blogs/guides/dpe-2026-impact-reel-prix-vente-d-bien", "impact réel du DPE sur le prix de vente"],
  ];

  for (const [from, to, anchorHtml] of anchors) {
    const html = applyCuratedInternalLinks(from, article(from).body_html);
    assert.ok(html.includes(`<a href="${to}">${anchorHtml}</a>`), `${from} -> ${anchorHtml}`);
  }
});

test("article HTML never nests one anchor inside another", () => {
  assert.deepEqual(findNestedAnchors('<a href="/outer">outer <a href="/inner">inner</a></a>').map(({ href }) => href), ["/inner"]);
  assert.deepEqual(findNestedAnchors('<a href="/first">first</a><a href="/second">second</a>'), []);

  const violations = [];
  const articlesRoot = new URL("src/content/articles/", root);

  for (const group of readdirSync(articlesRoot, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    const groupRoot = new URL(`${group.name}/`, articlesRoot);
    for (const file of readdirSync(groupRoot, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".json")) continue;
      const html = JSON.parse(readFileSync(new URL(file.name, groupRoot), "utf8")).body_html || "";
      for (const issue of findNestedAnchors(html)) {
        violations.push(`${group.name}/${file.name}:${issue.offset}:${issue.href}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("the layout imports only the French-compatible Latin font subsets", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  assert.doesNotMatch(layout, /@fontsource\/(?:inter|dm-sans)\/\d{3}\.css/);
  for (const entry of [
    "inter/latin-400.css",
    "inter/latin-500.css",
    "inter/latin-600.css",
    "inter/latin-700.css",
    "inter/latin-800.css",
    "dm-sans/latin-600.css",
    "dm-sans/latin-700.css",
    "dm-sans/latin-800.css",
  ]) {
    assert.match(layout, new RegExp(entry.replace("/", "\\/")));
  }
});

test("standards audit scans Astro file builds exhaustively and fails on page defects", () => {
  const audit = read("scripts/audit_standards.py");
  assert.match(audit, /rglob\(["']\*\.html["']\)/);
  assert.match(audit, /pages_checked/);
  assert.match(audit, /failing_keys[\s\S]{0,240}["']heading_issues["']/);
  assert.match(audit, /if key in failing_keys and items:[\s\S]{0,80}exit_code\s*=\s*1/);
  assert.doesNotMatch(audit, /html_file\.parent\.relative_to/);
});
