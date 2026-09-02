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
  var audienceStatus = consent ? consent.getStatus() : null;
  var advertisingStatus = consent && consent.getAdvertisingStatus
    ? consent.getAdvertisingStatus()
    : null;

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

  function syncConsent() {
    window.gtag("consent", "update", {
      ad_storage: advertisingStatus === "accepted" ? "granted" : "denied",
      analytics_storage: audienceStatus === "accepted" ? "granted" : "denied",
      ad_user_data: advertisingStatus === "accepted" ? "granted" : "denied",
      ad_personalization: "denied",
    });
    if (audienceStatus === "accepted" || advertisingStatus === "accepted") {
      loadGtm();
      loadGa4();
    }
    if (audienceStatus === "accepted") sendPageView();
  }

  if (consent) {
    if (audienceStatus || advertisingStatus) syncConsent();
    consent.onChange(function (status) {
      audienceStatus = status;
      syncConsent();
    });
    if (consent.onAdvertisingChange) {
      consent.onAdvertisingChange(function (status) {
        advertisingStatus = status;
        syncConsent();
      });
    }
  }
})();
