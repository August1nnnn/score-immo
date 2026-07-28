import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost } from "../functions/api/event.js";

const JOURNEY_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";
const env = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_KEY: "test-service-key",
};

function request(body, consent = "accepted") {
  return new Request("https://score-immo.fr/api/event", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `si_cookie_consent=${consent}; si_journey_id=${JOURNEY_ID}`,
    },
    body: JSON.stringify(body),
  });
}

test("API writes an idempotent, PII-free conversion event", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(null, { status: 201 });
  });

  const response = await onRequestPost({
    request: request({
      event_type: "analyzer_submit",
      journey_id: JOURNEY_ID,
      session_id: SESSION_ID,
      metadata: {
        page_path: "/",
        form_id: "homepage_analyzer",
        email: "private@example.test",
        listing_url: "https://example.test/listing",
      },
    }),
    env,
  });

  assert.equal(response.status, 204);
  assert.equal(calls.length, 1);
  assert.match(
    calls[0].url,
    /\/rest\/v1\/conversion_events\?on_conflict=event_key$/,
  );
  assert.equal(
    calls[0].options.headers.Prefer,
    "resolution=ignore-duplicates,return=minimal",
  );
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.event_type, "analyzer_submit");
  assert.equal(payload.journey_id, JOURNEY_ID);
  assert.equal(payload.session_id, SESSION_ID);
  assert.equal(payload.source, "marketing");
  assert.equal(payload.user_id, null);
  assert.match(payload.event_key, /^marketing:[a-f0-9]{64}$/);
  assert.deepEqual(payload.metadata, {
    form_id: "homepage_analyzer",
    page_path: "/",
  });
  assert.ok(!JSON.stringify(payload).includes("private@example.test"));
  assert.ok(!JSON.stringify(payload).includes("example.test/listing"));
});

test("API is silent without accepted consent", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  const response = await onRequestPost({
    request: request(
      {
        event_type: "analyzer_submit",
        session_id: SESSION_ID,
      },
      "rejected",
    ),
    env,
  });
  assert.equal(response.status, 204);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("API falls back to legacy only on a conversion_events schema error", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return Response.json(
        { code: "PGRST205", message: "Could not find the table" },
        { status: 404 },
      );
    }
    return new Response(null, { status: 201 });
  });

  const response = await onRequestPost({
    request: request({
      event_type: "marketing_page_view",
      journey_id: JOURNEY_ID,
      session_id: SESSION_ID,
      metadata: { page_path: "/" },
    }),
    env,
  });
  assert.equal(response.status, 204);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /conversion_events/);
  assert.match(calls[1].url, /\/rest\/v1\/events$/);
});

test("API never falls back after a successful conversion_events write", async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 201 }),
  );
  const response = await onRequestPost({
    request: request({
      event_type: "marketing_page_view",
      journey_id: JOURNEY_ID,
      session_id: SESSION_ID,
      metadata: { page_path: "/" },
    }),
    env,
  });
  assert.equal(response.status, 204);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("API rejects spoofed journeys and unknown event types before Supabase", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  const mismatch = await onRequestPost({
    request: request({
      event_type: "analyzer_submit",
      journey_id: "33333333-3333-4333-8333-333333333333",
      session_id: SESSION_ID,
    }),
    env,
  });
  assert.equal(mismatch.status, 400);

  const unknown = await onRequestPost({
    request: request({
      event_type: "purchase",
      journey_id: JOURNEY_ID,
      session_id: SESSION_ID,
    }),
    env,
  });
  assert.equal(unknown.status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("API does not use the legacy fallback for operational errors", async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("temporary outage", { status: 503 }),
  );
  const response = await onRequestPost({
    request: request({
      event_type: "marketing_page_view",
      journey_id: JOURNEY_ID,
      session_id: SESSION_ID,
      metadata: { page_path: "/?email=private@example.test" },
    }),
    env,
  });
  assert.equal(response.status, 502);
  assert.equal(fetchMock.mock.callCount(), 1);
});
