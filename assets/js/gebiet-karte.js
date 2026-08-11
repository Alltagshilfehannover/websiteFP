/* =========================================================================
   Fensterputz-Service – Karte des Einsatzgebiets (Leaflet + OpenStreetMap)

   ZWEI-KLICK-LÖSUNG: Leaflet und die Kartenkacheln werden erst geladen,
   nachdem die Besucherin oder der Besucher auf „Karte laden" geklickt hat.
   Vorher verlässt kein Byte den eigenen Server – das hält die Zusage der
   Datenschutzerklärung ein.

   Daten kommen aus der Seite: window.GEBIET_ORTE / _HQ / _CENTER / _RADIUS
   ========================================================================= */
(function () {
  'use strict';

  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  var box     = document.getElementById('gebietKarte');
  var consent = document.getElementById('karteConsent');
  var btn     = document.getElementById('karteLaden');
  if (!box || !btn) return;

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = 'Karte wird geladen …';

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    css.crossOrigin = '';
    document.head.appendChild(css);

    var js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.crossOrigin = '';
    js.onload = zeichnen;
    js.onerror = function () {
      btn.disabled = false;
      btn.textContent = 'Erneut versuchen';
      var p = consent.querySelector('p');
      if (p) p.innerHTML = 'Die Karte konnte nicht geladen werden. Alle Orte finden Sie unten als Liste.';
    };
    document.body.appendChild(js);
  });

  function zeichnen() {
    if (typeof L === 'undefined') return;
    if (consent) consent.remove();
    box.classList.add('is-live');

    var orte   = window.GEBIET_ORTE   || [];
    var hq     = window.GEBIET_HQ;
    var center = window.GEBIET_CENTER || [52.375, 9.62];
    var radius = window.GEBIET_RADIUS || 32000;

    var map = L.map(box, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende'
    }).addTo(map);

    /* Kerngebiet – weicher Radius um den Betriebssitz */
    L.circle(center, {
      radius: radius, color: '#0F6E9E', weight: 2, opacity: .55,
      fillColor: '#35B4D8', fillOpacity: .10
    }).addTo(map);

    var bounds = [];

    /* Betriebssitz */
    if (hq) {
      var hqIcon = L.divIcon({ className: 'gm-hq', html: '★', iconSize: [32, 32], iconAnchor: [16, 16] });
      L.marker([hq.lat, hq.lng], { icon: hqIcon, zIndexOffset: 1000, title: hq.name })
        .addTo(map)
        .bindPopup('<b>' + hq.name + '</b><br>' + (hq.adresse || []).join('<br>'));
      bounds.push([hq.lat, hq.lng]);
    }

    /* Orte */
    orte.forEach(function (o) {
      if (o.h) { bounds.push([o.lat, o.lng]); return; }   // Sitz schon gesetzt
      var stadt = o.t === 'Stadt';
      var m = L.circleMarker([o.lat, o.lng], {
        radius: stadt ? 8 : 7, color: '#fff', weight: 2,
        fillColor: stadt ? '#0F6E9E' : '#17795E', fillOpacity: .95
      }).addTo(map);
      m.bindPopup('<b>' + o.n + '</b><br><a href="../fensterreinigung-' + o.s + '/">Fensterreinigung in ' + o.n + ' &rarr;</a>');
      m.bindTooltip(o.n, { direction: 'top', offset: [0, -7] });
      bounds.push([o.lat, o.lng]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
    else map.setView(center, 10);

    /* Scroll-Zoom nur bei Fokus – sonst „springt" die Seite beim Scrollen */
    map.on('focus', function () { map.scrollWheelZoom.enable(); });
    map.on('blur',  function () { map.scrollWheelZoom.disable(); });
  }
})();
