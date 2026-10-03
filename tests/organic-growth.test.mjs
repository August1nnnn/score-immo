import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { extractFaq } from '../src/lib/extract-faq.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const article = (handle) => JSON.parse(read(`src/content/articles/guides/${handle}.json`));
const newHandles = ['prix-annonce-dvf-ecart', 'vente-absente-dvf', 'dvf-mutation-plusieurs-lots', 'verifier-dpe-numero-ademe', 'surface-carrez-habitable-dvf', 'annonce-immobiliere-sans-adresse'];
const revised = ['donnees-dvf-utiliser-prix-vente-reels', 'estimation-immobiliere-methodes-juste-prix', 'benchmark-immobilier-comparer-biens'];

test('the existing DVF owner distinguishes data, comparison limits and negotiated discount', () => {
  const a = article(revised[0]);
  assert.doesNotMatch(a.body_html, /100\s*%\s*fiable|12 millions|12 autres sources|\+10-15%|±15%|6 mois minimum/);
  assert.match(a.body_html, /prix initial de l'annonce/);
  assert.match(a.body_html, /mutations? groupée/);
  assert.match(a.body_html, /surface réelle bâtie/);
  assert.match(a.body_html, /Bas-Rhin/);
  assert.match(a.body_html, /Moselle/);
  assert.match(a.body_html, /Mayotte/);
  assert.match(a.body_html, /pas une remise négociée/);
  assert.ok(a.sources.some((s) => s.url.includes('notice-descriptive-du-fichier-dvf')));
});

test('the estimator serves buyers checking an asking price without invented market discounts', () => {
  const a = article(revised[1]);
  assert.match(a.body_html, /prix d'une maison est trop élevé/);
  assert.match(a.body_html, /Exemple fictif/);
  assert.match(a.body_html, /pas une estimation automatique/);
  assert.match(a.body_html, /prix-annonce-dvf-ecart/);
  assert.match(a.body_html, /devis/);
  assert.match(a.body_html, /adresse exacte/);
  assert.doesNotMatch(a.body_html, /100\s*%\s*fiable|\b68\s*%|\b15 000 transactions|\b±15\s*%/);
});

test('the comparison guide provides an actionable budget grid and rejects a guaranteed winning score', () => {
  const a = article(revised[2]);
  assert.match(a.body_html, /grille-comparaison/);
  assert.match(a.body_html, /charges/);
  assert.match(a.body_html, /travaux/);
  assert.match(a.body_html, /Critère bloquant/);
  assert.match(a.body_html, /Exemple fictif/);
  assert.match(a.body_html, /pas une recommandation d'achat/);
});

test('six complementary buyer questions have distinct source-backed indexable articles', () => {
  const ids = new Set();
  for (const handle of newHandles) {
    assert.ok(existsSync(new URL(`src/content/articles/guides/${handle}.json`, root)), handle);
    const a = article(handle);
    assert.equal(a.handle, handle); assert.equal(a.blog, 'guides');
    assert.equal(a.author, 'Score-Immo'); assert.equal(a.author_handle, 'scoreimmo');
    assert.ok(!ids.has(a.id)); ids.add(a.id);
    assert.ok(a.meta_title.length <= 70); assert.ok(a.meta_description.length <= 160);
    assert.ok(a.tldr.length >= 3); assert.ok(a.sources.length >= 2);
    assert.ok(extractFaq(a.body_html).length >= 3, handle);
    assert.match(a.body_html, /href="\/pages\/guide#parcours-achat"/);
    assert.match(a.body_html, /href="\/exemple-rapport(?:\?|"|#)/);
    assert.doesNotMatch(a.body_html, /<h1\b|<script\b|<iframe\b|on(?:click|load|error)\s*=|javascript:|100\s*%\s*fiable|[—–]/i);
    assert.match(a.body_html, /rapport personnalisé|Rapport personnalisé/);
    assert.match(a.body_html, /2,99/);
    assert.match(a.body_html, /utm_campaign=/);
    for (const s of a.sources) {
      const u = new URL(s.url);
      assert.equal(u.protocol, 'https:');
      assert.ok(/(?:\.gouv\.fr|ademe\.fr|legifrance\.gouv\.fr)$/.test(u.hostname), s.url);
    }
  }
});

test('the existing buyer hub organizes decisions and makes every new article discoverable', () => {
  const hub = read('src/components/sections/GuideHub.astro');
  assert.match(hub, /id="parcours-achat"/);
  assert.match(hub, /href="#parcours-achat"/);
  assert.match(hub, /BuyerJourney/);
  const journey = read('src/components/BuyerJourney.astro');
  const data = read('src/data/buyer-journey.mjs');
  for (const handle of [...newHandles, ...revised]) assert.ok(data.includes(handle), handle);
  assert.match(journey, /BUYER_JOURNEY/);
  assert.match(journey, /<h3/);
  assert.match(journey, /exemple-rapport/);
  assert.match(journey, /tarifs/);
});

test('existing trusted owners link to new questions without changing their identity or sponsored contracts', () => {
  const dpe = article('dpe-comprendre-classes-energetiques');
  const checklist = article('analyser-annonce-immobiliere-comme-pro');
  assert.match(dpe.body_html, /verifier-dpe-numero-ademe/);
  assert.match(checklist.body_html, /surface-carrez-habitable-dvf/);
  assert.match(checklist.body_html, /annonce-immobiliere-sans-adresse/);
  for (const handle of newHandles.slice(0,3)) assert.match(article(revised[0]).body_html, new RegExp(handle));
});
