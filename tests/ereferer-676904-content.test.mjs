import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const articlePath = "src/content/articles/guides/promesse-vente-vs-contrat-vente-suisse.json";
const imagePath = "public/images/articles/promesse-vente-vs-contrat-vente-suisse.webp";
const partnerUrl = "https://comptoir-immo.ch/vente/appartement/Vaud/Montreux/";
const partnerAnchor = "les appartements en vente chez Comptoir immobilier à Montreux";
const officialSources = new Set([
  "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_216",
  "https://www.vd.ch/territoire-et-construction/registre-foncier/informations-et-requisitions",
]);

const read = (path) => readFileSync(new URL(path, ROOT), "utf8");
const stripHtml = (html) => html
  .replace(/<[^>]*>/g, " ")
  .replace(/&[^;]+;/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const countWords = (html) => stripHtml(html).split(" ").filter(Boolean).length;

test("eReferer 676904 preserves its link contract and Swiss legal safeguards", () => {
  assert.ok(existsSync(new URL(articlePath, ROOT)), "the article must exist");
  assert.ok(existsSync(new URL(imagePath, ROOT)), "the local article image must exist");

  const article = JSON.parse(read(articlePath));
  assert.equal(article.title, "Promesse de vente vs contrat de vente en Suisse : différences et engagements légaux");
  assert.equal(article.handle, "promesse-vente-vs-contrat-vente-suisse");
  assert.equal(article.blog, "guides");
  assert.equal(article.author, "Score-Immo");
  assert.equal(article.author_handle, "scoreimmo");
  assert.equal(article.first_body_link_priority, true);
  assert.equal(article.last_reviewed, "2026-08-31");
  assert.equal(article.word_count, countWords(article.body_html));
  assert.ok(article.word_count >= 1600, `expected at least 1600 words, got ${article.word_count}`);
  assert.ok(article.meta_title.length <= 60);
  assert.ok(article.meta_description.length >= 145 && article.meta_description.length <= 160);
  assert.deepEqual(article.image, {
    src: "/images/articles/promesse-vente-vs-contrat-vente-suisse.webp",
    alt: "Acheteurs et notaire comparant une promesse et un contrat de vente immobilière en Suisse",
    width: 1200,
    height: 630,
  });

  assert.doesNotMatch(article.body_html, /[—–]/);
  assert.doesNotMatch(article.body_html, /<(?:font|colgroup)\b|\s(?:style|width|bgcolor|cellpadding|cellspacing)=/i);

  const links = [...article.body_html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  assert.ok(links.length > 0);
  assert.ok(links[0][1].includes(partnerUrl), "the partner URL must be the first body link");

  const partnerLinks = links.filter((link) => link[1].includes(partnerUrl));
  assert.equal(partnerLinks.length, 1);
  assert.equal(stripHtml(partnerLinks[0][2]), partnerAnchor);
  assert.doesNotMatch(partnerLinks[0][1], /\bsponsored\b/);
  assert.match(partnerLinks[0][1], /rel=['"]noopener['"]/);

  const bodyExternalLinks = links.filter((link) => /href=['"]https?:\/\//.test(link[1]));
  const internalLinks = links.filter((link) => /href=['"]\/(?:blogs|pages)\//.test(link[1]));
  assert.equal(bodyExternalLinks.length, 1);
  assert.ok(internalLinks.length >= 5, `expected at least 5 internal links, got ${internalLinks.length}`);
  assert.equal(article.sources.length, 2);
  assert.deepEqual(new Set(article.sources.map((source) => source.url)), officialSources);
  assert.equal(bodyExternalLinks.length + article.sources.length, 3);

  assert.match(article.body_html, /article 216/i);
  assert.match(article.body_html, /inscription au registre foncier/i);
  assert.match(article.body_html, /dépend(?:ent)? des clauses|selon les clauses/i);
  assert.doesNotMatch(article.body_html, /(?:acompte|frais)[\s\S]{0,80}(?:5 à 10|0,5|2 % à 5 %|2 à 5 %)/i);
  assert.doesNotMatch(article.body_html, /perd en principe l'acompte|impossibilité pratique d'aliéner/i);

  assert.match(article.body_html, /<table><thead><tr><th/);
  assert.match(article.body_html, /<tbody>/);
  assert.ok((article.body_html.match(/<h3>[^<]*\?[^<]*<\/h3>/g) || []).length >= 5);
});
