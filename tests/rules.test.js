'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/rules.js');

// Configurație de bază: cargou 180 m, pescaj 9 m, sosire ziua, Constanța, fără probleme.
const base = (o = {}) => ({
  zona: 'constanta',
  tipNava: 'marfa',
  manevra: 'sosire',
  loa: 180,
  pescaj: 9,
  ziNoapte: 'zi',
  dana: '40',
  vant: 10,
  pilot: 'da',
  remorchere: [20, 20, 10],
  remorcherUnMotor: 'nu',
  ...o,
});

const gasește = (rez, cat, re) => rez.items.filter((i) => i.cat === cat && re.test(i.titlu));
const arAvut = (rez, cat, status, re) => gasește(rez, cat, re || /./).some((i) => i.status === status);

/* ---------------- utilitare ---------------- */

test('tabel remorcaj Art. 126 alin. (2) – praguri pe lungime', () => {
  const t = R._t.tabelRemorcaj;
  assert.deepEqual(t(100, 8).req, [5]);
  assert.deepEqual(t(120, 8).req, [5]);
  assert.deepEqual(t(121, 8).req, [10, 5]);
  assert.deepEqual(t(150, 8).req, [10, 5]);
  assert.deepEqual(t(151, 8).req, [20, 10]);
  assert.deepEqual(t(175, 8).req, [20, 10]);
  assert.deepEqual(t(176, 8).req, [20, 20, 10]);
  assert.deepEqual(t(200, 8).req, [20, 20, 10]);
  assert.deepEqual(t(201, 8).req, [40, 20, 20]);
  assert.deepEqual(t(240, 8).req, [40, 20, 20]);
  assert.deepEqual(t(241, 8).req, [40, 40, 20, 20]);
});

test('tabel remorcaj – pescaj > 15 m impune lit. g) indiferent de lungime', () => {
  assert.deepEqual(R._t.tabelRemorcaj(100, 15.1).req, [40, 40, 20, 20]);
  assert.deepEqual(R._t.tabelRemorcaj(100, 15).req, [5]);
});

test('acopera: număr și tracțiune', () => {
  const a = R._t.acopera;
  assert.equal(a([20, 20, 10], [20, 20, 10]), true);
  assert.equal(a([40, 40, 40], [20, 20, 10]), true);
  assert.equal(a([20, 20], [20, 20, 10]), false);
  assert.equal(a([20, 10, 10], [20, 20, 10]), false);
  assert.equal(a([5], [0]), true);
});

test('scara Beaufort', () => {
  const b = R._t.beaufort;
  assert.equal(b(0), 0);
  assert.equal(b(3), 1);
  assert.equal(b(4), 2);
  assert.equal(b(16), 4);
  assert.equal(b(17), 5);
  assert.equal(b(22), 6);
  assert.equal(b(28), 7);
});

test('numărul danei se extrage din text', () => {
  assert.equal(R._t.nrDana('Dana 80'), 80);
  assert.equal(R._t.nrDana('79A'), 79);
  assert.equal(R._t.nrDana(''), null);
});

/* ---------------- date incomplete ---------------- */

test('date lipsă ⇒ incomplet', () => {
  const r = R.evaluate({});
  assert.equal(r.verdict, 'incomplet');
});

/* ---------------- pilotaj ---------------- */

test('pilotaj obligatoriu la sosire; fără pilot ⇒ neconform', () => {
  const r = R.evaluate(base({ pilot: 'nu' }));
  assert.equal(r.verdict, 'neconform');
  assert.ok(arAvut(r, 'pilotaj', 'fail'));
});

test('pilotaj asigurat ⇒ ok', () => {
  const r = R.evaluate(base());
  assert.ok(arAvut(r, 'pilotaj', 'ok', /obligatoriu/i));
});

test('nave exceptate (Art. 127 alin. 2): nava militară nu are pilotaj obligatoriu', () => {
  const r = R.evaluate(base({ tipNava: 'militara', pilot: 'nu', remorchere: [] }));
  assert.equal(r.cerinte.pilotaj, 'Neobligatoriu');
  assert.ok(!arAvut(r, 'pilotaj', 'fail'));
  assert.ok(!arAvut(r, 'remorcaj', 'fail'));
});

test('tragere pe parâme: peste LOA/2 ⇒ pilot obligatoriu', () => {
  const r = R.evaluate(base({ manevra: 'tragere', loa: 160, distantaTragere: 81, pilot: 'nu', remorchere: [20, 10] }));
  assert.equal(r.cerinte.pilotaj, 'Obligatoriu');
  assert.ok(arAvut(r, 'pilotaj', 'fail'));
});

