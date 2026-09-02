// Meta Pixel. The public Pixel ID is inert until advertising consent is accepted.
(function () {
  "use strict";

  if (window.__scoreImmoMetaPixelInit) return;
  window.__scoreImmoMetaPixelInit = true;

  var consent = window.ScoreImmoConsent;
  var idNode = document.querySelector('meta[name="scoreimmo-meta-pixel-id"]');
  var pixelId = idNode && /^\d{5,30}$/.test(idNode.content || "")
    ? idNode.content
    : "";
  var loaded = false;

  function enable() {
    if (!pixelId || loaded) return;
    loaded = true;
    if (!window.fbq) {
      var pixel = function () {
        if (pixel.callMethod) pixel.callMethod.apply(pixel, arguments);
        else pixel.queue.push(Array.prototype.slice.call(arguments));
      };
      pixel.queue = [];
      pixel.loaded = true;
      pixel.version = "2.0";
      pixel.push = pixel;
      window.fbq = pixel;
      window._fbq = pixel;
    }
    window.fbq("init", pixelId);
    window.fbq("consent", "grant");
    var script = document.createElement("script");
    script.id = "scoreimmo-meta-pixel";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("track", "PageView");
  }

  function disable() {
    if (window.fbq) window.fbq("consent", "revoke");
  }

  if (consent) {
    if (consent.getAdvertisingStatus() === "accepted") enable();
    consent.onAdvertisingChange(function (status) {
      if (status === "accepted") enable();
      else disable();
    });
  }
})();
