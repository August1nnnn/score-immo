// Consent-gated, PII-free marketing funnel tracker.
(function () {
  "use strict";

  if (window.__scoreImmoTrackerInit) return;
  window.__scoreImmoTrackerInit = true;

  var consent = window.ScoreImmoConsent;
  var SESSION_KEY = "si_session_id";
  var ALLOWED_EVENTS = new Set([
    "marketing_page_view",
    "analyzer_submit",
    "phone_click",
    "email_click",
    "website_click",
    "cta_click",
    "form_view",
    "form_focus",
    "form_submit",
    "form_abandon",
    "affiliate_click",
    "scroll_depth",
  ]);
  var pageViewSent = false;

  function isAccepted() {
    return Boolean(consent && consent.getStatus() === "accepted");
  }

  function sessionId() {
    var current = null;
    try {
      current = sessionStorage.getItem(SESSION_KEY);
    } catch (_error) {
      // Continue with an in-memory UUID.
    }
    if (
      current &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        current,
      )
    ) {
      return current;
    }
    var next =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : null;
    if (!next) return null;
    try {
      sessionStorage.setItem(SESSION_KEY, next);
    } catch (_error) {
      // Session storage may be disabled.
    }
    return next;
  }

  function safeSlug(value) {
    var text = String(value || "").toLowerCase();
    return /^[a-z0-9_-]{1,64}$/.test(text) ? text : null;
  }

  function outboundCategory(hostname) {
    var host = String(hostname || "").toLowerCase();
    if (host === "app.score-immo.fr") return "app";
    if (
      /(^|\.)(leboncoin\.fr|seloger\.com|bienici\.com|pap\.fr|logic-immo\.com|century21\.fr|orpi\.com|laforet\.com|ouestfrance-immo\.com|paruvendu\.fr|meilleursagents\.com|lefigaro\.fr)$/.test(
        host,
      )
    ) {
      return "portal";
    }
    if (
      /(^|\.)(gouv\.fr|data\.gouv\.fr|insee\.fr|georisques\.gouv\.fr|ademe\.fr)$/.test(
        host,
      )
    ) {
      return "official_source";
    }
    return "other";
  }

  function referrerCategory() {
    if (!document.referrer) return "direct";
    try {
      var host = new URL(document.referrer).hostname.toLowerCase();
      if (/(^|\.)google\./.test(host)) return "google";
      if (/(^|\.)bing\.com$/.test(host)) return "bing";
      if (/(^|\.)facebook\.com$/.test(host)) return "facebook";
      if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
      if (/(^|\.)linkedin\.com$/.test(host)) return "linkedin";
      return "referral";
    } catch (_error) {
      return "direct";
    }
  }

  function cleanReferrer() {
    if (!document.referrer) return "";
    try {
      var referrer = new URL(document.referrer);
      return referrer.origin + referrer.pathname;
    } catch (_error) {
      return "";
    }
  }

  function sanitizeMetadata(metadata) {
    var input = metadata || {};
    var safe = { page_path: location.pathname || "/" };
    var formId = safeSlug(input.form_id);
    var surface = safeSlug(input.surface);
    var category = safeSlug(input.outbound_category);
    if (formId) safe.form_id = formId;
    if (surface) safe.surface = surface;
    if (
      category &&
      ["app", "portal", "official_source", "other"].indexOf(category) >= 0
    ) {
      safe.outbound_category = category;
    }
    var depth = Number(input.scroll_depth);
    if ([25, 50, 75, 100].indexOf(depth) >= 0) {
      safe.scroll_depth = depth;
    }
    if (input.attribution_source) {
      var source = safeSlug(input.attribution_source);
      if (
        source &&
        [
          "direct",
          "google",
          "bing",
          "facebook",
          "instagram",
          "linkedin",
          "referral",
        ].indexOf(source) >= 0
      ) {
        safe.attribution_source = source;
      }
    }
    return safe;
  }

  function track(eventType, metadata) {
    if (!isAccepted() || !ALLOWED_EVENTS.has(eventType)) return false;
    var journeyId = consent.getJourneyId();
    var sid = sessionId();
    if (!journeyId || !sid) return false;

    var safeMetadata = sanitizeMetadata(metadata);
    var body = JSON.stringify({
      event_type: eventType,
      journey_id: journeyId,
      session_id: sid,
      metadata: safeMetadata,
    });
    try {
      fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        credentials: "same-origin",
        keepalive: true,
      }).catch(function () {});
    } catch (_error) {
      // Analytics must never block navigation or product use.
    }

    try {
      if (typeof window.gtag === "function") {
        var gaMetadata = Object.assign({}, safeMetadata, {
          page_location: location.origin + (location.pathname || "/"),
          page_referrer: cleanReferrer(),
        });
        window.gtag("event", eventType, gaMetadata);
      }
    } catch (_error) {
      // GA4 is an optional reporting layer.
    }
    return true;
  }

  function sendPageView() {
    if (pageViewSent || !isAccepted()) return;
    pageViewSent = true;
    track("marketing_page_view", {
      attribution_source: referrerCategory(),
    });
  }

  window.ScoreImmoTracking = { track: track };
  window.siTrack = track;

  if (consent) {
    consent.onChange(function (status) {
      if (status === "accepted") sendPageView();
    });
  }
  sendPageView();

  document.addEventListener("click", function (event) {
    var tel = event.target.closest && event.target.closest('a[href^="tel:"]');
    if (tel) track("phone_click", { surface: "phone_link" });

    var email =
      event.target.closest && event.target.closest('a[href^="mailto:"]');
    if (email) track("email_click", { surface: "email_link" });

    var cta = event.target.closest && event.target.closest("[data-cta]");
    if (cta) {
      track("cta_click", {
        surface: cta.getAttribute("data-cta"),
      });
    }

    var affiliate =
      event.target.closest && event.target.closest('a[href^="/go/"]');
    if (affiliate) {
      track("affiliate_click", { surface: "affiliate_link" });
    }

    var external =
      event.target.closest && event.target.closest('a[href^="http"]');
    if (!external) return;
    try {
      var url = new URL(external.getAttribute("href"), location.href);
      if (url.hostname && url.hostname !== location.hostname) {
        track("website_click", {
          outbound_category: outboundCategory(url.hostname),
        });
      }
    } catch (_error) {
      // Invalid links are ignored.
    }
  });

  var formsFocused = new Set();
  var formsSubmitted = new Set();

  function instrumentForm(form) {
    if (form.__scoreImmoTracked) return;
    var formId = safeSlug(form.getAttribute("data-form-id"));
    if (!formId) return;
    form.__scoreImmoTracked = true;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) {
            track("form_view", { form_id: formId });
            observer.disconnect();
            break;
          }
        }
      });
      observer.observe(form);
    }

    form.addEventListener("focusin", function () {
      if (formsFocused.has(formId)) return;
      formsFocused.add(formId);
      track("form_focus", { form_id: formId });
    });
    form.addEventListener("submit", function (event) {
      if (event.defaultPrevented) return;
      formsSubmitted.add(formId);
      if (form.hasAttribute("data-analyzer-form")) return;
      track("form_submit", { form_id: formId });
    });
  }

  function scanForms() {
    var forms = document.querySelectorAll("form[data-form-id]");
    for (var i = 0; i < forms.length; i += 1) instrumentForm(forms[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanForms);
  } else {
    scanForms();
  }
  if ("MutationObserver" in window) {
    new MutationObserver(scanForms).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "hidden") return;
    formsFocused.forEach(function (formId) {
      if (!formsSubmitted.has(formId)) {
        track("form_abandon", { form_id: formId });
      }
    });
    formsFocused.clear();
  });

  var marks = [25, 50, 75, 100];
  var fired = new Set();
  var scrollTimer = null;
  window.addEventListener(
    "scroll",
    function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        var total =
          Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
          ) - window.innerHeight;
        var percent =
          total <= 0
            ? 100
            : Math.round(((window.scrollY || 0) / total) * 100);
        for (var i = 0; i < marks.length; i += 1) {
          if (percent >= marks[i] && !fired.has(marks[i])) {
            fired.add(marks[i]);
            track("scroll_depth", { scroll_depth: marks[i] });
          }
        }
      }, 250);
    },
    { passive: true },
  );
})();
