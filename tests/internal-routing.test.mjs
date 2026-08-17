import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const ARTICLES = new URL("../src/content/articles/", import.meta.url);

function walkJson(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkJson(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function articleRoute(path) {
  const category = relative(ARTICLES.pathname, path).split(sep)[0];
  return `/blogs/${category}/${basename(path, ".json")}`;
}

const LEGACY_ACCENTED_ROUTES = new Map([
  ["/blogs/guides/analyser-annonce-immobilière-comme-pro", "/blogs/guides/analyser-annonce-immobiliere-comme-pro"],
  ["/blogs/guides/diagnostic-electricite-points-contrôle-achat", "/blogs/guides/diagnostic-electricite-points-controle-achat"],
  ["/blogs/guides/dpe-classe-e-travaux-stratégie", "/blogs/guides/dpe-classe-e-travaux-strategie"],
  ["/blogs/guides/dpe-comprendre-classes-énergétiques", "/blogs/guides/dpe-comprendre-classes-energetiques"],
  ["/blogs/guides/dpe-projete-négocier-passoire-thermique", "/blogs/guides/dpe-projete-negocier-passoire-thermique"],
  ["/blogs/guides/estimation-immobilière-méthodes-juste-prix", "/blogs/guides/estimation-immobiliere-methodes-juste-prix"],
  ["/blogs/guides/investissement-locatif-rentabilité-fiscalite-villes", "/blogs/guides/investissement-locatif-rentabilite-fiscalite-villes"],
  ["/blogs/guides/marge-négociation-immobilier-2026", "/blogs/guides/marge-negociation-immobilier-2026"],
  ["/blogs/guides/négocier-prix-bien-immobilier-guide-complet", "/blogs/guides/negocier-prix-bien-immobilier-guide-complet"],
  ["/blogs/guides/offre-achat-immobilier-modèle-conseils-stratégie", "/blogs/guides/offre-achat-immobilier-modele-conseils-strategie"],
  ["/blogs/guides/renovation-énergétique-maprimerenov-2026-aides-rentabilité", "/blogs/guides/renovation-energetique-maprimerenov-2026-aides-rentabilite"],
  ["/blogs/guides/score-scoreimmo-méthode-evaluation", "/blogs/guides/score-scoreimmo-methode-evaluation"],
  ["/blogs/guides/travaux-renovation-énergétique-dpe-f-d", "/blogs/guides/travaux-renovation-energetique-dpe-f-d"],
  ["/blogs/guides/visite-immobilière-checklist-points-verifier", "/blogs/guides/visite-immobiliere-checklist-points-verifier"],
  ["/blogs/pro/crédibilité-mandataire-rapport-analyse-rassure-client", "/blogs/pro/credibilite-mandataire-rapport-analyse-rassure-client"],
  ["/blogs/pro/decrocher-mandat-exclusif-méthode-arguments", "/blogs/pro/decrocher-mandat-exclusif-methode-arguments"],
  ["/blogs/pro/iad-safti-capifrance-efficity-quel-réseau-mandataire-choisir", "/blogs/pro/iad-safti-capifrance-efficity-quel-reseau-mandataire-choisir"],
  ["/blogs/pro/mandataire-ou-agent-immobilier-différences", "/blogs/pro/mandataire-ou-agent-immobilier-differences"],
  ["/blogs/pro/pige-immobilière-2026-trouver-mandats", "/blogs/pro/pige-immobiliere-2026-trouver-mandats"],
  ["/blogs/pro/prospection-immobilière-techniques-qui-marchent", "/blogs/pro/prospection-immobiliere-techniques-qui-marchent"],
  ["/blogs/villes/prix-immobilier-nantes-évolution-previsions", "/blogs/villes/prix-immobilier-nantes-evolution-previsions"],
]);

test("all internal article links resolve to a canonical article route", () => {
  const files = walkJson(ARTICLES.pathname);
  const routes = new Set([
    "/blogs/guides",
    "/blogs/pro",
    "/blogs/quartiers",
    "/blogs/villes",
    ...files.map(articleRoute),
  ]);
  const broken = new Set();

  for (const file of files) {
    const article = JSON.parse(readFileSync(file, "utf8"));
    const from = articleRoute(file);
    for (const match of article.body_html.matchAll(/href=(?:"|')(\/blogs\/[^"'#?]+)(?:"|')/g)) {
      const target = decodeURI(match[1]).replace(/\/$/, "");
      if (!routes.has(target)) broken.add(`${from} -> ${target}`);
    }
  }

  assert.deepEqual([...broken], []);
});

test("legacy accented article routes permanently redirect to canonical routes", () => {
  const redirects = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");
  const rules = new Map(
    redirects
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const [source, destination, status] = line.split(/\s+/);
        return [source, { destination, status }];
      }),
  );

  for (const [source, destination] of LEGACY_ACCENTED_ROUTES) {
    assert.deepEqual(rules.get(source), { destination, status: "301" }, source);
  }
});

test("the site defines a crawl-safe custom 404 page", () => {
  const path = new URL("../src/pages/404.astro", import.meta.url);
  assert.equal(existsSync(path), true, "src/pages/404.astro must exist");
  const source = readFileSync(path, "utf8");
  assert.match(source, /<BaseLayout[\s\S]*noindex/);
  assert.match(source, /<h1[^>]*>Page introuvable<\/h1>/);
  assert.match(source, /href="\/"/);
});

test("404 responses override the global index crawler header", () => {
  const middleware = readFileSync(
    new URL("../functions/_middleware.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    middleware,
    /response\.status === 404[\s\S]{0,200}headers\.set\(\s*['"]x-robots-tag['"],\s*['"]noindex, follow['"]\s*\)/,
  );
});
