import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

test("the city Dataset links its sources without declaring incomplete nested Datasets", () => {
  const hub = read("src/pages/blogs/[blog]/index.astro");
  assert.doesNotMatch(hub, /"isBasedOn":\s*\[\s*\{\s*"@type":\s*"Dataset"/);
  assert.match(
    hub,
    /"isBasedOn":\s*\[\s*"https:\/\/www\.data\.gouv\.fr\/fr\/datasets\/demandes-de-valeurs-foncieres-geolocalisees\/"/,
  );
});

test("IndexNow runs after deployment and targets changed article URLs", () => {
  const deploy = read(".github/workflows/deploy.yml");
  const blogAuto = read(".github/workflows/blog-auto.yml");
  const blogWorkflowName = "Blog Auto - publish prepared or queue next article";
  assert.match(blogAuto, new RegExp(`^name: ${blogWorkflowName}$`, "m"));
  assert.ok(
    deploy.includes(`workflows: ["${blogWorkflowName}"]`),
    "the deploy workflow_run trigger must exactly match the blog workflow name",
  );
  assert.ok(
    deploy.indexOf("Deploy to Cloudflare Pages") < deploy.indexOf("Notify IndexNow after deployment"),
    "IndexNow must run only after Cloudflare has published the content",
  );
  assert.doesNotMatch(blogAuto, /name:\s*Ping IndexNow/);

  const result = spawnSync(
    "python3",
    [
      "scripts/indexnow_ping.py",
      "--dry-run",
      "--changed-files",
      "src/content/articles/villes/prix-immobilier-paris-marche-plancher.json",
      "src/data/pages/tarifs.json",
    ],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /https:\/\/score-immo\.fr\/blogs\/villes\/prix-immobilier-paris-marche-plancher/,
  );
  assert.match(result.stdout, /https:\/\/score-immo\.fr\/pages\/tarifs/);
  assert.doesNotMatch(result.stdout, /Pinging 303 URLs/);
});
