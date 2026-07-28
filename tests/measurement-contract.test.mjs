import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { isSupportedPortalHostname } from "../src/lib/portal-hosts.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function cookieDocument(initial = {}) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    writes,
    document: {
      get cookie() {
        return [...values].map(([key, value]) => `${key}=${value}`).join("; ");
      },
      set cookie(raw) {
        writes.push(raw);
        const [pair] = raw.split(";");
        const separator = pair.indexOf("=");
        const key = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        if (/Max-Age=0/i.test(raw)) values.delete(key);
        else values.set(key, value);
      },
    },
  };
}

test("consent migrates the legacy choice and shares consent plus journey cookies", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument({
    _ga: "legacy",
    _ga_FL8T0DN7GH: "legacy-stream",
  });
  const localStorage = storage({
    si_cookie_consent: JSON.stringify({ status: "accepted", ts: Date.now() - 1_000 }),
  });
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage,
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    },
    Date,
    URL,
  });

  assert.equal(window.ScoreImmoConsent.getStatus(), "accepted");
  assert.equal(
    window.ScoreImmoConsent.getJourneyId(),
    "11111111-1111-4111-8111-111111111111",
  );
  assert.ok(
    cookies.writes.some(
      (raw) =>
        raw.startsWith("si_cookie_consent=accepted;") &&
        raw.includes("Domain=.score-immo.fr") &&
        raw.includes("Path=/") &&
        raw.includes("Secure") &&
        raw.includes("SameSite=Lax") &&
        raw.includes("Expires="),
    ),
  );

  window.ScoreImmoConsent.setStatus("rejected");
  assert.equal(window.ScoreImmoConsent.getStatus(), "rejected");
  assert.equal(window.ScoreImmoConsent.getJourneyId(), null);
  assert.doesNotMatch(cookies.document.cookie, /(?:^|; )_ga(?:_|=)/);
  assert.ok(
    cookies.writes.some(
      (raw) =>
        raw.startsWith("si_journey_id=;") &&
        raw.includes("Domain=.score-immo.fr") &&
        raw.includes("Max-Age=0"),
    ),
  );
  assert.ok(
    cookies.writes.some(
      (raw) =>
        raw.startsWith("_ga=;") &&
        raw.includes("Domain=.score-immo.fr") &&
        raw.includes("Max-Age=0"),
    ),
  );
});

test("consent removes an orphan journey when no valid consent exists", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument({
    si_journey_id: "11111111-1111-4111-8111-111111111111",
  });
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage: storage(),
    crypto: { randomUUID: () => "22222222-2222-4222-8222-222222222222" },
    CustomEvent: class {},
    Date,
  });
  assert.equal(window.ScoreImmoConsent.getStatus(), null);
  assert.equal(window.ScoreImmoConsent.getJourneyId(), null);
  assert.ok(
    cookies.writes.some(
      (raw) => raw.startsWith("si_journey_id=;") && raw.includes("Max-Age=0"),
    ),
  );
});

test("consent clamps a 13-month expiry to the last valid target day", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument();
  const january31 = Date.parse("2026-01-31T12:00:00.000Z");
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [january31]));
    }
    static now() {
      return january31;
    }
  }
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage: storage(),
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    CustomEvent: class {},
    Date: FixedDate,
  });
  window.ScoreImmoConsent.setStatus("accepted");
  const consentWrite = cookies.writes.find((raw) =>
    raw.startsWith("si_cookie_consent=accepted;"),
  );
  assert.match(consentWrite, /Expires=Sun, 28 Feb 2027 12:00:00 GMT/);
});

test("GA4 defaults to denied, loads only after acceptance and strips query strings", async () => {
  const source = await read("public/ga4.js");
  const callbacks = [];
  const appended = [];
  const consent = {
    getStatus: () => null,
    onChange: (callback) => callbacks.push(callback),
  };
  const window = { ScoreImmoConsent: consent };
  const document = {
    title: "Accueil",
    referrer:
      "https://app.score-immo.fr/app?url=https://example.test/listing&email=private@example.test",
    createElement: () => ({}),
    head: { appendChild: (element) => appended.push(element) },
  };
  vm.runInNewContext(source, {
    window,
    document,
    location: {
      origin: "https://score-immo.fr",
      pathname: "/",
      search: "?url=https://example.test/listing&email=private@example.test",
    },
    Date,
    URL,
  });

  assert.equal(appended.length, 0);
  assert.deepEqual(
    JSON.parse(JSON.stringify(Array.from(window.dataLayer[0]))),
    [
      "consent",
      "default",
      {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        wait_for_update: 500,
      },
    ],
  );

  callbacks[0]("accepted");
  assert.equal(appended.length, 1);
  assert.equal(
    appended[0].src,
    "https://www.googletagmanager.com/gtag/js?id=G-FL8T0DN7GH",
  );
  const pageView = window.dataLayer.find(
    (entry) => entry[0] === "event" && entry[1] === "page_view",
  );
  assert.equal(pageView[2].page_path, "/");
  assert.equal(pageView[2].page_location, "https://score-immo.fr/");
  assert.equal(pageView[2].page_referrer, "https://app.score-immo.fr/app");
  const config = window.dataLayer.find(
    (entry) => entry[0] === "config" && entry[1] === "G-FL8T0DN7GH",
  );
  assert.equal(config[2].page_location, "https://score-immo.fr/");
  assert.equal(config[2].page_referrer, "https://app.score-immo.fr/app");
  assert.ok(!JSON.stringify(pageView).includes("private@example.test"));
  assert.ok(!JSON.stringify(pageView).includes("example.test/listing"));
});

