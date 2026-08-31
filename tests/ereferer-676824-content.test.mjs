import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const articlePath = "src/content/articles/guides/faut-il-etre-en-cdi-pour-investir-immobilier.json";
const imagePath = "public/images/articles/faut-il-etre-en-cdi-pour-investir-immobilier.webp";
const sponsoredUrl = "https://www.investir-epargne.fr/credit-immobilier-sans-cdi-quelles-alternatives-pour-les-non-salaries/";
const sponsoredAnchor = "obtenir un prêt immobilier sans CDI";
const officialSources = new Set([
  "https://www.economie.gouv.fr/files/files/directions_services/hcsf/HCSF_FAQ_decisions_octroi_credits_immobiliers.pdf?v=1701699781",
  "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032315947",
]);

const read = (path) => readFileSync(new URL(path, ROOT), "utf8");
const stripHtml = (html) => html
  .replace(/<[^>]*>/g, " ")
  .replace(/&[^;]+;/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const countWords = (html) => stripHtml(html).split(" ").filter(Boolean).length;

test("eReferer 676824 preserves its commercial contract and editorial safeguards", () => {
  assert.ok(existsSync(new URL(articlePath, ROOT)), "the article must exist");
  assert.ok(existsSync(new URL(imagePath, ROOT)), "the local article image must exist");

  const article = JSON.parse(read(articlePath));
  assert.equal(article.title, "Faut-il être en CDI pour investir dans l'immobilier ?");
  assert.equal(article.handle, "faut-il-etre-en-cdi-pour-investir-immobilier");
  assert.equal(article.blog, "guides");
  assert.equal(article.author, "Score-Immo");
  assert.equal(article.author_handle, "scoreimmo");
  assert.equal(article.first_body_link_priority, true);
  assert.equal(article.last_reviewed, "2026-08-31");
  assert.equal(article.word_count, countWords(article.body_html));
  assert.ok(article.word_count >= 1077, `expected at least 1077 words, got ${article.word_count}`);
  assert.ok(article.meta_title.length <= 60);
  assert.ok(article.meta_description.length >= 145 && article.meta_description.length <= 160);
  assert.deepEqual(article.image, {
    src: "/images/articles/faut-il-etre-en-cdi-pour-investir-immobilier.webp",
    alt: "Investisseur préparant un dossier de financement immobilier sans CDI",
    width: 1200,
    height: 630,
  });

  assert.doesNotMatch(article.body_html, /[—–]/);
  assert.doesNotMatch(article.body_html, /class=['"]si-partnership-disclosure['"]/);
  assert.doesNotMatch(article.body_html, /partenariat rémunéré/i);

  const links = [...article.body_html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const sponsoredLinks = links.filter((link) => link[1].includes(sponsoredUrl));
  assert.equal(sponsoredLinks.length, 1);
  assert.equal(stripHtml(sponsoredLinks[0][2]), sponsoredAnchor);
  assert.doesNotMatch(sponsoredLinks[0][1], /\bsponsored\b/);
  assert.match(sponsoredLinks[0][1], /rel=['"]noopener['"]/);

  const bodyExternalLinks = links.filter((link) => /href=['"]https?:\/\//.test(link[1]));
  const internalLinks = links.filter((link) => /href=['"]\/(?:blogs|pages)\//.test(link[1]));
  assert.equal(bodyExternalLinks.length, 1);
  assert.ok(internalLinks.length >= 5, `expected at least 5 internal links, got ${internalLinks.length}`);
  assert.equal(article.sources.length, 2);
  assert.deepEqual(new Set(article.sources.map((source) => source.url)), officialSources);
  assert.equal(bodyExternalLinks.length + article.sources.length, 3);

  assert.match(article.body_html, /35\s?%/);
  assert.match(article.body_html, /25 ans/);
  assert.match(article.body_html, /décote prudente/i);
  assert.match(article.body_html, /n'est pas une condition légale/i);
  assert.doesNotMatch(article.body_html, /(?:les banques|la banque) (?:ne )?(?:retiennent|intègrent) (?:que )?70\s?%/i);
  assert.doesNotMatch(article.body_html, /apport (?:obligatoire|minimal) de 15 à 20\s?%/i);
  assert.doesNotMatch(article.body_html, /(?:garantit|garantie d')un accord/i);

  const h2 = [...article.body_html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((match) => stripHtml(match[1]));
  const bodyQuestions = h2.filter((title) => !["Sommaire", "Questions fréquentes"].includes(title));
  assert.ok(bodyQuestions.length >= 6);
  assert.ok(bodyQuestions.every((title) => title.endsWith("?")));
  assert.ok((article.body_html.match(/<h3>[^<]*\?[^<]*<\/h3>/g) || []).length >= 5);
});
