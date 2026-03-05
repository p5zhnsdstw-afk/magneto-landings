/**
 * Magneto Landing Pages — Form Handler
 * Handles form submission, validation, and lead tracking
 *
 * SETUP: Configure the webhook URL before deploying:
 * - WEBHOOK_URL → your CRM/Patagon webhook endpoint
 */

(function() {
  'use strict';

  var WEBHOOK_URL = '{{WEBHOOK_URL}}'; // Replace with actual endpoint

  // Find all landing forms
  var forms = document.querySelectorAll('.landing-form');

  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;

      // Basic validation
      var phone = form.querySelector('input[type="tel"]');
      if (phone && phone.value) {
        // Clean phone: keep only digits
        var cleaned = phone.value.replace(/\D/g, '');
        if (cleaned.length < 7 || cleaned.length > 13) {
          phone.style.borderColor = '#ef4444';
          phone.focus();
          return;
        }
      }

      var name = form.querySelector('input[name="nombre"]');
      if (name && name.value.trim().length < 2) {
        name.style.borderColor = '#ef4444';
        name.focus();
        return;
      }

      // Loading state
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      btn.style.opacity = '0.7';

      // Collect form data
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function(value, key) {
        data[key] = value;
      });

      // Add UTMs and metadata
      var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      utmKeys.forEach(function(key) {
        var val = sessionStorage.getItem(key);
        if (val) data[key] = val;
      });

      data.landing_id = sessionStorage.getItem('landing_id') || document.querySelector('meta[name="landing-id"]')?.content || 'unknown';
      data.landing_url = window.location.href;
      data.timestamp = new Date().toISOString();
      data.user_agent = navigator.userAgent;

      // Track conversion events
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          'currency': 'USD',
          'value': 10,
          'lead_source': data.landing_id
        });
      }

      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {
          content_name: data.landing_id,
          currency: 'USD',
          value: 10.00
        });
      }

      // Send to webhook (if configured)
      if (WEBHOOK_URL && WEBHOOK_URL !== '{{WEBHOOK_URL}}') {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(function() {
          // Silent fail — form still shows success
          console.warn('Webhook failed, data:', data);
        });
      } else {
        // Dev mode: log to console
        console.log('Form submission (no webhook configured):', data);
      }

      // Redirect to thank you page
      var isAwareness = form.closest('.lead-magnet') !== null;
      var basePath = getBasePath();

      setTimeout(function() {
        if (isAwareness) {
          window.location.href = basePath + 'gracias-lead/';
        } else {
          window.location.href = basePath + 'gracias/';
        }
      }, 300); // Small delay for tracking pixels to fire
    });
  });

  function getBasePath() {
    // Detect if we're in a subdirectory (e.g., /dueno-conversion/)
    var path = window.location.pathname;
    // Go up one level from current landing page directory
    var parts = path.replace(/\/$/, '').split('/');
    parts.pop(); // Remove current directory
    return parts.join('/') + '/';
  }

})();
