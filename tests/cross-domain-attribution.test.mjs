import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function loadAttribution(search, fixtures = {}) {
  const source = await read("public/attribution.js");
  const listeners = new Map();
  const document = {
    addEventListener: (name, callback) => listeners.set(name, callback),
    querySelectorAll: (selector) => selector.startsWith("a[")
      ? (fixtures.anchors || [])
      : (fixtures.forms || []),
    createElement: () => ({ setAttribute() {} }),
  };
  const window = {
    location: {
      href: `https://score-immo.fr/${search}`,
      search,
    },
    addEventListener() {},
    ScoreImmoConsent: {
      getStatus: () => fixtures.analytics ?? "accepted",
      getAdvertisingStatus: () => fixtures.advertising ?? "accepted",
      onChange(callback) { fixtures.onChange = callback; },
      onAdvertisingChange(callback) { fixtures.onAdvertisingChange = callback; },
    },
  };
  const sessionStorage = {
    getItem: () => fixtures.stored || null,
    setItem(_key, value) { fixtures.stored = value; },
    removeItem() { fixtures.stored = null; },
  };

  vm.runInNewContext(source, {
    window,
    document,
    sessionStorage,
    URL,
    URLSearchParams,
    MutationObserver: class { observe() {} },
  });
  return window.ScoreImmoAttribution;
}

test("paid attribution overrides site fallback on app links", async () => {
  const attribution = await loadAttribution(
    "?utm_source=google&utm_medium=cpc&utm_campaign=search_pilot_2026_09&gclid=click_123",
  );
  const decorated = new URL(attribution.decorateUrl(
    "https://app.score-immo.fr/app?utm_source=site&utm_medium=nav&url=https%3A%2F%2Fexample.test%2Flisting",
  ));

  assert.equal(decorated.searchParams.get("utm_source"), "google");
  assert.equal(decorated.searchParams.get("utm_medium"), "cpc");
  assert.equal(decorated.searchParams.get("utm_campaign"), "search_pilot_2026_09");
  assert.equal(decorated.searchParams.get("gclid"), "click_123");
  assert.equal(decorated.searchParams.get("url"), "https://example.test/listing");
});

test("Meta attribution reaches checkout routes without altering other origins", async () => {
  const attribution = await loadAttribution(
    "?utm_source=meta&utm_medium=paid_social&utm_campaign=meta_pilot_2026_09&utm_content=avant_visite&fbclid=fb_123",
  );
  const checkout = new URL(attribution.decorateUrl(
    "https://app.score-immo.fr/go/checkout/unit",
  ));

  assert.equal(checkout.searchParams.get("utm_source"), "meta");
  assert.equal(checkout.searchParams.get("utm_content"), "avant_visite");
  assert.equal(checkout.searchParams.get("fbclid"), "fb_123");
  assert.equal(
    attribution.decorateUrl("https://example.test/?utm_source=site"),
    "https://example.test/?utm_source=site",
  );
});

test("GET analyzer forms receive hidden attribution fields", async () => {
  const inputs = new Map();
  const form = {
    getAttribute: (name) => name === "action" ? "https://app.score-immo.fr/app" : null,
    querySelector: (selector) => {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      return name ? inputs.get(name) || null : null;
    },
    appendChild: (input) => inputs.set(input.name, input),
  };

  await loadAttribution(
    "?utm_source=google&utm_medium=cpc&utm_campaign=search_pilot_2026_09",
    { forms: [form] },
  );

  assert.equal(inputs.get("utm_source").value, "google");
  assert.equal(inputs.get("utm_medium").value, "cpc");
  assert.equal(inputs.get("utm_campaign").value, "search_pilot_2026_09");
});

test("the attribution bridge is loaded on every layout page", async () => {
  const layout = await read("src/layouts/BaseLayout.astro");
  assert.match(layout, /<script src="\/attribution\.js\?v=20260905" defer><\/script>/);
});


test("analytics acceptance never grants permission to retain advertising click IDs", async () => {
  const fixtures = { analytics: "accepted", advertising: "rejected" };
  const attribution = await loadAttribution("?utm_source=google&gclid=private_click", fixtures);
  const url = new URL(attribution.decorateUrl("https://app.score-immo.fr/app"));
  assert.equal(url.searchParams.get("utm_source"), "google");
  assert.equal(url.searchParams.get("gclid"), null);
  assert.ok(!fixtures.stored?.includes("private_click"));
});
test("withdrawal removes decorated IDs and stored attribution", async () => {
  const fixtures = { analytics: "accepted", advertising: "accepted" };
  const attribution = await loadAttribution("?utm_source=google&gclid=private_click", fixtures);
  const first = attribution.decorateUrl("https://app.score-immo.fr/app");
  fixtures.analytics = "rejected"; fixtures.advertising = "rejected"; fixtures.onChange();
  const url = new URL(attribution.decorateUrl(first));
  assert.equal(url.searchParams.get("utm_source"), null); assert.equal(url.searchParams.get("gclid"), null);
  assert.equal(fixtures.stored, null);
});
test("consented campaign survives navigation without retaining private values", async () => {
  const fixtures = {};
  await loadAttribution("?utm_source=google&utm_campaign=person%40example.com&gclid=click_123", fixtures);
  const attribution = await loadAttribution("", fixtures);
  const url = new URL(attribution.decorateUrl("https://app.score-immo.fr/app"));
  assert.equal(url.searchParams.get("utm_source"), "google"); assert.equal(url.searchParams.get("gclid"), "click_123");
  assert.equal(url.searchParams.get("utm_campaign"), null);
});


test("original navigation tags are restored after late consent, and removed again on rejection", async () => {
  let href = 'https://app.score-immo.fr/app?utm_source=site&utm_medium=nav';
  const anchor = { getAttribute: () => href, setAttribute: (_name, value) => { href = value; } };
  const fixtures = { analytics: 'rejected', advertising: 'rejected', anchors: [anchor] };
  await loadAttribution('', fixtures);
  assert.equal(new URL(href).searchParams.get('utm_source'), null);
  fixtures.analytics = 'accepted'; fixtures.onChange();
  assert.equal(new URL(href).searchParams.get('utm_source'), 'site');
  fixtures.analytics = 'rejected'; fixtures.onChange();
  assert.equal(new URL(href).searchParams.get('utm_source'), null);
});
