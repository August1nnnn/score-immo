// CF Pages Function: /api/ereferer
// Receives push-published sponsored articles from the Ereferer marketplace.
//
// Protocol:
//   - Auth: header "Authorization: Bearer <EREFERER_API_KEY>"
//   - Payload (JSON): { id, post_title, post_content, categories, front_image,
//                       meta_title, meta_description, test_connection? }
//   - Test connection: { test_connection: true } -> { status: true, code: "success_connection" }
//   - Publish: stores the article in Supabase `sponsored_posts` with status="pending"
//             and returns { status: true, code: "publish_pending", article_url }
//
// Articles are reviewed manually in Supabase Studio before going live.

const PUBLIC_URL_PREFIX = "https://score-immo.fr/sponsored/";

function bad(code, message, status = 400) {
  return new Response(JSON.stringify({ status: false, code, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ok(payload, status = 200) {
  return new Response(JSON.stringify({ status: true, ...payload }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authOk(request, env) {
  const expected = env.EREFERER_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return constantTimeEqual(m[1].trim(), expected);
}

async function supabaseRequest(env, method, path, body) {
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) {
    throw new Error("supabase_env_missing");
  }
  const r = await fetch(`${env.SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`supabase_${r.status}:${text.slice(0, 200)}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function uniqueSlug(env, base) {
  let slug = base;
  for (let i = 0; i < 8; i++) {
    const rows = await supabaseRequest(
      env,
      "GET",
      `/rest/v1/sponsored_posts?slug=eq.${encodeURIComponent(slug)}&select=id`,
    );
    if (!Array.isArray(rows) || rows.length === 0) return slug;
    slug = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  return `${base}-${Date.now()}`;
}

export async function onRequestPost({ request, env }) {
  if (!authOk(request, env)) {
    return bad("invalid_token", "Authorization header missing or invalid", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("invalid_json", "Body is not valid JSON", 400);
  }

  if (body && body.test_connection === true) {
    return ok({ code: "success_connection", message: "Endpoint reachable, auth OK" });
  }

  const postTitle = String(body?.post_title || "").trim();
  const postContent = String(body?.post_content || "").trim();
  if (!postTitle) return bad("missing_field", "post_title is required", 422);
  if (!postContent) return bad("missing_field", "post_content is required", 422);

  const erefererId =
    body?.id != null && !Number.isNaN(Number(body.id)) ? Number(body.id) : null;

  // Idempotency: if same ereferer_id already exists, return its article_url.
  if (erefererId != null) {
    try {
      const existing = await supabaseRequest(
        env,
        "GET",
        `/rest/v1/sponsored_posts?ereferer_id=eq.${erefererId}&select=article_url,status,slug`,
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return ok({
          code: "publish_pending",
          message: "Article already received",
          article_url: existing[0].article_url,
          slug: existing[0].slug,
          duplicate: true,
        });
      }
    } catch (e) {
      return bad("supabase_error", e.message, 502);
    }
  }

  const baseSlug = slugify(postTitle);
  let slug;
  try {
    slug = await uniqueSlug(env, baseSlug);
  } catch (e) {
    return bad("supabase_error", e.message, 502);
  }
  const articleUrl = `${PUBLIC_URL_PREFIX}${slug}/`;

  const row = {
    source: "ereferer",
    ereferer_id: erefererId,
    status: "pending",
    slug,
    article_url: articleUrl,
    post_title: postTitle.slice(0, 500),
    post_content: postContent,
    meta_title: body?.meta_title ? String(body.meta_title).slice(0, 500) : null,
    meta_description: body?.meta_description
      ? String(body.meta_description).slice(0, 1000)
      : null,
    front_image: body?.front_image ? String(body.front_image).slice(0, 1000) : null,
    categories: Array.isArray(body?.categories) ? body.categories : [],
    raw_payload: body,
  };

  try {
    await supabaseRequest(env, "POST", "/rest/v1/sponsored_posts", row);
  } catch (e) {
    return bad("supabase_error", e.message, 502);
  }

  return ok({
    code: "publish_pending",
    message: "Article received, awaiting manual review",
    article_url: articleUrl,
    slug,
  });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: true, code: "ok", message: "Ereferer endpoint live. POST to publish." }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
