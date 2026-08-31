// Google measurement Consent Mode. No Google request is made before explicit acceptance.
(function () {
  "use strict";

  if (window.__scoreImmoGa4Init) return;
  window.__scoreImmoGa4Init = true;

  var GA4_ID = "G-FL8T0DN7GH";
  var GTM_ID = "GTM-N8TVQPKH";
  var consent = window.ScoreImmoConsent;
  var ga4Loaded = false;
  var gtmLoaded = false;
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

  function loadGtm() {
    if (gtmLoaded) return;
    gtmLoaded = true;
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
    var script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtm.js?id=" +
      encodeURIComponent(GTM_ID);
    document.head.appendChild(script);
  }

  function loadGa4() {
    if (ga4Loaded) return;
    ga4Loaded = true;
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

  function enable() {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "denied",
    });
    loadGtm();
    loadGa4();
    sendPageView();
  }

  function disable() {
    window.gtag("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
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
