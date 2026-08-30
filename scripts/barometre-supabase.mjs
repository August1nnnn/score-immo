const SUPABASE_URL = "https://afvtxiklivnmakqixkml.supabase.co";
const PUBLIC_COLUMNS = [
  "mois", "ville", "code_postal", "region", "type_bien", "surface",
  "prix_demande", "score_global", "score_sections", "dpe", "alertes_cles",
  "points_forts", "verdict", "is_edito", "edito_label", "slug",
  "source_report_id", "details_json",
].join(",");

export function getBarometrePublishableKey(environment = process.env) {
  const key = environment.SCOREIMMO_SUPABASE_PUBLISHABLE_KEY;
  if (typeof key !== "string") return null;

  const normalized = key.trim();
  return normalized.startsWith("sb_publishable_") ? normalized : null;
}

export async function fetchPublishedBarometreRows({
  publishableKey,
  fetchImpl = globalThis.fetch,
}) {
  if (!publishableKey?.startsWith("sb_publishable_")) {
    throw new Error("A Supabase publishable key is required");
  }

  const response = await fetchImpl(
    // Only real scanned listings (source_report_id set) — never publish seed/mock rows to SEO.
    `${SUPABASE_URL}/rest/v1/barometre_reports?publie=eq.true&source_report_id=not.is.null&order=mois.desc%2Cscore_global.desc&select=${PUBLIC_COLUMNS}`,
    { headers: { apikey: publishableKey } },
  );
  if (!response.ok) {
    throw new Error(
      `Supabase fetch failed ${response.status} ${await response.text()}`,
    );
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No published barometre rows");
  }
  return rows;
}
