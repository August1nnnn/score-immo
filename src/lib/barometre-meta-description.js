const MAX_META_DESCRIPTION_LENGTH = 160;

export function buildBarometreMetaDescription(fiche) {
  const property = fiche.type_bien === 'appartement'
    ? "d'un appartement"
    : "d'une maison";
  const base = `Analyse Score-Immo ${property} de ${fiche.surface} m² à ${fiche.ville} (${fiche.code_postal}) : score ${fiche.score_global}/100.`;

  if (base.length > MAX_META_DESCRIPTION_LENGTH) {
    throw new Error(`Barometer base description exceeds ${MAX_META_DESCRIPTION_LENGTH} characters: ${fiche.slug}`);
  }

  const verdict = String(fiche.verdict || '').replace(/\s+/g, ' ').trim();
  if (!verdict) return base;

  const candidate = `${base} ${verdict}`;
  return candidate.length <= MAX_META_DESCRIPTION_LENGTH ? candidate : base;
}