test("first-party tracker is silent without consent and strips unsafe metadata", async () => {
  const source = await read("public/track.js");
  const callbacks = [];
  const fetches = [];
  let status = null;
  const consent = {
    getStatus: () => status,
    getJourneyId: () =>
      status === "accepted" ? "11111111-1111-4111-8111-111111111111" : null,
    onChange: (callback) => callbacks.push(callback),
  };
  const document = {
    readyState: "complete",
    referrer: "https://www.google.com/search?q=private",
    addEventListener() {},
    querySelectorAll: () => [],
    documentElement: { scrollHeight: 1_000 },
    body: { scrollHeight: 1_000 },
  };
  const window = {
    ScoreImmoConsent: consent,
    addEventListener() {},
    innerHeight: 800,
    scrollY: 0,
    dataLayer: [],
  };
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  vm.runInNewContext(source, {
    window,
    document,
    location: {
      origin: "https://score-immo.fr",
      pathname: "/",
      search: "?url=https://example.test/listing&email=private@example.test",
      hostname: "score-immo.fr",
      href: "https://score-immo.fr/?url=secret",
    },
    navigator: {},
    sessionStorage: storage(),
    crypto: {
      randomUUID: () => "22222222-2222-4222-8222-222222222222",
    },
    fetch: async (url, options) => {
      fetches.push({ url, options });
      return { ok: true };
    },
    URL,
    Set,
    MutationObserver: undefined,
    IntersectionObserver: undefined,
    setTimeout,
    clearTimeout,
  });

  window.ScoreImmoTracking.track("analyzer_submit", {
    form_id: "homepage_analyzer",
    listing_url: "https://example.test/listing",
    email: "private@example.test",
  });
  assert.equal(fetches.length, 0);

  status = "accepted";
  callbacks[0]("accepted");
  window.ScoreImmoTracking.track("analyzer_submit", {
    form_id: "homepage_analyzer",
    listing_url: "https://example.test/listing",
    email: "private@example.test",
  });
  assert.equal(fetches.length, 2);
  const body = JSON.parse(fetches[1].options.body);
  assert.equal(body.event_type, "analyzer_submit");
  assert.equal(body.journey_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(body.session_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(body.metadata.page_path, "/");
  assert.equal(body.metadata.form_id, "homepage_analyzer");
  assert.ok(!JSON.stringify(body).includes("private@example.test"));
  assert.ok(!JSON.stringify(body).includes("example.test/listing"));
  const gaEvent = window.dataLayer?.find?.(
    (entry) => entry[0] === "event" && entry[1] === "analyzer_submit",
  );
  assert.equal(gaEvent[2].page_location, "https://score-immo.fr/");
  assert.equal(gaEvent[2].page_referrer, "https://www.google.com/search");
  assert.ok(!JSON.stringify(gaEvent).includes("?"));
});

test("homepage analyzer has explicit funnel instrumentation", async () => {
  const hero = await read("src/components/sections/Hero.astro");
  assert.match(hero, /data-form-id="homepage_analyzer"/);
  assert.match(hero, /data-analyzer-form/);
  assert.match(
    hero,
    /siTrack\('analyzer_submit', \{ form_id: 'homepage_analyzer' \}\)/,
  );
  assert.match(hero, /if \(!val\) \{\s+e\.preventDefault\(\)/);
  assert.match(hero, /host === domain \|\| host\.endsWith\('\.' \+ domain\)/);
});

test("portal validation accepts only exact hosts and real subdomains", () => {
  assert.equal(isSupportedPortalHostname("leboncoin.fr"), true);
  assert.equal(isSupportedPortalHostname("www.leboncoin.fr"), true);
  assert.equal(isSupportedPortalHostname("LEBONCOIN.FR."), true);
  assert.equal(isSupportedPortalHostname("leboncoin.fr.evil.example"), false);
  assert.equal(isSupportedPortalHostname("fake-leboncoin.fr"), false);
});

test("layout initializes consent before analytics and does not mount legacy direct tracking", async () => {
  const layout = await read("src/layouts/BaseLayout.astro");
  const legacyAnalytics = await read("src/components/Analytics.astro");
  const legacyGa4 = await read("src/components/GA4Tracker.astro");
  const consentPosition = layout.indexOf('src="/consent.js"');
  const ga4Position = layout.indexOf('src="/ga4.js"');
  assert.ok(consentPosition >= 0);
  assert.ok(ga4Position > consentPosition);
  assert.doesNotMatch(layout, /<Analytics\s*\/>/);
  assert.doesNotMatch(legacyAnalytics, /rest\/v1\/page_views/);
  assert.match(legacyGa4, /src="\/ga4\.js"/);
});

test("footer exposes an accessible consent settings control", async () => {
  const footer = await read("src/components/Footer.astro");
  assert.match(footer, /id="si-footer-cookie-settings"/);
  assert.match(footer, /window\.siOpenCookieBanner\?\.\(\)/);
});
