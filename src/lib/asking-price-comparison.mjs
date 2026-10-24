/** Arithmetic on references supplied by the user; no automatic property valuation. */
export function compareAskingPrice(price, surface, references) {
  const positive = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
  if (!positive(price) || !positive(surface) || !Array.isArray(references) || references.length < 3 || !references.every(positive)) return null;
  const sorted = [...references].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const pricePerSqm = price / surface;
  const differencePercent = (pricePerSqm / median - 1) * 100;
  if (![median, pricePerSqm, differencePercent].every(Number.isFinite)) return null;
  return { pricePerSqm, median, differencePercent: Math.round(differencePercent * 100) / 100, referenceCount: references.length };
}
