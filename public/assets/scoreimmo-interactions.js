/* ============================================
   ScoreImmo - Micro-interactions JS
   IntersectionObserver, rotating text, counters,
   header scroll, smooth scroll
   ============================================ */

(function () {
  'use strict';

  /* --- Respect reduced motion --- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =============================================
     1. SCROLL REVEAL - IntersectionObserver
     ============================================= */
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.si-reveal');
    if (!reveals.length) return;

    if (prefersReducedMotion) {
      reveals.forEach(function (el) {
        el.classList.add('si-revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;

          /* If stagger children, delay them */
          if (el.classList.contains('si-reveal-stagger')) {
            var parent = el.parentElement;
            if (parent) {
              var siblings = parent.querySelectorAll('.si-reveal-stagger');
              var idx = Array.prototype.indexOf.call(siblings, el);
              el.style.transitionDelay = (idx * 0.08) + 's';
            }
          }

          el.classList.add('si-revealed');
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* =============================================
     2. ROTATING WORDS - Hero
     ============================================= */
  function initRotatingWords() {
    var container = document.getElementById('si-rotating-words');
    if (!container) return;

    var words = container.querySelectorAll('.si-rotating-word');
    if (words.length < 2) return;

    var current = 0;
    var interval = prefersReducedMotion ? 3000 : 2000;

    setInterval(function () {
      words[current].classList.remove('active');
      current = (current + 1) % words.length;
      words[current].classList.add('active');
    }, interval);
  }

  /* =============================================
     3. COUNTER ANIMATION - Stats
     ============================================= */
  function initCounters() {
    var counters = document.querySelectorAll('.si-counter');
    if (!counters.length) return;

    if (prefersReducedMotion) return; /* Keep static numbers */

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* Ease out cubic */
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  /* =============================================
     4. HEADER SCROLL - Progressive glass morphism
     ============================================= */
  function initHeaderScroll() {
    var header = document.getElementById('si-header');
    if (!header) return;

    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          var opacity = Math.min(scrollY / 200, 1);
          var blur = Math.min(8 + (scrollY / 20), 24);
          var borderOpacity = Math.min(scrollY / 300, 0.12);
          var shadowOpacity = Math.min(scrollY / 400, 0.08);

          header.style.background = 'rgba(255, 255, 255, ' + (0.65 + opacity * 0.25) + ')';
          header.style.backdropFilter = 'blur(' + blur + 'px)';
          header.style.webkitBackdropFilter = 'blur(' + blur + 'px)';
          header.style.borderBottomColor = 'rgba(0, 0, 0, ' + borderOpacity + ')';
          header.style.boxShadow = '0 1px 8px rgba(0, 0, 0, ' + shadowOpacity + ')';

          if (scrollY > 10) {
            header.classList.add('si-header-scrolled');
          } else {
            header.classList.remove('si-header-scrolled');
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* =============================================
     5. SMOOTH SCROLL - Anchor links
     ============================================= */
  function initSmoothScroll() {
    if (prefersReducedMotion) return;

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href*="#"]');
      if (!link) return;

      var href = link.getAttribute('href');
      /* Only handle same-page anchors */
      if (href.indexOf('#') === -1) return;

      var hash = href.split('#')[1];
      if (!hash) return;

      var target = document.getElementById(hash);
      if (!target) return;

      /* Check if same page */
      var linkPath = href.split('#')[0];
      if (linkPath && linkPath !== '' && linkPath !== '/' && linkPath !== window.location.pathname) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      /* Close mobile menu if open */
      var overlay = document.getElementById('si-mobile-overlay');
      var drawer = document.getElementById('si-mobile-drawer');
      if (overlay) overlay.classList.remove('open');
      if (drawer) drawer.classList.remove('open');
    });
  }

  /* =============================================
     6. FAQ ACCORDION
     ============================================= */
  function initAccordion() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('.si-accordion-trigger');
      if (!trigger) return;

      var item = trigger.closest('.si-accordion-item');
      if (!item) return;

      /* Close other items in the same accordion */
      var parent = item.parentElement;
      if (parent) {
        var allItems = parent.querySelectorAll('.si-accordion-item');
        allItems.forEach(function (other) {
          if (other !== item) other.classList.remove('active');
        });
      }

      item.classList.toggle('active');
    });
  }

  /* =============================================
     INIT - DOMContentLoaded
     ============================================= */
  function init() {
    initScrollReveal();
    initRotatingWords();
    initCounters();
    initHeaderScroll();
    initSmoothScroll();
    initAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
