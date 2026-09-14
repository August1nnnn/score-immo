import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const articlePath = "src/content/articles/guides/dpe-comprendre-classes-energetiques.json";
const partnerUrl = "https://reseaudiag.fr/guides/glossaire-dpe";
const partnerAnchor = "https://reseaudiag.fr/guides/glossaire-dpe";

const stripHtml = (html) => html
  .replace(/<[^>]*>/g, " ")
  .replace(/&[^;]+;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

test("eReferer RéseauDiag preserves the exact link contract and contextual placement", () => {
  const article = JSON.parse(readFileSync(new URL(articlePath, ROOT), "utf8"));
  const links = [...article.body_html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const partnerLinks = links.filter((link) => link[1].includes(partnerUrl));

  assert.equal(partnerLinks.length, 1, "the partner URL must appear in exactly one link");
  assert.equal(stripHtml(partnerLinks[0][2]), partnerAnchor);
  assert.match(partnerLinks[0][1], /rel=['"]noopener['"]/);
  assert.doesNotMatch(partnerLinks[0][1], /\bsponsored\b/);
  assert.match(partnerLinks[0][1], /target=['"]_blank['"]/);

  const unitsSection = article.body_html.match(
    /<h3 id="energie-primaire-finale">[\s\S]*?(?=<h2 id="changement-electricite-2026">)/,
  );
  assert.ok(unitsSection, "the energy-units section must remain present");
  assert.match(unitsSection[0], new RegExp(partnerUrl.replaceAll("/", "\\/")));
  assert.equal(article.updated_at, "2026-09-14");
  assert.equal(article.last_reviewed, "2026-09-10");
});
