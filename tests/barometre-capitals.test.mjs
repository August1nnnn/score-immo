import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('the August regional-capital observation set preserves complete, partial and unavailable states', () => {
  const data = JSON.parse(readFileSync(new URL('src/data/barometre-capitales-2026-08.json', root), 'utf8'));
  assert.equal(data.mois, '2026-08');
  assert.equal(data.capture_date, '2026-08-31');
  assert.equal(data.observations.length, 15);
  assert.equal(data.observations_partielles.length, 2);
  assert.equal(data.indisponibles.length, 1);

  const regionCodes = [
    ...data.observations.map(({ region_code }) => region_code),
    ...data.observations_partielles.map(({ region_code }) => region_code),
    ...data.indisponibles.map(({ region_code }) => region_code),
  ];
  assert.equal(new Set(regionCodes).size, 18);
  for (const observation of data.observations) {
    assert.match(observation.code_postal, /^\d{5}$/);
    assert.match(observation.dpe, /^[A-G]$/);
    assert.ok(observation.surface > 0);
    assert.ok(observation.prix_affiche > 0);
    assert.equal(observation.prix_m2, Math.round(observation.prix_affiche / observation.surface));
    assert.match(observation.date_publication, /^2026-08-\d{2}$/);
    assert.ok(Number.isFinite(observation.latitude_capitale));
    assert.ok(Number.isFinite(observation.longitude_capitale));
  }
  for (const observation of data.observations_partielles) {
    assert.match(observation.code_postal, /^\d{5}$/);
    assert.equal(observation.dpe, null);
    assert.equal(observation.statut_donnees, 'partiel_dpe_non_renseigne');
    assert.ok(observation.surface > 0);
    assert.ok(observation.prix_affiche > 0);
    assert.equal(observation.prix_m2, Math.round(observation.prix_affiche / observation.surface));
    assert.match(observation.date_publication, /^2026-08-\d{2}$/);
    assert.ok(Number.isFinite(observation.latitude_capitale));
    assert.ok(Number.isFinite(observation.longitude_capitale));
  }
  assert.deepEqual(
    data.observations_partielles.map(({ capitale }) => capitale),
    ['Cayenne', 'Saint-Denis'],
  );
  assert.deepEqual(data.indisponibles.map(({ capitale }) => capitale), ['Mamoudzou']);

  const serialized = JSON.stringify(data).toLowerCase();
  for (const forbidden of ['listing_id', 'listing_url', 'accountdisplayname', 'phonedisplays', 'photos']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
});

test('the public hub distinguishes capital observations from scored analyses', () => {
  const page = readFileSync(new URL('src/pages/barometre/index.astro', root), 'utf8');
  assert.match(page, /barometre-capitales-2026-08\.json/);
  assert.match(page, /Repères dans les capitales régionales/);
  assert.match(page, /prix affichés, pas des prix de vente/i);
  assert.match(page, /sans score Score-Immo/i);
  assert.match(page, /17 chefs-lieux sur 18/i);
  assert.match(page, /15 avec DPE renseigné/i);
  assert.match(page, /2 sans DPE renseigné/i);
  assert.match(page, /DPE non renseigné/);
  assert.match(page, /regionalCapitalDatasetSchema/);
  assert.match(page, /#bar-capitals-title\s*\{[^}]*scroll-margin-top:/s);
});

test('the CSV export includes complete and partial observations with an explicit status', () => {
  const route = readFileSync(new URL('src/pages/barometre/capitales/2026-08.csv.ts', root), 'utf8');
  assert.match(route, /observations_partielles/);
  assert.match(route, /statut_donnees/);
  assert.match(route, /partiel_dpe_non_renseigne/);
});

test('cookie actions remain on one balanced row on mobile', () => {
  const banner = readFileSync(new URL('src/components/CookieBanner.astro', root), 'utf8');
  assert.match(
    banner,
    /\.si-cookie-actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    banner,
    /\.si-cookie-action\s*\{[\s\S]*?min-height:\s*44px/,
  );
});

test('capital data exports are public downloads but excluded from indexing', () => {
  const headers = readFileSync(new URL('public/_headers', root), 'utf8');
  const astroConfig = readFileSync(new URL('astro.config.mjs', root), 'utf8');
  assert.match(
    headers,
    /\/barometre\/capitales\/\*[\s\S]*?Access-Control-Allow-Origin: \*[\s\S]*?X-Robots-Tag: noindex/,
  );
  assert.match(astroConfig, /pathname\.startsWith\('\/barometre\/capitales\/'\)/);
});
