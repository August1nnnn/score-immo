import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

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

test("legacy audience consent never becomes advertising consent", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument({ si_cookie_consent: "accepted" });
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    CustomEvent: class {},
    Date,
  });

  assert.equal(window.ScoreImmoConsent.getStatus(), "accepted");
  assert.equal(window.ScoreImmoConsent.getAdvertisingStatus(), null);
});

test("an explicit global choice writes audience and advertising consent", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument();
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    CustomEvent: class {},
    Date,
  });

  window.ScoreImmoConsent.setAllStatus("accepted");
  assert.match(cookies.document.cookie, /si_cookie_consent=accepted/);
  assert.match(cookies.document.cookie, /si_ad_consent=accepted/);
});

test("a global acceptance grants advertising before the first audience page view", async () => {
  const source = await read("public/consent.js");
  const cookies = cookieDocument();
  const window = { dispatchEvent() {} };
  vm.runInNewContext(source, {
    window,
    document: cookies.document,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    CustomEvent: class {},
    Date,
  });
  const notifications = [];
  window.ScoreImmoConsent.onAdvertisingChange(() => notifications.push("advertising"));
  window.ScoreImmoConsent.onChange(() => notifications.push("audience"));

  window.ScoreImmoConsent.setAllStatus("accepted");

  assert.deepEqual(notifications, ["advertising", "audience"]);
});

test("Meta Pixel stays dormant until a pixel ID and advertising consent exist", async () => {
  const source = await read("public/meta-pixel.js");
  const callbacks = [];
  const appended = [];
  let status = null;
  const consent = {
    getAdvertisingStatus: () => status,
    onAdvertisingChange: (callback) => callbacks.push(callback),
  };
  const idNode = { content: "123456789012345" };
  const window = { ScoreImmoConsent: consent };
  const document = {
    querySelector: () => idNode,
    getElementById: () => null,
    createElement: () => ({}),
    head: { appendChild: (element) => appended.push(element) },
  };

  vm.runInNewContext(source, { window, document });
  assert.equal(appended.length, 0);

  status = "accepted";
  callbacks[0](status);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].src, "https://connect.facebook.net/en_US/fbevents.js");
  assert.ok(window.fbq.queue.some((entry) => entry[0] === "init" && entry[1] === idNode.content));
  assert.ok(window.fbq.queue.some((entry) => entry[0] === "track" && entry[1] === "PageView"));
});

test("the CSP permits only the Meta Pixel origins needed by the browser", async () => {
  const middleware = await read("functions/_middleware.ts");
  assert.match(middleware, /script-src[^\n]+https:\/\/connect\.facebook\.net/);
  assert.match(middleware, /connect-src[^\n]+https:\/\/www\.facebook\.com/);
  assert.doesNotMatch(middleware, /https:\/\/\*\.facebook\.com/);
});
