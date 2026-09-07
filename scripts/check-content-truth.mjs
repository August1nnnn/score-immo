import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}


// Audit the complete article corpus, including HTML duplicated in JSON fields.
function blogOfferIssues(source) {
  const text = source.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code))).replace(/&euro;/gi, '€').replace(/&nbsp;/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const issues = [];
  if (/(?:notez|estimez)[^.!?]{0,100}(?:annonce|bien)[^.!?]{0,80}gratuit/i.test(text)) issues.push('free property scoring or valuation promise');
  if (/rapport détaillé[^.!?]{0,120}gratuit/i.test(text)) issues.push('free detailed report promise');
  if (/analysez\s+(?:gratuitement\s+(?:une|l['’])\s*annonce|une annonce gratuitement)/i.test(text)) issues.push('free personalized report promise');
  if (/text-décoration\s*:/i.test(source)) issues.push('invalid text-décoration CSS');
  if (/(?:\/go)?\/checkout\/(?:unit|discovery)(?=[?"'\s<\\/]|$)/i.test(source)) issues.push('legacy checkout SKU');
  // Currency amounts only: mortgage rates and other market statistics are untouched.
  if (/(?:rapport personnalisé|analyse[rz] (?:une|mon|votre) annonce|rapport complet|Score[- ]?Immo)[^.!?]{0,100}\b2[,.]99\s*(?:€|EUR(?:OS)?\b)/i.test(text)) issues.push('obsolete unit price');
  if (/9[,.]99\s*(?:€|EUR(?:OS)?\b)\s*(?:pour|les|\/)?\s*5\s*(?:crédits|rapports|analyses)/i.test(text)) issues.push('obsolete five-credit offer');
  if (/(?:Score[- ]?Immo|pack|rapports|analyses)[^.!?]{0,80}\b14[,.]95\s*(?:€|EUR(?:OS)?\b)/i.test(text)) issues.push('obsolete ten-report offer');
  if (/5\s*(?:crédits|rapports|analyses)\s*(?:à|pour|:|au prix de)?\s*9[,.]99\s*(?:€|EUR(?:OS)?\b)/i.test(text)) issues.push('obsolete five-credit offer');
  return issues;
}
function allFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? allFiles(path) : [path];
  }).sort();
}
if (process.argv.includes('--self-test-blog')) {
  const cases = [
    ['Analyser une annonce dès 2,99 €', true],
    ['Rapport personnalisé payant : 2,99 € pour 1 crédit', true],
    ['9,99 € pour 5 crédits', true],
    ['<a href="/go/checkout/discovery">Acheter</a>', true],
    ['<a href="/go/checkout/unit_v2">Acheter</a>', false],
    ['text-décoration: none', true],
    ["Notez n'importe quelle annonce gratuitement.", true],
    ['Estimez votre futur bien gratuitement.', true],
    ['Un rapport détaillé avec le score, gratuitement.', true],
    ['Calculateur de frais de notaire gratuit', false],
    ['Calculateur de mensualité crédit gratuit', false],
    ['Rapport complet : 2,99 &euro;', true],
    ['Rapport personnalisé : 2,99 &#8364;', true],
    ['Analyser une annonce dès 2,99 EUR', true],
    ['Score-Immo à 2.99 &#x20ac;', true],
    ['5 analyses à 9,99 &euro;', true],
    ['9,99 EUR pour 5 analyses', true],
    ['Analysez gratuitement une annonce', true],
    ['Analysez une annonce gratuitement.', true],
    ['Voir un rapport de démonstration gratuit', false],
    ['Taux immobilier de 2,99 % ; concurrent à 2,99 €', false],
    ['4,99 € pour 1 crédit ; 9,99 € pour 3 crédits ; 19,99 € pour 10 crédits', false],
  ];
  for (const [source, expected] of cases) {
    if ((blogOfferIssues(source).length > 0) !== expected) throw new Error(`Blog audit regression: ${source}`);
  }
  console.log(`Blog audit regressions passed: ${cases.length}`);
  process.exit(0);
}

const checks = [
  {
    file: "src/components/sections/Features.astro",
    forbidden: ["pour tu donner"],
    message: "La home contient encore la faute « pour tu donner ».",
  },
  {
    file: "src/components/sections/Score.astro",
    forbidden: ["ne tu donne pas"],
    message: "La home contient encore la faute « ne tu donne pas ».",
  },
  {
    file: "src/pages/barometre/index.astro",
    forbidden: ["><strong>13</strong><span>sources officielles"],
    message: "Le Baromètre affiche encore 13 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/BehindScenes.astro",
    forbidden: ['{v:"9",l:"sources officielles"}'],
    message: "L’animation de la home affiche encore 9 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/Stats.astro",
    forbidden: ['data-target="9" data-suffix="">9</div>'],
    message: "Le bloc de chiffres de la home affiche encore 9 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/Pricing.astro",
    forbidden: ['data-counter="13" data-suffix="">13</p>'],
    message: "La page tarifs affiche encore 13 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "public/assets/og-default.svg",
    forbidden: ["9 sources officielles"],
    message: "La carte sociale par défaut affiche encore 9 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/content/articles/guides/loi-pinel-2026-conditions-plafonds-alternatives.json",
    forbidden: [
      "seul le dispositif Pinel Plus (aussi appelé Super Pinel) maintient",
      "seul le Pinel Plus survit en 2025-2026",
      "Le Pinel Plus reste pertinent",
      "Pinel Plus en 2026 pour conserver",
    ],
    message: "L’article Pinel 2026 présente encore un dispositif éteint comme accessible.",
  },
  {
    file: "src/content/articles/guides/acheter-ancien-neuf-comparatif-complet.json",
    forbidden: [
      "Loi Pinel</strong> : réduction d'impôt",
      "Neuf (Pinel 12 ans)",
      "Investisseurs fiscaux</strong> : optimisation Pinel",
    ],
    message: "Le comparatif ancien/neuf présente encore Pinel comme un avantage actuel.",
  },
  {
    file: "src/content/articles/quartiers/meilleurs-quartiers-acheter-toulouse.json",
    forbidden: ["avantages fiscaux intéressants (Pinel, PTZ)"],
    message: "L’article Toulouse présente encore Pinel comme un avantage actuel.",
  },
  {
    file: "src/content/articles/guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser.json",
    forbidden: [
      "31 décembre 2026",
      "prorogé jusqu'au <strong>31 décembre 2026</strong>",
      "date d'expiration : le 31 décembre 2026",
      "2026 est la dernière année certifiée",
      "https://www.service-public.fr/particuliers/vosdroits/F31151",
    ],
    message: "L’article Denormandie contient une date de fin ou une source obsolète.",
  },
  {
    file: "src/content/articles/guides/loi-pinel-2026-conditions-plafonds-alternatives.json",
    forbidden: ["\"https://www.service-public.fr/particuliers/vosdroits/F1730\""],
    message: "La source Loc'Avantages pointe vers une fiche Service-Public sans rapport.",
  },
];

const failures = [];

for (const check of checks) {
  const source = read(check.file);
  for (const phrase of check.forbidden) {
    if (source.includes(phrase)) {
      failures.push(`${check.file}: ${check.message} Motif: ${phrase}`);
    }
  }
}

const sourcesComponent = read("src/components/sections/Sources.astro");
const canonicalSources = [
  "DVF (Transactions)",
  "ADEME (DPE)",
  "INSEE",
  "G&eacute;orisques",
  "IGN / G&eacute;oportail de l'urbanisme",
  "BAN (Adresses)",
  "OpenStreetMap",
  "ATMO France",
  "DGFIP",
  "&Eacute;ducation Nationale",
];
for (const source of canonicalSources) {
  if (!sourcesComponent.includes(source)) {
    failures.push(`src/components/sections/Sources.astro: source canonique absente: ${source}`);
  }
}
const sourcePillCount = (sourcesComponent.match(/class="si-source-pill /g) || []).length;
if (sourcePillCount !== 10) {
  failures.push(
    `src/components/sections/Sources.astro: ${sourcePillCount} sources affichées, 10 attendues.`,
  );
}

const behindScenesComponent = read("src/components/sections/BehindScenes.astro");
const behindScenesSources =
  behindScenesComponent.match(/var SRC=\[(.*?)\];/)?.[1] ?? "";
if (!behindScenesSources.includes('"BAN (Adresses)"')) {
  failures.push(
    "src/components/sections/BehindScenes.astro: BAN (Adresses) est absente de la liste des 10 sources.",
  );
}
const behindScenesSourceCount = (
  behindScenesSources.match(/"[^"]+"/g) || []
).length;
if (behindScenesSourceCount !== 10) {
  failures.push(
    `src/components/sections/BehindScenes.astro: ${behindScenesSourceCount} sources affichées, 10 attendues.`,
  );
}

if (sourcesComponent.includes("Bing News")) {
  failures.push(
    "src/components/sections/Sources.astro: Bing News ne doit pas être présenté comme une source publique officielle française.",
  );
}


const articleFiles = allFiles(resolve(root, 'src/content/articles')).filter(path => path.endsWith('.json'));
for (const file of articleFiles) {
  const article = JSON.parse(readFileSync(file, 'utf8'));
  for (const issue of blogOfferIssues(JSON.stringify(article))) failures.push(`${file}: ${issue}`);
}
console.log(`Blog sources inspected: ${articleFiles.length} JSON files.`);
if (process.argv.includes('--built-blog')) {
  const dist = resolve(root, 'dist');
  if (!existsSync(dist)) throw new Error('Build missing: run the site build before --built-blog.');
  const sitemaps = allFiles(dist).filter(file => /sitemap.*\.xml$/.test(file));
  const urls = [...new Set(sitemaps.flatMap(file => [...readFileSync(file, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])).filter(url => new URL(url).pathname.startsWith('/blogs/')))];
  if (!urls.length) throw new Error('No blog routes in built sitemap.');
  let articles = 0;
  let hubs = 0;
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 3) articles++; else hubs++;
    const candidates = [resolve(dist, `.${pathname}`, 'index.html'), resolve(dist, `.${pathname.replace(/\/$/, '')}.html`)];
    const file = candidates.find(existsSync);
    if (!file) { failures.push(`Missing built blog page: ${pathname}`); continue; }
    for (const issue of blogOfferIssues(readFileSync(file, 'utf8'))) failures.push(`${pathname}: ${issue}`);
  }
  // Verify every nonredirected source independently of sitemap discovery.
  const redirected = read('src/lib/redirected-articles.ts');
  for (const file of articleFiles) {
    const article = JSON.parse(readFileSync(file, 'utf8'));
    if (redirected.includes(`'${article.handle}'`)) continue;
    if (!urls.some(url => new URL(url).pathname.replace(/\/$/, '').endsWith(`/${article.handle}`))) failures.push(`Article absent from sitemap: ${file}`);
  }
  console.log(`Built blog pages inspected: ${urls.length} (${articles} articles, ${hubs} category hubs).`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Content truth checks passed.");
