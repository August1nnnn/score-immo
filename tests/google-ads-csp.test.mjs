import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const middleware = readFileSync(
  new URL("../functions/_middleware.ts", import.meta.url),
  "utf8",
);

function connectSourcePolicy(source) {
  const match = source.match(/"connect-src ([^"]+)"/);
  assert.ok(match, "the middleware must define a connect-src policy");
  return match[1].split(/\s+/);
}

test("Google Ads conversion endpoints are explicitly allowed by the CSP", () => {
  const allowed = connectSourcePolicy(middleware);

  for (const origin of [
    "https://www.googleadservices.com",
    "https://www.google.com",
    "https://ad.doubleclick.net",
  ]) {
    assert.ok(allowed.includes(origin), `${origin} must be explicitly allowed`);
  }
});

test("the Google Ads CSP exception stays limited to known HTTPS origins", () => {
  const allowed = connectSourcePolicy(middleware);

  assert.equal(allowed.includes("https:"), false);
  assert.equal(allowed.includes("*"), false);
  assert.equal(allowed.includes("https://*.google.com"), false);
  assert.equal(allowed.includes("https://*.googleadservices.com"), false);
  assert.equal(allowed.includes("https://*.doubleclick.net"), false);
});
