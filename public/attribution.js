(function () {
  "use strict";

  var APP_ORIGIN = "https://app.score-immo.fr";
  var STORAGE_KEY = "si_campaign_attribution";
  var PARAM_NAMES = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "gbraid",
    "wbraid",
    "fbclid",
    "msclkid",
  ];

  var originalAnchors = new WeakMap();
  var originalForms = new WeakMap();
  var MAX_AGE = 90 * 24 * 60 * 60 * 1000;
  function allowed(name) {
    try {
      var consent = window.ScoreImmoConsent;
      return Boolean(consent && (name.indexOf("utm_") === 0
        ? consent.getStatus() === "accepted"
        : consent.getAdvertisingStatus() === "accepted"));
    } catch (_error) { return false; }
  }
  function safeValue(name, value) {
    if (typeof value !== "string") return null;
    var normalized = value.trim();
    if (name === "fbclid" && normalized.length > 160) return null;
    return (name.indexOf("utm_") === 0
      ? /^[\p{L}\p{N} ._-]{1,80}$/u.test(normalized)
      : /^[A-Za-z0-9_-]{1,200}$/.test(normalized)) ? normalized : null;
  }
  function paramsFromSearch(search) {
    var source = new URLSearchParams(search || ""); var result = {};
    PARAM_NAMES.forEach(function (name) {
      var value = allowed(name) && safeValue(name, source.get(name));
      if (value) result[name] = value;
    });
    return result;
  }
  function hasValues(value) { return Object.keys(value).length > 0; }
  function readStored() {
    try {
      var stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || !Number.isFinite(stored.capturedAt) || Date.now() - stored.capturedAt > MAX_AGE || stored.capturedAt > Date.now()) return {};
      var result = {};
      PARAM_NAMES.forEach(function (name) {
        var value = allowed(name) && safeValue(name, stored.params && stored.params[name]);
        if (value) result[name] = value;
      });
      return result;
    } catch (_error) { return {}; }
  }
  var attribution = {};
  function syncStorage() {
    try {
      var current = paramsFromSearch(window.location.search);
      attribution = hasValues(current) ? current : readStored();
      if (!hasValues(attribution)) sessionStorage.removeItem(STORAGE_KEY);
      else {
        var old = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
        var capturedAt = !hasValues(current) && old ? old.capturedAt : Date.now();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ params: attribution, capturedAt: capturedAt }));
      }
    } catch (_error) { /* Storage remains optional. */ }
    decorateAll(document);
  }

  function appUrl(rawUrl) {
    try {
      var url = new URL(rawUrl, window.location.href);
      return url.origin === APP_ORIGIN ? url : null;
    } catch (_error) {
      return null;
    }
  }

  function decorateUrl(rawUrl) {
    var url = appUrl(rawUrl);
    if (!url) return rawUrl;
    PARAM_NAMES.forEach(function (name) {
      if (!allowed(name) || !safeValue(name, url.searchParams.get(name))) url.searchParams.delete(name);
    });
    Object.keys(attribution).forEach(function (name) {
      if (allowed(name)) url.searchParams.set(name, attribution[name]);
    });
    return url.toString();
  }

  function decorateAnchor(anchor) {
    var rawUrl = anchor && anchor.getAttribute && anchor.getAttribute("href");
    if (!rawUrl) return;
    if (!originalAnchors.has(anchor)) originalAnchors.set(anchor, rawUrl);
    var decorated = decorateUrl(originalAnchors.get(anchor));
    if (decorated !== rawUrl) anchor.setAttribute("href", decorated);
  }

  function decorateForm(form) {
    var rawAction = form && form.getAttribute && form.getAttribute("action");
    if (!rawAction || !appUrl(rawAction)) return;
    if (!originalForms.has(form)) {
      var originals = {};
      PARAM_NAMES.forEach(function (name) {
        var input = form.querySelector('input[name="' + name + '"]');
        if (input && safeValue(name, input.value)) originals[name] = input.value;
      });
      originalForms.set(form, originals);
    }
    var defaults = originalForms.get(form);
    PARAM_NAMES.forEach(function (name) {
      var old = form.querySelector('input[name="' + name + '"]');
      if (old && !allowed(name) && old.remove) old.remove();
    });
    var formValues = Object.assign({}, defaults, attribution);
    Object.keys(formValues).forEach(function (name) {
      if (!allowed(name)) return;
      var input = form.querySelector('input[name="' + name + '"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.setAttribute("data-scoreimmo-attribution", "true");
        form.appendChild(input);
      }
      input.value = formValues[name];
    });
  }

  function decorateAll(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('a[href*="app.score-immo.fr"]').forEach(decorateAnchor);
    root.querySelectorAll('form[action*="app.score-immo.fr"]').forEach(decorateForm);
  }

  syncStorage();
  decorateAll(document);

  document.addEventListener("DOMContentLoaded", function () {
    decorateAll(document);
    if (typeof MutationObserver !== "undefined" && document.documentElement) {
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(decorateAll);
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  });

  document.addEventListener("click", function (event) {
    var anchor = event.target && event.target.closest
      ? event.target.closest('a[href*="app.score-immo.fr"]')
      : null;
    if (anchor) decorateAnchor(anchor);
  }, true);

  document.addEventListener("submit", function (event) {
    decorateForm(event.target);
  }, true);

  try {
    var consent = window.ScoreImmoConsent;
    if (consent) {
      consent.onChange(syncStorage);
      consent.onAdvertisingChange(syncStorage);
    }
  } catch (_error) {
    // Consent callbacks are optional.
  }

  window.ScoreImmoAttribution = {
    decorateUrl: decorateUrl,
  };
})();
