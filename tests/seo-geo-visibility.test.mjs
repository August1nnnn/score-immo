import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the homepage uses a stable, descriptive H1", () => {
  const hero = read("src/components/sections/Hero.astro");
  assert.match(hero, /Analysez une annonce[\s\S]*immobilière/);
  assert.doesNotMatch(hero, /id="si-hero-word"/);
  assert.doesNotMatch(hero, /Mot rotatif du titre/);
});

test("public machine-readable facts use canonical URLs and source counts", () => {
  const llms = read("public/llms.txt");
  assert.match(llms, /10 sources de donnees officielles francaises/);
  assert.match(llms, /Sources de donnees officielles \(10\)/);
  assert.match(llms, /https:\/\/score-immo\.fr\/barometre/);
  assert.doesNotMatch(llms, /https:\/\/app\.score-immo\.fr\/barometre/);
});

test("high-impression pages target their observed search intent", () => {
  const paris = JSON.parse(read("src/content/articles/villes/prix-immobilier-paris-marche-plancher.json"));
  assert.match(paris.title, /Prix immobilier à Paris en 2026/i);
  assert.match(paris.meta_title, /Prix immobilier Paris 2026/i);

  const hub = read("src/pages/blogs/[blog]/index.astro");
  assert.match(hub, /évolution des prix immobiliers par ville/i);
  assert.match(hub, /si-collection-summary/);
});

test("the primary accent passes WCAG AA with white text", () => {
  const css = read("public/assets/scoreimmo.css");
  assert.match(css, /--si-accent:\s*#2563EB/i);
  assert.match(css, /--si-accent-hover:\s*#1D4ED8/i);
});

test("the shared stylesheet is cache-busted after accessibility changes", () => {
  const layout = read("src/layouts/BaseLayout.astro");
  assert.match(layout, /\/assets\/scoreimmo\.css\?v=20260730-seo-geo/g);
});

test("the decorative report preview does not introduce a skipped heading", () => {
  const demo = read("src/components/sections/DemoMockup.astro");
  assert.doesNotMatch(demo, /<h3[^>]*>Appartement T3/);
});

test("editorial components preserve heading order and readable status colors", () => {
  const analyzer = read("src/components/AnalyzerBox.astro");
  const author = read("src/components/AuthorCard.astro");
  const barometer = read("src/components/BarometreLinks.astro");
  const sources = read("src/components/SourcesSection.astro");

  assert.match(analyzer, /<h2 class="sib-h">/);
  assert.match(author, /#2563EB/);
  assert.match(barometer, /#15803D/);
  assert.match(barometer, /#B45309/);
  assert.match(sources, /#475569/);
});

test("legacy inline article CTAs receive accessible color overrides", () => {
  const css = read("public/assets/scoreimmo.css");
  assert.match(css, /\.si-article-body \.si-tool-cta > a/);
  assert.match(css, /\.si-article-body \.si-article-cta > a/);
  assert.match(css, /color:\s*#CBD5E1\s*!important/i);
});
