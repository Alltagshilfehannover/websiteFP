/* =========================================================================
   Fensterputz-Service – Interaktivität
   ========================================================================= */
(function () {
  'use strict';
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------- Jahr im Footer -------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------ Mobile-Menü --------------------------- */
  var toggle = $('.nav__toggle');
  if (toggle) {
    var close = function () { document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var overlay = $('.mobile-nav__overlay');
    if (overlay) overlay.addEventListener('click', close);
    $$('.mobile-nav a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* -------------------------- Mobile-Akkordeon -------------------------- */
  $$('.m-acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.nextElementSibling;
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------------------- Desktop-Dropdown per Klick -------------------- */
  $$('.nav__item--has-menu > .nav__link').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var item = btn.parentElement;
      var wasOpen = item.classList.contains('nav__item--open');
      $$('.nav__item--open').forEach(function (i) { i.classList.remove('nav__item--open'); });
      if (!wasOpen) item.classList.add('nav__item--open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav__item--has-menu')) {
      $$('.nav__item--open').forEach(function (i) { i.classList.remove('nav__item--open'); });
    }
  });

  /* ---------------------------- Pflegegrad-Tabs ------------------------- */
  var pgTabs = $$('.pg-tab');
  if (pgTabs.length) {
    pgTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-pg');
        pgTabs.forEach(function (t) { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
        $$('.pg-panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pg') === id); });
      });
    });
  }

  /* -------------------------- Testimonial-Slider ------------------------ */
  var track = $('.tst__track');
  if (track) {
    var cards = $$('.tcard', track);
    var dotsWrap = $('.tst__dots');
    var prev = $('.tst__btn--prev');
    var next = $('.tst__btn--next');

    if (dotsWrap) {
      cards.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'tst__dot' + (i === 0 ? ' active' : '');
        d.type = 'button';
        d.setAttribute('aria-label', 'Bewertung ' + (i + 1));
        d.addEventListener('click', function () { scrollToCard(i); });
        dotsWrap.appendChild(d);
      });
    }
    var dots = $$('.tst__dot', dotsWrap);

    function scrollToCard(i) {
      var card = cards[i];
      if (!card) return;
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft - 4, behavior: 'smooth' });
    }
    function current() {
      var min = Infinity, idx = 0;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft - track.scrollLeft - track.offsetLeft);
        if (d < min) { min = d; idx = i; }
      });
      return idx;
    }
    function sync() {
      var i = current();
      dots.forEach(function (d, di) { d.classList.toggle('active', di === i); });
    }
    var raf;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); });
    if (prev) prev.addEventListener('click', function () { scrollToCard(Math.max(0, current() - 1)); });
    if (next) next.addEventListener('click', function () { scrollToCard(Math.min(cards.length - 1, current() + 1)); });
  }

  /* ------------------------------ FAQ: nur eine offen ------------------- */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ------------------------------- Cookie-Banner ------------------------ */
  var cookie = $('.cookie');
  if (cookie) {
    var KEY = 'ah_cookie_consent';
    var stored;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = '1'; }
    if (!stored) { setTimeout(function () { cookie.classList.add('show'); }, 900); }
    function decide(v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      cookie.classList.remove('show');
    }
    var acc = $('.cookie__accept'); var dec = $('.cookie__decline');
    if (acc) acc.addEventListener('click', function () { decide('accept'); });
    if (dec) dec.addEventListener('click', function () { decide('decline'); });
  }

  /* ------------------------------ Kontaktformular ----------------------- */
  var form = $('.form:not(.form--bewerbung)');
  if (form) {
    var cfg        = window.SITE_CONFIG || {};
    var btn        = form.querySelector('button[type="submit"]');
    var btnDefault = btn ? btn.textContent : 'Jetzt kostenlos anfragen';
    var okBox      = $('.form__ok', form);
    var consentBox = $('.form__error', form);      // Hinweis zur Einwilligung
    var sendErrBox = $('.form__senderror', form);  // technischer Sendefehler

    function resetBtn()   { if (btn) { btn.disabled = false; btn.textContent = btnDefault; } }
    function hide(el)     { if (el) el.style.display = 'none'; }
    function show(el)     { if (el) el.style.display = 'block'; }
    function succeed()    { show(okBox); hide(sendErrBox); form.reset(); resetBtn(); if (okBox) okBox.scrollIntoView({block:'nearest',behavior:'smooth'}); }
    function failSend()   { show(sendErrBox); resetBtn(); }

    function mailtoUrl(data) {
      var to = form.getAttribute('data-mailto') || cfg.FALLBACK_EMAIL || '';
      var lines = [
        'Name: '      + (data.get('vorname') || '') + ' ' + (data.get('nachname') || ''),
        'E-Mail: '    + (data.get('email') || ''),
        'Telefon: '   + (data.get('telefon') || ''),
        'Adresse: '   + (data.get('adresse') || ''),
        'Anliegen: '  + (data.get('anliegen') || 'keine Angabe'),
        'Objektart: ' + (data.get('objektart') || 'keine Angabe'),
        '', 'Nachricht:', (data.get('nachricht') || '')
      ];
      return 'mailto:' + to + '?subject=' + encodeURIComponent('Anfrage über die Website')
        + '&body=' + encodeURIComponent(lines.join('\n'));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // 1) Pflichtfelder prüfen. Das Formular trägt novalidate, damit wir die
      //    Meldungen selbst steuern – die Prüfung muss deshalb hier ausgelöst
      //    werden, sonst gingen leere Anfragen durch.
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

      // 2) Einwilligung (Pflicht)
      var consent = form.querySelector('input[type="checkbox"][required]');
      if (consent && !consent.checked) { show(consentBox); consent.focus(); return; }
      hide(consentBox); hide(sendErrBox); hide(okBox);

      // 2) Spam-Honeypot – von Bots ausgefüllt, von Menschen nie
      var hp = form.querySelector('[name="_hp"]');
      if (hp && hp.value) { succeed(); return; }

      var data = new FormData(form);

      // 3a) Supabase (wenn konfiguriert): Anfrage in der Datenbank speichern
      if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SITE_KEY) {
        if (btn) { btn.disabled = true; btn.textContent = 'Wird gesendet …'; }
        var payload = {
          seite:      cfg.SITE_KEY,
          vorname:    data.get('vorname')   || '',
          nachname:   data.get('nachname')  || '',
          email:      data.get('email')     || '',
          telefon:    data.get('telefon')   || '',
          adresse:    data.get('adresse')   || '',
          anliegen:   data.get('anliegen')  || '',
          objektart:  data.get('objektart') || '',
          nachricht:  data.get('nachricht') || '',
          quelle:     (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index')
        };
        fetch(cfg.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + (cfg.CONTACT_TABLE || 'kontaktanfragen'), {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        cfg.SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
            'Prefer':        'return=minimal'
          },
          body: JSON.stringify(payload)
        })
        .then(function (r) { if (r.ok) succeed(); else failSend(); })
        .catch(function () { failSend(); });
        return;
      }

      // 3b) Fallback ohne Backend: E-Mail-Programm öffnen.
      //     Hier NICHT „Anfrage eingegangen" melden – die Anfrage erreicht uns
      //     erst, wenn der Besucher die vorbereitete E-Mail auch abschickt.
      if (btn) { btn.disabled = true; btn.textContent = 'E-Mail-Programm wird geöffnet …'; }
      window.location.href = mailtoUrl(data);
      setTimeout(function () {
        if (okBox) {
          var tel = sendErrBox ? sendErrBox.querySelector('a[href^="tel:"]') : null;
          okBox.innerHTML = 'Ihr E-Mail-Programm wurde mit Ihrer Anfrage geöffnet. '
            + '<strong>Bitte schicken Sie die E-Mail dort noch ab</strong> – erst dann erreicht sie uns.'
            + (tel ? ' Klappt das nicht, rufen Sie uns gern an unter ' + tel.outerHTML + '.' : '');
          show(okBox);
          okBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        resetBtn();   // Eingaben stehen lassen, falls das Mailprogramm fehlt
      }, 900);
    });
  }

  /* --------------------------- Bewerbungsformular ----------------------- */
  var bwForm = $('.form--bewerbung');
  if (bwForm) {
    var bwCfg = window.SITE_CONFIG || {};
    var toast = $('#bewerbungToast');
    var toastTimer = null;
    function hideToast() {
      if (!toast) return;
      toast.classList.remove('show');
      setTimeout(function () { toast.hidden = true; }, 350);
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    }
    function showToast() {
      if (!toast) return;
      toast.hidden = false;
      requestAnimationFrame(function () { toast.classList.add('show'); });
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, 15000);   // 15 Sekunden sichtbar
    }
    if (toast) toast.addEventListener('click', hideToast);   // wegklickbar (× oder Klick)

    bwForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // Pflichtfelder prüfen (das Formular trägt novalidate, siehe Kontaktformular)
      if (typeof bwForm.reportValidity === 'function' && !bwForm.reportValidity()) return;
      var consent = bwForm.querySelector('input[type="checkbox"][required]');
      var err = $('.form__error', bwForm);
      if (consent && !consent.checked) { if (err) err.style.display = 'block'; consent.focus(); return; }
      if (err) err.style.display = 'none';
      var hp = bwForm.querySelector('[name="_hp"]');
      if (hp && hp.value) { showToast(); bwForm.reset(); return; }   // Bot

      var btn = bwForm.querySelector('button[type="submit"]');
      var done = function () { showToast(); bwForm.reset(); if (btn) { btn.disabled = false; btn.textContent = 'Bewerbung absenden'; } };

      // Versand an Supabase (EU): Unterlagen in Storage, Daten in Tabelle
      if (bwCfg.SUPABASE_URL && bwCfg.SUPABASE_ANON_KEY && bwCfg.SITE_KEY) {
        if (btn) { btn.disabled = true; btn.textContent = 'Wird gesendet …'; }
        var base = bwCfg.SUPABASE_URL.replace(/\/+$/, '');
        var key = bwCfg.SUPABASE_ANON_KEY;
        var bucket = bwCfg.BEWERBUNG_BUCKET || 'bewerbungen';
        var data = new FormData(bwForm);
        // Ordner je Website – die Datenbank lässt nur bekannte Schlüssel zu.
        var stamp = bwCfg.SITE_KEY + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        var upload = function (file, label) {
          if (!file || !file.name) return Promise.resolve(null);
          var path = stamp + '/' + label + '-' + file.name.replace(/[^\w.\-]+/g, '_');
          return fetch(base + '/storage/v1/object/' + bucket + '/' + path, {
            method: 'POST',
            headers: { apikey: key, 'Authorization': 'Bearer ' + key, 'Content-Type': file.type || 'application/octet-stream' },
            body: file
          }).then(function (r) { return r.ok ? path : null; }).catch(function () { return null; });
        };
        var ll = (bwForm.querySelector('[name="lebenslauf"]').files || [])[0];
        var an = (bwForm.querySelector('[name="anschreiben"]').files || [])[0];
        Promise.all([upload(ll, 'lebenslauf'), upload(an, 'anschreiben')]).then(function (paths) {
          var payload = {
            seite: bwCfg.SITE_KEY,
            vorname: data.get('vorname') || '', nachname: data.get('nachname') || '',
            telefon: data.get('telefon') || '', email: data.get('email') || '',
            ort: data.get('ort') || '', stelle: data.get('stelle') || '',
            lebenslauf_pfad: paths[0], anschreiben_pfad: paths[1]
          };
          return fetch(base + '/rest/v1/' + (bwCfg.BEWERBUNG_TABLE || 'bewerbungen'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'return=minimal' },
            body: JSON.stringify(payload)
          });
        }).then(function () { done(); }).catch(function () { done(); });
      } else {
        done();   // ohne Backend: nur Bestätigung anzeigen
      }
    });
  }

  /* ----------------------------- Blog: Mehr anzeigen -------------------- */
  var blogMore = $('.blog-more');
  if (blogMore) {
    blogMore.addEventListener('click', function () {
      $$('.post[data-more]').forEach(function (el) { el.classList.remove('is-hidden'); el.removeAttribute('data-more'); });
      var wrap = blogMore.closest('.blog-more-wrap');
      if (wrap) wrap.remove();
    });
  }

  /* ----------------------------- Scroll-Reveal -------------------------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  /* -------------------- Header-Schatten beim Scrollen ------------------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();

/* --------------------- Barrierefreiheits-Menü ------------------- */
(function () {
  var html = document.documentElement;
  var fab = document.querySelector('.a11y-fab');
  var panel = document.getElementById('a11yPanel');
  if (!fab || !panel) return;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* Panel öffnen/schließen */
  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    fab.style.display = open ? 'none' : '';
    if (open) { var c = panel.querySelector('.a11y-x'); if (c) c.focus(); }
  }
  fab.addEventListener('click', function () { setOpen(true); });
  var xBtn = panel.querySelector('.a11y-x');
  if (xBtn) xBtn.addEventListener('click', function () { setOpen(false); fab.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); fab.focus(); } });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) setOpen(false); });

  /* Schriftgröße (0–3) */
  var szBtns = panel.querySelectorAll('.a11y-sz');
  function applyTs(n) {
    html.classList.remove('ts-1', 'ts-2', 'ts-3');
    if (n >= 1 && n <= 3) html.classList.add('ts-' + n);
    szBtns.forEach(function (b) {
      var on = (+b.getAttribute('data-ts') === n);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  szBtns.forEach(function (b) { b.addEventListener('click', function () { var n = +b.getAttribute('data-ts'); ls('ah_textsize', n); applyTs(n); }); });
  applyTs(+ls('ah_textsize') || 0);

  /* Vorlesen (Sprachausgabe des Browsers) */
  var synth = window.speechSynthesis || null;
  var readHandler = null;
  function speak(text, el) {
    if (!synth) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; u.rate = 0.95;
    u.onstart = function () { if (el) el.classList.add('a11y-reading'); };
    u.onend = function () { if (el) el.classList.remove('a11y-reading'); };
    synth.speak(u);
  }
  function onReadClick(e) {
    if (e.target.closest('a, button, input, select, textarea, label, .a11y-panel, .a11y-fab')) return;
    var el = e.target.closest('.a11y-fx p, .a11y-fx h1, .a11y-fx h2, .a11y-fx h3, .a11y-fx h4, .a11y-fx li, .a11y-fx blockquote, .a11y-fx figcaption, .a11y-fx dd, .a11y-fx dt');
    if (!el) return;
    var t = (el.textContent || '').trim();
    if (t) { e.preventDefault(); speak(t, el); }
  }
  function setRead(on) {
    if (!synth) on = false;
    html.classList.toggle('a11y-read', on);
    if (on && !readHandler) { readHandler = onReadClick; document.addEventListener('click', readHandler, true); }
    else if (!on && readHandler) {
      document.removeEventListener('click', readHandler, true); readHandler = null;
      if (synth) synth.cancel();
      document.querySelectorAll('.a11y-reading').forEach(function (x) { x.classList.remove('a11y-reading'); });
    }
  }

  /* Umschalter */
  var tgls = panel.querySelectorAll('.a11y-tgl');
  function setMode(key, on) {
    if (key === 'read') setRead(on);
    else html.classList.toggle('a11y-' + key, on);
    ls('ah_a11y_' + key, on ? '1' : '0');
    var t = panel.querySelector('.a11y-tgl[data-a11y="' + key + '"]');
    if (t) t.setAttribute('aria-checked', on ? 'true' : 'false');
  }
  tgls.forEach(function (t) {
    var key = t.getAttribute('data-a11y');
    var on = ls('ah_a11y_' + key) === '1';
    t.setAttribute('aria-checked', on ? 'true' : 'false');
    if (key === 'read' && on) setRead(true);
    t.addEventListener('click', function () { setMode(key, t.getAttribute('aria-checked') !== 'true'); });
  });

  /* Zurücksetzen */
  var reset = panel.querySelector('.a11y-reset');
  if (reset) reset.addEventListener('click', function () {
    ['contrast', 'gray', 'links', 'motion'].forEach(function (k) { html.classList.remove('a11y-' + k); ls('ah_a11y_' + k, '0'); });
    setRead(false); ls('ah_a11y_read', '0');
    ls('ah_textsize', 0); applyTs(0);
    tgls.forEach(function (t) { t.setAttribute('aria-checked', 'false'); });
  });
})();

/* --------------------- Galerie „Unsere Arbeit": Filter ------------------- */
(function () {
  'use strict';
  var tabs = document.querySelectorAll('.gal__tab');
  if (!tabs.length) return;
  var items = document.querySelectorAll('.gal__item');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var kat = t.getAttribute('data-gal');
      tabs.forEach(function (x) {
        var on = x === t;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      items.forEach(function (it) {
        it.classList.toggle('is-out', kat !== 'alle' && it.getAttribute('data-kat') !== kat);
      });
    });
  });
})();
