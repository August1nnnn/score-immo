import type { APIRoute } from 'astro';
import capitalesAout from '@/data/barometre-capitales-2026-08.json';

export const prerender = true;

export const GET: APIRoute = () => new Response(`${JSON.stringify(capitalesAout)}\n`, {
  status: 200,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'content-disposition': 'inline; filename="barometre-capitales-regionales-2026-08.json"',
    'x-content-type-options': 'nosniff',
  },
});
