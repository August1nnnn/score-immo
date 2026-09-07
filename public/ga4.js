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
      if (!/^https?:$/.test(referrer.protocol)) return "";
      var host = referrer.hostname.toLowerCase();
      if (host === "accounts.google.com" || host === "appleid.apple.com"
        || /(^|\.)(stripe\.com|supabase\.co)$/.test(host)) return "";
      return referrer.origin + referrer.pathname;
    } catch (_error) {
      return "";
    }
  }

  function campaignFields() {
    if (audienceStatus !== "accepted") return {};
    var params = new URL(location.search || "", location.origin + "/").searchParams;
    var fields = {};
    var mapping = { utm_source: "campaign_source", utm_medium: "campaign_medium",
      utm_campaign: "campaign_name", utm_content: "campaign_content", utm_term: "campaign_term" };
    Object.keys(mapping).forEach(function (key) {
      var value = (params.get(key) || "").trim();
      if (/^[\p{L}\p{N} ._-]{1,80}$/u.test(value)) fields[mapping[key]] = value;
    });
    return fields;
  }

  function cleanLocation() {
    var url = new URL(location.pathname || "/", location.origin);
    if (advertisingStatus === "accepted") {
      var params = new URL(location.search || "", location.origin + "/").searchParams;
      ["gclid", "gbraid", "wbraid"].forEach(function (key) {
        var value = params.get(key) || "";
        if (/^[A-Za-z0-9_-]{1,200}$/.test(value)) url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  function cleanPage() {
    return {
      ...campaignFields(),
      page_path: location.pathname || "/",
      page_location: cleanLocation(),
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
  }

  var configuredCampaign = {};
  function configureGa4() {
    var fields = campaignFields();
    // Explicitly clear defaults set before a consent withdrawal.
    Object.keys(configuredCampaign).forEach(function (key) {
      if (!(key in fields)) fields[key] = "";
    });
    configuredCampaign = fields;
    window.gtag("config", GA4_ID, {
      send_page_view: false,
      ...fields,
      cookie_domain: "score-immo.fr",
      cookie_flags: "SameSite=Lax;Secure",
      page_location: cleanLocation(),
      page_referrer: audienceStatus === "accepted" ? cleanReferrer() : "",
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
    if (ga4Loaded) configureGa4();
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
