export const LEGACY_BAROMETRE_METHOD = 'legacy-five-section-2026-06';
export const CURRENT_BAROMETRE_METHOD = 'current-category-grid-2026-08';

export type BarometreFiche = {
  slug: string;
  mois: string;
  methodology_version: string;
  score_global: number;
  prix_m2?: number | null;
  region: string;
  date_analyse: string;
  score_sections?: Record<string, number>;
  [key: string]: unknown;
};

export type BarometreEdition<T extends BarometreFiche = BarometreFiche> = {
  month: string;
  methodology: string;
  fiches: T[];
};

const LEGACY_SECTIONS = [
  { key: 'prix', label: 'Prix face au marché' },
  { key: 'dpe', label: 'Performance énergétique' },
  { key: 'risques', label: 'Risques naturels' },
  { key: 'urbanisme', label: 'Urbanisme' },
  { key: 'environnement', label: 'Environnement' },
];

const CURRENT_SECTIONS = [
  { key: 'prix', label: 'Prix face au marché' },
  { key: 'dpe', label: 'Performance énergétique' },
  { key: 'risques', label: 'Risques naturels et industriels' },
  { key: 'transports', label: 'Transports' },
  { key: 'commerces', label: 'Commerces et services' },
  { key: 'environnement', label: 'Environnement' },
  { key: 'urbanisme', label: 'Urbanisme' },
  { key: 'ecoles', label: 'Écoles' },
  { key: 'population', label: 'Profil socio-démographique' },
  { key: 'taxe_fonciere', label: 'Taxe foncière' },
  { key: 'rendement', label: 'Rendement locatif' },
  { key: 'cout', label: 'Coût d’acquisition' },
  { key: 'actualites', label: 'Actualités locales' },
];

export function sectionsForMethod(methodology: string) {
  if (methodology === LEGACY_BAROMETRE_METHOD) return LEGACY_SECTIONS;
  if (methodology === CURRENT_BAROMETRE_METHOD) return CURRENT_SECTIONS;
  throw new Error(`Méthode Baromètre inconnue : ${methodology}`);
}

export function sectionsForScoreGrid(
  methodology: string,
  scores: Record<string, number> | null | undefined,
) {
  const publishedScores = scores && typeof scores === 'object' && !Array.isArray(scores)
    ? scores
    : {};
  return sectionsForMethod(methodology).filter(({ key }) => (
    Object.prototype.hasOwnProperty.call(publishedScores, key)
  ));
}

export function scoreSectionCountRange<T extends BarometreFiche>(fiches: T[]) {
  if (fiches.length === 0) throw new Error('Impossible de compter les sections d’une édition vide');
  const counts = fiches.map((fiche) => (
    sectionsForScoreGrid(fiche.methodology_version, fiche.score_sections).length
  ));
  return {
    minimum: Math.min(...counts),
    maximum: Math.max(...counts),
  };
}

export function groupByEdition<T extends BarometreFiche>(fiches: T[]): BarometreEdition<T>[] {
  const groups = new Map<string, BarometreEdition<T>>();
  for (const fiche of fiches) {
    if (!fiche.mois || !fiche.methodology_version) {
      throw new Error(`Édition ou méthode manquante pour ${fiche.slug}`);
    }
    const key = `${fiche.mois}|${fiche.methodology_version}`;
    if (!groups.has(key)) {
      groups.set(key, {
        month: fiche.mois,
        methodology: fiche.methodology_version,
        fiches: [],
      });
    }
    groups.get(key)!.fiches.push(fiche);
  }
  return [...groups.values()]
    .map((edition) => ({
      ...edition,
      fiches: [...edition.fiches].sort((a, b) => b.score_global - a.score_global || a.slug.localeCompare(b.slug, 'fr')),
    }))
    .sort((a, b) => b.month.localeCompare(a.month) || a.methodology.localeCompare(b.methodology));
}

export function selectLatestEdition<T extends BarometreFiche>(
  fiches: T[],
  { minCount = 1 }: { minCount?: number } = {},
): BarometreEdition<T> {
  const edition = groupByEdition(fiches).find((candidate) => candidate.fiches.length >= minCount);
  if (!edition) throw new Error(`Aucune édition homogène avec au moins ${minCount} fiche(s)`);
  return edition;
}

export function selectLatestRegionalEdition<T extends BarometreFiche>(
  fiches: T[],
  { minCount = 3 }: { minCount?: number } = {},
): BarometreEdition<T> {
  return selectLatestEdition(fiches, { minCount });
}

export function aggregateEdition<T extends BarometreFiche>(fiches: T[]) {
  if (fiches.length === 0) throw new Error('Impossible d’agréger une édition vide');
  const signatures = new Set(fiches.map((fiche) => `${fiche.mois}|${fiche.methodology_version}`));
  if (signatures.size !== 1) throw new Error('L’agrégat doit utiliser une édition homogène');
  const withPrice = fiches
    .map((fiche) => Number(fiche.prix_m2))
    .filter((value) => Number.isFinite(value) && value > 0);
  const dates = fiches.map((fiche) => fiche.date_analyse).filter(Boolean).sort();
  return {
    count: fiches.length,
    avgScore: Math.round(fiches.reduce((sum, fiche) => sum + fiche.score_global, 0) / fiches.length),
    avgPriceM2: withPrice.length
      ? Math.round(withPrice.reduce((sum, value) => sum + value, 0) / withPrice.length)
      : null,
    regions: new Set(fiches.map((fiche) => fiche.region)).size,
    latestAnalysisDate: dates.at(-1) ?? null,
  };
}
