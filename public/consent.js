// Consent shared by score-immo.fr and app.score-immo.fr.
(function () {
  "use strict";

  if (window.ScoreImmoConsent) return;

  var CONSENT_KEY = "si_cookie_consent";
  var AD_CONSENT_KEY = "si_ad_consent";
  var JOURNEY_KEY = "si_journey_id";
  var COOKIE_SCOPE = "Domain=.score-immo.fr; Path=/; Secure; SameSite=Lax";
  var VALID_STATUS = /^(accepted|rejected)$/;
  var UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var listeners = [];
  var advertisingListeners = [];

  function readCookie(name) {
    var prefix = name + "=";
    var parts = (document.cookie || "").split(";");
    for (var i = 0; i < parts.length; i += 1) {
      var value = parts[i].trim();
      if (value.indexOf(prefix) === 0) {
        try {
          return decodeURIComponent(value.slice(prefix.length));
        } catch (_error) {
          return null;
        }
      }
    }
    return null;
  }

  function expiryFrom(timestamp) {
    var expires = new Date(timestamp || Date.now());
    var sourceDay = expires.getUTCDate();
    expires.setUTCDate(1);
    expires.setUTCMonth(expires.getUTCMonth() + 13);
    var lastTargetDay = new Date(
      Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth() + 1, 0),
    ).getUTCDate();
    expires.setUTCDate(Math.min(sourceDay, lastTargetDay));
    return expires;
  }

  function writeCookie(name, value, timestamp) {
    var expires = expiryFrom(timestamp);
    if (expires.getTime() <= Date.now()) return false;
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; " +
      COOKIE_SCOPE +
      "; Expires=" +
      expires.toUTCString();
    return true;
  }

  function deleteCookie(name) {
    document.cookie =
      name +
      "=; " +
      COOKIE_SCOPE +
      "; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
  }

  function clearAnalyticsCookies() {
    try {
      var parts = (document.cookie || "").split(";");
      for (var i = 0; i < parts.length; i += 1) {
        var name = parts[i].trim().split("=", 1)[0];
        if (!/^(_ga($|_)|_gid$|_gat($|_))/.test(name)) continue;
        var expired =
          name +
          "=; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
        document.cookie = expired;
        document.cookie =
          expired + "; Domain=.score-immo.fr; Secure";
        document.cookie =
          expired + "; Domain=score-immo.fr; Secure";
      }
    } catch (_error) {
      // Cookie cleanup must not break consent controls.
    }
  }

  function clearAdvertisingCookies() {
    try {
      var names = ["_fbp", "_fbc"];
      for (var i = 0; i < names.length; i += 1) {
        var expired =
          names[i] +
          "=; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
        document.cookie = expired;
        document.cookie = expired + "; Domain=.score-immo.fr; Secure";
        document.cookie = expired + "; Domain=score-immo.fr; Secure";
      }
    } catch (_error) {
      // Cookie cleanup must not break consent controls.
    }
  }

  function readLegacyConsent() {
    try {
      var value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      if (
        !value ||
        !VALID_STATUS.test(String(value.status || "")) ||
        !Number.isFinite(value.ts)
      ) {
        return null;
      }
      if (expiryFrom(value.ts).getTime() <= Date.now()) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }
      return { status: value.status, ts: value.ts };
    } catch (_error) {
      return null;
    }
  }

  function ensureJourney(timestamp) {
    var current = readCookie(JOURNEY_KEY);
    if (current && UUID_RE.test(current)) return current;
    var next =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : null;
    if (!next || !UUID_RE.test(next)) return null;
    writeCookie(JOURNEY_KEY, next, timestamp);
    return next;
  }

  function getStatus() {
    var value = readCookie(CONSENT_KEY);
    return value && VALID_STATUS.test(value) ? value : null;
  }

  function getAdvertisingStatus() {
    var value = readCookie(AD_CONSENT_KEY);
    return value && VALID_STATUS.test(value) ? value : null;
  }

  function getJourneyId() {
    if (getStatus() !== "accepted") return null;
    var value = readCookie(JOURNEY_KEY);
    return value && UUID_RE.test(value) ? value : null;
  }

  function notify(status) {
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](status);
      } catch (_error) {
        // Consent changes must not break the page.
      }
    }
    try {
      window.dispatchEvent(
        new CustomEvent("si:consent", { detail: { status: status } }),
      );
    } catch (_error) {
      // CustomEvent is optional in older embedded browsers.
    }
  }

  function notifyAdvertising(status) {
    for (var i = 0; i < advertisingListeners.length; i += 1) {
      try {
        advertisingListeners[i](status);
      } catch (_error) {
        // Consent changes must not break the page.
      }
    }
    try {
      window.dispatchEvent(
        new CustomEvent("si:ad-consent", { detail: { status: status } }),
      );
    } catch (_error) {
      // CustomEvent is optional in older embedded browsers.
    }
  }

  function setStatus(status) {
    if (!VALID_STATUS.test(String(status || ""))) return false;
    var now = Date.now();
    writeCookie(CONSENT_KEY, status, now);
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ status: status, ts: now }),
      );
    } catch (_error) {
      // The shared cookie remains the source of truth.
    }
    if (status === "accepted") ensureJourney(now);
    else {
      deleteCookie(JOURNEY_KEY);
      clearAnalyticsCookies();
    }
    notify(status);
    return true;
  }

  function setAdvertisingStatus(status) {
    if (!VALID_STATUS.test(String(status || ""))) return false;
    var now = Date.now();
    writeCookie(AD_CONSENT_KEY, status, now);
    if (status === "rejected") clearAdvertisingCookies();
    notifyAdvertising(status);
    return true;
  }

  function setAllStatus(status) {
    if (!VALID_STATUS.test(String(status || ""))) return false;
    // Advertising is notified first so a global acceptance applies its consent
    // state before the audience controller emits the initial page view.
    setAdvertisingStatus(status);
    setStatus(status);
    return true;
  }

  function onChange(listener) {
    if (typeof listener !== "function") return function () {};
    listeners.push(listener);
    return function () {
      var index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  function onAdvertisingChange(listener) {
    if (typeof listener !== "function") return function () {};
    advertisingListeners.push(listener);
    return function () {
      var index = advertisingListeners.indexOf(listener);
      if (index >= 0) advertisingListeners.splice(index, 1);
    };
  }

  var existing = getStatus();
  var migratedAt = null;
  if (!existing) {
    var legacy = readLegacyConsent();
    if (legacy && writeCookie(CONSENT_KEY, legacy.status, legacy.ts)) {
      existing = legacy.status;
      migratedAt = legacy.ts;
    }
  }
  if (existing === "accepted") ensureJourney(migratedAt);
  else {
    deleteCookie(JOURNEY_KEY);
    clearAnalyticsCookies();
  }
  if (getAdvertisingStatus() !== "accepted") clearAdvertisingCookies();

  window.ScoreImmoConsent = {
    getStatus: getStatus,
    getAdvertisingStatus: getAdvertisingStatus,
    getJourneyId: getJourneyId,
    setStatus: setStatus,
    setAdvertisingStatus: setAdvertisingStatus,
    setAllStatus: setAllStatus,
    onChange: onChange,
    onAdvertisingChange: onAdvertisingChange,
  };
})();
