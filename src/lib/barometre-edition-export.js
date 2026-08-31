import { buildBarometreManifest } from './barometre-manifest.js';

function normalizedOrigin(siteOrigin) {
  const url = new URL(siteOrigin);
  if (url.protocol !== 'https:') throw new TypeError('Edition export origin must use HTTPS');
  return url.origin;
}

function editionSignature(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError('Edition export requires at least one entry');
  }
  const signatures = new Set(
    entries.map((entry) => `${entry?.mois ?? ''}|${entry?.methodology_version ?? ''}`),
  );
  if (signatures.size !== 1) throw new TypeError('Edition export requires one homogeneous edition');
  return {
    edition: entries[0].mois,
    methodology: entries[0].methodology_version,
  };
}

function publicEditionReport(entry, report, origin) {
  const publishedPriceM2 = Number(entry.prix_m2);
  const derivedPriceM2 = Math.round(report.prix_demande / report.surface);
  return {
    id: report.slug,
    url: `${origin}/barometre/${report.slug}`,
    ville: report.ville,
    region: report.region,
    type_bien: report.type_bien,
    surface_m2: report.surface,
    prix_demande_eur: report.prix_demande,
    prix_demande_m2_eur: Number.isFinite(publishedPriceM2) && publishedPriceM2 > 0
      ? publishedPriceM2
      : derivedPriceM2,
    score_global: report.score_global,
    sections_visibles: Object.keys(report.score_sections).length,
    dpe: report.dpe,
    points_forts: [...report.points_forts],
    alertes_cles: [...report.alertes_cles],
    date_analyse: entry.date_analyse,
  };
}

export function buildEditionExport(entries, siteOrigin = 'https://score-immo.fr') {
  const origin = normalizedOrigin(siteOrigin);
  const { edition, methodology } = editionSignature(entries);
  const sourceBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const manifest = buildBarometreManifest(entries);
  const reports = manifest.reports.map((report) => (
    publicEditionReport(sourceBySlug.get(report.slug), report, origin)
  ));
  const dates = reports.map(({ date_analyse }) => date_analyse).filter(Boolean).sort();

  return {
    schema_version: 1,
    edition,
    methodology,
    count: reports.length,
    date_modified: dates.at(-1) ?? null,
    source_url: `${origin}/barometre`,
    downloads: {
      json: `${origin}/barometre/editions/${edition}.json`,
      csv: `${origin}/barometre/editions/${edition}.csv`,
    },
    scope: "Échantillon descriptif d'annonces analysées, non représentatif du marché immobilier français.",
    reports,
  };
}

function csvCell(value) {
  const raw = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeEditionCsv(dataset) {
  const columns = [
    'id',
    'ville',
    'region',
    'type_bien',
    'surface_m2',
    'prix_demande_eur',
    'prix_demande_m2_eur',
    'score_global',
    'sections_visibles',
    'dpe',
    'points_forts',
    'alertes_cles',
    'date_analyse',
    'url',
  ];
  const rows = dataset.reports.map((report) => (
    columns.map((column) => csvCell(report[column])).join(',')
  ));
  return `${columns.join(',')}\n${rows.join('\n')}\n`;
}
