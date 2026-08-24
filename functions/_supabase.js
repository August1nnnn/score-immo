export function getSupabaseSecretKey(env) {
  const key = env?.SUPABASE_SECRET_KEY;
  if (typeof key !== "string") return null;

  const normalized = key.trim();
  return normalized.startsWith("sb_secret_") ? normalized : null;
}

export function supabaseHeaders(secretKey, prefer) {
  const headers = {
    apikey: secretKey,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}
