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

  function safeValue(value) {
    if (typeof value !== "string") return null;
    var normalized = value.trim();
    if (!normalized || normalized.length > 200 || /[\u0000-\u001f\u007f]/.test(normalized)) {
      return null;
    }
    return normalized;
  }

  function paramsFromSearch(search) {
    var source = new URLSearchParams(search || "");
    var result = {};
    PARAM_NAMES.forEach(function (name) {
      var value = safeValue(source.get(name));
      if (value) result[name] = value;
    });
    return result;
  }

  function hasValues(value) {
    return Object.keys(value).length > 0;
  }

  function measurementAllowed() {
    try {
      var consent = window.ScoreImmoConsent;
      return Boolean(
        consent
        && (consent.getStatus() === "accepted"
          || consent.getAdvertisingStatus() === "accepted")
      );
    } catch (_error) {
      return false;
    }
  }

  function readStored() {
    if (!measurementAllowed()) return {};
    try {
      var parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
      var result = {};
      PARAM_NAMES.forEach(function (name) {
        var value = safeValue(parsed[name]);
        if (value) result[name] = value;
      });
      return result;
    } catch (_error) {
      return {};
    }
  }

  var current = paramsFromSearch(window.location.search);
  var attribution = hasValues(current) ? current : readStored();

  function syncStorage() {
    try {
      if (!measurementAllowed()) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (hasValues(current)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        attribution = current;
      }
    } catch (_error) {
      // Storage is optional; same-page propagation still works.
    }
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
    if (!url || !hasValues(attribution)) return rawUrl;
    Object.keys(attribution).forEach(function (name) {
      url.searchParams.set(name, attribution[name]);
    });
    return url.toString();
  }

  function decorateAnchor(anchor) {
    var rawUrl = anchor && anchor.getAttribute && anchor.getAttribute("href");
    if (!rawUrl) return;
    var decorated = decorateUrl(rawUrl);
    if (decorated !== rawUrl) anchor.setAttribute("href", decorated);
  }

  function decorateForm(form) {
    var rawAction = form && form.getAttribute && form.getAttribute("action");
    if (!rawAction || !appUrl(rawAction) || !hasValues(attribution)) return;
    Object.keys(attribution).forEach(function (name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.setAttribute("data-scoreimmo-attribution", "true");
        form.appendChild(input);
      }
      input.value = attribution[name];
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
