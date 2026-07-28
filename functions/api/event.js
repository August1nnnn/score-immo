// Consent-gated Cloudflare endpoint for PII-free marketing funnel events.

const ALLOWED_EVENTS = new Set([
  "marketing_page_view",
  "analyzer_submit",
  "phone_click",
  "email_click",
  "website_click",
  "cta_click",
  "form_view",
  "form_focus",
  "form_submit",
  "form_abandon",
  "affiliate_click",
  "scroll_depth",
]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_SLUG_RE = /^[a-z0-9_-]{1,64}$/;

function cookies(request) {
  const values = new Map();
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    try {
      values.set(name, decodeURIComponent(rawValue));
    } catch {
      // Ignore malformed cookie values.
    }
  }
  return values;
}

function safePagePath(value) {
  const path = String(value || "/").split(/[?#]/, 1)[0];
  if (path === "/") return "/";
  if (
    /^\/(blogs|barometre|pages)(\/[a-z0-9-]+){1,4}\/?$/i.test(path) ||
    /^\/pro\/?$/i.test(path)
  ) {
    return path.slice(0, 300);
  }
  return "/other";
}

function safeSlug(value) {
  const text = String(value || "").toLowerCase();
  return SAFE_SLUG_RE.test(text) ? text : null;
}

function sanitizeMetadata(input) {
  const metadata = input && typeof input === "object" ? input : {};
  const safe = { page_path: safePagePath(metadata.page_path) };
  const formId = safeSlug(metadata.form_id);
  const surface = safeSlug(metadata.surface);
  const category = safeSlug(metadata.outbound_category);
  const source = safeSlug(metadata.attribution_source);

  if (formId) safe.form_id = formId;
  if (surface) safe.surface = surface;
  if (["app", "portal", "official_source", "other"].includes(category)) {
    safe.outbound_category = category;
  }
  const depth = Number(metadata.scroll_depth);
  if ([25, 50, 75, 100].includes(depth)) safe.scroll_depth = depth;
  if (
    [
      "direct",
      "google",
      "bing",
      "facebook",
      "instagram",
      "linkedin",
      "referral",
    ].includes(source)
  ) {
    safe.attribution_source = source;
  }
  return safe;
}

function canonicalMetadata(metadata) {
  return Object.keys(metadata)
    .sort()
    .map((key) => `${key}=${metadata[key]}`)
    .join("&");
}

async function eventKey(eventType, journeyId, sessionId, metadata) {
  const canonical = [
    "marketing",
    eventType,
    journeyId,
    sessionId,
    canonicalMetadata(metadata),
  ].join("|");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return (
    "marketing:" +
    [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

function headers(key, prefer) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
}

function isSchemaError(response, responseText) {
  if (![400, 404].includes(response.status)) return false;
  return /PGRST20[45]|schema cache|could not find the table|could not find.*column/i.test(
    responseText,
  );
}

function legacyTarget(metadata) {
  return (
    metadata.form_id ||
    metadata.surface ||
    metadata.outbound_category ||
    (metadata.scroll_depth ? String(metadata.scroll_depth) : null)
  );
}

export async function onRequestPost({ request, env }) {
  const cookieValues = cookies(request);
  if (cookieValues.get("si_cookie_consent") !== "accepted") {
    return new Response(null, { status: 204 });
  }

  const journeyId = cookieValues.get("si_journey_id") || "";
  if (!UUID_RE.test(journeyId)) {
    return new Response("bad journey", { status: 400 });
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 8192) return new Response("body too large", { status: 413 });
    body = JSON.parse(text || "{}");
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const eventType = String(body.event_type || "").trim();
  const sessionId = String(body.session_id || "").trim();
  if (!ALLOWED_EVENTS.has(eventType)) {
    return new Response("bad event type", { status: 400 });
  }
  if (!UUID_RE.test(sessionId)) {
    return new Response("bad session", { status: 400 });
  }
  if (body.journey_id && body.journey_id !== journeyId) {
    return new Response("journey mismatch", { status: 400 });
  }

  const metadata = sanitizeMetadata(body.metadata);
  if (!env.SUPABASE_URL || (!env.SUPABASE_SERVICE_KEY && !env.SUPABASE_ANON)) {
    return new Response(null, { status: 204 });
  }

  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON;
  const payload = {
    event_type: eventType,
    journey_id: journeyId,
    session_id: sessionId,
    source: "marketing",
    event_key: await eventKey(eventType, journeyId, sessionId, metadata),
    metadata,
    user_id: null,
  };

  const conversionResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/conversion_events?on_conflict=event_key`,
    {
      method: "POST",
      headers: headers(
        key,
        "resolution=ignore-duplicates,return=minimal",
      ),
      body: JSON.stringify(payload),
    },
  );
  if (conversionResponse.ok) return new Response(null, { status: 204 });

  const responseText = await conversionResponse.text();
  if (!isSchemaError(conversionResponse, responseText)) {
    return new Response("supabase error " + conversionResponse.status, {
      status: 502,
    });
  }

  // Temporary compatibility path while the additive conversion_events migration
  // reaches production. It is never called after a successful primary write.
  const legacyResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/events`, {
    method: "POST",
    headers: headers(key, "return=minimal"),
    body: JSON.stringify({
      type: eventType,
      target: legacyTarget(metadata),
      page: metadata.page_path,
      session_id: sessionId,
    }),
  });
  if (!legacyResponse.ok) {
    return new Response("supabase error " + legacyResponse.status, {
      status: 502,
    });
  }
  return new Response(null, { status: 204 });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://score-immo.fr",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
