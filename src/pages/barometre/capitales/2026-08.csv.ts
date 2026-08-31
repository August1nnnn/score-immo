import type { APIRoute } from 'astro';
import capitalesAout from '@/data/barometre-capitales-2026-08.json';

export const prerender = true;

const columns = [
  'region_code',
  'region',
  'capitale',
  'statut_donnees',
  'code_insee',
  'code_postal',
  'type_bien',
  'surface',
  'prix_affiche',
  'prix_m2',
  'dpe',
  'ges',
  'date_publication',
] as const;

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const GET: APIRoute = () => {
  const observations = [
    ...capitalesAout.observations.map((observation) => ({
      ...observation,
      statut_donnees: 'complet' as const,
    })),
    ...capitalesAout.observations_partielles.map((observation) => ({
      ...observation,
      statut_donnees: 'partiel_dpe_non_renseigne' as const,
    })),
  ].sort((left, right) => left.region_code.localeCompare(right.region_code, 'fr'));
  const lines = [
    columns.join(','),
    ...observations.map((observation) => (
      columns.map((column) => csvCell(observation[column])).join(',')
    )),
  ];
  return new Response(`\uFEFF${lines.join('\r\n')}\r\n`, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'inline; filename="barometre-capitales-regionales-2026-08.csv"',
      'x-content-type-options': 'nosniff',
    },
  });
};
