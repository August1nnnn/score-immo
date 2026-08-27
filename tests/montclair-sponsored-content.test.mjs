import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const immediatePath = "src/content/articles/guides/accompagnement-investissement-immobilier-qui-choisir.json";
const scheduledPath = "blog-auto/scheduled-content/valeur-immeuble-par-rapport-loyer.json";
const manifestPath = "blog-auto/scheduled/valeur-immeuble-par-rapport-loyer.manifest.json";

const read = (path) => readFileSync(new URL(path, ROOT), "utf8");
const parse = (path) => JSON.parse(read(path));
const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
const countWords = (html) => stripHtml(html).split(" ").filter(Boolean).length;
const sha256 = (path) => createHash("sha256").update(readFileSync(new URL(path, ROOT))).digest("hex");

function assertScoreImmoArticle(article, { anchor, url }) {
  assert.equal(article.author, "Score-Immo");
  assert.equal(article.author_handle, "scoreimmo");
  assert.equal(article.first_body_link_priority, true);
  assert.equal(article.word_count, countWords(article.body_html));
  assert.ok(article.word_count >= 2500, `expected at least 2500 words, got ${article.word_count}`);
  assert.ok(article.meta_title.length <= 60);
  assert.ok(article.meta_description.length >= 150 && article.meta_description.length <= 160);
  assert.doesNotMatch(article.body_html, /[—–]/);
  assert.match(article.body_html, /class='si-partnership-disclosure'/);

  const links = [...article.body_html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  assert.ok(links.length > 0);
  const firstLink = links[0];
  assert.match(firstLink[1], new RegExp(`href=['"]${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`));
  assert.equal(stripHtml(firstLink[2]), anchor);
  assert.match(firstLink[1], /rel=['"][^'"]*\bsponsored\b[^'"]*['"]/);

  const internalLinks = links.filter((link) => /href=['"]\/(?:blogs|pages)\//.test(link[1]));
  assert.ok(internalLinks.length >= 5, `expected 5 internal links, got ${internalLinks.length}`);
  assert.ok(article.sources.length >= 5);

  const h2 = [...article.body_html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((match) => stripHtml(match[1]));
  const bodyQuestions = h2.filter((title) => !["Sommaire", "Questions fréquentes"].includes(title));
  assert.ok(bodyQuestions.length >= 6);
  assert.ok(bodyQuestions.every((title) => title.endsWith("?")));
  assert.ok((article.body_html.match(/<h3>[^<]*\?[^<]*<\/h3>/g) || []).length >= 5);
}

test("the immediate Montclair article preserves its exact sponsored homepage link", () => {
  const article = parse(immediatePath);
  assertScoreImmoArticle(article, {
    anchor: "Montclair",
    url: "https://www.montclair.fr/",
  });
  assert.equal(article.handle, "accompagnement-investissement-immobilier-qui-choisir");
  assert.equal(article.last_reviewed, "2026-08-26");
  assert.ok(existsSync(new URL("public/images/articles/accompagnement-investissement-immobilier-qui-choisir.webp", ROOT)));
});

test("organization-authored articles do not resolve a fictional person record", () => {
  const articlePage = read("src/pages/blogs/[blog]/[slug].astro");
  assert.match(articlePage, /author: \{ '@type': 'Organization', name: 'Score-Immo'/);
  assert.doesNotMatch(articlePage, /getEntry\('authors'|AuthorCard/);
});

test("the FAQ schema recognizes the editorial Questions fréquentes heading", () => {
  const articlePage = read("src/pages/blogs/[blog]/[slug].astro");
  const faqExtractor = read("src/lib/extract-faq.js");
  assert.match(articlePage, /extractFaq\(bodyHtml\)/);
  assert.match(faqExtractor, /\(\?:FAQ\|Questions fréquentes\)/);
});

test("the September article is sealed outside the live collection", () => {
  const article = parse(scheduledPath);
  const manifest = parse(manifestPath);
  assertScoreImmoArticle(article, {
    anchor: "le faire estimé par Montclair",
    url: "https://www.montclair.fr/estimation-immeuble-de-rapport-en-ligne/",
  });
  assert.equal(article.handle, "valeur-immeuble-par-rapport-loyer");
  assert.equal(manifest.status, "pending");
  assert.equal(manifest.publish_at, "2026-09-25T08:00:00+02:00");
  assert.equal(manifest.article.sha256, sha256(scheduledPath));
  assert.equal(manifest.asset.sha256, sha256("blog-auto/scheduled-assets/valeur-immeuble-par-rapport-loyer.webp"));
  assert.equal(existsSync(new URL(manifest.article.target, ROOT)), false);
  assert.equal(existsSync(new URL(manifest.asset.target, ROOT)), false);
});
