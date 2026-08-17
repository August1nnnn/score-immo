import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const article = (path) => JSON.parse(read(path));

test("the first-purchase duplicate is removed and permanently redirected", () => {
  const duplicate = new URL(
    "src/content/articles/guides/erreurs-a-eviter-premier-achat-immobilier.json",
    root,
  );
  assert.equal(existsSync(duplicate), false);

  const redirects = read("public/_redirects");
  const rule = /^\/blogs\/guides\/erreurs-a-eviter-premier-achat-immobilier \/blogs\/guides\/premier-achat-immobilier-erreurs-eviter 301$/gm;
  assert.equal(redirects.match(rule)?.length, 1);

  const survivor = article(
    "src/content/articles/guides/premier-achat-immobilier-erreurs-eviter.json",
  );
  assert.match(survivor.meta_description, /10 erreurs à éviter/i);
  assert.ok(survivor.meta_description.length <= 160);

  const counterVisit = article(
    "src/content/articles/guides/checklist-contre-visite-immobiliere.json",
  ).body_html;
  assert.doesNotMatch(
    counterVisit,
    /href="\/blogs\/guides\/erreurs-a-eviter-premier-achat-immobilier"/,
  );
  assert.match(
    counterVisit,
    /href="\/blogs\/guides\/premier-achat-immobilier-erreurs-eviter"/,
  );
});

test("the DPE page aligns its visible title without changing its Bing title signal", () => {
  const dpe = article(
    "src/content/articles/guides/dpe-comprendre-classes-energetiques.json",
  );
  assert.match(dpe.title, /^Grille DPE 2026/i);
  assert.match(dpe.title, /classes A à G/i);
  assert.equal(
    dpe.meta_title,
    "Grille DPE 2026 : Classes A à G, Seuils kWh et Calcul de la Note",
  );
  assert.match(dpe.meta_description, /seuils kWh\/m²\/an/i);
  assert.ok(dpe.meta_description.length <= 160);
});

test("the negotiation cluster separates benchmarks from the procedural guide", () => {
  const negotiation = article(
    "src/content/articles/guides/negocier-prix-bien-immobilier-guide-complet.json",
  );
  const benchmarks = article(
    "src/content/articles/guides/marge-negociation-immobilier-2026.json",
  );
  assert.match(negotiation.title, /^Négocier le prix d'un bien immobilier/i);
  assert.match(negotiation.meta_title, /méthode et arguments/i);
  assert.match(negotiation.meta_description, /offre d'achat/i);
  assert.doesNotMatch(negotiation.meta_title, /^Marge de négociation/i);
  assert.ok(negotiation.meta_description.length <= 160);
  assert.match(benchmarks.title, /^Marge de Négociation Immobilier 2026/i);
  assert.match(benchmarks.meta_title, /selon la région/i);
});

test("the Bordeaux snippet targets neighbourhood comparison without an unsourced price promise", () => {
  const bordeaux = article(
    "src/content/articles/villes/prix-immobilier-bordeaux-quartiers-tendances.json",
  );
  assert.match(bordeaux.title, /^Prix immobilier Bordeaux 2026/i);
  assert.match(bordeaux.meta_title, /prix au m² par quartier/i);
  assert.match(bordeaux.meta_description, /comparez les quartiers/i);
  assert.doesNotMatch(bordeaux.meta_title, /\d[\d\s]*\s*€/);
  assert.doesNotMatch(bordeaux.meta_description, /\d[\d\s]*\s*€/);
  assert.ok(bordeaux.meta_description.length <= 160);
});

test("the city hub owns the comparison intent and links to priority pages", () => {
  const hub = read("src/pages/blogs/[blog]/index.astro");
  assert.match(hub, /Prix immobilier par ville 2026 : carte, m² et tendances/);
  assert.match(hub, /<div class="si-city-guide">/);
  assert.match(hub, /<h2[^>]*>Comment comparer les prix immobiliers par ville \?<\/h2>/);
  assert.match(hub, /<h2[^>]*>Explorer les marchés de Paris et Bordeaux<\/h2>/);
  assert.match(hub, /<h2[^>]*>Du prix au m² à la décision d'achat<\/h2>/);
  assert.match(hub, /\/blogs\/villes\/prix-immobilier-paris-marche-plancher/);
  assert.match(hub, /\/blogs\/villes\/prix-immobilier-bordeaux-quartiers-tendances/);
  assert.match(hub, /\/blogs\/guides\/dpe-comprendre-classes-energetiques/);
  assert.match(hub, /\/blogs\/guides\/marge-negociation-immobilier-2026/);
  assert.match(hub, /\/blogs\/guides\/negocier-prix-bien-immobilier-guide-complet/);
  assert.match(hub, /color:\s*var\(--si-muted-foreground,/);
  assert.doesNotMatch(hub, /color:\s*var\(--si-muted,/);
});

test("the Paris metadata stays unchanged until its source data is refreshed", () => {
  const paris = article(
    "src/content/articles/villes/prix-immobilier-paris-marche-plancher.json",
  );
  assert.equal(
    paris.title,
    "Prix immobilier à Paris en 2026 : carte et prix au m² par arrondissement",
  );
  assert.equal(
    paris.meta_title,
    "Prix immobilier Paris 2026 : carte du m² par arrondissement",
  );
  assert.equal(paris.updated_at, "2026-06-02");
});
