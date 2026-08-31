import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { groupByEdition } from '@/lib/barometre-editions';
import {
  buildEditionExport,
  serializeEditionCsv,
} from '@/lib/barometre-edition-export.js';

export const prerender = true;

export async function getStaticPaths() {
  const entries = (await getCollection('barometre')).map(({ data }) => data);
  return groupByEdition(entries).map((edition) => ({
    params: { month: edition.month },
    props: { entries: edition.fiches },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const dataset = buildEditionExport(props.entries);
  return new Response(serializeEditionCsv(dataset), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `inline; filename="barometre-score-immo-${dataset.edition}.csv"`,
      'x-content-type-options': 'nosniff',
    },
  });
};
