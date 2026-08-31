#!/usr/bin/env node
// Vérifie dans Chromium les débordements de texte et le scroll horizontal.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const DIST = resolve(readArg('--dist', 'dist'));
const PAGES = readArg('--pages', 'barometre.html,index.html,tarifs.html').split(',');
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-nav-min', width: 1152, height: 900 },
  { name: 'desktop-compact', width: 1024, height: 900 },
  { name: 'tablette', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-etroit', width: 320, height: 844 },
];
const SPILL_TOLERANCE_PX = 1.5;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  if (args.includes('--allow-missing')) {
    console.warn('[geometrie] IGNORÉ volontairement : Playwright absent, 0 page mesurée.');
    process.exit(0);
  }
  console.error('[geometrie] Playwright introuvable : aucune page n\'a été mesurée.');
  console.error('[geometrie] Installer « npx playwright install --with-deps chromium »,');
  console.error('[geometrie] ou passer --allow-missing pour assumer explicitement l\'absence de contrôle.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent((request.url || '/').split('?')[0]);
    let file = join(DIST, path);
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const PROBE = `(() => {
  const report = { scrollWidth: document.documentElement.scrollWidth,
                   clientWidth: document.documentElement.clientWidth,
                   headerGap: null, logoNavGap: null, navActionsGap: null,
                   logoTextHeight: null, spills: [] };
  const logo = document.querySelector('.si-header .si-logo');
  const logoText = document.querySelector('.si-header .si-logo-text');
  const nav = document.querySelector('.si-header .si-header-nav');
  const actions = document.querySelector('.si-header .si-header-actions');
  if (logo && actions && logo.getBoundingClientRect().width > 0) {
    report.headerGap = actions.getBoundingClientRect().left - logo.getBoundingClientRect().right;
  }
  if (logoText && logoText.getBoundingClientRect().width > 0) {
    report.logoTextHeight = logoText.getBoundingClientRect().height;
  }
  if (logo && nav && actions && nav.getBoundingClientRect().width > 0) {
    report.logoNavGap = nav.getBoundingClientRect().left - logo.getBoundingClientRect().right;
    report.navActionsGap = actions.getBoundingClientRect().left - nav.getBoundingClientRect().right;
  }
  for (const node of document.querySelectorAll('body *')) {
    if (node.children.length) continue;
    if (!(node.textContent || '').trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const box = node.getBoundingClientRect();
    const parentBox = parent.getBoundingClientRect();
    if (box.width === 0 || parentBox.width === 0) continue;
    if (getComputedStyle(parent).overflow !== 'visible') continue;
    const right = box.right - parentBox.right;
    const left = parentBox.left - box.left;
    if (right > ${SPILL_TOLERANCE_PX} || left > ${SPILL_TOLERANCE_PX}) {
      report.spills.push({
        text: (node.textContent || '').trim().slice(0, 40),
        right: Math.round(right), left: Math.round(left),
        parent: parent.tagName.toLowerCase() + '.' + String(parent.className).trim().split(/\\s+/).join('.'),
      });
    }
  }
  return report;
})()`;

const browser = await chromium.launch();
const failures = [];
let checked = 0;

for (const page of PAGES) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
    });
    const tab = await context.newPage();
    const response = await tab.goto(`${origin}/${page}`, { waitUntil: 'networkidle' });
    await tab.waitForTimeout(400);
    const report = await tab.evaluate(PROBE);
    checked += 1;

    const where = `${page} @ ${viewport.name} (${viewport.width}px)`;
    if (!response?.ok()) failures.push(`${where} : HTTP ${response?.status() ?? 'inconnu'}`);
    if (report.scrollWidth > report.clientWidth) {
      failures.push(`${where} : défilement horizontal ${report.scrollWidth} > ${report.clientWidth}`);
    }
    if (report.headerGap !== null && report.headerGap < 4) {
      failures.push(`${where} : logo et actions se chevauchent (${report.headerGap.toFixed(1)}px)`);
    }
    if (report.logoNavGap !== null && report.logoNavGap < 4) {
      failures.push(`${where} : logo et navigation se chevauchent (${report.logoNavGap.toFixed(1)}px)`);
    }
    if (report.navActionsGap !== null && report.navActionsGap < 4) {
      failures.push(`${where} : navigation et actions se chevauchent (${report.navActionsGap.toFixed(1)}px)`);
    }
    if (report.logoTextHeight !== null && report.logoTextHeight > 34) {
      failures.push(`${where} : le nom de marque passe sur plusieurs lignes (${report.logoTextHeight.toFixed(1)}px)`);
    }
    for (const spill of report.spills) {
      const overshoot = spill.right > 0 ? `+${spill.right}px à droite` : `+${spill.left}px à gauche`;
      failures.push(`${where} : « ${spill.text} » sort de ${spill.parent} de ${overshoot}`);
    }
    await context.close();
  }
}

await browser.close();
server.close();

console.log(`[geometrie] ${checked} rendus mesurés sur ${PAGES.length} pages.`);
if (failures.length) {
  console.error(`[geometrie] ${failures.length} débordement(s) :`);
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}
console.log('[geometrie] Aucun texte ne sort de sa boîte, aucun défilement horizontal.');
