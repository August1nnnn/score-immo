// Shared region helpers. Defined in a module (not page frontmatter) so they are
// available inside getStaticPaths, which Astro evaluates in an isolated context.

export const slugifyRegion = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// 'France' is an editorial catch-all label, not a real region -> excluded.
export function groupByRegion<T extends { region?: string }>(all: T[]): Map<string, T[]> {
  const g = new Map<string, T[]>();
  for (const f of all) {
    const r = f.region;
    if (!r || r === 'France') continue;
    if (!g.has(r)) g.set(r, []);
    g.get(r)!.push(f);
  }
  return g;
}

export const REGION_MIN = 3; // minimum fiches for a region page (real aggregate)
