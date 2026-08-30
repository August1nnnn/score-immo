import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("la page nomme directement le Barometre immobilier", () => {
  const hub = read("src/pages/barometre/index.astro");
  assert.match(hub, /Le Baromètre immobilier Score-Immo/);
  assert.doesNotMatch(hub, /<h1[^>]*>Le Baromètre<\/h1>/);
});

test("le footer compacte les liens utiles sans supprimer les destinations", () => {
  const footer = read("src/components/Footer.astro");
  const styles = read("public/assets/scoreimmo.css");
  assert.match(footer, /si-footer-links--compact/);
  assert.match(styles, /\.si-footer-links--compact\s*\{[^}]*column-gap:\s*0\.75rem[^}]*row-gap:\s*0\.5rem/s);
  for (const label of ["Tarifs", "CGV", "Mentions légales", "Confidentialité", "Contact"]) {
    assert.match(footer, new RegExp(`>${label}<`));
  }
});

test("le rendu Baromètre n'invente aucune section absente", () => {
  const detail = read("src/pages/barometre/[slug].astro");
  const hub = read("src/pages/barometre/index.astro");
  const region = read("src/pages/barometre/region/[slug].astro");

  assert.match(detail, /sectionsForScoreGrid\(fiche\.methodology_version, fiche\.score_sections\)/);
  assert.doesNotMatch(detail, /fiche\.score_sections\[s\.key\]\s*\?\?\s*0/);
  assert.match(hub, /scoreSectionCountRange\(current\)/);
  assert.match(region, /scoreSectionCountRange\(fiches\)/);
});
