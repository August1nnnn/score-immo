import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the conventional sitemap endpoint resolves to the generated Astro sitemap", () => {
  const sitemap = read("public/sitemap.xml");

  assert.match(sitemap, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<loc>https:\/\/score-immo\.fr\/sitemap-0\.xml<\/loc>/);
});

test("the public pricing entrypoint is direct, canonical and slash-safe", () => {
  assert.equal(existsSync(new URL("src/pages/tarifs.astro", root)), true);

  const route = read("src/pages/tarifs.astro");
  const pricingPage = read("src/pages/pages/tarifs.astro");
  const redirects = read("public/_redirects");
  const sitemapConfig = read("astro.config.mjs");

  assert.match(route, /TarifsPage/);
  assert.match(pricingPage, /const canonical = "https:\/\/score-immo\.fr\/tarifs"/);
  assert.match(pricingPage, /"item": "https:\/\/score-immo\.fr\/tarifs"/);
  assert.match(pricingPage, /<BaseLayout[^>]*\{canonical\}/);
  assert.match(redirects, /^\/tarifs\/ \/tarifs 301$/m);
  assert.match(redirects, /^\/pages\/tarifs \/tarifs 301$/m);
  assert.match(redirects, /^\/pricing \/tarifs 301$/m);
  assert.doesNotMatch(redirects, /^\/tarifs \/pages\/tarifs 301$/m);
  assert.match(sitemapConfig, /['"]\/pages\/tarifs['"]/);
});

test("navigation and machine-readable discovery use the canonical pricing URL", () => {
  for (const path of [
    "src/components/Header.astro",
    "src/components/Footer.astro",
    "src/pages/pro.astro",
    "public/llms.txt",
  ]) {
    const contents = read(path);
    assert.match(contents, /\/tarifs/);
    assert.doesNotMatch(contents, /\/pages\/tarifs/);
  }
});
