// Consent-gated, coarse presence. No page views or identifiers beyond the existing session.
(function () {
  'use strict';
  if (window.__siPresenceLoaded) return;
  window.__siPresenceLoaded = true;
  var consent = window.ScoreImmoConsent;
  if (!consent) return;
  var interval = null, timeout = null, pending = null, suspended = false;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function sessionId() {
    try {
      var existing = sessionStorage.getItem('si_session_id');
      if (UUID.test(existing || '')) return existing;
      var id = crypto.randomUUID();
      sessionStorage.setItem('si_session_id', id);
      return id;
    } catch (_) { return null; }
  }
  function device() {
    var ua = navigator.userAgent || '';
    if (/iPad|Tablet|Kindle|Silk/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    if (/iPhone|iPod|Mobile|Android/i.test(ua)) return 'mobile';
    if (/Windows|Macintosh|X11|Linux/i.test(ua)) return 'desktop';
    return 'unknown';
  }
  function path() {
    var value = location.pathname || '/';
    if (value.indexOf('/admin') === 0) return null;
    if (value === '/' || /^\/(blogs|barometre|pages)(\/[a-z0-9-]+){1,4}\/?$/i.test(value) || /^\/(pro|tarifs|iad|barometre|guides)\/?$/i.test(value)) return value.slice(0, 240);
    return '/other';
  }
  function stop() {
    clearInterval(interval); clearTimeout(timeout);
    interval = null;
    if (pending) pending.abort();
    pending = null;
  }
  function allowed() {
    return !suspended && document.visibilityState === 'visible' && consent.getStatus() === 'accepted' && path() !== null;
  }
  function send() {
    if (!allowed()) { stop(); return; }
    if (pending) return;
    var id = sessionId();
    if (!id) { stop(); return; }
    var controller = new AbortController();
    pending = controller;
    var requestTimeout = setTimeout(function () { controller.abort(); }, 10000);
    timeout = requestTimeout;
    try {
      Promise.resolve(fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({ session_id: id, path: path(), device_type: device() }),
      })).catch(function () {}).finally(function () {
        clearTimeout(requestTimeout);
        if (pending === controller) pending = null;
      });
    } catch (_) {
      clearTimeout(requestTimeout);
      pending = null;
    }
  }
  function sync() {
    stop();
    if (!allowed() || !sessionId()) return;
    send();
    interval = setInterval(send, 30000);
  }
  consent.onChange(sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', function () { suspended = true; stop(); });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { suspended = false; sync(); }
  });
  sync();
})();
