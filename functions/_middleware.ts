// CF Pages middleware : three responsibilities.
//   1. Force canonical host (www, .com -> apex .fr) via 301.
//   2. Server-side bot crawl logger : log HTML GETs from bot UAs to Supabase
//      page_views with is_bot=true (captures GPTBot/ClaudeBot/PerplexityBot
//      which the consent-gated client JS beacon misses).
//   3. Inject CSP security header.

const BOT_RE =
  /bot|crawl|spider|slurp|lighthouse|headless|curl|wget|python|httpx|scrap|fetch|monitor|preview|vercel|facebookexternalhit|whatsapp|telegram|skypeuripreview|linkedinbot|twitterbot|duckduckbot|yandex|semrush|ahrefs|mj12bot|dotbot|petalbot|seznambot|applebot|ccbot|claudebot|gptbot|google-extended|perplexitybot|youbot|amazonbot|bytespider|duckassistbot|chatgpt-user|oai-searchbot|anthropic|cohere|diffbot|archive|uptime|pingdom|gtmetrix|Nexus 5X Build\/MMB29P/i;

const ASSET_EXT =
  /\.(js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|map|json|xml|txt|mp4|webm|mp3|pdf|zip)$/i;

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
}

function logBotIfRelevant(
  request: Request,
  response: Response,
  env: Env,
  waitUntil: (p: Promise<unknown>) => void,
): void {
  try {
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    const path = url.pathname;
    if (ASSET_EXT.test(path)) return;
    if (path.startsWith("/api/")) return;
    if (path.startsWith("/_astro/") || path.startsWith("/_worker")) return;

    const ua = request.headers.get("user-agent") || "";
    if (!ua || !BOT_RE.test(ua)) return;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return;

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

    const payload = {
      path: path.slice(0, 500),
      referrer: (request.headers.get("referer") || "").slice(0, 500) || null,
      user_agent: ua.slice(0, 500),
      is_bot: true,
      country: request.headers.get("cf-ipcountry") || null,
      city: request.headers.get("cf-ipcity") || null,
    };

    waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/page_views`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      }).catch(() => null),
    );
  } catch {
    // silent
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // (1) 301 canonical host : all variants -> score-immo.fr
  const redirectHosts = new Set([
    'www.score-immo.fr',
    'score-immo.com',
    'www.score-immo.com',
  ]);
  if (redirectHosts.has(url.hostname)) {
    const target = new URL(context.request.url);
    target.hostname = 'score-immo.fr';
    return Response.redirect(target.toString(), 301);
  }

  const response = await context.next();

  // (2) Bot crawl logger (no-op for assets/non-HTML/non-bot/no-env-vars)
  logBotIfRelevant(context.request, response, context.env, context.waitUntil);

  // (3) CSP header injection
  const headers = new Headers(response.headers);
  if (!headers.has('content-security-policy')) {
    headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://afvtxiklivnmakqixkml.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' https: data:",
        "connect-src 'self' https://afvtxiklivnmakqixkml.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' https://app.score-immo.fr",
      ].join('; ')
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
