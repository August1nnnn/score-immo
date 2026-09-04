// The browser supplies no user identity. Marketing presence is always anonymous.
import { getSupabaseSecretKey, supabaseHeaders } from '../_supabase.js';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEVICES = new Set(['desktop', 'mobile', 'tablet', 'unknown']);
function hasConsent(request) {
  return (request.headers.get('cookie') || '').split(';').some(part => part.trim() === 'si_cookie_consent=accepted');
}
function publicPath(value) {
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/admin')) return null;
  if (path === '/' || /^\/(blogs|barometre|pages)(\/[a-z0-9-]+){1,4}\/?$/i.test(path) || /^\/(pro|tarifs|iad|barometre|guides)\/?$/i.test(path)) return path.slice(0, 240);
  return '/other';
}
export async function onRequestPost({ request, env }) {
  if (request.headers.get('origin') !== 'https://score-immo.fr') return new Response('Forbidden', { status: 403 });
  if (!hasConsent(request)) return new Response(null, { status: 204 });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return new Response('JSON required', { status: 415 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 2048) return new Response('Payload too large', { status: 413 });
    body = JSON.parse(text);
  } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['session_id', 'path', 'device_type'].includes(key)) || !UUID.test(body.session_id || '') || typeof body.path !== 'string' || !DEVICES.has(body.device_type)) return new Response('Invalid payload', { status: 400 });
  const path = publicPath(body.path);
  if (!path) return new Response('Invalid path', { status: 400 });
  const key = getSupabaseSecretKey(env);
  if (!key || !env.SUPABASE_URL) return new Response('Unavailable', { status: 503 });
  try {
    const result = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_analytics_presence`, {
      method: 'POST', headers: supabaseHeaders(key),
      body: JSON.stringify({ p_session_id: body.session_id, p_path: path, p_device_type: body.device_type, p_source: 'marketing' }),
      signal: AbortSignal.timeout(10000),
    });
    return result.ok ? new Response(null, { status: 204 }) : new Response('Presence unavailable', { status: 502 });
  } catch { return new Response('Presence unavailable', { status: 502 }); }
}
