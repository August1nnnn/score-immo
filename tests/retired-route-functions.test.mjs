import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const HELPER_URL = new URL(
  "../cloudflare-pages/retired-route-response.js",
  import.meta.url,
);

const ROUTES = new Map([
  [
    "/barometre/la-roche-guyon-appartement-45m2-99k",
    "functions/barometre/la-roche-guyon-appartement-45m2-99k.js",
  ],
  [
    "/barometre/maxeville-appartement-74m2-97k",
    "functions/barometre/maxeville-appartement-74m2-97k.js",
  ],
  [
    "/barometre/nancy-appartement-47m2-96k",
    "functions/barometre/nancy-appartement-47m2-96k.js",
  ],
  [
    "/barometre/sons-et-roncheres-maison-92m2-25k",
    "functions/barometre/sons-et-roncheres-maison-92m2-25k.js",
  ],
  [
    "/barometre/region/france",
    "functions/barometre/region/france.js",
  ],
  [
    "/barometre/region/bourgogne-franche-comte",
    "functions/barometre/region/bourgogne-franche-comte.js",
  ],
]);

async function loadHandler() {
  const module = await import(HELPER_URL.href);
  return module.retiredRouteResponse;
}

function makeContext({
  method = "GET",
  url = "https://score-immo.fr/barometre/removed?source=untrusted",
  assetStatus = 200,
  assetBody = "<!doctype html><title>Page introuvable</title><p>404 ScoreImmo</p>",
  assetThrows = false,
} = {}) {
  const assetCalls = [];
  const context = {
    request: new Request(url, {
      method,
      headers: {
        Authorization: "Bearer must-not-be-forwarded",
        Cookie: "must-not-be-forwarded=true",
      },
      body: ["GET", "HEAD"].includes(method) ? undefined : "must-not-be-forwarded",
    }),
    env: {
      ASSETS: {
        async fetch(input) {
          assetCalls.push(input);
          if (assetThrows) throw new Error("asset unavailable");
          return new Response(assetBody, {
            status: assetStatus,
            headers: {
              Age: "12345",
              "Cache-Control": "public, s-maxage=604800",
              "CDN-Cache-Control": "max-age=604800",
              "Cloudflare-CDN-Cache-Control": "max-age=604800",
              ETag: '"stale"',
              Expires: "Tue, 25 Aug 2026 00:00:00 GMT",
              "Last-Modified": "Tue, 18 Aug 2026 00:00:00 GMT",
              "Surrogate-Control": "max-age=604800",
              "Content-Type": "text/html; charset=utf-8",
            },
          });
        },
      },
    },
  };
  return { context, assetCalls, assetBody };
}

test("all and only the six retired paths have exact Function files", () => {
  for (const [route, relativePath] of ROUTES) {
    const file = new URL(relativePath, ROOT);
    assert.equal(existsSync(file), true, `${route} is missing ${relativePath}`);
    const source = readFileSync(file, "utf8");
    assert.match(source, /retiredRouteResponse/);
    assert.match(source, /export const onRequest\s*=\s*retiredRouteResponse/);
    assert.doesNotMatch(source, /context\.next|passThroughOnException/);
  }

  assert.equal(
    existsSync(new URL("functions/barometre/[slug].js", ROOT)),
    false,
    "a wildcard Barometer Function must not be introduced",
  );
  assert.equal(
    existsSync(new URL("functions/barometre/[[path]].js", ROOT)),
    false,
    "a catch-all Barometer Function must not be introduced",
  );
});

test("the shared retired-route helper lives outside the Functions routing tree", () => {
  assert.equal(existsSync(HELPER_URL), true);
  assert.equal(HELPER_URL.pathname.includes("/functions/"), false);
});

test("helper-only fixes remain inside the production deployment trigger", () => {
  const workflow = readFileSync(new URL(".github/workflows/deploy.yml", ROOT), "utf8");
  assert.match(workflow, /- ['"]cloudflare-pages\/\*\*['"]/);
  assert.match(workflow, /wranglerVersion:\s*["']4\.123\.0["']/);
});

test("asset status 200 or 404 is always reconstructed as a non-cacheable 404", async () => {
  const handler = await loadHandler();
  for (const assetStatus of [200, 404]) {
    const { context, assetCalls, assetBody } = makeContext({ assetStatus });
    const response = await handler(context);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
    for (const header of [
      "age",
      "cdn-cache-control",
      "cloudflare-cdn-cache-control",
      "etag",
      "expires",
      "last-modified",
      "surrogate-control",
    ]) {
      assert.equal(response.headers.has(header), false, `${header} must be removed`);
    }
    assert.equal(await response.text(), assetBody);
    assert.equal(assetCalls.length, 1);
    assert.equal(assetCalls[0] instanceof URL, true);
    assert.equal(assetCalls[0].pathname, "/404");
    assert.equal(assetCalls[0].search, "");
  }
});

test("asset failures fail closed to a local noindex 404 without pass-through", async () => {
  const handler = await loadHandler();
  for (const env of [undefined, {}, { ASSETS: {} }]) {
    const { context } = makeContext();
    context.env = env;
    const response = await handler(context);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
    assert.match(await response.text(), /<meta name="robots" content="noindex, follow">/);
  }

  const { context } = makeContext({ assetThrows: true });
  const response = await handler(context);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Page introuvable/);

  const upstreamFailure = makeContext({
    assetStatus: 500,
    assetBody: "upstream error must not be rendered",
  });
  const upstreamFailureResponse = await handler(upstreamFailure.context);
  const upstreamFailureBody = await upstreamFailureResponse.text();
  assert.equal(upstreamFailureResponse.status, 404);
  assert.match(upstreamFailureBody, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(upstreamFailureBody, /upstream error/);
});

test("GET, POST and OPTIONS return the fixed 404 body while HEAD has no body", async () => {
  const handler = await loadHandler();
  for (const method of ["GET", "POST", "OPTIONS", "HEAD"]) {
    const { context, assetCalls, assetBody } = makeContext({
      method,
      url: "https://score-immo.fr/barometre/removed/?q=not-forwarded",
    });
    const response = await handler(context);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
    assert.equal(await response.text(), method === "HEAD" ? "" : assetBody);
    assert.equal(assetCalls.length, 1);
    assert.equal(assetCalls[0].pathname, "/404");
    assert.equal(assetCalls[0].search, "");
  }
});
