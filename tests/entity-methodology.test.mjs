import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("one shared entity defines the canonical Score-Immo organization", () => {
  const entity = read("src/data/entity.ts");
  const layout = read("src/layouts/BaseLayout.astro");

  assert.match(entity, /BRAND_NAME = ['"]Score-Immo['"]/);
  assert.match(entity, /['"]ScoreImmo['"]/);
  assert.match(entity, /['"]Score Immo['"]/);
  assert.match(entity, /ORGANIZATION_ID = [`'"]https:\/\/score-immo\.fr\/#organization/);
  assert.match(entity, /https:\/\/www\.wikidata\.org\/wiki\/Q140289914/);
  assert.match(entity, /plateforme française d'analyse de biens immobiliers à partir de données publiques/i);

  assert.match(layout, /organizationJsonLd/);
  assert.match(layout, /const structuredData = \[organizationJsonLd, \.\.\.jsonLd\]/);
  assert.match(layout, /const siteName = BRAND_NAME/);
  assert.match(layout, /articleMeta\?\.author \|\| BRAND_NAME/);
});

test("principal structured templates reference the same organization id", () => {
  const templates = [
    "src/data/homepage-jsonld.ts",
    "src/pages/blogs/[blog]/[slug].astro",
    "src/pages/blogs/[blog]/index.astro",
    "src/pages/pro.astro",
    "src/pages/barometre/index.astro",
    "src/pages/barometre/[slug].astro",
    "src/pages/barometre/region/[slug].astro",
  ];

  for (const path of templates) {
    const source = read(path);
    assert.match(source, /ORGANIZATION_ID/, path);
    assert.doesNotMatch(source, /(?:name|"name"):\s*["']ScoreImmo["']/, path);
  }

  const article = read("src/pages/blogs/[blog]/[slug].astro");
  assert.doesNotMatch(article, /market 40%|cinq sous-scores pondérés|Prix face au marché \(DVF\)[\s\S]*value: '40%'/);
});

test("the about page exposes the verified service and publisher", () => {
  const about = read("src/pages/a-propos.astro");

  for (const expected of [
    "À propos de Score-Immo",
    "plateforme française d'analyse de biens immobiliers à partir de données publiques",
    "conçue du côté de l'acheteur",
    "Augustin Foucheres",
    "890 838 709",
    "/methodologie",
    "/pages/mentions-legales",
  ]) {
    assert.ok(about.includes(expected), expected);
  }

  assert.match(about, /AboutPage/);
  assert.match(about, /ORGANIZATION_ID/);
  assert.doesNotMatch(about, /premier outil|leader|aucun concurrent|100% indépendant/i);
});

test("the methodology page documents the live scoring contract and its limits", () => {
  const method = read("src/pages/methodologie.astro");

  for (const expected of [
    "Méthodologie Score-Immo",
    "Version publique de la méthode en vigueur au 28 août 2026",
    "13 sections",
    "Prix face au marché",
    "18 %",
    "Performance énergétique",
    "12 %",
    "Actualités locales",
    "3 %",
    "poids effectif",
    "poids source",
    "donnée insuffisante ou non autoritative",
    "indice de confiance A, B ou C",
    "instantanés datés",
    "échantillon de fiches publiées",
    "Politique de correction",
    "contact@score-immo.fr",
  ]) {
    assert.ok(method.includes(expected), expected);
  }

  for (const source of [
    "data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres",
    "observatoire-dpe-audit.ademe.fr",
    "georisques.gouv.fr",
    "insee.fr",
    "geoportail-urbanisme.gouv.fr",
    "adresse.data.gouv.fr",
    "openstreetmap.org",
    "data.education.gouv.fr",
    "atmo-france.org",
    "data.economie.gouv.fr",
  ]) {
    assert.ok(method.includes(source), source);
  }

  assert.match(method, /WebPage/);
  assert.match(method, /APPLICATION_ID/);
  assert.match(method, /ORGANIZATION_ID/);
  assert.doesNotMatch(method, /plus de 250|40 %<\/td>|toutes les données.*officielles/i);
});

test("the obsolete scoring article is consolidated without a redirect chain", () => {
  const helper = read("src/lib/redirected-articles.ts");
  const articleTemplate = read("src/pages/blogs/[blog]/[slug].astro");
  const hubTemplate = read("src/pages/blogs/[blog]/index.astro");
  const redirects = read("public/_redirects");

  assert.match(helper, /score-scoreimmo-methode-evaluation/);
  assert.match(helper, /isRedirectedArticle/);
  assert.match(articleTemplate, /isRedirectedArticle/);
  assert.match(hubTemplate, /isRedirectedArticle/);

  assert.match(
    redirects,
    /^\/blogs\/guides\/score-scoreimmo-methode-evaluation \/methodologie 301$/m,
  );
  assert.match(
    redirects,
    /^\/blogs\/guides\/score-scoreimmo-méthode-evaluation \/methodologie 301$/m,
  );
});

test("global navigation links the institutional sources of truth", () => {
  const header = read("src/components/Header.astro");
  const footer = read("src/components/Footer.astro");

  assert.match(header, />Score-Immo</);
  assert.match(footer, />Score-Immo &copy;/);
  assert.match(footer, /href="\/a-propos"/);
  assert.match(footer, /href="\/methodologie"/);
});

test("barometer templates identify dated samples instead of the national market", () => {
  const pages = [
    "src/pages/barometre/index.astro",
    "src/pages/barometre/[slug].astro",
    "src/pages/barometre/region/[slug].astro",
  ].map(read).join("\n");

  assert.match(pages, /instantanés datés/);
  assert.match(pages, /échantillon/);
  assert.match(pages, /href="\/methodologie"/);
  assert.doesNotMatch(pages, /La notation est indépendante/);
});

test("new public surfaces contain no em or en dash", () => {
  const surfaces = [
    "src/data/entity.ts",
    "src/pages/a-propos.astro",
    "src/pages/methodologie.astro",
    "src/components/Header.astro",
    "src/components/Footer.astro",
  ].map(read).join("\n");

  assert.doesNotMatch(surfaces, /[—–]/);
});
