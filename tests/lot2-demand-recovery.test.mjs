import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the analysis guide owns the pre-visit educational intent", () => {
  const article = JSON.parse(
    readFileSync(
      new URL(
        "src/content/articles/guides/analyser-annonce-immobiliere-comme-pro.json",
        root,
      ),
      "utf8",
    ),
  );

  assert.equal(
    article.title,
    "Comment analyser une annonce immobilière avant la visite",
  );
  assert.equal(
    article.meta_title,
    "Comment analyser une annonce immobilière avant une visite",
  );
  assert.equal(
    article.meta_description,
    "Prix, DPE, diagnostics, photos, copropriété et quartier : la checklist pour vérifier une annonce immobilière avant de visiter ou de faire une offre.",
  );
  assert.ok(article.meta_title.length <= 60);
  assert.ok(article.meta_description.length >= 120);
  assert.ok(article.meta_description.length <= 160);
  assert.equal(article.handle, "analyser-annonce-immobiliere-comme-pro");
});

test("article analyzers use the canonical brand and a bounded buyer-side claim", () => {
  const analyzer = readFileSync(
    new URL("src/components/AnalyzerBox.astro", root),
    "utf8",
  );

  assert.doesNotMatch(analyzer, /dans ScoreImmo/);
  assert.match(analyzer, /dans Score-Immo/);
  assert.doesNotMatch(analyzer, /100% indépendant/);
  assert.match(analyzer, /analyse conçue du côté de l'acheteur/);
});
