import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.DEMO_PREVIEW_URL??'http://127.0.0.1:4329/exemple-rapport.html';
const human=await (await fetch(base)).text();
const bot=await (await fetch(base,{headers:{'user-agent':'ChatGPT-User/1.0'}})).text();
assert.equal(human,bot,'Human and bot must receive the same page');
assert.match(human,/<h1[^>]*>Exemple complet de rapport immobilier/);
assert.match(human,/canonical[^>]*exemple-rapport/);
assert.ok(!/<meta[^>]*name="robots"[^>]*noindex/.test(human));
assert.match(readFileSync('dist/sitemap-0.xml','utf8'),/https:\/\/score-immo.fr\/exemple-rapport/);
const browser=await chromium.launch({headless:true});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},javaScriptEnabled:false});
  await page.goto(base);
  assert.equal(await page.locator('.demo-document h2').count(),12);
  assert.ok((await page.locator('.demo-document').innerText()).includes('307'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'No horizontal page overflow');
  await page.close();
 }
} finally{await browser.close();}
console.log('Static public demo: same HTML human/bot, 12 sections without JS, mobile/desktop no overflow, canonical and sitemap verified');
