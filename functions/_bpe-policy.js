/** Expire old equipment snapshots, including old preview deployments. */
export function bpeAssetPolicy(path, now = Date.now()) {
  if (!path.startsWith('/data/bpe/')) return null;
  if (path === '/data/bpe/current.json') return { expired: false, cacheSeconds: 3600 };
  const match = path.match(/^\/data\/bpe\/(20\d{2})-(20\d{2}-\d{2}-\d{2})-[a-f0-9]{8}\/(?:\d{1,4}_\d{1,3}\.json\.gz|manifest\.json)$/);
  if (!match) return { expired: true, cacheSeconds: 0 };
  const verified = Date.parse(match[2] + 'T00:00:00Z');
  const expires = verified + 35 * 86400000;
  if (!Number.isFinite(verified) || new Date(verified).toISOString().slice(0,10) !== match[2] || verified > now || now >= expires) return { expired: true, cacheSeconds: 0 };
  return { expired: false, cacheSeconds: Math.min(86400, Math.floor((expires-now)/1000)) };
}
