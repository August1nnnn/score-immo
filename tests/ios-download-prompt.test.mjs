import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1';
const safari = iphone.replace('CriOS/140.0', 'Version/18.0');
const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 CriOS/140.0 Safari/605.1.15';

async function setup(t, ua = iphone, touch = 1, storageBlocked = false) {
  const source = await readFile(new URL('../src/lib/ios-download-prompt.mjs', import.meta.url), 'utf8');
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ userAgent: ua });
  await page.route('https://prompt.test/**', route => route.fulfill({ body: '<input id="entry"><button id="si-mobile-menu-btn" aria-expanded="false">Menu</button><div id="si-cookie-banner" hidden>Cookies</div><aside id="ios-download-prompt" hidden><button data-ios-dismiss>Fermer</button><a href="https://apps.apple.com/">App Store</a></aside>', contentType: 'text/html' }));
  await page.goto('https://prompt.test/');
  await page.clock.install({ time: new Date('2026-09-04T21:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-04T21:00:00Z'));
  await page.evaluate(({touch, storageBlocked}) => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: touch });
    if (storageBlocked) for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { get() { throw new Error('blocked'); } });
  }, {touch, storageBlocked});
  const url = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  const start = () => page.evaluate(async url => (await import(url)).initIOSDownloadPrompt(), url);
  return {page, start, visible: () => page.locator('#ios-download-prompt').isVisible()};
}

test('iOS Chrome waits 8 seconds, never steals focus, Escape dismisses for seven days', async t => {
  const {page, start, visible} = await setup(t);
  await start();
  await page.clock.fastForward(7999); assert.equal(await visible(), false);
  await page.clock.fastForward(1); assert.equal(await visible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BODY');
  await page.keyboard.press('Escape'); assert.equal(await visible(), false);
  const remaining = await page.evaluate(() => Number(localStorage.getItem('si-ios-prompt-dismissed-until')) - Date.now());
  assert.equal(remaining, 7 * 86400000);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await start(); await page.clock.fastForward(8000); assert.equal(await visible(), false);
});

test('cookie consent, mobile menu and typing defer display and hide an already visible prompt', async t => {
  const {page, start, visible} = await setup(t);
  await page.locator('#si-cookie-banner').evaluate(el => el.hidden = false);
  await start(); await page.clock.fastForward(10000); assert.equal(await visible(), false);
  await page.locator('#entry').focus();
  await page.locator('#si-cookie-banner').evaluate(el => el.hidden = true);
  await page.clock.fastForward(1000); assert.equal(await visible(), false);
  await page.locator('#entry').evaluate(el => el.blur());
  await page.clock.fastForward(1000); assert.equal(await visible(), true);
  await page.locator('#si-mobile-menu-btn').evaluate(el => el.setAttribute('aria-expanded', 'true'));
  assert.equal(await visible(), false);
  await page.locator('#si-mobile-menu-btn').evaluate(el => el.setAttribute('aria-expanded', 'false'));
  assert.equal(await visible(), true);
  await page.locator('#si-cookie-banner').evaluate(el => el.hidden = false);
  assert.equal(await visible(), false);
});

for (const [name, ua, touch, expected] of [
  ['Safari iPhone', safari, 1, false], ['Safari iPadOS', ipad.replace('CriOS/140.0', 'Version/18.0'), 5, false],
  ['Chrome iPadOS', ipad, 5, true], ['desktop Mac', ipad, 0, false],
  ['Android', 'Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile Safari/537.36', 5, false],
  ['Firefox iPhone', iphone.replace('CriOS/140.0', 'FxiOS/140.0'), 1, true],
]) test(name + ' eligibility', async t => {
  const {page, start, visible} = await setup(t, ua, touch);
  await start(); await page.clock.fastForward(9000); assert.equal(await visible(), expected);
});

test('one prompt per session, expired dismissal permits a new session', async t => {
  const {page, start, visible} = await setup(t);
  await page.evaluate(() => localStorage.setItem('si-ios-prompt-dismissed-until', String(Date.now() - 1)));
  await start(); await page.clock.fastForward(8000); assert.equal(await visible(), true);
  await page.reload(); await start(); await page.clock.fastForward(8000); assert.equal(await visible(), false);
});

test('blocked storage does not break display or close button', async t => {
  const {page, start, visible} = await setup(t, iphone, 1, true);
  await start(); await page.clock.fastForward(8000); assert.equal(await visible(), true);
  await page.locator('[data-ios-dismiss]').click(); assert.equal(await visible(), false);
  await start(); await page.clock.fastForward(8000); assert.equal(await visible(), false);
});

test('Escape consumed by the mobile menu does not dismiss the download suggestion', async t => {
  const {page, start, visible} = await setup(t);
  await page.evaluate(() => {
    document.addEventListener('keydown', event => {
      const menu = document.getElementById('si-mobile-menu-btn');
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  });
  await start(); await page.clock.fastForward(8000);
  await page.locator('#si-mobile-menu-btn').evaluate(el => el.setAttribute('aria-expanded', 'true'));
  assert.equal(await visible(), false);
  await page.keyboard.press('Escape');
  assert.equal(await visible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('si-ios-prompt-dismissed-until')), null);
});
