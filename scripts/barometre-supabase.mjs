const SUPABASE_URL = "https://afvtxiklivnmakqixkml.supabase.co";

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
    `${SUPABASE_URL}/rest/v1/barometre_reports?publie=eq.true&source_report_id=not.is.null&order=score_global.desc&select=*`,
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
