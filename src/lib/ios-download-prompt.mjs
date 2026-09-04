const DISMISSED_UNTIL = 'si-ios-prompt-dismissed-until';
const SESSION_SEEN = 'si-ios-prompt-seen';
let initialized = false;

// Storage is optional: private browsing must never interrupt the page.
function read(storage, key) {
  try { return window[storage].getItem(key); } catch { return null; }
}
function write(storage, key, value) {
  try { window[storage].setItem(key, String(value)); } catch { /* best effort */ }
}

export function initIOSDownloadPrompt() {
  const prompt = document.getElementById('ios-download-prompt');
  if (!prompt || initialized) return;
  initialized = true;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser|Chrome\//i.test(ua);
  const safari = /Safari/i.test(ua) && /Version\//i.test(ua) && !otherBrowser;
  if (!ios || safari || read('sessionStorage', SESSION_SEEN) || Number(read('localStorage', DISMISSED_UNTIL)) > Date.now()) return;

  const cookie = document.getElementById('si-cookie-banner');
  const menu = document.getElementById('si-mobile-menu-btn');
  let ready = false;
  let dismissed = false;
  let shown = false;
  const update = () => {
    const active = document.activeElement;
    const typing = active?.matches('input, textarea, select') || active?.isContentEditable;
    const blocked = (cookie && !cookie.hidden) || menu?.getAttribute('aria-expanded') === 'true' || typing || document.hidden;
    prompt.hidden = !ready || dismissed || Boolean(blocked);
    if (!prompt.hidden && !shown) {
      shown = true;
      write('sessionStorage', SESSION_SEEN, '1');
    }
  };
  const observer = new MutationObserver(update);
  if (cookie) observer.observe(cookie, { attributes: true, attributeFilter: ['hidden'] });
  if (menu) observer.observe(menu, { attributes: true, attributeFilter: ['aria-expanded'] });
  const onFocus = () => { queueMicrotask(update); };
  const onKey = event => { if (event.key === 'Escape' && !event.defaultPrevented && !prompt.hidden) dismiss(); };
  const dismiss = () => {
    dismissed = true;
    prompt.hidden = true;
    write('localStorage', DISMISSED_UNTIL, Date.now() + 7 * 86400000);
    observer.disconnect();
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('focusout', onFocus);
    document.removeEventListener('visibilitychange', update);
    document.removeEventListener('keydown', onKey);
  };
  prompt.querySelector('[data-ios-dismiss]')?.addEventListener('click', dismiss);
  document.addEventListener('focusin', onFocus);
  document.addEventListener('focusout', onFocus);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('keydown', onKey);
  setTimeout(() => { ready = true; update(); }, 8000);
}
