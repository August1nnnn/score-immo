import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(process.env.SCOREIMMO_TEST_DIST || 'dist');
const appleURL = 'https://apps.apple.com/fr/app/score-immo-analyse-immobili%C3%A8re/id6806366573';
let browser, server, origin, localOrigin, article;
async function interceptLocally(route) {
  const url = route.request().url();
  if (url.startsWith(origin + '/')) {
    const response = await route.fetch({ url: localOrigin + url.slice(origin.length) });
    return route.fulfill({ response });
  }
  return route.fulfill({ body: '<p>Destination interceptée par le test</p>', contentType: 'text/html' });
}
async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(resolve(dir, entry.name)) : entry.name.endsWith('.html') ? [resolve(dir, entry.name)] : []))).flat();
}
before(async () => {
  const articleFiles = await htmlFiles(resolve(dist, 'blogs/guides'));
  for (const file of articleFiles) {
    const html = await readFile(file, 'utf8');
    if (html.includes('article_analyzer_blog_top') && html.includes('si-article-footer')) {
      article = file.slice(dist.length).replace(/index\.html$/, ''); break;
    }
  }
  assert.ok(article, 'A generated guide with the existing analyzer must be available');
  server = createServer(async (req, res) => {
    try {
      let path = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!path.startsWith(dist + '/') && path !== dist) throw new Error('path');
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
      res.end(await readFile(path));
    } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  localOrigin = `http://127.0.0.1:${server.address().port}`;
  // Exercise the real shared-cookie scope while serving every byte locally.
  origin = 'https://score-immo.fr';
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

test('built shared layouts have exactly one inline banner and no custom popup', async () => {
  let checked = 0;
  for (const file of await htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    if (!html.includes('id="si-header"')) continue;
    checked++;
    assert.equal((html.match(/data-ios-context-banner/g) || []).length, 1, file);
    assert.ok(!html.includes('ios-download-prompt'), file);
    assert.ok(html.includes('app-id=6806366573'), file);
    if (html.includes('si-article-footer')) {
      const footer = html.match(/<footer class="si-article-footer"[^>]*>([\s\S]*?)<\/footer>/)?.[1];
      assert.ok(footer?.includes('data-ios-context-banner'), file);
      assert.ok(!html.includes('data-ios-banner-global'), file);
    } else {
      assert.ok(html.includes('data-ios-banner-global'), file);
      assert.ok(html.indexOf('data-ios-context-banner') < html.indexOf('<footer'), file);
    }
  }
  assert.ok(checked >= 300);
});

for (const [width, path, js, android = false, consent = 'rejected'] of [[320, '/', true], [390, 'article', true], [1440, 'article', true], [390, '/', false], [390, '/', true, true], [390, '/', true, false, 'accepted'], [390, 'article', true, false, 'accepted']]) {
  test(`banner links and layout work at ${width}px on ${path}, JavaScript=${js}, Android=${android}, consent=${consent}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: js, reducedMotion: 'reduce', ...(android ? { userAgent: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36', hasTouch: true, isMobile: true } : {}) });
    try {
      await page.route('**/*', interceptLocally);
      const url = origin + (path === 'article' ? article : path);
      await page.goto(url);
      if (js && await page.locator('#si-cookie-banner').isVisible()) await page.locator(consent === 'accepted' ? '#si-cookie-accept' : '#si-cookie-reject').click();
      const banner = page.locator('[data-ios-context-banner]');
      assert.equal(await banner.count(), 1);
      await banner.scrollIntoViewIfNeeded();
      assert.equal(await banner.count(), 1);
      assert.equal(await banner.isVisible(), true);
      assert.ok(await banner.evaluate(el => !['fixed', 'sticky', 'absolute'].includes(getComputedStyle(el).position)));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const links = banner.locator('a');
      assert.equal(await links.count(), 2);
      for (const link of await links.all()) {
        const rect = await link.boundingBox();
        assert.ok(rect.height >= 44 && rect.x >= 0 && rect.x + rect.width <= width);
      }
      const analyze = banner.getByRole('link', { name: 'Analyser une annonce', exact: true });
      const expected = new URL(await analyze.getAttribute('href'));
      assert.equal(expected.origin + expected.pathname, 'https://app.score-immo.fr/app');
      if (!js || consent === 'accepted') {
        assert.equal(expected.searchParams.get('utm_source'), 'site');
        assert.equal(expected.searchParams.get('utm_medium'), path === 'article' ? 'blog_end' : 'ios_banner');
        if (path === 'article') assert.ok(expected.searchParams.get('utm_campaign'));
      } else {
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) assert.equal(expected.searchParams.get(key), null);
      }
      await analyze.click();
      await page.waitForURL('https://app.score-immo.fr/**');
      assert.equal(new URL(page.url()).pathname, '/app');
      assert.equal(new URL(page.url()).searchParams.get('utm_source'), expected.searchParams.get('utm_source'));
      await page.goto(url);
      await page.locator('[data-ios-context-banner]').getByRole('link', { name: 'Télécharger l’app sur iOS', exact: true }).click();
      await page.waitForURL('https://apps.apple.com/**');
      assert.equal(page.url(), appleURL);
    } finally { await page.close(); }
  });
}

for (const consent of ['accepted', 'rejected']) test(`article top analyzer passes listing and respects ${consent} attribution consent`, async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/*', interceptLocally);
    await page.goto(origin + article);
    if (await page.locator('#si-cookie-banner').isVisible()) await page.locator(consent === 'accepted' ? '#si-cookie-accept' : '#si-cookie-reject').click();
    const form = page.locator('[data-analyzer-form]').first();
    await form.locator('[name="url"]').fill('https://www.leboncoin.fr/ad/ventes_immobilieres/1234567890');
    await form.getByRole('button', { name: 'Analyser', exact: true }).click();
    await page.waitForURL('https://app.score-immo.fr/**');
    const url = new URL(page.url());
    assert.equal(url.pathname, '/app');
    if (consent === 'accepted') {
      assert.equal(url.searchParams.get('utm_medium'), 'blog_top');
      assert.ok(url.searchParams.get('utm_campaign'));
    } else {
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) assert.equal(url.searchParams.get(key), null);
    }
    assert.equal(url.searchParams.get('url'), 'https://www.leboncoin.fr/ad/ventes_immobilieres/1234567890');
  } finally { await page.close(); }
});
