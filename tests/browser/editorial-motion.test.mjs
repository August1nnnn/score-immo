import { test, before, after } from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

let origin = process.env.SCOREIMMO_MOTION_URL;
let server;
before(async () => {
  if (origin) return;
  const root = resolve('dist');
  server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
      if (path !== root && !path.startsWith(root + '/')) throw new Error('path');
      const file = path === root ? resolve(root, 'index.html') : path;
      res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(done => server.close(done)); });
test('editorial headings stay readable and motion follows scroll reversibly', async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      for (const mode of ['motion', 'reduced', 'no-js']) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: mode !== 'no-js', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
        await page.goto(origin);
        const h1 = page.locator('h1');
        assert.equal(await h1.count(), 1);
        assert.match(await h1.innerText(), /Un bien vous plaît\./);
        const headings = page.locator('[data-reading-heading]');
        assert.equal(await headings.count(), 3);
        const text = await headings.first().innerText();
        for (const heading of await headings.all()) {
          assert.ok(await heading.evaluate(el => {
            for (let node = el; node; node = node.parentElement) {
              const style = getComputedStyle(node);
              if (Number(style.opacity) === 0 || style.visibility === 'hidden' || style.display === 'none') return false;
            }
            return true;
          }), 'headings and ancestors remain painted without JavaScript');
        }
        assert.equal(await page.locator('.si-proof-count').count(), 0, 'no invented social proof counter');
        assert.equal(await page.locator('#si-url-form').getAttribute('action'), 'https://app.score-immo.fr/app');
        assert.ok(await page.locator('a[href="/exemple-rapport"]').count());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (mode === 'motion') {
          const target = headings.first();
          const top = await target.evaluate(el => el.getBoundingClientRect().top + scrollY);
          await page.evaluate(y => scrollTo(0, y), top - 900 * .82);
          await page.waitForTimeout(200);
          const first = await target.locator('.is-read').count();
          await page.evaluate(y => scrollTo(0, y), top - 900 * .35);
          await page.waitForTimeout(200);
          const last = await target.locator('.is-read').count();
          assert.ok(last > first, 'scrolling forward progressively highlights words');
          await page.evaluate(y => scrollTo(0, y), top - 900 * .82);
          await page.waitForTimeout(200);
          assert.equal(await target.locator('.is-read').count(), first, 'scrolling back reverses the highlight');
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.waitForTimeout(100);
          assert.equal(await target.locator('.is-read').count(), await target.locator('[data-reading-word]').count());
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await page.waitForTimeout(100);
          assert.equal(await target.locator('.is-read').count(), first, 'motion resumes at the current scroll position');
        }
        assert.equal(await headings.first().innerText(), text, 'visible wording never mutates');
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
  } finally { await browser.close(); }
});
