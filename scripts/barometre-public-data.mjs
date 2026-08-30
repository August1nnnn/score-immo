const LEGACY_KEYS = ["dpe", "environnement", "prix", "risques", "urbanisme"];
const CURRENT_KEYS = [
  "actualites", "commerces", "cout", "dpe", "ecoles", "environnement",
  "population", "prix", "rendement", "risques", "taxe_fonciere",
  "transports", "urbanisme",
];
const CURRENT_METHOD = "current-category-grid-2026-08";
const LEGACY_METHOD = "legacy-five-section-2026-06";

function validMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value ?? ""));
}

function assertExactScoreGrid(scores, keys, message) {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) throw new Error(message);
  const actual = Object.keys(scores).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(message);
  }
  for (const value of Object.values(scores)) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 10) {
      throw new Error("Une note de section est hors de l'echelle 0-10");
    }
  }
}

function validateBaseRow(row) {
  if (!validMonth(row.mois)) throw new Error(`Mois invalide pour ${row.slug ?? "ligne inconnue"}`);
  if (typeof row.slug !== "string" || !row.slug) throw new Error("Slug public manquant");
  if (typeof row.source_report_id !== "string" || !row.source_report_id) throw new Error(`Source manquante pour ${row.slug}`);
  if (typeof row.ville !== "string" || !row.ville.trim()) throw new Error(`Ville manquante pour ${row.slug}`);
  if (typeof row.region !== "string" || !row.region.trim() || row.region.trim() === "France") {
    throw new Error(`Geographie invalide pour ${row.slug}`);
  }
  if (!/^\d{5}$/.test(String(row.code_postal ?? ""))) throw new Error(`Code postal invalide pour ${row.slug}`);
  if (!/^[A-G]$/.test(String(row.dpe ?? ""))) throw new Error(`DPE invalide pour ${row.slug}`);
  if (!Number.isFinite(Number(row.surface)) || Number(row.surface) <= 0) throw new Error(`Surface invalide pour ${row.slug}`);
  if (!Number.isFinite(Number(row.prix_demande)) || Number(row.prix_demande) <= 0) throw new Error(`Prix invalide pour ${row.slug}`);
  if (!Number.isFinite(Number(row.score_global)) || Number(row.score_global) < 0 || Number(row.score_global) > 100) {
    throw new Error(`Score global invalide pour ${row.slug}`);
  }
}

function publicationFor(row) {
  const publication = row.details_json?.publication;
  if (row.mois < "2026-08") {
    assertExactScoreGrid(row.score_sections, LEGACY_KEYS, "Une fiche historique doit avoir cinq sections");
    return {
      analyzed_at: `${row.mois}-01`,
      methodology_version: LEGACY_METHOD,
      source_kind: "historical-curation",
      sample_policy: "historical-curated-sample",
    };
  }
  if (!publication || typeof publication !== "object") {
    throw new Error(`Provenance courante manquante pour ${row.slug}`);
  }
  if (publication.methodology_version !== CURRENT_METHOD) {
    throw new Error(`Methode courante invalide pour ${row.slug}`);
  }
  if (!["admin-test", "user-optin"].includes(publication.source_kind)) {
    throw new Error(`Source publique invalide pour ${row.slug}`);
  }
  if (publication.sample_policy !== "all-eligible-monthly-reports") {
    throw new Error(`Politique d'echantillon invalide pour ${row.slug}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publication.analyzed_at ?? "") || publication.analyzed_at.slice(0, 7) !== row.mois) {
    throw new Error(`Date d'analyse incoherente avec le mois pour ${row.slug}`);
  }
  assertExactScoreGrid(row.score_sections, CURRENT_KEYS, "Une fiche courante doit avoir treize sections");
  return publication;
}

function stripInternalPublication(details) {
  if (!details || typeof details !== "object") return null;
  const copy = structuredClone(details);
  delete copy.publication;
  return copy;
}

export function normalizePublishedRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Aucune fiche Barometre publiee");
  const slugs = new Set();
  const sources = new Set();
  const fiches = rows.map((row) => {
    validateBaseRow(row);
    if (slugs.has(row.slug)) throw new Error(`Slug duplique: ${row.slug}`);
    if (sources.has(row.source_report_id)) throw new Error(`Source dupliquee: ${row.source_report_id}`);
    slugs.add(row.slug);
    sources.add(row.source_report_id);
    const publication = publicationFor(row);
    const surface = Number(row.surface);
    const price = Number(row.prix_demande);
    return {
      slug: row.slug,
      ville: row.ville,
      code_postal: String(row.code_postal),
      region: row.region,
      type_bien: row.type_bien,
      surface,
      prix_demande: price,
      prix_m2: Math.round(price / surface),
      score_global: Number(row.score_global),
      score_sections: row.score_sections,
      dpe: row.dpe,
      points_forts: Array.isArray(row.points_forts) ? row.points_forts : [],
      alertes_cles: Array.isArray(row.alertes_cles) ? row.alertes_cles : [],
      verdict: typeof row.verdict === "string" ? row.verdict : "",
      mois: row.mois,
      is_edito: row.is_edito === true,
      edito_label: row.edito_label ?? null,
      date_analyse: publication.analyzed_at,
      methodology_version: publication.methodology_version,
      source_kind: publication.source_kind,
      sample_policy: publication.sample_policy,
      details: stripInternalPublication(row.details_json),
    };
  });
  return fiches.sort((a, b) => (
    b.mois.localeCompare(a.mois)
      || b.score_global - a.score_global
      || a.slug.localeCompare(b.slug, "fr")
  ));
}

export function assertFreshLatestEdition(fiches, {
  referenceDate = new Date().toISOString().slice(0, 10),
  maxAgeDays = 62,
} = {}) {
  if (!Array.isArray(fiches) || fiches.length === 0) throw new Error("Aucune edition a controler");
  const latestMonth = fiches.map((fiche) => fiche.mois).sort().at(-1);
  const editionDate = new Date(`${latestMonth}-01T00:00:00.000Z`);
  const reference = new Date(`${referenceDate}T00:00:00.000Z`);
  if (Number.isNaN(reference.valueOf())) throw new Error("Date de reference invalide");
  const ageDays = Math.floor((reference - editionDate) / 86_400_000);
  if (ageDays > maxAgeDays) {
    throw new Error(`La derniere edition ${latestMonth} est trop ancienne (${ageDays} jours)`);
  }
  return latestMonth;
}