test('tragere pe parâme: exact LOA/2 sau mai puțin ⇒ pilotaj neobligatoriu', () => {
  const r = R.evaluate(base({ manevra: 'tragere', loa: 160, distantaTragere: 80, pilot: 'nu', remorchere: [] }));
  assert.equal(r.cerinte.pilotaj, 'Neobligatoriu');
  assert.ok(!arAvut(r, 'pilotaj', 'fail'));
  assert.ok(!arAvut(r, 'remorcaj', 'fail'));
});

test('navă fluvială fără ofițeri brevetați și fără pilot ⇒ neconform (Art. 20 alin. 2)', () => {
  const r = R.evaluate(base({ tipNava: 'fluviala', loa: 80, pilot: 'nu', ofiteriBrevetati: 'nu', remorchere: [] }));
  assert.ok(arAvut(r, 'pilotaj', 'fail', /fluvial/i));
});

/* ---------------- remorcaj ---------------- */

test('cargou 180 m cu 20+20+10 tf ⇒ remorcaj conform', () => {
  const r = R.evaluate(base());
  assert.ok(arAvut(r, 'remorcaj', 'ok', /Remorcaj obligatoriu/));
  assert.notEqual(r.verdict, 'neconform');
});

test('cargou 180 m cu doar 2 remorchere ⇒ neconform', () => {
  const r = R.evaluate(base({ remorchere: [20, 20] }));
  assert.equal(r.verdict, 'neconform');
  assert.ok(arAvut(r, 'remorcaj', 'fail'));
});

test('tracțiune insuficientă (10 în loc de 20) ⇒ neconform', () => {
  const r = R.evaluate(base({ remorchere: [20, 10, 10] }));
  assert.ok(arAvut(r, 'remorcaj', 'fail'));
});

test('portcontainer 300 m cere 2×40 + 2×20 tf', () => {
  const ok = R.evaluate(base({ tipNava: 'container', loa: 300, pescaj: 14, remorchere: [40, 40, 20, 20] }));
  assert.ok(arAvut(ok, 'remorcaj', 'ok', /Remorcaj obligatoriu/));
  const bad = R.evaluate(base({ tipNava: 'container', loa: 300, pescaj: 14, remorchere: [40, 20, 20] }));
  assert.ok(arAvut(bad, 'remorcaj', 'fail'));
});

test('scutire de un remorcher cu propulsoare (Art. 126 alin. 3)', () => {
  const fara = R.evaluate(base({ propulsoareTransversale: true, remorchere: [20, 20] }));
  assert.ok(arAvut(fara, 'remorcaj', 'fail'), 'fără confirmarea condițiilor rămâne neconform');
  const cu = R.evaluate(base({ propulsoareTransversale: true, remorchere: [20, 20], scutHidro: 'da', scutComandant: 'da' }));
  assert.ok(arAvut(cu, 'remorcaj', 'warn', /scutire/i));
  assert.ok(!arAvut(cu, 'remorcaj', 'fail', /Remorcaj/));
});

test('scutirea nu se aplică tancurilor / mărfurilor periculoase (Art. 126 alin. 4)', () => {
  const r = R.evaluate(base({ tipNava: 'tanc_petrolier', propulsoareTransversale: true, remorchere: [20, 10], scutHidro: 'da', scutComandant: 'da' }));
  assert.ok(arAvut(r, 'remorcaj', 'fail'));
});

test('scutirea se aplică portcontainerelor cu mărfuri periculoase (excepția din alin. 4)', () => {
  const r = R.evaluate(base({ tipNava: 'container', marfaPericuloasa: true, propulsoareTransversale: true, remorchere: [20, 20], scutHidro: 'da', scutComandant: 'da' }));
  assert.ok(arAvut(r, 'remorcaj', 'warn', /scutire/i));
});

test('pescaj > 12,5 m: minim un remorcher chiar și cu scutire (Art. 19 alin. 3)', () => {
  const r = R.evaluate(base({ tipNava: 'container', loa: 110, pescaj: 12.6, propulsoareTransversale: true, remorchere: [], scutHidro: 'da', scutComandant: 'da' }));
  assert.ok(arAvut(r, 'remorcaj', 'fail', /12,5/));
});

