const FALLBACK_NOT_FOUND_HTML = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, follow">
    <title>Page introuvable — ScoreImmo</title>
  </head>
  <body>
    <main>
      <h1>Page introuvable</h1>
      <p>Cette page n’existe plus.</p>
      <p><a href="/barometre">Voir le Baromètre ScoreImmo</a></p>
    </main>
  </body>
</html>`;

const STALE_CACHE_HEADERS = [
  "age",
  "cdn-cache-control",
  "cloudflare-cdn-cache-control",
  "etag",
  "expires",
  "last-modified",
  "surrogate-control",
];

export async function retiredRouteResponse(context) {
  let asset = null;

  try {
    if (typeof context?.env?.ASSETS?.fetch !== "function") {
      throw new Error("ASSETS binding unavailable");
    }

    const notFoundUrl = new URL("/404", context.request.url);
    const candidate = await context.env.ASSETS.fetch(notFoundUrl);
    if (candidate.status === 200 || candidate.status === 404) asset = candidate;
  } catch {
    asset = null;
  }

  const headers = new Headers(asset?.headers);
  for (const header of STALE_CACHE_HEADERS) headers.delete(header);
  headers.set("cache-control", "no-store");
  headers.set("x-robots-tag", "noindex, follow");
  if (!headers.has("content-type")) {
    headers.set("content-type", "text/html; charset=utf-8");
  }

  const isHead = context.request.method.toUpperCase() === "HEAD";
  const body = isHead ? null : (asset?.body ?? FALLBACK_NOT_FOUND_HTML);

  return new Response(body, {
    status: 404,
    statusText: "Not Found",
    headers,
  });
}
