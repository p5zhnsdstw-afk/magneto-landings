/**
 * WhatsApp Enhancer — Patagon Ad Attribution
 * Intercepts all WhatsApp links and appends tracking params:
 * - source_url (current page + fbp cookie + user_agent)
 * - show_ad_attribution=1
 * - context=patagonad
 * - icebreaker (from text param)
 */
(function () {
  'use strict';

  var WHATSAPP_HOSTS = [
    'wa.me',
    'wa.link',
    'web.whatsapp.com',
    'api.whatsapp.com',
    'whatsapp.com',
  ];

  var sourceUrl = buildSourceUrl();

  function buildSourceUrl() {
    try {
      var url = new URL(window.location.href);
      var fbpMatch = document.cookie.match(/_fbp=([^;]+)/);
      var fbp = fbpMatch ? fbpMatch[1] : null;

      if (fbp) {
        url.searchParams.set('fbp', fbp);
      }
      if (navigator.userAgent) {
        url.searchParams.set('user_agent', navigator.userAgent);
      }
      return url.href;
    } catch (e) {
      return window.location.href || '';
    }
  }

  function isWhatsAppLink(href) {
    if (!href || typeof href !== 'string') return false;
    if (href.indexOf('whatsapp://') === 0) return true;

    try {
      var url = new URL(href, window.location.href);
      var hostname = url.hostname.toLowerCase();

      if (WHATSAPP_HOSTS.indexOf(hostname) === -1) return false;

      if ((hostname === 'api.whatsapp.com' || hostname === 'whatsapp.com') && url.pathname.indexOf('/send') !== 0) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  function enhanceWhatsAppUrl(href) {
    try {
      var url = new URL(href);

      if (sourceUrl) {
        url.searchParams.set('source_url', sourceUrl);
      }
      url.searchParams.set('show_ad_attribution', '1');
      url.searchParams.set('context', 'patagonad');

      var textParam = url.searchParams.get('text');
      if (textParam) {
        url.searchParams.set('icebreaker', textParam);
      }

      return url.href;
    } catch (e) {
      return href;
    }
  }

  function globalClickHandler(event) {
    var anchor = event.target.closest('a');

    if (!anchor || !isWhatsAppLink(anchor.getAttribute('href'))) {
      return;
    }

    if (anchor.getAttribute('data-skip-wa-enhance') === '1') {
      return;
    }

    event.preventDefault();

    var finalHref = enhanceWhatsAppUrl(anchor.href);
    var target = anchor.target || '_self';

    if (!window.open(finalHref, target) && target !== '_self') {
      window.location.href = finalHref;
    }
  }

  function initialize() {
    document.addEventListener('click', globalClickHandler, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
