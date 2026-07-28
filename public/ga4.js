// GA4 Consent Mode. No Google request is made before explicit acceptance.
(function () {
  "use strict";

  if (window.__scoreImmoGa4Init) return;
  window.__scoreImmoGa4Init = true;

  var GA4_ID = "G-FL8T0DN7GH";
  var consent = window.ScoreImmoConsent;
  var loaded = false;
  var pageViewSent = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  function cleanReferrer() {
    if (!document.referrer) return "";
    try {
      var referrer = new URL(document.referrer);
      return referrer.origin + referrer.pathname;
    } catch (_error) {
      return "";
    }
  }

  function cleanPage() {
    return {
      page_path: location.pathname || "/",
      page_location: location.origin + (location.pathname || "/"),
      page_referrer: cleanReferrer(),
      page_title: document.title || undefined,
    };
  }

  function sendPageView() {
    if (pageViewSent) return;
    pageViewSent = true;
    window.gtag("event", "page_view", cleanPage());
  }

  function enable() {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
    if (!loaded) {
      loaded = true;
      var script = document.createElement("script");
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=" +
        encodeURIComponent(GA4_ID);
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID, {
        send_page_view: false,
        cookie_domain: "score-immo.fr",
        cookie_flags: "SameSite=Lax;Secure",
        page_location: location.origin + (location.pathname || "/"),
        page_referrer: cleanReferrer(),
      });
    }
    sendPageView();
  }

  function disable() {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
    });
  }

  if (consent) {
    if (consent.getStatus() === "accepted") enable();
    consent.onChange(function (status) {
      if (status === "accepted") enable();
      else disable();
    });
  }
})();
