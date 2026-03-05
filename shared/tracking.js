/**
 * Magneto Landing Pages — Shared Tracking
 * Meta Pixel + GA4 + Scroll Depth + CTA Clicks
 *
 * SETUP: Replace placeholders before deploying:
 * - 302317904357081 → actual Meta Pixel ID
 * - G-NC45CQFT0C → actual GA4 Measurement ID
 */

(function() {
  'use strict';

  // ===== UTM CAPTURE =====
  // Store UTMs in sessionStorage for form submission
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utms = {};
  utmKeys.forEach(function(key) {
    var val = params.get(key);
    if (val) {
      utms[key] = val;
      sessionStorage.setItem(key, val);
    }
  });

  // Store landing page identifier
  var landingId = document.querySelector('meta[name="landing-id"]');
  if (landingId) {
    sessionStorage.setItem('landing_id', landingId.content);
  }

  // ===== SCROLL DEPTH TRACKING =====
  var scrollThresholds = [25, 50, 75, 100];
  var scrollFired = {};

  function getScrollPercent() {
    var h = document.documentElement;
    var b = document.body;
    var st = h.scrollTop || b.scrollTop;
    var sh = h.scrollHeight || b.scrollHeight;
    var ch = h.clientHeight;
    return Math.round((st / (sh - ch)) * 100);
  }

  window.addEventListener('scroll', function() {
    var pct = getScrollPercent();
    scrollThresholds.forEach(function(threshold) {
      if (pct >= threshold && !scrollFired[threshold]) {
        scrollFired[threshold] = true;

        // GA4
        if (typeof gtag === 'function') {
          gtag('event', 'scroll_depth', {
            'percent': threshold,
            'page_title': document.title
          });
        }

        // Meta Pixel
        if (typeof fbq === 'function') {
          fbq('trackCustom', 'ScrollDepth', { percent: threshold });
        }
      }
    });
  }, { passive: true });

  // ===== CTA CLICK TRACKING =====
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;

    var text = btn.textContent.trim().substring(0, 50);
    var section = btn.closest('section');
    var sectionId = section ? section.id : 'unknown';

    // GA4
    if (typeof gtag === 'function') {
      gtag('event', 'cta_click', {
        'button_text': text,
        'section': sectionId
      });
    }

    // Meta Pixel
    if (typeof fbq === 'function') {
      fbq('trackCustom', 'CTAClick', {
        button_text: text,
        section: sectionId
      });
    }
  });

  // ===== FORM INTERACTION TRACKING =====
  var formStarted = false;

  document.addEventListener('focusin', function(e) {
    if (formStarted) return;
    if (e.target.closest('.form-card')) {
      formStarted = true;

      if (typeof gtag === 'function') {
        gtag('event', 'form_start', {
          'form_name': sessionStorage.getItem('landing_id') || 'unknown'
        });
      }

      if (typeof fbq === 'function') {
        fbq('trackCustom', 'FormStart');
      }
    }
  });

  // ===== FADE-IN ANIMATIONS =====
  var fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // ===== TIME ON PAGE =====
  var startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    var timeOnPage = Math.round((Date.now() - startTime) / 1000);
    if (typeof gtag === 'function') {
      gtag('event', 'time_on_page', {
        'seconds': timeOnPage,
        'page_title': document.title
      });
    }
  });

})();
