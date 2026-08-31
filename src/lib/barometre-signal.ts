import { sectionsForScoreGrid } from './barometre-editions.ts';

export type SignalAxis = {
  key: string;
  label: string;
  score: number;
};

export type FicheSignal = {
  /** Axes réellement notés, dans l'ordre canonique de la méthode. */
  axes: SignalAxis[];
  /** Nombre d'axes de la méthode qui n'ont pas été notés pour cette fiche. */
  missing: number;
  strongest: SignalAxis | null;
  weakest: SignalAxis | null;
  /** Première alerte publiée, si la fiche en porte une. */
  alert: string | null;
};

type SignalFiche = {
  methodology_version: string;
  score_sections?: Record<string, number> | null;
  alertes_cles?: unknown;
};

const SCORE_MAX = 10;

function readScore(value: unknown): number | null {
  // Number(null) vaut 0 : une note absente doit être rejetée sur son type,
  // jamais convertie, sinon elle s'affiche comme un vrai zéro.
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  if (value < 0 || value > SCORE_MAX) return null;
  return value;
}

/**
 * Décrit une fiche par ses notes réelles, sans jamais combler une note absente.
 * Un axe non noté est compté dans `missing` et reste hors de `axes` : il ne doit
 * pas être rendu comme un zéro.
 */
export function buildFicheSignal(fiche: SignalFiche): FicheSignal {
  const scores = fiche.score_sections ?? {};
  const graded = sectionsForScoreGrid(fiche.methodology_version, scores);

  const axes: SignalAxis[] = [];
  let missing = 0;
  for (const section of graded) {
    const score = readScore(scores[section.key]);
    if (score === null) {
      missing += 1;
      continue;
    }
    axes.push({ key: section.key, label: section.label, score });
  }

  let strongest: SignalAxis | null = null;
  let weakest: SignalAxis | null = null;
  for (const axis of axes) {
    if (!strongest || axis.score > strongest.score) strongest = axis;
    if (!weakest || axis.score < weakest.score) weakest = axis;
  }

  const alerts = Array.isArray(fiche.alertes_cles) ? fiche.alertes_cles : [];
  const firstAlert = alerts.find((value) => typeof value === 'string' && value.trim().length > 0);

  return {
    axes,
    missing,
    strongest,
    weakest,
    alert: typeof firstAlert === 'string' ? firstAlert : null,
  };
}

/** Hauteur de barre en pourcentage, bornée pour rester visible à 0/10. */
export function axisBarHeight(score: number) {
  return Math.max(Math.round((score / SCORE_MAX) * 100), 6);
}
