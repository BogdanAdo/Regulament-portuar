(function () {
  'use strict';

  var R = window.Regulament;
  var form = document.getElementById('form');
  var out = document.getElementById('resultsInner');
  var STORE_KEY = 'verificator-regulament-portuar:v1';
  var state = { doarProbleme: false };

  /* ---------------- utilitare ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function opt(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
  }
  var TRI_OPTS = opt('?', '— de confirmat —') + opt('da', 'Da') + opt('nu', 'Nu');

  /* ---------------- construirea câmpurilor dinamice ---------------- */
  function build() {
    // tip navă, grupat
    var grupe = {};
    Object.keys(R.NAVE).forEach(function (k) {
      var g = R.NAVE[k].grup;
      (grupe[g] = grupe[g] || []).push(k);
    });
    var html = opt('', '— alegeți tipul navei —');
    Object.keys(grupe).forEach(function (g) {
      html += '<optgroup label="' + esc(g) + '">';
      grupe[g].forEach(function (k) { html += opt(k, R.NAVE[k].l); });
      html += '</optgroup>';
    });
    document.getElementById('tipNava').innerHTML = html;

    var m = opt('', '— alegeți manevra —');
    Object.keys(R.MANEVRE).forEach(function (k) { m += opt(k, R.MANEVRE[k]); });
    document.getElementById('manevra').innerHTML = m;

    var z = '';
    Object.keys(R.ZONE).forEach(function (k) { z += opt(k, R.ZONE[k], k === 'constanta'); });
    document.getElementById('zona').innerHTML = z;

    Array.prototype.forEach.call(form.querySelectorAll('select[data-tri]'), function (s) { s.innerHTML = TRI_OPTS; });

    // formalități
    var a = '';
    R.ADMIN_CHECKS.forEach(function (c) {
      a += '<div class="field" data-admin="' + c.id + '" data-hidden="true">' +
        '<label for="admin_' + c.id + '">' + esc(c.l) + ' <span class="opt">' + esc(c.art.join('; ')) + '</span></label>' +
        '<select id="admin_' + c.id + '" name="admin_' + c.id + '" data-tri>' + TRI_OPTS + '</select></div>';
    });
    document.getElementById('adminFields').innerHTML = a;

    // situații Art. 38
    var s = '';
    Object.keys(R.SITUATII_ART38).forEach(function (k) {
      var x = R.SITUATII_ART38[k];
      s += '<label class="check"><input type="checkbox" name="' + k + '"> <span>' + esc(x.l) + ' <span class="opt">' + esc(x.art) + '</span></span></label>';
    });
    document.getElementById('situatii').innerHTML = s;
  }

  /* ---------------- citire / scriere formular ---------------- */
  function readForm() {
    var v = { admin: {} };
    var rem = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') v[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; }
      else if (/^rem[1-4]$/.test(el.name)) rem.push(el.value);
      else if (el.name.indexOf('admin_') === 0) v.admin[el.name.slice(6)] = el.value;
      else v[el.name] = el.value;
    });
    v.remorchere = rem;
    return v;
  }

  function writeForm(vals) {
    form.reset();
    vals = vals || {};
    var rem = vals.remorchere || [];
    var adm = vals.admin || {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var n = el.name;
      var val;
      if (/^rem[1-4]$/.test(n)) val = rem[parseInt(n.slice(3), 10) - 1];
      else if (n.indexOf('admin_') === 0) val = adm[n.slice(6)];
      else val = vals[n];
      if (val === undefined || val === null) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else if (el.type === 'radio') el.checked = el.value === String(val);
      else el.value = String(val);
    });
  }

  function save(vals) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(vals)); } catch (e) { /* stocarea poate lipsi */ }
  }
  function load() {
    try {
      var t = localStorage.getItem(STORE_KEY);
      return t ? JSON.parse(t) : null;
    } catch (e) { return null; }
  }

  /* ---------------- vizibilitatea câmpurilor condiționale ---------------- */
  var VIS = {
    fluvial: function (v) { return v.tipNava === 'fluviala'; },
    tragere: function (v) { return v.manevra === 'tragere'; },
    doc: function (v) { return v.manevra === 'doc_santier'; },
    plecare: function (v) { return v.manevra === 'plecare' || v.manevra === 'plecare_pgm'; },
    arrival: function (v) { return v.manevra === 'sosire' || v.manevra === 'sosire_pgm'; },
    scutire: function (v) { return v.propulsoareTransversale || v.manevra === 'tragere'; },
    anrRem: function (v) { return (v.zona === 'midia' || v.zona === 'mangalia') && v.hidrometeoNefavorabile; },
    operare: function (v) { return v.verificaOperare; },
    sud: function (v) { return v.directieVant === 'sud'; },
  };

  function updateVisibility(vals) {
    Array.prototype.forEach.call(form.querySelectorAll('[data-show]'), function (el) {
      var f = VIS[el.getAttribute('data-show')];
      el.setAttribute('data-hidden', f && f(vals) ? 'false' : 'true');
    });
    var ids = R.adminAplicabile(vals);
    Array.prototype.forEach.call(form.querySelectorAll('[data-admin]'), function (el) {
      el.setAttribute('data-hidden', ids.indexOf(el.getAttribute('data-admin')) >= 0 ? 'false' : 'true');
    });
  }

  /* ---------------- afișarea rezultatului ---------------- */
  var IC = { ok: '✓', fail: '✕', warn: '!', todo: '?', info: 'i' };
  var LBL = { ok: 'Conform', fail: 'Neconform', warn: 'Atenție', todo: 'De confirmat', info: 'Informare' };

  function artChip(a) {
    var m = /^Art\. (\d+)/.exec(a);
    var tip = m && R.ARTICOLE['Art. ' + m[1]] ? R.ARTICOLE['Art. ' + m[1]] : '';
    var href = R.linkArticol(a);
    if (!href) return '<span class="art"' + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + esc(a) + '</span>';
    return '<a class="art" href="' + esc(href) + '" target="_blank" rel="noopener"' +
      ' title="' + esc((tip ? tip + ' ' : '') + '(se deschide regulamentul într-o fereastră nouă)') + '">' + esc(a) + ' ↗</a>';
  }

  function renderItem(i) {
    var open = i.status === 'fail' || i.status === 'warn' || i.status === 'todo';
    var body = '';
    if (i.mesaj && i.mesaj !== i.titlu) body += '<p>' + esc(i.mesaj) + '</p>';
    if (i.art.length) body += '<div class="arts">' + i.art.map(artChip).join('') + '</div>';
    return '<li class="item ' + i.status + '"><details' + (open ? ' open' : '') + '><summary>' +
      '<span class="ic" role="img" aria-label="' + LBL[i.status] + '">' + IC[i.status] + '</span>' +
      '<span>' + esc(i.titlu) + '</span></summary><div class="body">' + body + '</div></details></li>';
  }

  /* ---------------- bara de rezultat (telefon) ---------------- */
  var bar = document.getElementById('bar');
  var resultsEl = document.getElementById('results');
  var rezultatVizibil = false;
  function updateBar(rez) {
    if (!bar) return;
    var c = rez.counts;
    bar.className = 'bar ' + rez.verdict;
    document.getElementById('barT').textContent = rez.titlu;
    document.getElementById('barS').textContent = rez.verdict === 'incomplet'
      ? 'Completați datele obligatorii'
      : c.fail + ' neconforme · ' + c.warn + ' atenție · ' + c.todo + ' de confirmat';
    verificaBara();
  }
  function verificaBara() {
    if (!bar || !resultsEl || !window.__ultimulRezultat) return;
    // bara dispare când începutul rezultatului a ajuns în ecran
    rezultatVizibil = resultsEl.getBoundingClientRect().top < window.innerHeight - 140;
    bar.hidden = rezultatVizibil && window.matchMedia('(max-width: 979px)').matches;
  }
  window.addEventListener('scroll', verificaBara, { passive: true });
  window.addEventListener('resize', verificaBara);

  function render() {
    var vals = readForm();
    updateVisibility(vals);
    save(vals);
    var rez = R.evaluate(vals);
    window.__ultimulRezultat = { vals: vals, rez: rez };
    updateBar(rez);

    var h = '<div class="res-card">';
    h += '<div class="verdict ' + rez.verdict + '"><h2>' + esc(rez.titlu) + '</h2><p>' + esc(rez.text) + '</p></div>';

    if (rez.verdict === 'incomplet') {
      var inc = rez.items.filter(function (i) { return i.cat === 'general'; });
      h += '<div class="empty">' + (inc.length ? esc(inc[0].mesaj) : 'Completați datele navei și ale manevrei.') +
        '</div></div>';
      out.innerHTML = h;
      return;
    }

    var c = rez.counts;
    h += '<div class="counts">' +
      '<span class="pill fail">' + c.fail + ' neconforme</span>' +
      '<span class="pill warn">' + c.warn + ' atenție</span>' +
      '<span class="pill todo">' + c.todo + ' de confirmat</span>' +
      '<span class="pill ok">' + c.ok + ' conforme</span>' +
      '<span class="pill info">' + c.info + ' informări</span></div>';

    h += '<div class="req">';
    if (rez.cerinte.pilotaj) h += '<div><b>Pilotaj:</b> ' + esc(rez.cerinte.pilotaj) + '</div>';
    if (rez.cerinte.remorcaj) h += '<div><b>Remorcaj necesar:</b> ' + esc(rez.cerinte.remorcaj) + '</div>';
    h += '</div>';

    h += '<div class="tools">' +
      '<button type="button" class="btn primary" id="btnCopy">Copiază raportul</button>' +
      '<button type="button" class="btn" id="btnDown">Descarcă .txt</button>' +
      '<button type="button" class="btn" id="btnPrint">Tipărește</button>' +
      '<label class="check"><input type="checkbox" id="chkProbleme"' + (state.doarProbleme ? ' checked' : '') + '> Doar probleme</label></div>';

    rez.ordine.forEach(function (cat) {
      var lista = rez.items.filter(function (i) {
        if (i.cat !== cat) return false;
        if (state.doarProbleme) return i.status === 'fail' || i.status === 'warn' || i.status === 'todo';
        return true;
      });
      if (!lista.length) return;
      // probleme întâi
      var ord = { fail: 0, warn: 1, todo: 2, ok: 3, info: 4 };
      lista = lista.slice().sort(function (a, b) { return ord[a.status] - ord[b.status]; });
      h += '<section class="group"><h3>' + esc(rez.categorii[cat]) + '</h3><ul class="items">' + lista.map(renderItem).join('') + '</ul></section>';
    });
    h += '</div>';
    out.innerHTML = h;
  }

  /* ---------------- acțiuni ---------------- */
  function raportText() {
    var u = window.__ultimulRezultat;
    if (!u) return '';
    var d = new Date();
    var data = d.toLocaleDateString('ro-RO') + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return R.raport(u.vals, u.rez, data);
  }

  function copiaza(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  out.addEventListener('click', function (e) {
    var id = e.target && e.target.id;
    if (id === 'btnCopy') {
      var b = e.target;
      copiaza(raportText()).then(function () {
        b.textContent = 'Copiat ✓';
        setTimeout(function () { b.textContent = 'Copiază raportul'; }, 1800);
      }, function () { b.textContent = 'Nu s-a putut copia'; });
    } else if (id === 'btnDown') {
      var blob = new Blob([raportText()], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'verificare-manevra.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    } else if (id === 'btnPrint') {
      window.print();
    }
  });
  out.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'chkProbleme') {
      state.doarProbleme = e.target.checked;
      render();
    }
  });
  window.addEventListener('beforeprint', function () {
    Array.prototype.forEach.call(out.querySelectorAll('details'), function (d) { d.open = true; });
  });

  /* ---------------- inițializare ---------------- */
  build();

  var salvat = load();
  if (salvat) writeForm(salvat);

  var timer = null;
  form.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(render, 80);
  });
  form.addEventListener('change', function (e) {
    // un tanc implică mărfuri periculoase
    if (e.target && e.target.name === 'tipNava') {
      var n = R.NAVE[e.target.value];
      if (n && n.periculoasa) form.elements.marfaPericuloasa.checked = true;
    }
    render();
  });
  document.getElementById('btnReset').addEventListener('click', function () {
    writeForm({});
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorat */ }
    render();
  });

  render();
})();
