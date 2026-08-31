import type { APIRoute } from 'astro';
import capitalesAout from '@/data/barometre-capitales-2026-08.json';

export const prerender = true;

const columns = [
  'region_code',
  'region',
  'capitale',
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
  const lines = [
    columns.join(','),
    ...capitalesAout.observations.map((observation) => (
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
