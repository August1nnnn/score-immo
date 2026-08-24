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

const PUBLISHABLE_KEY = getBarometrePublishableKey();

if (!PUBLISHABLE_KEY) {
  console.error('SCOREIMMO_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'content', 'barometre');
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

const invalidRows = rows.filter((row) =>
  REJECTED_SOURCE_SLUGS.has(row.slug) || !row.region || row.region.trim() === 'France'
);
if (invalidRows.length > 0) {
  console.error(
    'Barometre generation stopped: invalid geography for',
    invalidRows.map((row) => row.slug).join(', '),
  );
  process.exit(1);
}

if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) if (f.endsWith('.json')) rmSync(join(OUT, f));
} else {
  mkdirSync(OUT, { recursive: true });
}

let n = 0;
for (const r of rows) {
  const surface = Number(r.surface) || 0;
  const prix = Number(r.prix_demande) || 0;
  const fiche = {
    slug: r.slug,
    ville: r.ville,
    code_postal: r.code_postal,
    region: r.region,
    type_bien: r.type_bien,
    surface,
    prix_demande: prix,
    prix_m2: surface > 0 ? Math.round(prix / surface) : null,
    score_global: r.score_global,
    score_sections: r.score_sections || {},
    dpe: r.dpe || null,
    points_forts: r.points_forts || [],
    alertes_cles: r.alertes_cles || [],
    verdict: r.verdict || '',
    mois: r.mois,
    is_edito: !!r.is_edito,
    edito_label: r.edito_label || null,
    date_analyse: `${r.mois}-01`,
    details: r.details_json || null,
  };
  writeFileSync(join(OUT, `${r.slug}.json`), JSON.stringify(fiche, null, 2) + '\n');
  n++;
}
console.log(`Wrote ${n} barometre fiches to src/content/barometre/`);
