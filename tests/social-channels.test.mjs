import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const officialProfiles = [
  ["TikTok", "https://www.tiktok.com/@scoreimmo"],
  ["YouTube", "https://www.youtube.com/@scoreimmo"],
  ["Facebook", "https://www.facebook.com/people/Score-Immo/61594068807617/"],
  ["LinkedIn", "https://www.linkedin.com/company/score-immo-fr/"],
];

test("official social profiles share one canonical source", () => {
  const entity = read("src/data/entity.ts");

  assert.match(entity, /export const SOCIAL_PROFILES/);
  for (const [name, url] of officialProfiles) {
    assert.ok(entity.includes(`name: '${name}'`), name);
    assert.ok(entity.includes(`url: '${url}'`), url);
  }

  assert.match(
    entity,
    /sameAs:\s*\[\s*['"]https:\/\/www\.wikidata\.org\/wiki\/Q140289914['"],\s*\.\.\.SOCIAL_PROFILES\.map\(\(profile\) => profile\.url\),?\s*\]/,
  );
});

test("the global footer exposes accessible verified social links", () => {
  const footer = read("src/components/Footer.astro");
  const layout = read("src/layouts/BaseLayout.astro");

  assert.match(footer, /import \{ SOCIAL_PROFILES \} from ['"]@\/data\/entity['"]/);
  assert.match(footer, /<nav[^>]+class="si-footer-socials"[^>]+aria-label="Réseaux sociaux Score-Immo"/);
  assert.match(footer, /SOCIAL_PROFILES\.map/);
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="me noopener noreferrer"/);
  assert.match(footer, /Suivre Score-Immo/);
  assert.equal(
    layout.match(/\/assets\/scoreimmo\.css\?v=20260831-social-channels/g)?.length,
    2,
  );
});
