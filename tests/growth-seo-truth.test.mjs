import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const slugs = ['estimation-immobiliere-methodes-juste-prix', 'analyser-annonce-immobiliere-comme-pro'];
for (const slug of slugs) {
  test(`${slug}: actionable sources and truthful paid analysis journey`, () => {
    const d = JSON.parse(read(`src/content/articles/guides/${slug}.json`));
    assert.match(d.body_html, /href="https:\/\/app.score-immo.fr\/r\/demo"/);
    assert.match(d.body_html, /href="https:\/\/app.score-immo.fr\/app"/);
    assert.match(d.body_html, /2,99/);
    assert.match(d.body_html, /9,99/);
    assert.match(d.body_html, /href="\/methodologie"/);
    assert.match(d.body_html, /href="https:\/\/www.data.gouv.fr\/datasets\/demandes-de-valeurs-foncieres"/);
    assert.doesNotMatch(JSON.stringify(d), /68%|5,2%|230\+|Que Choisir|garantit une estimation|2 à 3%|plus complète du marché|quasi-invendable/i);
    assert.equal(d.last_reviewed, '2026-09-06');
    assert.equal(d.updated_at.slice(0, 10), d.last_reviewed);
    assert.ok(d.body_html.includes(slugs.find(s => s !== slug)));
  });
}
test('pro offers a direct demonstration and usable referral resources without promised returns', () => {
  const pro = read('src/pages/pro.astro');
  assert.match(pro, /https:\/\/app.score-immo.fr\/r\/demo/);
  assert.match(pro, /Faire découvrir Score-Immo/);
  for (const slug of slugs) assert.ok(pro.includes(slug));
  assert.doesNotMatch(pro, /CREATEUR|Un seul mandat décroché rembourse|Le vendeur accepte le bon prix|rapport d'expert|emporter la décision/);
});