test('nave de pasageri cu propulsoare: remorcaj stabilit de comandant (Art. 126 alin. 8)', () => {
  const r = R.evaluate(base({ tipNava: 'pasageri', loa: 250, pescaj: 8, propulsoareTransversale: true, remorchere: [] }));
  assert.ok(arAvut(r, 'remorcaj', 'ok', /stabilit de comandant/));
  assert.ok(!arAvut(r, 'remorcaj', 'fail'));
});

test('plecare de la PGM: cel puțin un remorcher ≥ 20 tf (Art. 126 alin. 7)', () => {
  const ok = R.evaluate(base({ manevra: 'plecare_pgm', tipNava: 'tanc_petrolier', pescaj: 12, remorchere: [20] }));
  assert.ok(arAvut(ok, 'remorcaj', 'ok', /PGM/));
  const bad = R.evaluate(base({ manevra: 'plecare_pgm', tipNava: 'tanc_petrolier', pescaj: 12, remorchere: [10] }));
  assert.ok(arAvut(bad, 'remorcaj', 'fail', /PGM/));
});

test('Midia/Mangalia, condiții nefavorabile: aprobare ANR (Art. 126 alin. 9)', () => {
  const r = R.evaluate(base({ zona: 'midia', hidrometeoNefavorabile: true, remorchere: [], vant: 10 }));
  assert.ok(arAvut(r, 'remorcaj', 'todo', /Midia/));
  const ok = R.evaluate(base({ zona: 'mangalia', hidrometeoNefavorabile: true, remorchere: [], vant: 10, aprobareANRRemorcaj: 'da' }));
  assert.ok(arAvut(ok, 'remorcaj', 'ok', /Mangalia/));
});

test('remorcher cu un singur motor/cârmă/elice ⇒ interzis (Art. 136 alin. 4)', () => {
  const r = R.evaluate(base({ remorcherUnMotor: 'da' }));
  assert.ok(arAvut(r, 'remorcaj', 'fail', /un singur motor/));
});

/* ---------------- Art. 34: zi/noapte, vânt ---------------- */

test('Art. 34(2)(a): noapte, pescaj 17 m, dana 81, tanc la dana 79 ⇒ interzis', () => {
  const r = R.evaluate(base({ tipNava: 'tanc_petrolier', pescaj: 17, loa: 240, ziNoapte: 'noapte', dana: '81', dana79Tanc: true, manevra: 'plecare', remorchere: [40, 20, 20] }));
  assert.equal(r.verdict, 'neconform');
  assert.ok(arAvut(r, 'meteo', 'fail', /INTERZIS/));
});

test('Art. 34(2)(a): aceeași situație ziua ⇒ nu este interzis', () => {
  const r = R.evaluate(base({ tipNava: 'tanc_petrolier', pescaj: 17, loa: 240, ziNoapte: 'zi', dana: '81', dana79Tanc: true, manevra: 'plecare', remorchere: [40, 20, 20] }));
  assert.ok(!arAvut(r, 'meteo', 'fail', /INTERZIS/));
});

test('Art. 34(2)(a): pescaj exact 16 m nu declanșează interdicția', () => {
  const r = R.evaluate(base({ pescaj: 16, ziNoapte: 'noapte', dana: '80', dana79Tanc: true, loa: 200, remorchere: [20, 20, 10] }));
  assert.ok(!arAvut(r, 'meteo', 'fail', /INTERZIS/));
});

test('Art. 34(2)(a): dana 79 fără tanc ⇒ nu se aplică', () => {
  const r = R.evaluate(base({ pescaj: 17, ziNoapte: 'noapte', dana: '82', dana79Tanc: false, loa: 200, remorchere: [40, 20, 20] }));
  assert.ok(!arAvut(r, 'meteo', 'fail'));
});

test('Art. 34(2)(b): sosire de noapte la PGM ⇒ interzis; ziua ⇒ ok', () => {
  const n = R.evaluate(base({ manevra: 'sosire_pgm', tipNava: 'tanc_petrolier', ziNoapte: 'noapte', remorchere: [20, 20, 10] }));
  assert.ok(arAvut(n, 'meteo', 'fail', /PGM/));
  const z = R.evaluate(base({ manevra: 'sosire_pgm', tipNava: 'tanc_petrolier', ziNoapte: 'zi', remorchere: [20, 20, 10] }));
  assert.ok(!arAvut(z, 'meteo', 'fail', /PGM/));
});

test('Art. 34(2)(c): structură agabaritică de noapte ⇒ interzis', () => {
  const r = R.evaluate(base({ tipNava: 'structura', manevra: 'plecare', ziNoapte: 'noapte' }));
  assert.ok(arAvut(r, 'meteo', 'fail', /agabaritice/));
});

