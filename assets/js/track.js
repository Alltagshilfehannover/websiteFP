/* =========================================================================
   Fensterputz-Service – First-Party-Statistik (cookiefrei, DSGVO-freundlich)
   - Sendet EINEN anonymen Seitenaufruf pro Aufruf an Supabase.
   - KEINE Cookies, KEINE personenbezogenen Daten, KEIN Cross-Site-Tracking.
   - Bleibt inaktiv, solange in site-config.js keine Supabase-Werte gesetzt sind.
   ========================================================================= */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;         // erst nach Einrichtung aktiv
  if (!cfg.SITE_KEY) return;                                       // ohne Website-Schlüssel lehnt die DB ab
  // Eigene Besuche ausblenden – Schalter sitzt im Statistik-Dashboard.
  try { if (localStorage.getItem('ah_no_track') === '1') return; } catch (e) {}
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return; // „Do Not Track" respektieren

  var ref = '', refHost = '';
  try { ref = document.referrer || ''; if (ref) refHost = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) {}
  var self = location.hostname.replace(/^www\./, '');
  var quelle =
      !ref ? 'Direkt' :
      refHost === self ? 'Intern' :
      /google\./.test(refHost) ? 'Google' :
      /instagram\./.test(refHost) ? 'Instagram' :
      /(facebook\.|fb\.)/.test(refHost) ? 'Facebook' :
      /bing\./.test(refHost) ? 'Bing' :
      /duckduckgo\./.test(refHost) ? 'DuckDuckGo' :
      (refHost || 'Sonstige');

  var w = window.innerWidth || 0;
  var device = w > 0 && w < 640 ? 'Mobil' : w < 1024 ? 'Tablet' : 'Desktop';

  var payload = {
    seite:         cfg.SITE_KEY,
    pfad:          (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index'),
    titel:         (document.title || '').slice(0, 200),
    quelle:        quelle,
    referrer_host: (refHost || '').slice(0, 120),
    device:        device,
    breite:        w,
    sprache:       (navigator.language || '').slice(0, 8)
  };

  var url = cfg.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + (cfg.TRACK_TABLE || 'seitenaufrufe');
  try {
    fetch(url, {
      method: 'POST', keepalive: true,
      headers: {
        'Content-Type':  'application/json',
        'apikey':        cfg.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(payload)
    }).catch(function () {});
  } catch (e) {}
})();
