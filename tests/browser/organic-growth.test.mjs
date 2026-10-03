import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve('dist');
const origin = 'https://score-immo.fr';
const handles = ['prix-annonce-dvf-ecart', 'vente-absente-dvf', 'dvf-mutation-plusieurs-lots', 'verifier-dpe-numero-ademe', 'surface-carrez-habitable-dvf', 'annonce-immobiliere-sans-adresse', 'donnees-dvf-utiliser-prix-vente-reels', 'estimation-immobiliere-methodes-juste-prix', 'benchmark-immobilier-comparer-biens', 'dpe-comprendre-classes-energetiques', 'analyser-annonce-immobiliere-comme-pro'];
const paths = ['/pages/guide', ...handles.map(h => '/blogs/guides/' + h)];
let server, browser, local;
before(async () => {
  server = createServer(async (req, res) => {
    try {
      let file = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      assert.ok(file === dist || file.startsWith(dist + '/'));
      const info = await stat(file).catch(() => null);
      if (info?.isDirectory()) file = resolve(file, 'index.html');
      else if (!info && !extname(file)) file += '.html';
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  local = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); if (server) await new Promise(done => server.close(done)); });
async function intercept(page, events = []) {
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/api/')) {
      if (route.request().method() === 'POST') events.push(route.request().postDataJSON());
      return route.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
    }
    if (url.startsWith(origin + '/')) return route.fulfill({ response: await route.fetch({ url: local + url.slice(origin.length) }) });
    if (route.request().resourceType() === 'script') return route.fulfill({ contentType: 'text/javascript', body: '/* external script isolated by test */' });
    return route.fulfill({ contentType: 'text/html', body: '<p>Destination isolée pour vérification</p>' });
  });
}

for (const js of [true, false]) for (const width of [390, 1440]) test(`12 decision pages are usable at ${width}px, JavaScript=${js}`, async () => {
  const page = await browser.newPage({ javaScriptEnabled: js, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const events = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await intercept(page, events);
  try {
    for (const path of paths) {
      const response = await page.goto(origin + path);
      assert.equal(response.status(), 200, path);
      assert.equal(await page.locator('h1').count(), 1, path);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), origin + path, path);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path);
      const structured = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const block of structured) JSON.parse(block);
      if (path === '/pages/guide') {
        assert.equal(await page.locator('.si-buyer-journey-step').count(), 6);
        assert.equal(await page.locator('.si-buyer-journey-step a').count(), 20);
      } else {
        assert.ok(await page.locator('[data-analyzer-form]').first().isVisible(), path);
        if (handles.slice(0, 6).some(h => path.endsWith(h))) {
          const cta = page.locator('.si-cta-box');
          assert.equal(await cta.count(), 1);
          assert.equal(await cta.locator('h2').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
          assert.equal(await cta.locator('a[href="/exemple-rapport"]').count(), 1);
          assert.equal(await cta.locator('a[href="/tarifs"]').count(), 1);
          const faq = structured.map(JSON.parse).flatMap(value => value['@graph'] || [value]).find(value => value['@type'] === 'FAQPage');
          assert.ok(faq, path);
          for (const question of faq.mainEntity) {
            assert.ok((await page.locator('body').innerText()).includes(question.name), question.name);
            assert.ok((await page.locator('body').innerText()).includes(question.acceptedAnswer.text), question.name);
          }
        }
      }
    }
    assert.equal(events.length, 0, 'No analytics without consent');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

for (const consent of ['accepted', 'rejected', 'no-js']) test(`new guide analyzer validates input and passes listing with ${consent} consent`, async () => {
  const page = await browser.newPage({ javaScriptEnabled: consent !== 'no-js', reducedMotion: 'reduce' });
  const events = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await intercept(page, events);
  try {
    await page.goto(origin + paths[1]);
    if (consent !== 'no-js') await page.locator(consent === 'accepted' ? '#si-cookie-accept' : '#si-cookie-reject').click();
    const form = page.locator('[data-analyzer-form]').first();
    await form.getByRole('button', { name: 'Analyser', exact: true }).click();
    assert.equal(new URL(page.url()).origin, origin, 'Empty required field blocks navigation');
    const listing = 'https://www.leboncoin.fr/ad/ventes_immobilieres/1234567890';
    await form.locator('[name="url"]').fill(listing);
    await form.getByRole('button', { name: 'Analyser', exact: true }).click();
    await page.waitForURL('https://app.score-immo.fr/**');
    const target = new URL(page.url());
    assert.equal(target.pathname, '/app');
    assert.equal(target.searchParams.get('url'), listing);
    assert.equal(target.searchParams.get('utm_campaign'), consent === 'rejected' ? null : handles[0]);
    assert.equal(events.filter(event => event.event_type === 'analyzer_submit').length, consent === 'accepted' ? 1 : 0);
    assert.ok(!JSON.stringify(events).includes(listing), 'The listing is not sent to analytics');
    assert.ok(!JSON.stringify(events).includes('1234567890'), 'No listing identifier in analytics');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

for (const consent of ['accepted', 'rejected', 'no-js']) test(`buyer journey opens the paid analysis with ${consent} consent`, async () => {
  const page = await browser.newPage({ javaScriptEnabled: consent !== 'no-js', reducedMotion: 'reduce', viewport: { width: 320, height: 900 } });
  const events = [];
  await intercept(page, events);
  try {
    await page.goto(origin + '/pages/guide');
    if (consent !== 'no-js') await page.locator(consent === 'accepted' ? '#si-cookie-accept' : '#si-cookie-reject').click();
    const jump = page.locator('a[href="#parcours-achat"]');
    const box = await jump.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 320, 'The navigation fits on narrow phones');
    await jump.click();
    const action = page.locator('.si-buyer-journey-action .si-btn');
    await action.click();
    await page.waitForURL('https://app.score-immo.fr/**');
    const target = new URL(page.url());
    assert.equal(target.pathname, '/app');
    assert.equal(target.searchParams.get('utm_medium'), consent === 'rejected' ? null : 'guide_journey');
    assert.equal(target.searchParams.get('utm_campaign'), consent === 'rejected' ? null : 'parcours-achat');
    if (consent !== 'accepted') assert.equal(events.length, 0);
  } finally { await page.close(); }
});