test('Art. 34(2)(d): doc, vânt > 13 Nd și fără spațiu ⇒ interzis; cu spațiu ⇒ ok', () => {
  const bad = R.evaluate(base({ manevra: 'doc_santier', vant: 14, spatiuSuficient: 'nu' }));
  assert.ok(arAvut(bad, 'meteo', 'fail', /doc/i));
  const ok = R.evaluate(base({ manevra: 'doc_santier', vant: 14, spatiuSuficient: 'da' }));
  assert.ok(!arAvut(ok, 'meteo', 'fail', /doc/i));
  const lim = R.evaluate(base({ manevra: 'doc_santier', vant: 13, spatiuSuficient: 'nu' }));
  assert.ok(!arAvut(lim, 'meteo', 'fail', /doc/i), '13 Nd nu depășește pragul');
});

test('Art. 34(3): suspendare la vânt > 30 Nd în Constanța; 30 exact este permis', () => {
  assert.ok(arAvut(R.evaluate(base({ vant: 31 })), 'meteo', 'fail', /suspendate/));
  assert.ok(!arAvut(R.evaluate(base({ vant: 30 })), 'meteo', 'fail'));
});

test('Art. 34(3): în Midia/Mangalia pragul este 22 Nd', () => {
  assert.ok(arAvut(R.evaluate(base({ zona: 'midia', vant: 23 })), 'meteo', 'fail', /suspendate/));
  assert.ok(arAvut(R.evaluate(base({ zona: 'mangalia', vant: 25 })), 'meteo', 'fail', /suspendate/));
  assert.ok(!arAvut(R.evaluate(base({ zona: 'midia', vant: 22 })), 'meteo', 'fail'));
  // 25 Nd e în limită la Constanța
  assert.ok(!arAvut(R.evaluate(base({ zona: 'constanta', vant: 25 })), 'meteo', 'fail'));
});

test('Art. 34(6): plecarea poate fi aprobată excepțional de Căpitanul Șef', () => {
  const fara = R.evaluate(base({ manevra: 'plecare', vant: 35 }));
  assert.ok(arAvut(fara, 'meteo', 'fail', /suspendate/));
  const cu = R.evaluate(base({ manevra: 'plecare', vant: 35, aprobareCapSef: 'da' }));
  assert.ok(!arAvut(cu, 'meteo', 'fail', /suspendate/));
  assert.ok(arAvut(cu, 'meteo', 'warn', /aprobată/));
  // sosirea nu beneficiază de excepție
  const sos = R.evaluate(base({ manevra: 'sosire', vant: 35, aprobareCapSef: 'da' }));
  assert.ok(arAvut(sos, 'meteo', 'fail', /suspendate/));
});

test('Art. 34(4): nava tehnică nu este afectată de suspendarea pentru vânt', () => {
  const r = R.evaluate(base({ tipNava: 'tehnica', vant: 40, remorchere: [] }));
  assert.ok(!arAvut(r, 'meteo', 'fail'));
});

test('Art. 34(3),(5): vizibilitate redusă suspendă manevrele (nava tehnică: poate)', () => {
  assert.ok(arAvut(R.evaluate(base({ vizibilitateAfectata: true })), 'meteo', 'fail', /vizibilitate/));
  const t = R.evaluate(base({ tipNava: 'tehnica', vizibilitateAfectata: true, remorchere: [] }));
  assert.ok(!arAvut(t, 'meteo', 'fail'));
  assert.ok(arAvut(t, 'meteo', 'warn', /vizibilitate/i));
});

/* ---------------- dană ---------------- */

test('Art. 44: depășirea danei peste limită ⇒ neconform; în limită ⇒ doar cu aprobare', () => {
  // LOA 90: limită 1/10 = 9 m pe capăt; depășire totală 40 ⇒ 20 pe capăt > 9
  const bad = R.evaluate(base({ loa: 90, lungimeDana: 50, remorchere: [5] }));
  assert.ok(arAvut(bad, 'dana', 'fail', /Depășire/));
  // LOA 90, dana 80 ⇒ total 10, 5 pe capăt ≤ 9 ⇒ atenție (aprobare Căpitănie)
  const ok = R.evaluate(base({ loa: 90, lungimeDana: 80, remorchere: [5] }));
  assert.ok(arAvut(ok, 'dana', 'warn', /Depășire/));
});

