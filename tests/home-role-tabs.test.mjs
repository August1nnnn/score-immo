import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// This component is static HTML. Execute its actual script as a module, like Astro,
// so an accidental return to inline handlers referencing module-local names fails.
async function setup(t, width = 390) {
  const source = await readFile(new URL('../src/components/sections/Problem.astro', import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const html = source.replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/, '');
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(html);
  await page.addScriptTag({ type: 'module', content: script });
  return { page, errors };
}

for (const width of [320, 1440]) test(`all three roles reveal their existing argument at ${width}px`, async t => {
  const { page, errors } = await setup(t, width);
  assert.equal(await page.locator('#tab-acheteur').isVisible(), true);
  const copy = { vendeur: 'Tu ne connais pas la vraie valeur de ton bien.', agent: 'Tes clients hésitent. Ils comparent. Ils doutent.', acheteur: 'Le prix est-il juste ? Les risques ? Le quartier ?' };
  for (const role of ['vendeur', 'agent', 'acheteur', 'agent']) {
    await page.locator(`[data-tab="${role}"]`).click();
    assert.equal(await page.locator(`#tab-${role}`).isVisible(), true);
    assert.ok((await page.locator(`#tab-${role}`).textContent()).includes(copy[role]));
    for (const other of ['acheteur', 'vendeur', 'agent'].filter(item => item !== role)) {
      assert.equal(await page.locator(`#tab-${other}`).isVisible(), false);
    }
    assert.equal(await page.locator(`[data-tab="${role}"]`).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[role="tab"][aria-selected="true"]').count(), 1);
    assert.equal(await page.locator('[role="tab"][tabindex="0"]').count(), 1);
  }
  assert.deepEqual(errors, []);
});

test('keyboard arrows wrap, Home/End navigate and panels have accessible relationships', async t => {
  const { page } = await setup(t);
  await page.locator('[data-tab="acheteur"]').focus();
  for (const [key, expected] of [['ArrowRight', 'vendeur'], ['ArrowRight', 'agent'], ['ArrowRight', 'acheteur'], ['ArrowLeft', 'agent'], ['Home', 'acheteur'], ['End', 'agent']]) {
    await page.keyboard.press(key);
    const tab = page.locator(`[data-tab="${expected}"]`);
    assert.equal(await tab.evaluate(el => el === document.activeElement), true);
    assert.equal(await tab.getAttribute('aria-selected'), 'true');
    const panel = page.locator('#' + await tab.getAttribute('aria-controls'));
    assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.getAttribute('aria-labelledby'), await tab.getAttribute('id'));
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#tab-agent').evaluate(el => el === document.activeElement), true);
});
