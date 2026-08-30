// gen-barometre.mjs — Generate static barometre content (JSON) from the published
// `barometre_reports` rows in Supabase. Run before build to refresh the SEO pages:
//   SCOREIMMO_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... node scripts/gen-barometre.mjs
// Writes one file per published fiche into src/content/barometre/<slug>.json.
// The data is committed to the repo (same pattern as the blog articles collection),
// so the Astro build stays purely static (no build-time external dependency).
import { writeFileSync, readdirSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  fetchPublishedBarometreRows,
  getBarometrePublishableKey,
} from './barometre-supabase.mjs';
import {
  assertFreshLatestEdition,
  normalizePublishedRows,
} from './barometre-public-data.mjs';

const PUBLISHABLE_KEY = getBarometrePublishableKey();

if (!PUBLISHABLE_KEY) {
  console.error('SCOREIMMO_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'content', 'barometre');
// Defense in depth for the four known legacy rows while the generic validator
// below rejects any row whose region is missing or equal to France.
const REJECTED_SOURCE_SLUGS = new Set([
  'la-roche-guyon-appartement-45m2-99k',
  'maxeville-appartement-74m2-97k',
  'nancy-appartement-47m2-96k',
  'sons-et-roncheres-maison-92m2-25k',
]);
let rows;
try {
  rows = await fetchPublishedBarometreRows({ publishableKey: PUBLISHABLE_KEY });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

let fiches;
try {
  const rejectedRows = rows.filter((row) =>
    REJECTED_SOURCE_SLUGS.has(row.slug) || !row.region || row.region.trim() === 'France'
  );
  if (rejectedRows.length > 0) {
    throw new Error(`Geographie invalide: ${rejectedRows.map((row) => row.slug).join(', ')}`);
  }
  fiches = normalizePublishedRows(rows);
  assertFreshLatestEdition(fiches);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) if (f.endsWith('.json')) rmSync(join(OUT, f));
} else {
  mkdirSync(OUT, { recursive: true });
}

for (const fiche of fiches) {
  writeFileSync(join(OUT, `${fiche.slug}.json`), JSON.stringify(fiche, null, 2) + '\n');
}
console.log(`Wrote ${fiches.length} barometre fiches to src/content/barometre/`);