test('Art. 129(2)(a): spațiu liber < 10% din LOA la extremități ⇒ atenție', () => {
  const r = R.evaluate(base({ loa: 180, lungimeDana: 190 }));
  assert.ok(arAvut(r, 'dana', 'warn', /Spațiu liber/));
  const ok = R.evaluate(base({ loa: 180, lungimeDana: 230 }));
  assert.ok(arAvut(ok, 'dana', 'ok', /Spațiu liber/));
});

test('Art. 130: adâncime ≤ pescaj ⇒ neconform', () => {
  assert.ok(arAvut(R.evaluate(base({ adancime: 9 })), 'dana', 'fail', /Adâncime/));
});

/* ---------------- formalități și Art. 101 ---------------- */

test('formalități negative ⇒ neconform; necompletate ⇒ de confirmat', () => {
  const r = R.evaluate(base({ admin: { buletin: 'nu' } }));
  assert.ok(arAvut(r, 'formalitati', 'fail'));
  const t = R.evaluate(base());
  assert.ok(arAvut(t, 'formalitati', 'todo'));
  assert.notEqual(t.verdict, 'neconform');
});

test('Art. 38: situație specială fără autorizare ⇒ neconform', () => {
  const r = R.evaluate(base({ sit_carantina: true, autorizareSpeciala: 'nu' }));
  assert.ok(arAvut(r, 'formalitati', 'fail', /autorizare specială/i));
});

test('Art. 38 alin. (2): nava nucleară cere aprobare', () => {
  const r = R.evaluate(base({ tipNava: 'nucleara' }));
  assert.ok(arAvut(r, 'formalitati', 'todo', /Autorizare specială/));
});

test('Art. 101: limite de vânt la operare', () => {
  const mk = (o) => R.evaluate(base({ tipNava: 'tanc_petrolier', verificaOperare: true, pescaj: 10, loa: 180, remorchere: [20, 20, 10], ...o }));
  // 17 Nd = forța 5
  assert.ok(arAvut(mk({ vant: 17, directieVant: 'dinspre_dana' }), 'operare', 'fail'));
  assert.ok(arAvut(mk({ vant: 17, directieVant: 'vest_est' }), 'operare', 'ok'));
  assert.ok(arAvut(mk({ vant: 17, directieVant: 'sud', descarcariElectrice: 'nu' }), 'operare', 'ok'));
  assert.ok(arAvut(mk({ vant: 17, directieVant: 'sud', descarcariElectrice: 'da' }), 'operare', 'fail'));
  // 22 Nd = forța 6 > 5 la vânt de sud
  assert.ok(arAvut(mk({ vant: 22, directieVant: 'sud', descarcariElectrice: 'nu' }), 'operare', 'fail'));
  assert.ok(arAvut(mk({ vant: 22, directieVant: 'vest_est' }), 'operare', 'ok'));
});

test('Art. 101(3): fire wire pentru ≥ 20.000 tdw', () => {
  const mk = (o) => R.evaluate(base({ tipNava: 'tanc_petrolier', verificaOperare: true, directieVant: 'vest_est', vant: 5, ...o }));
  assert.ok(arAvut(mk({ dwt: 50000, fireWire: 'nu' }), 'operare', 'fail', /fire wire/));
  assert.ok(arAvut(mk({ dwt: 50000, fireWire: 'da' }), 'operare', 'ok', /fire wire/));
  assert.ok(!gasește(mk({ dwt: 15000 }), 'operare', /fire wire/i).some((i) => i.status === 'fail'));
});

/* ---------------- rezultat și raport ---------------- */

test('scenariu fără probleme (cu formalități confirmate) ⇒ conform', () => {
  const adm = {};
  R.ADMIN_CHECKS.forEach((c) => (adm[c.id] = 'da'));
  const r = R.evaluate(base({ admin: adm }));
  assert.equal(r.verdict, 'conform', JSON.stringify(r.items.filter((i) => ['fail', 'warn', 'todo'].includes(i.status))));
});

test('alt port ⇒ avertisment', () => {
  const r = R.evaluate(base({ zona: 'alt' }));
  assert.ok(arAvut(r, 'general', 'warn', /Alt port/));
});

test('raportul text conține rezultatul și articolele', () => {
  const inp = base({ remorchere: [20] });
  const r = R.evaluate(inp);
  const t = R.raport(inp, r, '2026-11-18');
  assert.match(t, /NECONFORM/);
  assert.match(t, /Art\. 126/);
  assert.match(t, /2026-11-18/);
});
