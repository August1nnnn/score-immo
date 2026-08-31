import type { BarometreFiche } from './barometre-editions';

type InsightFiche = BarometreFiche & {
  type_bien?: unknown;
  dpe?: unknown;
};

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function finitePositive(values: unknown[]) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function assertHomogeneousEdition(fiches: InsightFiche[]) {
  if (fiches.length === 0) throw new Error('Impossible de décrire une édition vide');
  const signatures = new Set(
    fiches.map((fiche) => `${fiche.mois}|${fiche.methodology_version}`),
  );
  if (signatures.size !== 1) {
    throw new Error('Les insights exigent une édition homogène');
  }
}

export function buildEditionInsights<T extends InsightFiche>(fiches: T[]) {
  assertHomogeneousEdition(fiches);
  const scores = fiches.map((fiche) => fiche.score_global);
  const typeKeys = ['appartement', 'maison'];
  const scoreBands = [
    { key: '0-49', label: '0 à 49', minimum: 0, maximum: 49 },
    { key: '50-59', label: '50 à 59', minimum: 50, maximum: 59 },
    { key: '60-69', label: '60 à 69', minimum: 60, maximum: 69 },
    { key: '70-79', label: '70 à 79', minimum: 70, maximum: 79 },
    { key: '80-100', label: '80 à 100', minimum: 80, maximum: 100 },
  ].map((band) => ({
    ...band,
    count: scores.filter((score) => score >= band.minimum && score <= band.maximum).length,
  }));

  const propertyTypes = typeKeys
    .map((key) => {
      const group = fiches.filter((fiche) => fiche.type_bien === key);
      const groupScores = group.map((fiche) => fiche.score_global);
      const prices = finitePositive(group.map((fiche) => fiche.prix_m2));
      return {
        key,
        label: key === 'appartement' ? 'Appartements' : 'Maisons',
        count: group.length,
        averageScore: group.length
          ? Math.round(groupScores.reduce((sum, score) => sum + score, 0) / group.length)
          : null,
        medianScore: median(groupScores),
        medianPriceM2: prices.length ? Math.round(median(prices)!) : null,
      };
    })
    .filter(({ count }) => count > 0);

  const dpe = [...'ABCDEFG'].map((label) => ({
    label,
    count: fiches.filter((fiche) => fiche.dpe === label).length,
  }));

  const regionCounts = new Map<string, number>();
  for (const fiche of fiches) {
    regionCounts.set(fiche.region, (regionCounts.get(fiche.region) ?? 0) + 1);
  }
  const regions = [...regionCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));

  return {
    count: fiches.length,
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    medianScore: median(scores)!,
    minimumScore: Math.min(...scores),
    maximumScore: Math.max(...scores),
    scoreBands,
    propertyTypes,
    dpe,
    regions,
  };
}
