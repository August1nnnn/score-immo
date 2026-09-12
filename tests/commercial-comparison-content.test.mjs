import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const slugs = [
  "alternative-castorus-score-immo-comparatif",
  "analyser-bien-immobilier-score-immo-recherche-manuelle",
];
const readArticle = (slug) => JSON.parse(readFileSync(new URL(
  `src/content/articles/guides/${slug}.json`, root,
), "utf8"));
const visibleWords = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ");

test("les deux comparatifs commerciaux restent distincts, sourcés et honnêtes", () => {
  const castorus = readArticle(slugs[0]);
  const manual = readArticle(slugs[1]);

  assert.match(castorus.title, /Castorus/);
  assert.doesNotMatch(manual.title, /Castorus/);
  assert.match(manual.title, /recherche manuelle/i);
  assert.equal(castorus.last_reviewed, "2026-09-12");
  assert.equal(manual.last_reviewed, "2026-09-12");

  for (const article of [castorus, manual]) {
    const publicCopy = `${article.title} ${article.meta_description} ${article.tldr.join(" ")} ${article.body_html}`;
    assert.equal(article.author, "Score-Immo");
    assert.equal(article.author_handle, "scoreimmo");
    assert.ok(visibleWords(article.body_html).length >= 1200);
    assert.equal(article.word_count, visibleWords(article.body_html).length);
    assert.match(article.body_html, /href="https:\/\/app.score-immo.fr\/r\/demo/);
    assert.match(article.body_html, /href="https:\/\/app.score-immo.fr\/app/);
    assert.match(article.body_html, /href="\/tarifs"/);
    assert.match(article.body_html, /href="\/methodologie"/);
    assert.match(article.body_html, /2,99 € pour 1 rapport/);
    assert.match(article.body_html, /ne remplace/i);
    assert.doesNotMatch(publicCopy, /rapport personnalisé gratuit|rapport gratuit personnalisé|meilleur outil|sans risque|[—–]/i);
    assert.ok(article.sources.length >= 3);
    assert.ok(existsSync(new URL(`public${article.image.src}`, root)));
  }

  assert.match(castorus.body_html, /30 € TTC pour un mois/);
  assert.match(castorus.body_html, /10 consultations sur 7 jours glissants/);
  assert.match(castorus.body_html, /Publié par Score-Immo/i);
  assert.ok(castorus.sources.some(({ url }) => url === "https://www.castorus.com/extensions"));
  assert.ok(castorus.sources.some(({ url }) => url === "https://www.castorus.com/conditions-generales"));

  for (const source of [
    "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
    "https://observatoire-dpe-audit.ademe.fr/",
    "https://www.georisques.gouv.fr/",
    "https://www.geoportail-urbanisme.gouv.fr/",
  ]) assert.ok(manual.sources.some(({ url }) => url === source), source);
});

test("le maillage accompagne le choix sans dupliquer les guides existants", () => {
  const castorus = readArticle(slugs[0]);
  const manual = readArticle(slugs[1]);
  assert.match(castorus.body_html, /analyser-bien-immobilier-score-immo-recherche-manuelle/);
  assert.match(manual.body_html, /alternative-castorus-score-immo-comparatif/);
  assert.match(manual.body_html, /donnees-dvf-utiliser-prix-vente-reels/);
  assert.match(manual.body_html, /diagnostic-etat-risques-pollutions-erp/);
  assert.match(manual.body_html, /consulter-comprendre-plu-achat-immobilier/);
});
