import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const article = p => JSON.parse(read('src/content/articles/' + p + '.json'));

test('Paris uses a dated primary benchmark and no invented forecast or automatic discount', () => {
  const d = article('villes/prix-immobilier-paris-marche-plancher');
  assert.match(d.body_html, /9 530/);
  assert.match(d.body_html, /avril 2026/);
  assert.ok(d.sources.some(s => s.url.includes('conjoncture-immobiliere-en-ile-de-france-de-fevrier-avril-2026')));
  assert.doesNotMatch(JSON.stringify(d), /9 840|9 700|55%|décote de 15% minimum|plus fort potentiel de plus-value/);
  assert.doesNotMatch(d.meta_title, /carte/i);
  assert.match(d.body_html, /Exemple pédagogique/);
});

test('DPE distinguishes current coefficient from future effective date', () => {
  const d = article('guides/dpe-comprendre-classes-energetiques');
  assert.match(d.body_html, /1er janvier 2027/);
  assert.match(d.body_html, /1,7/);
  assert.match(d.body_html, /1,9/);
  assert.ok(d.sources.some(s => s.url.includes('economie.gouv.fr')));
});

test('editorial responsibility is visible without inventing a human reviewer', () => {
  const t = read('src/pages/blogs/[blog]/[slug].astro');
  assert.match(t, /datetime=\{article.published_at\}/);
  assert.match(t, /datetime=\{modifiedAt\}/);
  assert.match(t, /dateModified: modifiedAt/);
  assert.match(t, /href="\/a-propos"/);
  assert.match(t, /href="\/methodologie#politique-editoriale"/);
  assert.doesNotMatch(t, /expert certifié|relecture par un notaire/i);
});
