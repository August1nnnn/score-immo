const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const LEGACY_METHOD = "legacy-five-section-2026-06";
const CURRENT_METHOD = "current-category-grid-2026-08";
const LEGACY_SECTION_KEYS = ["prix", "dpe", "risques", "urbanisme", "environnement"];
const CURRENT_SECTION_KEYS = [
  "prix", "dpe", "risques", "transports", "commerces", "environnement",
  "urbanisme", "ecoles", "population", "taxe_fonciere", "rendement", "cout",
  "actualites",
];

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteInRange(value, minimum, maximum = Number.POSITIVE_INFINITY) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function hasExactScores(scores, expectedKeys) {
  if (!isRecord(scores)) return false;
  const actualKeys = Object.keys(scores).sort();
  const sortedExpected = [...expectedKeys].sort();
  return actualKeys.length === sortedExpected.length
    && actualKeys.every((key, index) => key === sortedExpected[index])
    && Object.values(scores).every((score) => isFiniteInRange(score, 0, 10));
}

function isValidPublicEntry(entry) {
  if (!isRecord(entry) || !SAFE_SLUG.test(entry.slug ?? "")) return false;
  for (const value of [
    entry.mois,
    entry.ville,
    entry.code_postal,
    entry.region,
    entry.type_bien,
    entry.dpe,
    entry.verdict,
  ]) if (!isNonEmptyString(value)) return false;
  if (!SAFE_MONTH.test(entry.mois) || !/^\d{5}$/.test(entry.code_postal)) return false;
  if (entry.region.trim() === "France" || !/^[A-G]$/.test(entry.dpe)) return false;
  if (!isFiniteInRange(entry.surface, Number.EPSILON)) return false;
  if (!isFiniteInRange(entry.prix_demande, Number.EPSILON)) return false;
  if (!isFiniteInRange(entry.score_global, 0, 100)) return false;
  if (typeof entry.is_edito !== "boolean") return false;
  if (entry.edito_label != null && typeof entry.edito_label !== "string") return false;
  if (!Array.isArray(entry.alertes_cles) || !entry.alertes_cles.every((item) => typeof item === "string")) {
    return false;
  }
  if (!Array.isArray(entry.points_forts) || !entry.points_forts.every((item) => typeof item === "string")) {
    return false;
  }
  const isCurrent = entry.mois >= "2026-08";
  const expectedMethod = isCurrent ? CURRENT_METHOD : LEGACY_METHOD;
  if (entry.methodology_version !== expectedMethod) return false;
  const expectedSections = isCurrent ? CURRENT_SECTION_KEYS : LEGACY_SECTION_KEYS;
  return hasExactScores(entry.score_sections, expectedSections);
}

function publicReport(entry) {
  return {
    id: entry.slug,
    mois: entry.mois,
    ville: entry.ville,
    code_postal: entry.code_postal,
    region: entry.region,
    type_bien: entry.type_bien,
    surface: entry.surface,
    prix_demande: entry.prix_demande,
    score_global: entry.score_global,
    score_sections: { ...entry.score_sections },
    dpe: entry.dpe,
    alertes_cles: [...entry.alertes_cles],
    points_forts: [...entry.points_forts],
    verdict: entry.verdict,
    is_edito: entry.is_edito,
    edito_label: entry.edito_label ?? null,
    slug: entry.slug,
    publie: true,
  };
}

export function buildBarometreManifest(entries) {
  if (!Array.isArray(entries)) throw new TypeError("Barometre entries must be an array");
  const slugs = new Set();
  const editorialMonths = new Set();
  const reports = entries.map((entry) => {
    if (!isRecord(entry) || !SAFE_SLUG.test(entry.slug ?? "")) {
      throw new TypeError("Invalid Barometre slug");
    }
    if (!isValidPublicEntry(entry)) throw new TypeError("Invalid public Barometre entry");
    if (slugs.has(entry.slug)) throw new TypeError(`Duplicate Barometre slug: ${entry.slug}`);
    if (entry.is_edito && editorialMonths.has(entry.mois)) {
      throw new TypeError(`Duplicate editorial Barometre entry for ${entry.mois}`);
    }
    slugs.add(entry.slug);
    if (entry.is_edito) editorialMonths.add(entry.mois);
    return publicReport(entry);
  });
  reports.sort((a, b) => a.slug.localeCompare(b.slug));
  return { schema_version: 1, reports };
}
