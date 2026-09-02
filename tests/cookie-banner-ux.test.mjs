import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("la bannière est une région de consentement nommée et concise", () => {
  const banner = read("src/components/CookieBanner.astro");

  assert.match(banner, /role="region"/);
  assert.match(banner, /aria-labelledby="si-cookie-title"/);
  assert.match(banner, /aria-describedby="si-cookie-description"/);
  assert.match(banner, /id="si-cookie-title"/);
  assert.match(banner, /id="si-cookie-description"/);
  assert.match(banner, /La mesure d'audience et de l'efficacité de nos publicités reste désactivée sans ton accord/);
  assert.match(banner, /Nous ne personnalisons pas les annonces avec ce choix/);
  assert.match(banner, />Refuser<\/button>/);
  assert.match(banner, />Détails<\/a>/);
  assert.match(banner, />Accepter<\/button>/);
});

test("la surface est opaque, compacte et ne dépend pas du flou", () => {
  const banner = read("src/components/CookieBanner.astro");

  assert.match(banner, /background:\s*#fff;/i);
  assert.match(banner, /backdrop-filter:\s*none;/);
  assert.match(banner, /-webkit-backdrop-filter:\s*none;/);
  assert.match(banner, /max-width:\s*860px;/);
  assert.doesNotMatch(banner, /var\(--si-glass-bg/);
  assert.doesNotMatch(banner, /blur\(/);
});

test("les trois actions restent sur une ligne et les choix sont symétriques", () => {
  const banner = read("src/components/CookieBanner.astro");

  assert.match(banner, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(banner, /min-height:\s*44px;/);
  assert.match(banner, /id="si-cookie-reject" class="si-cookie-action si-cookie-choice"/);
  assert.match(banner, /id="si-cookie-accept" class="si-cookie-action si-cookie-choice"/);
  assert.doesNotMatch(banner, /flex-wrap:\s*wrap/);
});

test("le contrat de consentement reste délégué au contrôleur existant", () => {
  const banner = read("src/components/CookieBanner.astro");

  assert.match(banner, /consent\?\.setAllStatus\('accepted'\)/);
  assert.match(banner, /consent\?\.setAllStatus\('rejected'\)/);
  assert.match(banner, /window\.siOpenCookieBanner\s*=\s*show/);
  assert.doesNotMatch(banner, /document\.cookie\s*=/);
  assert.doesNotMatch(banner, /localStorage\./);
});
