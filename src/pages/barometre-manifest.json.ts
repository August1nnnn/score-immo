import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildBarometreManifest } from '@/lib/barometre-manifest.js';

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = (await getCollection('barometre')).map(({ data }) => data);
  const manifest = buildBarometreManifest(entries);
  return new Response(`${JSON.stringify(manifest)}\n`, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  });
};
