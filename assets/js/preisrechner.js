/* =========================================================================
   Fensterputz-Service – interaktiver Preisrechner
   Liest die Konfiguration aus window.RECHNER (wird auf der Preisseite gesetzt).
   Übergibt das Ergebnis per sessionStorage an das Kontaktformular.
   ========================================================================= */
(function () {
  'use strict';

  var KEY = 'fp_angebot';

  function eur(n) {
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/, '.') + ' €';
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ===================================================================== */
  /*  1) Rechner                                                            */
  /* ===================================================================== */
  function initRechner(root) {
    var R = window.RECHNER;
    if (!R) return;

    var state = { objekt: null, groesse: null, umfang: null, letzte: null,
                  dach: true, seiten: true, qmDach: R.wintergarten.dachStart, qmSeiten: R.wintergarten.seiteStart };

    var steps    = $$('.rstep', root);
    var bar      = $('.rechner__fill', root);
    var stepNr   = $('.r-stepnr', root);
    var stepLbl  = $('.r-steplabel', root);
    var btnBack  = $('.r-back', root);
    var btnNext  = $('.r-next', root);
    var btnReset = $('.r-reset', root);
    var idx = 0;

    /* --- welche Schritte sind je nach Objektart aktiv? ------------------ */
    function kette() {
      var k = ['objekt'];
      if (state.objekt === 'wohnung' || state.objekt === 'haus' || state.objekt === 'kombi') k.push('groesse');
      if (state.objekt === 'wintergarten' || state.objekt === 'kombi') k.push('wintergarten');
      k.push('umfang', 'letzte', 'ergebnis');
      return k;
    }
    function stepEl(name) { return $('.rstep[data-step="' + name + '"]', root); }

    /* --- Welche Größen-Gruppe wird angezeigt? --------------------------- */
    function groessenGruppe() {
      if (state.objekt === 'haus') return 'haus';
      if (state.objekt === 'wohnung') return 'wohnung';
      return state.kombiTyp || null;      // bei Kombi erst nach Auswahl
    }

    function zeigeGroessen() {
      var g = stepEl('groesse');
      if (!g) return;
      var typ = groessenGruppe();
      $$('.ropts[data-for]', g).forEach(function (el) {
        el.hidden = (el.getAttribute('data-for') !== typ);
      });
      var wahl = $('.rkombi', g);
      if (wahl) wahl.hidden = (state.objekt !== 'kombi');
    }

    /* --- Bei Kombi zuerst Wohnung/Haus wählen lassen -------------------- */
    (function baueKombiWahl() {
      var g = stepEl('groesse');
      if (!g) return;
      var box = document.createElement('div');
      box.className = 'rkombi';
      box.hidden = true;
      box.innerHTML = '<p class="rkombi__lbl">Worum handelt es sich zusätzlich zum Wintergarten?</p>'
        + '<div class="ropts ropts--2" role="radiogroup" aria-label="Wohnung oder Haus">'
        + '<button type="button" class="ropt" role="radio" aria-checked="false" data-group="kombiTyp" data-value="wohnung">'
        +   '<span class="ropt__tx"><b>Wohnung</b><span>Etagenwohnung oder Apartment</span></span>'
        +   '<span class="ropt__check" aria-hidden="true"></span></button>'
        + '<button type="button" class="ropt" role="radio" aria-checked="false" data-group="kombiTyp" data-value="haus">'
        +   '<span class="ropt__tx"><b>Haus</b><span>Einfamilien-, Doppel- oder Reihenhaus</span></span>'
        +   '<span class="ropt__check" aria-hidden="true"></span></button>'
        + '</div>';
      g.insertBefore(box, g.children[1]);
    })();

    /* --- Auswahlkarten -------------------------------------------------- */
    root.addEventListener('click', function (e) {
      var opt = e.target.closest ? e.target.closest('.ropt') : null;
      if (opt && root.contains(opt)) {
        var grp = opt.getAttribute('data-group');
        var val = opt.getAttribute('data-value');
        $$('.ropt[data-group="' + grp + '"]', root).forEach(function (o) {
          var on = (o === opt);
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        state[grp] = val;
        if (grp === 'objekt') { state.groesse = null; state.kombiTyp = null; clearGroup('groesse'); clearGroup('kombiTyp'); }
        if (grp === 'kombiTyp') { state.groesse = null; clearGroup('groesse'); }
        zeigeGroessen();
        pruefeWeiter();
        // Direkt weiterspringen, wenn der Schritt damit fertig ist
        if (grp === 'objekt' || grp === 'umfang' || grp === 'letzte' || (grp === 'groesse')) {
          if (kannWeiter()) setTimeout(function () { gehe(1); }, 180);
        }
      }
      var sw = e.target.closest ? e.target.closest('.rswitch__btn') : null;
      if (sw && root.contains(sw)) {
        var key = sw.getAttribute('data-toggle');
        var an = !sw.classList.contains('is-on');
        if (!an && ((key === 'dach' && !state.seiten) || (key === 'seiten' && !state.dach))) return; // mind. eines an
        sw.classList.toggle('is-on', an);
        sw.setAttribute('aria-pressed', an ? 'true' : 'false');
        state[key] = an;
        var qm = $('.rqm[data-qm="' + key + '"]', root);
        if (qm) qm.hidden = !an;
        pruefeWeiter();
      }
    });
    function clearGroup(grp) {
      $$('.ropt[data-group="' + grp + '"]', root).forEach(function (o) {
        o.classList.remove('is-on'); o.setAttribute('aria-checked', 'false');
      });
    }

    /* --- Schieberegler --------------------------------------------------- */
    $$('.rqm input[type=range]', root).forEach(function (inp) {
      var out = $('#qmout-' + inp.name, root);
      var max = +inp.max;
      function upd() {
        var v = +inp.value;
        state[inp.name === 'dach' ? 'qmDach' : 'qmSeiten'] = v;
        if (out) out.textContent = v + (v >= max ? '+ m²' : ' m²');
        inp.style.setProperty('--p', ((v - inp.min) / (max - inp.min) * 100) + '%');
      }
      inp.addEventListener('input', upd);
      upd();
    });

    /* --- Navigation ------------------------------------------------------ */
    function kannWeiter() {
      var name = kette()[idx];
      if (name === 'objekt')       return !!state.objekt;
      if (name === 'groesse')      return !!state.groesse;
      if (name === 'wintergarten') return state.dach || state.seiten;
      if (name === 'umfang')       return !!state.umfang;
      if (name === 'letzte')       return !!state.letzte;
      return false;
    }
    function pruefeWeiter() { btnNext.disabled = !kannWeiter(); }

    function zeige() {
      var k = kette(), name = k[idx];
      steps.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-step') === name); });
      bar.style.width = Math.round((idx + 1) / k.length * 100) + '%';
      stepNr.textContent = (name === 'ergebnis') ? 'Fertig'
        : (idx === 0 && !state.objekt ? 'Schritt 1' : 'Schritt ' + (idx + 1) + ' von ' + (k.length - 1));
      stepLbl.textContent = stepEl(name) ? stepEl(name).getAttribute('data-label') : '';
      var nrEl = stepEl(name) ? stepEl(name).querySelector('.rstep__nr') : null;
      if (nrEl) nrEl.textContent = idx + 1;
      btnBack.disabled = (idx === 0);
      btnNext.hidden = (name === 'ergebnis');
      pruefeWeiter();
      if (name === 'ergebnis') berechne();
      if (name === 'groesse') zeigeGroessen();
      var top = root.getBoundingClientRect().top + window.scrollY - 96;
      if (window.scrollY > top + 40) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    function gehe(d) {
      var k = kette();
      var n = Math.min(Math.max(idx + d, 0), k.length - 1);
      if (n === idx) return;
      idx = n; zeige();
    }
    btnNext.addEventListener('click', function () { if (kannWeiter()) gehe(1); });
    btnBack.addEventListener('click', function () { gehe(-1); });
    btnReset.addEventListener('click', function () {
      state = { objekt:null, groesse:null, umfang:null, letzte:null, dach:true, seiten:true,
                qmDach:R.wintergarten.dachStart, qmSeiten:R.wintergarten.seiteStart };
      ['objekt','groesse','umfang','letzte','kombiTyp'].forEach(clearGroup);
      $$('.rswitch__btn', root).forEach(function (b) { b.classList.add('is-on'); b.setAttribute('aria-pressed','true'); });
      $$('.rqm', root).forEach(function (q) { q.hidden = false; });
      $$('.rqm input[type=range]', root).forEach(function (i) {
        i.value = (i.name === 'dach') ? R.wintergarten.dachStart : R.wintergarten.seiteStart;
        i.dispatchEvent(new Event('input'));
      });
      idx = 0; zeige();
    });

    /* --- Berechnung ------------------------------------------------------ */
    function findGroesse(key) {
      var alle = R.groessen.wohnung.concat(R.groessen.haus);
      for (var i = 0; i < alle.length; i++) if (alle[i].key === key) return alle[i];
      return null;
    }
    function findIn(list, key) {
      for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
      return null;
    }

    function berechne() {
      var u = findIn(R.umfang, state.umfang) || { f: 1, t: '' };
      var l = findIn(R.letzte, state.letzte) || { zuschlag: 0, t: '' };
      var von = 0, bis = 0, offen = false, zeilen = [];

      if (state.objekt !== 'wintergarten') {
        var g = findGroesse(state.groesse);
        if (g) {
          von += g.von * u.f;
          if (g.bis === null) { offen = true; bis += g.von * u.f; }
          else bis += g.bis * u.f;
          zeilen.push([g.t + (g.bis === null ? ' (ab)' : ''), (g.bis === null ? 'ab ' : '') + eur(g.von * u.f)
                       + (g.bis && g.bis !== g.von ? ' – ' + eur(g.bis * u.f) : '')]);
        }
      }
      if (state.objekt === 'wintergarten' || state.objekt === 'kombi') {
        var qm = 0;
        if (state.dach)   qm += state.qmDach;
        if (state.seiten) qm += state.qmSeiten;
        var wg = qm * R.wintergarten.qmPreis * u.f;
        von += wg; bis += wg;
        var teile = [];
        if (state.dach)   teile.push('Dach ' + state.qmDach + ' m²');
        if (state.seiten) teile.push('Seiten ' + state.qmSeiten + ' m²');
        zeilen.push(['Wintergarten (' + teile.join(', ') + ')', 'ab ' + eur(wg)]);
        if (state.dach && state.seiten) offen = offen || false;
      }

      /* Mindestauftragswert */
      if (von > 0 && von < R.mindest) {
        zeilen.push(['Mindestauftragswert Einzeltermin', eur(R.mindest)]);
        von = R.mindest; bis = Math.max(bis, R.mindest);
      }

      /* Verschmutzungszuschlag */
      var evtl = false;
      if (l.zuschlag) {
        von += l.zuschlag; bis += l.zuschlag;
        zeilen.push(['Verschmutzungszuschlag', '+ ' + eur(l.zuschlag)]);
      } else if (l.evtl) {
        evtl = true; bis += R.zuschlag;
        zeilen.push(['Verschmutzungszuschlag, falls nötig', 'ggf. + ' + eur(R.zuschlag)]);
      }

      zeilen.unshift(['Umfang', u.t]);

      /* Anzeige */
      var txt;
      if (offen)               txt = 'ab ' + eur(von);
      else if (bis - von > 0.5) txt = eur(von) + ' – ' + eur(bis);
      else                      txt = eur(von);
      $('.r-price', root).textContent = txt;

      var note = offen
        ? 'Nach oben offen: Bei größeren Häusern hängt der Preis stark von Anzahl und Erreichbarkeit der Fenster ab. Wir nennen Ihnen den Festpreis nach kurzer Rückfrage.'
        : (evtl ? 'Ob der Verschmutzungszuschlag anfällt, sehen wir erst vor Ort – häufig entfällt er.'
                : 'Schätzwert auf Basis Ihrer Angaben.');
      $('.r-pricenote', root).textContent = note;

      $('.r-lines', root).innerHTML = zeilen.map(function (z) {
        return '<li><span>' + z[0] + '</span><b>' + z[1] + '</b></li>';
      }).join('');

      /* Für die Übergabe ans Kontaktformular merken */
      var objTitel = (findIn(R.objekte, state.objekt) || {}).t || '';
      var daten = {
        objekt: objTitel,
        details: zeilen.filter(function (z) { return z[0] !== 'Umfang'; }).map(function (z) { return z[0] + ': ' + z[1]; }),
        umfang: u.t,
        letzte: l.t,
        preis: txt,
        anliegen: (state.objekt === 'wintergarten') ? 'Wintergartenreinigung' : 'Fensterreinigung',
        objektart: state.objekt === 'wohnung' ? 'Wohnung'
                 : state.objekt === 'haus' ? 'Einfamilienhaus'
                 : state.objekt === 'wintergarten' ? 'Wintergarten' : 'Sonstiges'
      };
      root.__daten = daten;
    }

    $('.r-anfragen', root).addEventListener('click', function () {
      try { sessionStorage.setItem(KEY, JSON.stringify(root.__daten || {})); } catch (e) {}
    });

    zeige();
  }

  /* ===================================================================== */
  /*  2) Übernahme ins Kontaktformular                                      */
  /* ===================================================================== */
  function initFormular() {
    var box = $('.form__angebot');
    if (!box) return;
    var daten = null;
    try { daten = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!daten || !daten.preis) return;

    var form = box.closest('form');
    var dl = $('.form__angebot-list', box);
    var zeilen = [['Objekt', daten.objekt], ['Umfang', daten.umfang], ['Letzte Reinigung', daten.letzte]]
      .concat((daten.details || []).map(function (d) {
        var i = d.indexOf(':');
        return [d.slice(0, i), d.slice(i + 1).trim()];
      }))
      .concat([['Geschätzter Preis', daten.preis]]);
    dl.innerHTML = zeilen.filter(function (z) { return z[1]; }).map(function (z) {
      return '<dt>' + z[0] + '</dt><dd>' + z[1] + '</dd>';
    }).join('');
    box.hidden = false;

    /* Felder vorbelegen */
    var setSel = function (name, wert) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el || !wert) return;
      for (var i = 0; i < el.options.length; i++) {
        if (el.options[i].text.replace(/\s+/g, ' ').trim() === wert) { el.selectedIndex = i; return; }
      }
    };
    setSel('anliegen', daten.anliegen);
    setSel('objektart', daten.objektart);

    var hidden = form.querySelector('[name="angebot"]');
    if (hidden) {
      hidden.value = 'Preisrechner: ' + daten.objekt + ' | ' + daten.umfang + ' | ' + daten.letzte
        + ' | ' + (daten.details || []).join(' | ') + ' | Schätzung: ' + daten.preis;
    }
    var msg = form.querySelector('[name="nachricht"]');
    if (msg && !msg.value) {
      msg.value = 'Angaben aus dem Preisrechner:\n'
        + '· Objekt: ' + daten.objekt + '\n'
        + '· Umfang: ' + daten.umfang + '\n'
        + '· Letzte Reinigung: ' + daten.letzte + '\n'
        + (daten.details || []).map(function (d) { return '· ' + d; }).join('\n') + '\n'
        + '· Geschätzter Preis: ' + daten.preis + '\n\n';
    }

    $('.form__angebot-x', box).addEventListener('click', function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      box.hidden = true;
      if (hidden) hidden.value = '';
      if (msg && msg.value.indexOf('Angaben aus dem Preisrechner') === 0) msg.value = '';
    });

    form.addEventListener('submit', function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
    });
  }

  /* ===================================================================== */
  function start() {
    var r = $('[data-rechner]');
    if (r) initRechner(r);
    initFormular();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
