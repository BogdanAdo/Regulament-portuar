/*
 * Motor de reguli – Regulamentul Portuar al porturilor maritime românești aflate în
 * administrarea CN APM SA Constanța, Ediția 2025.
 *
 * Funcționează atât în browser (window.Regulament) cât și în Node (require).
 * Nu are dependențe. Toate verificările citează articolul din regulament.
 *
 * IMPORTANT: instrument de sprijin. Nu înlocuiește regulamentul, Autoritatea Navală
 * Română / VTS / Căpitănia de Port și nici comandantul sau pilotul navei.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Regulament = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SURSA =
    'Regulamentul Portuar al porturilor maritime românești aflate în administrarea ' +
    'CN „Administrația Porturilor Maritime” SA Constanța – Ediția 2025';

  /* ------------------------------------------------------------------ */
  /* Nomenclatoare                                                       */
  /* ------------------------------------------------------------------ */

  const ZONE = {
    constanta: 'Constanța',
    midia: 'Midia',
    mangalia: 'Mangalia',
    alt: 'Alt port / altă zonă (Basarabi, Tomis etc.)',
  };

  // g: maritima | fluvio | fluviala ; exceptPilot: art. 127 alin. (2)
  const NAVE = {
    marfa: { l: 'Navă de marfă (generală, vrac, frigorifică)', grup: 'Nave maritime', g: 'maritima' },
    container: { l: 'Portcontainer', grup: 'Nave maritime', g: 'maritima' },
    tanc_petrolier: { l: 'Tanc petrolier', grup: 'Nave maritime', g: 'maritima', periculoasa: true, tanc: true },
    tanc_chimic_gaz: { l: 'Tanc chimic / gazier (LPG, GNL)', grup: 'Nave maritime', g: 'maritima', periculoasa: true, tanc: true },
    pasageri: { l: 'Navă de pasageri (inclusiv croazieră)', grup: 'Nave maritime', g: 'maritima', pasageri: true },
    roro: { l: 'RO-RO (marfă)', grup: 'Nave maritime', g: 'maritima' },
    roro_pasageri: { l: 'RO-RO pasageri (Ro-Pax)', grup: 'Nave maritime', g: 'maritima', pasageri: true },
    nucleara: { l: 'Navă cu propulsie nucleară', grup: 'Nave maritime', g: 'maritima', nucleara: true },
    structura: { l: 'Structură mobilă agabaritică (platformă foraj, macara plutitoare, corp fără propulsie)', grup: 'Nave maritime', g: 'maritima', structura: true },
    fluvio_maritima: { l: 'Navă fluvio-maritimă', grup: 'Nave fluvio-maritime și fluviale', g: 'fluvio' },
    fluviala: { l: 'Navă de navigație interioară (fluvială)', grup: 'Nave fluvio-maritime și fluviale', g: 'fluviala' },
    tehnica: { l: 'Navă tehnică portuară', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true, tehnica: true },
    militara: { l: 'Navă militară', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true },
    pescuit: { l: 'Navă de pescuit costier (zonă de navigație până la 50 Mm)', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true },
    agrement: { l: 'Ambarcațiune de agrement (HG 464/2017)', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true },
    autoritati: { l: 'Navă din dotarea Poliției de Frontieră, Poliției Române, ANV, ANR sau AFDJ Galați', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true },
    arsvom: { l: 'Navă A.R.S.V.O.M.', grup: 'Categorii exceptate de la pilotaj (Art. 127 alin. (2))', g: 'maritima', exceptPilot: true },
  };

  const MANEVRE = {
    sosire: 'Sosire – intrare în port și acostare',
    sosire_pgm: 'Sosire la punctul de geamanduri multiple (PGM)',
    plecare: 'Plecare – ieșire din dană / din port',
    plecare_pgm: 'Plecare de la punctul de geamanduri multiple (PGM)',
    mutare: 'Mutare de la o dană la alta',
    schimbare_linie: 'Schimbarea liniei de acostare',
    tragere: 'Tragere pe parâme',
    tranzit: 'Tranzitarea acvatoriilor portuare (spre/dinspre șantiere navale sau canale navigabile)',
    doc_santier: 'Intrare/ieșire la doc plutitor sau uscat al unui șantier naval',
  };

  const ENTRY_EXIT = ['sosire', 'plecare', 'sosire_pgm', 'plecare_pgm', 'doc_santier'];
  const ARRIVAL = ['sosire', 'sosire_pgm'];
  const DEPARTURE = ['plecare', 'plecare_pgm'];

  const SITUATII_ART38 = {
    sit_pericol: { l: 'Nava este în pericol de scufundare / incendiu la bord sau suspiciune de incendiu', art: 'Art. 38 alin. (1) lit. a), b)', preaviz: null },
    sit_constructie: { l: 'Din cauza construcției, nava poate pune în pericol infrastructura sau suprastructura portuară', art: 'Art. 38 alin. (1) lit. c)', preaviz: null },
    sit_carantina: { l: 'Bolnavi sau persoane susceptibile de boli care necesită carantină la bord', art: 'Art. 38 alin. (1) lit. d)', preaviz: 'raportare către VTS/Căpitănia de Port cu cel puțin 6 ore înainte de intrarea în zona de control al traficului' },
    sit_deseuri: { l: 'Deșeuri toxice, radioactive, explozive sau similare la bord', art: 'Art. 38 alin. (1) lit. e)', preaviz: 'notificare VTS/Căpitănia de Port cu cel puțin 24 de ore înainte de intrarea în zona de control al traficului' },
    sit_radioactiv: { l: 'Transport de materiale sau mărfuri radioactive', art: 'Art. 38 alin. (1) lit. e)', preaviz: 'solicitarea aprobării intrării cu cel puțin 30 de zile înainte de data sosirii' },
    sit_ordine: { l: 'Constituie, din orice motiv, un pericol pentru ordinea și siguranța publică', art: 'Art. 38 alin. (1) lit. f)', preaviz: null },
    sit_reparatii: { l: 'Reparații, modificări sau dezmembrare în afara perimetrelor șantierelor navale din port', art: 'Art. 38 alin. (1) lit. g)', preaviz: null },
    sit_adapost: { l: 'Intră în port pentru adăpost, staționare sau alte activități în afara operațiunilor portuare', art: 'Art. 38 alin. (1) lit. h)', preaviz: null },
  };

  // Bife de formalități: [id, etichetă, articole, aplicabilitate(inp, ctx)]
  const ADMIN_CHECKS = [
    { id: 'buletin', l: 'Buletin de pilotaj online întocmit de agent (inițiat până la începerea ședinței CCMN, confirmat de operatorul portuar până la ora 10:00)', art: ['Art. 40 alin. (3)', 'Art. 64 alin. (2)', 'Art. 129 alin. (1)'], when: (i, c) => c.pilotOb === true },
    { id: 'aprobareVTS', l: 'Aprobarea Autorității Navale Române / VTS / Căpităniei de Port pentru începerea manevrei', art: ['Art. 29 alin. (1)', 'Art. 39 alin. (2)', 'Art. 129 alin. (3)', 'Art. 131 alin. (1), (4)'], when: () => true },
    { id: 'aviz24', l: 'Documentul de avizare a navei transmis serviciului de specialitate al administrației portuare cu cel puțin 24 h înainte (sau la plecarea din portul anterior, dacă voiajul < 24 h)', art: ['Art. 40 alin. (1)'], when: (i) => ARRIVAL.includes(i.manevra) },
    { id: 'eta', l: 'Notificări ETA transmise: la plecarea din ultimul port și cu 10, 7, 5, 3 zile și 24 h înainte de sosire', art: ['Art. 42 alin. (1)'], when: (i) => ARRIVAL.includes(i.manevra) },
    { id: 'practica', l: 'Permis de acostare eliberat (Interfața Unică de Raportare – Maritime Single Window) și liberă practică sanitară obținută', art: ['Art. 43 alin. (1), (2)', 'Art. 49 alin. (1)'], when: (i) => ARRIVAL.includes(i.manevra) },
    { id: 'operatorDana', l: 'Operatorul portuar a confirmat dana și că a luat măsurile pentru manevră: reprezentant la dană, semnalizare poziție (bicon), macarale grupate la mijlocul navei, dana liberă', art: ['Art. 43 alin. (3), (5)', 'Art. 129 alin. (2)'], when: (i) => ['sosire', 'mutare', 'schimbare_linie'].includes(i.manevra) },
    { id: 'permisPlecare', l: 'Permis/aviz de plecare eliberat de Autoritatea Navală Română (Căpitănia de Port), cu toate acceptele din Maritime Single Window; pilotul se solicită doar după finalizarea formalităților', art: ['Art. 47 alin. (1)–(3)'], when: (i) => DEPARTURE.includes(i.manevra) },
    { id: 'fara_retinere', l: 'Nava, echipamentele și echipajul îndeplinesc condițiile de siguranță a navigației; nu există cerere justificată de reținere a navei', art: ['Art. 48'], when: (i) => DEPARTURE.includes(i.manevra) },
    { id: 'echipaj_minim', l: 'Echipajul de la bord corespunde certificatului de echipaj minim de siguranță', art: ['Art. 19 alin. (4)'], when: (i) => DEPARTURE.includes(i.manevra) },
    { id: 'parame', l: 'Parâme suficient de lungi și rezistente disponibile la prova și la pupa pentru acordarea imediată a asistenței', art: ['Art. 19 alin. (2)'], when: () => true },
    { id: 'mijloaceManevra', l: 'Nava dispune de mijloacele necesare manevrei în siguranță și este gata de manevră la data și ora comunicate de agent', art: ['Art. 129 alin. (4), (5)'], when: (i, c) => c.pilotOb !== false },
    { id: 'certBollard', l: 'Remorcherele trimise au documente și certificate valabile, inclusiv certificatul de bollard pull', art: ['Art. 135 alin. (2)'], when: (i, c) => c.areRemorchere },
    { id: 'parameRemorca', l: 'Parâmele de remorcă sunt destinate remorcajului și au certificat de rezistență la rupere', art: ['Art. 137'], when: (i, c) => c.areRemorchere },
    { id: 'gasFree', l: 'Certificat „gas free” eliberat de Autoritatea Navală Română (obligatoriu la intrarea în șantier a navelor tip tanc)', art: ['Art. 102 alin. (6)'], when: (i, c) => c.tanc && i.manevra === 'doc_santier' },
  ];

  // Referințe scurte pentru tooltip-uri în interfață
  const ARTICOLE = {
    'Art. 19': 'Obligații la intrarea în port: parâme la prova și pupa; pescaj > 12,5 m ⇒ minim un remorcher în asistență; echipaj minim.',
    'Art. 20': 'Nave de navigație interioară: manevra cu pilot maritim/căpitan maritim portuar dacă nu au ofițeri brevetați.',
    'Art. 29': 'Manevrele se efectuează numai cu aprobarea administrației portuare și a Autorității Navale Române.',
    'Art. 34': 'Manevre permise oricând; interdicții (noapte, dane 80–82, PGM, structuri agabaritice, docuri); suspendare la vânt >30 Nd (Constanța) / >22 Nd (Midia, Mangalia) sau vizibilitate redusă.',
    'Art. 36': 'Viteza navelor tehnice și fluviale în dreptul danelor 77, 78, 89, 90: maximum 6 Nd.',
    'Art. 38': 'Intrarea în port în cazuri de interes general sau de pericol: doar cu autorizare specială.',
    'Art. 39': 'Orice manevră de ancorare, intrare/ieșire sau mutare: doar după aprobarea VTS / ANR.',
    'Art. 40': 'Avizarea navei cu 24 h înainte; buletin de pilotaj obligatoriu; prioritizarea danelor.',
    'Art. 42': 'Notificarea sosirii: 10, 7, 5, 3 zile și 24 h înainte; ETA.',
    'Art. 43': 'Permis de acostare, liberă practică, dane fund de bazin, obligațiile operatorilor.',
    'Art. 44': 'Depășirea limitelor danei: 1/10 LOA (≤100 m), 10 m sau 1/15 LOA (>100 m); dane de capăt de mol: 1/15 LOA la fiecare capăt; semnalizare.',
    'Art. 47': 'Permis de plecare; pilotul se solicită după finalizarea formalităților.',
    'Art. 48': 'Plecarea este interzisă dacă nava/echipajul nu îndeplinesc condițiile de siguranță sau există cerere de reținere.',
    'Art. 64': 'Buletinul de pilotaj online și ședința zilnică CCMN (09:00–10:00).',
    'Art. 101': 'Operarea navelor cu mărfuri periculoase: limite de vânt, împământare, fire wire (≥ 20.000 tdw).',
    'Art. 102': 'Terminale petroliere, baraje antipoluare, certificat „gas free”.',
    'Art. 123': 'Pilotajul și remorcajul de manevră sunt servicii de siguranță.',
    'Art. 124': 'Pilotaj obligatoriu în portul Constanța: intrare/ieșire, tranzit, manevre între dane; tragere pe parâme > LOA/2.',
    'Art. 125': 'Navele din zona de control al traficului respectă indicațiile ANR prin VTS.',
    'Art. 126': 'Remorcaj de manevră obligatoriu: tabel pe LOA/pescaj, scutiri, PGM, nave de pasageri, Midia/Mangalia.',
    'Art. 127': 'Pilotajul este serviciu de siguranță obligatoriu; categorii exceptate; tragerea pe parâme.',
    'Art. 128': 'Ambarcarea pilotului, schimb de informații, schița manevrei.',
    'Art. 129': 'Solicitarea pilotului prin buletin; măsurile operatorilor; nava gata de manevră.',
    'Art. 130': 'Piloții cunosc adâncimile; rezervă minimă sub chilă; nicio altă navă nu se apropie de nava în manevră.',
    'Art. 131': 'Începutul și sfârșitul manevrei de sosire/plecare.',
    'Art. 132': 'Obligațiile pilotului; comandantul rămâne responsabil de manevră.',
    'Art. 133': 'Evidența manevrelor (registru 5 ani) și raportarea evenimentelor.',
    'Art. 134': 'Remorcajul de manevră este serviciu de siguranță obligatoriu.',
    'Art. 135': 'Remorchere cu documente și certificat de bollard pull valabile.',
    'Art. 136': 'Remorcherele execută ordinele comandantului; tragere pe parâme; interdicție remorchere cu un singur motor/elice/cârmă.',
    'Art. 137': 'Parâme de remorcă cu certificat de rezistență.',
    'Art. 138': 'Manevra de împingere: locul stabilit de comandant.',
    'Art. 139': 'Remorcherele părăsesc nava numai după acostare și cu acordul comandantului.',
    'Art. 140': 'Căpitanul șef de port poate cere întreruperea remorcajului în anumite situații.',
  };

  /* ------------------------------------------------------------------ */
  /* Utilitare                                                           */
  /* ------------------------------------------------------------------ */

  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (v === null || v === undefined) return null;
    const s = String(v).trim().replace(',', '.');
    if (s === '') return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  function bool(v) {
    return v === true || v === 'da' || v === 'true' || v === 'on' || v === 1 || v === '1';
  }

  function tri(v) {
    if (v === true || v === 'da') return 'da';
    if (v === false || v === 'nu') return 'nu';
    return '?';
  }

  function nrDana(v) {
    if (v === null || v === undefined) return null;
    const m = String(v).match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  function parseRemorchere(v) {
    const arr = Array.isArray(v) ? v : [];
    return arr
      .map(num)
      .filter((x) => x !== null && x > 0)
      .sort((a, b) => b - a);
  }

  function fmt(n) {
    if (n === null || n === undefined) return '–';
    return (Math.round(n * 100) / 100).toString().replace('.', ',');
  }

  function beaufort(kt) {
    const limite = [0.5, 3.5, 6.5, 10.5, 16.5, 21.5, 27.5, 33.5, 40.5, 47.5, 55.5, 63.5];
    for (let i = 0; i < limite.length; i++) if (kt <= limite[i]) return i;
    return 12;
  }

  /** Tabelul Art. 126 alin. (2): cerința minimă de remorchere (tracțiune la cârlig, tf). */
  function tabelRemorcaj(loa, pescaj) {
    if (loa > 240 || pescaj > 15) {
      return { lit: 'g', req: [40, 40, 20, 20], art: 'Art. 126 alin. (2) lit. g)', criteriu: loa > 240 ? 'LOA > 240 m' : 'pescaj > 15 m' };
    }
    if (loa > 200) return { lit: 'f', req: [40, 20, 20], art: 'Art. 126 alin. (2) lit. f)', criteriu: '200 m < LOA ≤ 240 m' };
    if (loa > 175) return { lit: 'e', req: [20, 20, 10], art: 'Art. 126 alin. (2) lit. e)', criteriu: '175 m < LOA ≤ 200 m' };
    if (loa > 150) return { lit: 'd', req: [20, 10], art: 'Art. 126 alin. (2) lit. d)', criteriu: '150 m < LOA ≤ 175 m' };
    if (loa > 120) return { lit: 'c', req: [10, 5], art: 'Art. 126 alin. (2) lit. c)', criteriu: '120 m < LOA ≤ 150 m' };
    return { lit: 'a/b', req: [5], art: 'Art. 126 alin. (2) lit. a), b)', criteriu: 'LOA ≤ 120 m' };
  }

  /** Remorcherele disponibile acoperă cerința? (ambele liste, în tf) */
  function acopera(disp, req) {
    const d = [...disp].sort((a, b) => b - a);
    const r = [...req].sort((a, b) => b - a);
    if (d.length < r.length) return false;
    return r.every((v, i) => d[i] >= v);
  }

  function descrieCerinta(req) {
    if (!req.length) return 'niciun remorcher impus';
    const grup = {};
    req.forEach((v) => (grup[v] = (grup[v] || 0) + 1));
    const parti = Object.keys(grup)
      .map(Number)
      .sort((a, b) => b - a)
      .map((v) => (v > 0 ? `${grup[v]} × min. ${fmt(v)} tf` : `${grup[v]} × remorcher (fără tracțiune impusă)`));
    return `${req.length} remorchere: ${parti.join(' + ')}`;
  }

  function descrieDisponibil(disp) {
    return disp.length ? `${disp.length} remorchere (${disp.map((v) => fmt(v) + ' tf').join(', ')})` : 'niciun remorcher introdus';
  }

  /* ------------------------------------------------------------------ */
  /* Normalizarea datelor de intrare                                     */
  /* ------------------------------------------------------------------ */

  function normalize(raw) {
    raw = raw || {};
    const a = raw.admin || {};
    const adm = {};
    ADMIN_CHECKS.forEach((c) => (adm[c.id] = tri(a[c.id] !== undefined ? a[c.id] : raw[c.id])));
    const sit = {};
    Object.keys(SITUATII_ART38).forEach((k) => (sit[k] = bool(raw[k])));
    return {
      zona: ZONE[raw.zona] ? raw.zona : 'constanta',
      tipNava: raw.tipNava || '',
      manevra: raw.manevra || '',
      loa: num(raw.loa),
      pescaj: num(raw.pescaj),
      trn: num(raw.trn),
      dwt: num(raw.dwt),
      propulsoare: bool(raw.propulsoareTransversale),
      marfaPericuloasa: bool(raw.marfaPericuloasa),
      propulsata: raw.propulsata === undefined ? true : bool(raw.propulsata),
      ofiteriBrevetati: tri(raw.ofiteriBrevetati),
      noapte: raw.ziNoapte === 'noapte',
      dana: nrDana(raw.dana),
      danaText: String(raw.dana === undefined || raw.dana === null ? '' : raw.dana).trim(),
      danaFundBazin: bool(raw.danaFundBazin),
      dana79Tanc: bool(raw.dana79Tanc),
      danaCapatMol: bool(raw.danaCapatMol),
      lungimeDana: num(raw.lungimeDana),
      distantaTragere: num(raw.distantaTragere),
      adancime: num(raw.adancime),
      vant: num(raw.vant),
      vizibilitate: bool(raw.vizibilitateAfectata),
      hidroNefav: bool(raw.hidrometeoNefavorabile),
      spatiu: tri(raw.spatiuSuficient),
      pilot: tri(raw.pilot),
      remorchere: parseRemorchere(raw.remorchere),
      remorcherUnMotor: tri(raw.remorcherUnMotor),
      scutHidro: tri(raw.scutHidro),
      scutComandant: tri(raw.scutComandant),
      aprobareANRRemorcaj: tri(raw.aprobareANRRemorcaj),
      aprobareCapSef: tri(raw.aprobareCapSef),
      autorizareSpeciala: tri(raw.autorizareSpeciala),
      verificaOperare: bool(raw.verificaOperare),
      directieVant: raw.directieVant || '',
      descarcariElectrice: tri(raw.descarcariElectrice),
      impamantare: tri(raw.impamantare),
      fireWire: tri(raw.fireWire),
      admin: adm,
      sit,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Evaluarea                                                           */
  /* ------------------------------------------------------------------ */

  const CATEGORII = {
    general: 'Date și observații generale',
    pilotaj: 'Pilotaj',
    remorcaj: 'Remorcaj',
    meteo: 'Program, vânt și vizibilitate',
    dana: 'Dană și acostare',
    formalitati: 'Formalități și documente',
    operare: 'Operare la dană (mărfuri periculoase)',
    info: 'Obligații pe durata manevrei',
  };
  const ORDINE_CATEGORII = ['general', 'pilotaj', 'remorcaj', 'meteo', 'dana', 'formalitati', 'operare', 'info'];

  // status: ok | fail | warn | todo | info
  function evaluate(raw) {
    const inp = normalize(raw);
    const nava = NAVE[inp.tipNava] || null;
    const man = MANEVRE[inp.manevra] ? inp.manevra : null;
    const items = [];
    const add = (cat, status, titlu, mesaj, art) =>
      items.push({ cat, status, titlu, mesaj: mesaj || '', art: art || [] });

    const cerinte = { pilotaj: null, remorcaj: null };
    const ctx = { pilotOb: null, areRemorchere: inp.remorchere.length > 0, tanc: !!(nava && nava.tanc) };

    /* ---------- date minime ---------- */
    const lipsa = [];
    if (!nava) lipsa.push('tipul navei');
    if (!man) lipsa.push('tipul manevrei');
    if (inp.loa === null || inp.loa <= 0) lipsa.push('lungimea maximă (LOA)');
    if (inp.pescaj === null || inp.pescaj <= 0) lipsa.push('pescajul');
    if (lipsa.length) {
      add('general', 'warn', 'Date incomplete', `Completați: ${lipsa.join(', ')}. Verificările care depind de aceste date nu pot fi făcute.`);
    }
    if (!nava || !man) return finish(inp, items, cerinte, lipsa);

    const periculoasa = !!nava.periculoasa || inp.marfaPericuloasa;
    const loa = inp.loa > 0 ? inp.loa : null;
    const pescaj = inp.pescaj > 0 ? inp.pescaj : null;
    const intrareIesire = ENTRY_EXIT.includes(man);
    const sosire = ARRIVAL.includes(man);
    const plecare = DEPARTURE.includes(man);
    const tehnica = !!nava.tehnica;

    if (inp.zona === 'alt') {
      add('general', 'warn', 'Alt port / altă zonă',
        'Art. 124, 126 și 34 sunt formulate pentru portul Constanța (zonele Constanța, Midia și Mangalia). ' +
        'Pentru Basarabi, Tomis sau alte zone aplicați Art. 127 alin. (1) (pilotaj obligatoriu în porturi) și dispozițiile ANR; ' +
        'cerințele numerice de remorcaj și limitele de vânt nu pot fi verificate automat.',
        ['Art. 124', 'Art. 35 alin. (2)']);
    }

    /* ---------- PILOTAJ ---------- */
    const P = pilotaj(inp, nava, loa);
    ctx.pilotOb = P.ob;
    cerinte.pilotaj = P.ob === true ? 'Obligatoriu' : P.ob === false ? 'Neobligatoriu' : 'De stabilit';

    if (P.ob === true) {
      if (inp.pilot === 'da') add('pilotaj', 'ok', 'Pilotaj obligatoriu – asigurat', `${P.motiv} Pilotul este solicitat/asigurat.`, P.art);
      else if (inp.pilot === 'nu') add('pilotaj', 'fail', 'Pilotaj obligatoriu – lipsește', `${P.motiv} Manevra nu poate fi efectuată fără pilot la bord.`, P.art);
      else add('pilotaj', 'todo', 'Pilotaj obligatoriu – de confirmat', `${P.motiv} Solicitați pilotul prin buletinul de pilotaj.`, P.art);
    } else if (P.ob === false) {
      add('pilotaj', 'ok', 'Pilotajul nu este obligatoriu', P.motiv, P.art);
    } else {
      add('pilotaj', 'warn', 'Pilotaj – date insuficiente', P.motiv, P.art);
    }

    if (nava.g === 'fluviala') {
      if (inp.propulsata) {
        if (inp.ofiteriBrevetati === 'da') {
          add('pilotaj', 'ok', 'Navă fluvială propulsată – ofițeri brevetați la bord', 'Are la bord ofițeri de navigație cu brevet maritim-portuar sau de căpitan fluvial A.', ['Art. 20 alin. (2)']);
        } else if (inp.ofiteriBrevetati === 'nu') {
          if (inp.pilot === 'da') add('pilotaj', 'ok', 'Navă fluvială fără ofițeri brevetați – cu pilot', 'Manevra se poate executa cu pilot maritim la bord sau căpitan maritim portuar.', ['Art. 20 alin. (2)']);
          else add('pilotaj', 'fail', 'Navă fluvială fără ofițeri brevetați – fără pilot', 'Fără ofițeri brevetați la bord, manevra se poate executa numai cu pilot maritim sau căpitan maritim portuar la bord.', ['Art. 20 alin. (2)']);
        } else {
          add('pilotaj', 'todo', 'Navă fluvială propulsată – verificați brevetele', 'Dacă nu are la bord ofițeri cu brevet maritim-portuar sau de căpitan fluvial A, manevra necesită pilot maritim sau căpitan maritim portuar.', ['Art. 20 alin. (2)']);
        }
      } else {
        add('pilotaj', 'info', 'Navă fluvială nepropulsată', 'Manevra intră în responsabilitatea comandantului remorcherului/împingătorului care o manevrează; la staționare, în responsabilitatea proprietarului/operatorului.', ['Art. 20 alin. (2)']);
      }
    }

    /* ---------- REMORCAJ ---------- */
    const disp = inp.remorchere;
    const scutPosibila = (inp.propulsoare || man === 'tragere') && !(periculoasa && inp.tipNava !== 'container');
    const scutConfirmata = inp.scutHidro === 'da' && inp.scutComandant === 'da';
    const pescajMare = pescaj !== null && pescaj > 12.5;
    let remorcajPrelucrat = false;

    function verificaMin1Art19(titluDeja) {
      if (!pescajMare) return;
      if (disp.length >= 1) add('remorcaj', 'ok', 'Pescaj > 12,5 m – remorcher în asistență', `Pescaj ${fmt(pescaj)} m: cel puțin un remorcher este în asistență.`, ['Art. 19 alin. (3)']);
      else add('remorcaj', 'fail', 'Pescaj > 12,5 m – lipsește remorcherul în asistență', `Pescaj ${fmt(pescaj)} m: pe durata manevrei navele trebuie să aibă în asistență minim un remorcher dintre cele desemnate (se aplică și când Art. 126 alin. (3) permite scutirea).`, ['Art. 19 alin. (3)']);
    }

    if (P.ob !== true) {
      // Art. 126 alin. (1) condiționează remorcajul obligatoriu de pilotajul obligatoriu.
      cerinte.remorcaj = 'Nu este impus de Art. 126 (pilotajul nu este obligatoriu)';
      const extra = man === 'tragere'
        ? ' Comandantul poate solicita asistența pilotului și a remorcherelor și pentru distanțe ≤ LOA/2.'
        : ' Comandantul poate solicita remorchere suplimentar, după condițiile hidrometeorologice.';
      add('remorcaj', 'info', 'Remorcaj – nu este impus de Art. 126',
        'Art. 126 alin. (1) impune remorcajul de manevră în cazurile în care pilotajul este obligatoriu.' + extra,
        ['Art. 126 alin. (1)', 'Art. 126 alin. (5)', 'Art. 136 alin. (2), (3)']);
      remorcajPrelucrat = true;
    } else if (man === 'tranzit') {
      cerinte.remorcaj = 'Art. 126 nu enumeră tranzitul – stabilit de comandant și pilot';
      add('remorcaj', 'info', 'Remorcaj la tranzit – nu este enumerat în Art. 126',
        'Art. 126 alin. (1) enumeră intrarea, ieșirea, mutarea, schimbarea liniei de acostare și tragerea pe parâme. Pentru tranzit, necesarul se stabilește de comandant împreună cu pilotul.',
        ['Art. 126 alin. (1)', 'Art. 126 alin. (5)']);
      remorcajPrelucrat = true;
    } else if (inp.zona !== 'constanta' && inp.zona !== 'alt' && inp.hidroNefav) {
      cerinte.remorcaj = 'Stabilit de comandant și pilot, cu aprobarea ANR/Căpitanului Șef';
      if (inp.aprobareANRRemorcaj === 'da') add('remorcaj', 'ok', `Remorcaj în ${ZONE[inp.zona]} – condiții nefavorabile, aprobat`, 'Necesarul a fost stabilit de comandant și pilot cu aprobarea ANR / Căpitanului Șef de Port și cu înștiințarea administrației portuare.', ['Art. 126 alin. (9)']);
      else if (inp.aprobareANRRemorcaj === 'nu') add('remorcaj', 'fail', `Remorcaj în ${ZONE[inp.zona]} – fără aprobare`, 'În condiții hidrometeorologice nefavorabile, necesarul de remorcare în zonele Midia și Mangalia se stabilește de comandant și pilot cu aprobarea ANR / Căpitanului Șef de Port.', ['Art. 126 alin. (9)']);
      else add('remorcaj', 'todo', `Remorcaj în ${ZONE[inp.zona]} – condiții nefavorabile`, 'Necesarul de remorcare se stabilește de comandant și pilot cu aprobarea ANR / Căpitanului Șef de Port și cu înștiințarea administrației portuare.', ['Art. 126 alin. (9)']);
      remorcajPrelucrat = true;
    } else if (nava.pasageri && inp.propulsoare && man !== 'plecare_pgm') {
      cerinte.remorcaj = 'Stabilit de comandant (nave de pasageri / RO-RO pasageri cu propulsoare transversale)';
      add('remorcaj', 'ok', 'Remorcaj – stabilit de comandant',
        'Pentru navele de pasageri și RO-RO de pasageri cu propulsoare transversale funcționale, necesitatea și numărul remorcherelor se stabilesc de comandant, după consultarea pilotului și cu informarea prealabilă a ANR/VTS/Căpităniei de Port.',
        ['Art. 126 alin. (8)']);
      remorcajPrelucrat = true;
    } else if (man === 'plecare_pgm') {
      const req = [20];
      cerinte.remorcaj = 'Min. 1 remorcher cu tracțiune ≥ 20 tf (numărul îl stabilește comandantul)';
      if (acopera(disp, req)) add('remorcaj', 'ok', 'Plecare de la PGM – remorcher ≥ 20 tf', `Disponibil: ${descrieDisponibil(disp)}. Numărul total de remorchere îl stabilește comandantul, după consultarea pilotului.`, ['Art. 126 alin. (7)']);
      else add('remorcaj', 'fail', 'Plecare de la PGM – remorcher insuficient', `Se impune cel puțin un remorcher cu tracțiune la cârlig ≥ 20 tf. Disponibil: ${descrieDisponibil(disp)}.`, ['Art. 126 alin. (7)']);
      remorcajPrelucrat = true;
    } else if (loa === null || pescaj === null) {
      cerinte.remorcaj = 'De calculat (completați LOA și pescaj)';
      add('remorcaj', 'warn', 'Remorcaj – date insuficiente', 'Completați LOA și pescajul pentru a determina cerința din tabelul Art. 126 alin. (2).', ['Art. 126 alin. (2)']);
      remorcajPrelucrat = true;
    } else {
      const tab = tabelRemorcaj(loa, pescaj);
      let req = tab.req;
      cerinte.remorcaj = descrieCerinta(req);
      const note = [];
      if (inp.trn !== null && inp.trn < 1000 && loa > 120) {
        note.push(`TRN ${fmt(inp.trn)} < 1000 cu LOA > 120 m: lit. a) ar impune doar un remorcher de 5 tf, dar tabelul pe lungime (lit. c–g) este mai restrictiv; s-a aplicat varianta mai restrictivă.`);
      }
      const baza = `Cerință ${tab.art} (${tab.criteriu}): ${descrieCerinta(req)}. Disponibil: ${descrieDisponibil(disp)}.`;
      const notaTxt = note.length ? ' ' + note.join(' ') : '';
      const titlu = `Remorcaj obligatoriu – ${descrieCerinta(req)}`;

      if (acopera(disp, req)) {
        add('remorcaj', 'ok', titlu, baza + notaTxt + ' Cerința este îndeplinită.', [tab.art, 'Art. 126 alin. (1)']);
      } else if (scutPosibila && scutConfirmata) {
        if (man === 'tragere') {
          cerinte.remorcaj += ' – sau stabilit de comandant (scutire Art. 126 alin. (3), (6))';
          if (pescajMare && disp.length < 1) {
            add('remorcaj', 'fail', 'Remorcaj la tragere pe parâme – insuficient', `Scutirea din Art. 126 alin. (3) este confirmată, dar la pescaj > 12,5 m rămâne obligatoriu cel puțin un remorcher în asistență (Art. 19 alin. (3)).`, ['Art. 126 alin. (3), (6)', 'Art. 19 alin. (3)']);
          } else {
            add('remorcaj', 'ok', 'Tragere pe parâme – numărul de remorchere stabilit de comandant', `Cu condiții hidrometeorologice favorabile, decizia comandantului după consultarea pilotului și informarea prealabilă a ANR/VTS/Căpităniei, numărul de remorchere îl stabilește comandantul. ${baza}`, ['Art. 126 alin. (3), (6)']);
          }
        } else {
          let redus = [...req].sort((a, b) => b - a).slice(0, -1);
          if (pescajMare && redus.length === 0) redus = [0];
          cerinte.remorcaj += ` – cu scutire Art. 126 alin. (3): ${descrieCerinta(redus)}`;
          if (acopera(disp, redus)) {
            add('remorcaj', 'warn', 'Remorcaj – cu scutire de un remorcher (Art. 126 alin. (3))',
              `${baza} Cerința nu este îndeplinită integral, dar scutirea de un remorcher este posibilă (propulsoare transversale funcționale, condiții hidrometeorologice favorabile, decizie a comandantului după consultarea pilotului, informare prealabilă ANR/VTS/Căpitănie): necesar redus = ${descrieCerinta(redus)}. Interpretare: s-a scutit remorcherul cu cea mai mică tracțiune.`,
              ['Art. 126 alin. (3)', 'Art. 126 alin. (4)']);
          } else {
            add('remorcaj', 'fail', titlu + ' – insuficient',
              `${baza} Chiar și cu scutirea de un remorcher (Art. 126 alin. (3)) ar fi necesar: ${descrieCerinta(redus)}.`,
              [tab.art, 'Art. 126 alin. (3)']);
          }
        }
      } else {
        let hint = '';
        if (scutPosibila) {
          hint = ' Scutirea de un remorcher (Art. 126 alin. (3)) ar putea fi aplicabilă, dar nu au fost confirmate condițiile hidrometeorologice favorabile și decizia comandantului cu informarea prealabilă a ANR/VTS/Căpitănie.';
        } else if ((inp.propulsoare || man === 'tragere') && periculoasa) {
          hint = ' Scutirea din Art. 126 alin. (3) nu se aplică navelor care transportă produse petroliere sau mărfuri periculoase (altele decât portcontainerele) – Art. 126 alin. (4).';
        }
        add('remorcaj', 'fail', titlu + ' – insuficient',
          baza + notaTxt + ' Cerința nu este îndeplinită.' + (disp.length ? '' : ' (Dacă remorcherele nu au fost încă introduse, completați tracțiunea la cârlig în secțiunea „Remorcaj”.)') + hint,
          [tab.art, 'Art. 126 alin. (1)']);
      }
      remorcajPrelucrat = true;
    }

    if (remorcajPrelucrat) verificaMin1Art19();

    if (disp.length > 0) {
      if (inp.remorcherUnMotor === 'da') {
        add('remorcaj', 'fail', 'Remorcher cu un singur motor, o cârmă și o elice', 'Este interzisă folosirea la manevră a remorcherelor dotate doar cu un motor principal, o cârmă și o elice, chiar dacă au bowthruster.', ['Art. 136 alin. (4)']);
      } else if (inp.remorcherUnMotor === 'nu') {
        add('remorcaj', 'ok', 'Tipul remorcherelor', 'Remorcherele nu sunt de tipul interzis (un motor principal, o cârmă, o elice).', ['Art. 136 alin. (4)']);
      } else {
        add('remorcaj', 'todo', 'Tipul remorcherelor – de confirmat', 'Confirmați că niciun remorcher nu este dotat doar cu un motor principal, o cârmă și o elice.', ['Art. 136 alin. (4)']);
      }
    }

    /* ---------- PROGRAM, VÂNT, VIZIBILITATE ---------- */
    const dana = inp.dana;
    let restrictieZiNoapte = false;

    // Art. 34 alin. (2) lit. a)
    if (inp.noapte && ['sosire', 'plecare', 'mutare'].includes(man) && pescaj !== null && pescaj > 16) {
      const danaVizata = dana !== null && [80, 81, 82].includes(dana);
      if (danaVizata && inp.dana79Tanc) {
        const exact = man !== 'mutare';
        add('meteo', exact ? 'fail' : 'warn',
          exact ? 'INTERZIS: manevră de noapte, pescaj > 16 m, dana 80/81/82, tanc petrolier la dana 79' : 'Mutare de noapte spre/dinspre dana 80/81/82 cu tanc petrolier la dana 79',
          `Pescaj ${fmt(pescaj)} m > 16 m, dana ${dana}, în dana 79 se operează un tanc petrolier. ` +
          (exact ? 'Manevrele de intrare/ieșire de noapte sunt interzise în această configurație.' : 'Interdicția vizează expres manevrele de intrare/ieșire; pentru mutare confirmați cu VTS/Căpitănia de Port.'),
          ['Art. 34 alin. (2) lit. a)']);
        restrictieZiNoapte = true;
      } else if (dana === null) {
        add('meteo', 'warn', 'Verificați dana (Art. 34 alin. (2) lit. a))', 'Pescaj > 16 m, manevră de noapte: introduceți dana — manevrele de intrare/ieșire în danele 80, 81, 82 sunt interzise dacă în dana 79 se operează un tanc petrolier.', ['Art. 34 alin. (2) lit. a)']);
        restrictieZiNoapte = true;
      } else if (danaVizata) {
        add('meteo', 'ok', 'Dana 80/81/82 – dana 79 liberă de tanc petrolier', `Pescaj ${fmt(pescaj)} m > 16 m și dana ${dana}, dar în dana 79 nu se operează un tanc petrolier – interdicția nu se aplică.`, ['Art. 34 alin. (2) lit. a)']);
        restrictieZiNoapte = true;
      }
    }
    // Art. 34 alin. (2) lit. b)
    if (man === 'sosire_pgm' && inp.noapte) {
      add('meteo', 'fail', 'INTERZIS: sosire de noapte la PGM', 'Manevrele de sosire pe timp de noapte în zona PGM sunt interzise.', ['Art. 34 alin. (2) lit. b)']);
      restrictieZiNoapte = true;
    } else if (man === 'sosire_pgm') {
      add('meteo', 'ok', 'Sosire la PGM – în timpul zilei', 'Interdicția din Art. 34 alin. (2) lit. b) vizează doar sosirea pe timp de noapte.', ['Art. 34 alin. (2) lit. b)']);
      restrictieZiNoapte = true;
    }
    // Art. 34 alin. (2) lit. c)
    if (nava.structura && intrareIesire) {
      if (inp.noapte) add('meteo', 'fail', 'INTERZIS: intrare/ieșire de noapte pentru structuri mobile agabaritice', 'Manevrele de intrare/ieșire pe timp de noapte ale platformelor de foraj, macaralelor plutitoare de mari dimensiuni și ale corpurilor de navă fără propulsie sunt interzise.', ['Art. 34 alin. (2) lit. c)']);
      else add('meteo', 'ok', 'Structură agabaritică – manevră în timpul zilei', 'Interdicția de noapte din Art. 34 alin. (2) lit. c) nu se aplică în timpul zilei.', ['Art. 34 alin. (2) lit. c)']);
      restrictieZiNoapte = true;
    }
    if (!restrictieZiNoapte && inp.zona !== 'alt') {
      add('meteo', 'ok', 'Program zi/noapte', `Manevrele sunt permise oricând, ziua și noaptea, în afara perioadelor de suspendare comunicate de ANR/VTS/Căpitănie; nicio interdicție specifică zi/noapte pentru configurația introdusă (${inp.noapte ? 'noapte' : 'zi'}).`, ['Art. 34 alin. (1)', 'Art. 127 alin. (5)']);
    }

    // Art. 34 alin. (2) lit. d) – docuri
    if (man === 'doc_santier') {
      if (inp.vant === null) {
        add('meteo', 'warn', 'Doc de șantier – introduceți vântul', 'La docurile plutitoare și uscate manevrele sunt interzise dacă vântul depășește 13 Nd și nu există spațiu suficient în vecinătate.', ['Art. 34 alin. (2) lit. d)']);
      } else if (inp.vant > 13) {
        if (inp.spatiu === 'nu') add('meteo', 'fail', 'INTERZIS: doc de șantier, vânt > 13 Nd, spațiu insuficient', `Vânt ${fmt(inp.vant)} Nd > 13 Nd (de la travers, înaintea sau înapoia traversului) și nu există spațiu suficient în vecinătate.`, ['Art. 34 alin. (2) lit. d)']);
        else if (inp.spatiu === 'da') add('meteo', 'ok', 'Doc de șantier – vânt > 13 Nd, dar există spațiu suficient', `Vânt ${fmt(inp.vant)} Nd > 13 Nd; interdicția se aplică doar cumulativ cu lipsa spațiului suficient în vecinătate, care este confirmat.`, ['Art. 34 alin. (2) lit. d)']);
        else add('meteo', 'warn', 'Doc de șantier – vânt > 13 Nd, confirmați spațiul', `Vânt ${fmt(inp.vant)} Nd > 13 Nd: manevra este interzisă dacă nu există spațiu suficient în vecinătate. Confirmați spațiul disponibil.`, ['Art. 34 alin. (2) lit. d)']);
      } else {
        add('meteo', 'ok', 'Doc de șantier – vânt ≤ 13 Nd', `Vânt ${fmt(inp.vant)} Nd ≤ 13 Nd.`, ['Art. 34 alin. (2) lit. d)']);
      }
    }

    // Art. 34 alin. (3), (4), (6) – vânt
    const prag = inp.zona === 'constanta' ? 30 : inp.zona === 'alt' ? null : 22;
    if (inp.vant === null) {
      add('meteo', 'todo', 'Vânt – de introdus', 'Introduceți viteza medie a vântului din ultimele 10 minute pentru a verifica limitele de suspendare (30 Nd Constanța; 22 Nd Midia/Mangalia).', ['Art. 34 alin. (3)']);
    } else if (tehnica) {
      add('meteo', 'ok', 'Vânt – navă tehnică', 'Decizia de suspendare a manevrelor din cauza vântului nu afectează manevrele navelor tehnice care intră/ies sau se deplasează separat în interiorul portului.', ['Art. 34 alin. (4)']);
    } else if (prag === null) {
      add('meteo', 'warn', 'Vânt – limita nu se poate verifica', `Vânt ${fmt(inp.vant)} Nd. Limitele din Art. 34 alin. (3) sunt definite pentru zonele Constanța, Midia și Mangalia.`, ['Art. 34 alin. (3)']);
    } else if (inp.vant > prag) {
      if (plecare && inp.aprobareCapSef === 'da') {
        add('meteo', 'warn', 'Vânt peste limită – plecare aprobată excepțional', `Vânt mediu ${fmt(inp.vant)} Nd > ${prag} Nd (${ZONE[inp.zona]}). Plecarea a fost aprobată de Căpitanul Șef la solicitarea comandantului, după analiza cu pilotul și compania de remorcaj.`, ['Art. 34 alin. (3)', 'Art. 34 alin. (6)']);
      } else {
        const sugestie = plecare ? ' Plecarea poate fi aprobată excepțional de Căpitanul Șef, la solicitarea comandantului, după o analiză comună cu pilotul și compania de remorcaj (bifați aprobarea dacă o aveți).' : '';
        add('meteo', 'fail', `Manevre suspendate: vânt ${fmt(inp.vant)} Nd > ${prag} Nd`, `Viteza medie a vântului din ultimele 10 minute în zona ${ZONE[inp.zona]} depășește ${prag} Nd – Căpitănia de Port (direct sau prin VTS) suspendă manevrele navelor.${sugestie}`, ['Art. 34 alin. (3)', 'Art. 34 alin. (6)']);
      }
    } else {
      add('meteo', 'ok', `Vânt sub limita de suspendare (${prag} Nd)`, `Vânt mediu ${fmt(inp.vant)} Nd ≤ ${prag} Nd (${ZONE[inp.zona]}).`, ['Art. 34 alin. (3)']);
    }
    // vizibilitate
    if (inp.vizibilitate) {
      if (tehnica) add('meteo', 'warn', 'Vizibilitate redusă – navă tehnică', 'Căpitănia de Port poate suspenda și manevrele navelor tehnice când vizibilitatea afectează desfășurarea manevrelor în siguranță.', ['Art. 34 alin. (5)']);
      else add('meteo', 'fail', 'Manevre suspendate: vizibilitate redusă', 'Vizibilitatea afectează desfășurarea manevrelor în siguranță – Căpitănia de Port suspendă manevrele.', ['Art. 34 alin. (3)']);
    }
    if (inp.hidroNefav) {
      add('meteo', 'info', 'Condiții hidrometeorologice nefavorabile', 'Ambarcarea/debarcarea pilotului se poate face, cu aprobarea VTS/Căpităniei de Port, la adăpostul digurilor; pilotina monitorizează nava. Comandantul poate solicita remorchere suplimentare.', ['Art. 128 alin. (3)', 'Art. 126 alin. (5)']);
    }

    /* ---------- DANĂ ȘI ACOSTARE ---------- */
    if (inp.danaFundBazin) {
      add('dana', 'info', 'Dană de fund de bazin', 'Manevrele de acostare/plecare în/din danele fund de bazin au prioritate față de cele din danele limitrofe (fără a afecta prioritatea navelor de linie, Art. 40 alin. (4)). Operatorii furnizează în timp util caracteristicile navelor (lungime, lățime, pescaj maxim) și ETA/ETD.', ['Art. 43 alin. (11), (12)']);
    }
    if (dana !== null && [77, 78, 89, 90].includes(dana) && (tehnica || nava.g === 'fluviala')) {
      add('dana', 'info', `Viteză maximă 6 Nd în dreptul danei ${dana}`, 'Viteza navelor tehnice și fluviale în dreptul danelor 77, 78, 89 și 90 nu va depăși 6 Nd (cu excepția navelor de intervenție care pleacă în misiune).', ['Art. 36']);
    }
    if (loa !== null && inp.lungimeDana !== null && inp.lungimeDana > 0 && man !== 'sosire_pgm' && man !== 'plecare_pgm' && man !== 'tranzit') {
      const L = inp.lungimeDana;
      if (loa <= L) {
        const liber = L - loa;
        const necesar = 0.2 * loa;
        if (['sosire', 'mutare', 'schimbare_linie'].includes(man)) {
          if (liber + 1e-9 >= necesar) add('dana', 'ok', 'Spațiu liber la extremitățile navei', `Dana ${fmt(L)} m, LOA ${fmt(loa)} m: rămân ${fmt(liber)} m liberi (≥ ${fmt(necesar)} m = 10% din LOA la prova și la pupa).`, ['Art. 129 alin. (2) lit. a)']);
          else add('dana', 'warn', 'Spațiu liber sub 10% din LOA la extremități', `Dana ${fmt(L)} m, LOA ${fmt(loa)} m: rămân ${fmt(liber)} m liberi, sub ${fmt(necesar)} m (10% din LOA la prova și la pupa), cât se cere pentru poziționarea navei la cheu. Verificați cu operatorul portuar și serviciul de pilotaj.`, ['Art. 129 alin. (2) lit. a)']);
        }
      } else {
        const total = loa - L;
        const limitaMica = inp.danaCapatMol ? loa / 15 : loa <= 100 ? loa / 10 : Math.min(10, loa / 15);
        const limitaMare = inp.danaCapatMol ? loa / 15 : loa <= 100 ? loa / 10 : Math.max(10, loa / 15);
        const perCapat = total / 2;
        const baza = `LOA ${fmt(loa)} m > dana ${fmt(L)} m: depășire totală ${fmt(total)} m (${fmt(perCapat)} m la fiecare capăt dacă este repartizată egal). Limită pe extremitate: ${limitaMica === limitaMare ? fmt(limitaMica) + ' m' : 'între ' + fmt(limitaMica) + ' și ' + fmt(limitaMare) + ' m (formularea „10 m sau cel mult 1/15 din LOA” este ambiguă)'}${inp.danaCapatMol ? ' (dană de capăt de mol: 1/15 din LOA la fiecare capăt)' : loa <= 100 ? ' (1/10 din LOA)' : ''}.`;
        if (perCapat > limitaMare + 1e-9) add('dana', 'fail', 'Depășire peste limita permisă a danei', baza + ' Depășirea este peste limita permisă chiar și repartizată egal la ambele extremități.', ['Art. 44 alin. (1), (2)']);
        else add('dana', 'warn', 'Depășire a limitelor danei – numai cu aprobare', baza + ' Acostarea este permisă numai cu aprobarea Căpităniei de Port; extremitatea care depășește dana se semnalizează corespunzător, ziua și noaptea.' + (perCapat > limitaMica + 1e-9 ? ' Atenție: valoarea depășește limita mai restrictivă.' : ''), ['Art. 44 alin. (1)–(3)']);
      }
    }
    if (inp.adancime !== null && pescaj !== null) {
      const ukc = inp.adancime - pescaj;
      if (ukc <= 0) add('dana', 'fail', 'Adâncime insuficientă', `Adâncime ${fmt(inp.adancime)} m, pescaj ${fmt(pescaj)} m: nu există rezervă sub chilă.`, ['Art. 130 alin. (1)']);
      else add('dana', 'info', 'Rezerva sub chilă', `Adâncime ${fmt(inp.adancime)} m − pescaj ${fmt(pescaj)} m = ${fmt(ukc)} m. Regulamentul impune o „rezervă minimă de siguranță” sub chilă (determinată și comunicată de administrația portuară), dar nu o cuantifică – confirmați valoarea cu serviciul de pilotaj.`, ['Art. 130 alin. (1)']);
    }

    /* ---------- FORMALITĂȚI ---------- */
    ctx.areRemorchere = disp.length > 0 || (ctx.pilotOb === true && man !== 'tranzit');
    ADMIN_CHECKS.forEach((c) => {
      if (!c.when(inp, ctx)) return;
      const v = inp.admin[c.id];
      const titlu = c.l.length > 90 ? c.l.slice(0, 87).replace(/[\s,;(]+\S*$/, '') + '…' : c.l;
      if (v === 'da') add('formalitati', 'ok', titlu, c.l, c.art);
      else if (v === 'nu') add('formalitati', 'fail', titlu, 'Neîndeplinit: ' + c.l, c.art);
      else add('formalitati', 'todo', titlu, 'De confirmat: ' + c.l, c.art);
    });

    if (sosire) {
      const active = Object.keys(inp.sit).filter((k) => inp.sit[k]);
      if (nava.nucleara) {
        active.push('__nucleara');
      }
      if (active.length) {
        const lista = active.map((k) => (k === '__nucleara' ? 'navă cu propulsie nucleară (Art. 38 alin. (2): aprobare, cu anunțarea datei/orei sosirii și a perioadei de staționare cu cel puțin 30 de zile înainte)' : `${SITUATII_ART38[k].l}${SITUATII_ART38[k].preaviz ? ' — ' + SITUATII_ART38[k].preaviz : ''}`));
        const artS = ['Art. 38 alin. (1)'];
        if (nava.nucleara) artS.push('Art. 38 alin. (2)');
        if (inp.autorizareSpeciala === 'da') add('formalitati', 'ok', 'Autorizare specială de intrare obținută', 'Situații Art. 38: ' + lista.join('; ') + '.', artS);
        else if (inp.autorizareSpeciala === 'nu') add('formalitati', 'fail', 'Intrare fără autorizare specială', 'Intrarea în port se face numai cu autorizarea specială și prealabilă a ANR (prin Căpitănia de Port) și/sau a administrației portuare. Situații: ' + lista.join('; ') + '.', artS);
        else add('formalitati', 'todo', 'Autorizare specială de intrare – de obținut', 'Intrarea în port se face numai cu autorizarea specială și prealabilă a ANR (prin Căpitănia de Port) și/sau a administrației portuare. Situații: ' + lista.join('; ') + '.', artS);
      }
    }

    /* ---------- OPERARE LA DANĂ (Art. 101) ---------- */
    if (inp.verificaOperare) {
      if (!periculoasa) {
        add('operare', 'info', 'Art. 101 – nu se aplică', 'Verificarea condițiilor de operare se aplică navelor care transportă mărfuri periculoase, produse petroliere, gaze lichefiate și produse chimice (bifați „Transportă produse petroliere / mărfuri periculoase”).', ['Art. 101 alin. (1)']);
      } else {
        const dirLabel = { dinspre_dana: 'dinspre postul de acostare', vest_est: 'de vest sau est (prova sau pupa)', sud: 'de sud' };
        const lim = { dinspre_dana: 4, vest_est: 6, sud: 5 }[inp.directieVant];
        if (inp.vant === null || !lim) {
          add('operare', 'todo', 'Condiții de vânt la operare – de verificat', 'Introduceți vântul și direcția lui față de dană: max. forța 4 dinspre postul de acostare; max. forța 6 de vest/est; max. forța 5 de sud (numai fără descărcări electrice în timpul ploii).', ['Art. 101 alin. (1)']);
        } else {
          const b = beaufort(inp.vant);
          if (b > lim) add('operare', 'fail', `Operare nepermisă: vânt forța ${b} ${dirLabel[inp.directieVant]}`, `Vânt ${fmt(inp.vant)} Nd = forța ${b} Beaufort; pentru vânt ${dirLabel[inp.directieVant]} operarea este permisă până la forța ${lim}.`, ['Art. 101 alin. (1)']);
          else if (inp.directieVant === 'sud') {
            if (inp.descarcariElectrice === 'nu') add('operare', 'ok', `Operare permisă: vânt de sud forța ${b}`, `Forța ${b} ≤ 5 și fără descărcări electrice în atmosferă.`, ['Art. 101 alin. (1)']);
            else if (inp.descarcariElectrice === 'da') add('operare', 'fail', 'Operare nepermisă: descărcări electrice', 'Pe vânt de sud, operarea este permisă numai când în timpul ploii nu există descărcări electrice în atmosferă.', ['Art. 101 alin. (1)']);
            else add('operare', 'todo', 'Vânt de sud – confirmați lipsa descărcărilor electrice', `Forța ${b} ≤ 5, dar operarea este permisă numai dacă în timpul ploii nu există descărcări electrice.`, ['Art. 101 alin. (1)']);
          } else add('operare', 'ok', `Operare permisă: vânt forța ${b} ${dirLabel[inp.directieVant]}`, `Forța ${b} ≤ ${lim}.`, ['Art. 101 alin. (1)']);
        }
        if (inp.impamantare === 'da') add('operare', 'ok', 'Legătură de împământare cu uscatul', 'Navele cu mărfuri periculoase au legătura de împământare cu uscatul pe toată perioada operării.', ['Art. 101 alin. (2)']);
        else if (inp.impamantare === 'nu') add('operare', 'fail', 'Lipsește legătura de împământare', 'Pe toată perioada operării la dană, navele cu mărfuri periculoase vor avea legătura de împământare cu uscatul.', ['Art. 101 alin. (2)']);
        else add('operare', 'todo', 'Legătură de împământare – de confirmat', 'Pe toată perioada operării la dană, navele cu mărfuri periculoase vor avea legătura de împământare cu uscatul.', ['Art. 101 alin. (2)']);
        if (inp.dwt !== null && inp.dwt >= 20000) {
          if (inp.fireWire === 'da') add('operare', 'ok', 'Legături „fire wire” la prova și pupa', `Navă de ${fmt(inp.dwt)} tdw ≥ 20.000 tdw: legăturile „fire wire” sunt fixate în poziție, pregătite pentru remorcarea de urgență.`, ['Art. 101 alin. (3)']);
          else if (inp.fireWire === 'nu') add('operare', 'fail', 'Lipsesc legăturile „fire wire”', `Navă de ${fmt(inp.dwt)} tdw ≥ 20.000 tdw: pe toată perioada operării la dană trebuie să aibă legături/parâme „fire wire” fixate în poziție la prova și la pupa.`, ['Art. 101 alin. (3)']);
          else add('operare', 'todo', 'Legături „fire wire” – de confirmat', `Navă de ${fmt(inp.dwt)} tdw ≥ 20.000 tdw: se impun legături „fire wire” la prova și la pupa pe toată perioada operării.`, ['Art. 101 alin. (3)']);
        } else if (inp.dwt === null) {
          add('operare', 'info', 'Fire wire – introduceți tdw', 'Navele maritime de 20.000 tdw sau mai mari care transportă mărfuri periculoase trebuie să aibă legături „fire wire” la prova și la pupa.', ['Art. 101 alin. (3)']);
        }
      }
    }

    /* ---------- INFORMAȚII PE DURATA MANEVREI ---------- */
    add('info', 'info', 'Conformarea la indicațiile ANR / VTS', 'Navele din zona de control al traficului se conformează indicațiilor ANR prin VTS (locul și momentul ambarcării/debarcării pilotului, începerea manevrei). Suspendarea manevrelor este dispusă de ANR și comunicată prin VTS.', ['Art. 125', 'Art. 128 alin. (1)', 'Art. 127 alin. (5)']);
    if (P.ob === true) {
      add('info', 'info', 'Schimbul de informații comandant–pilot', 'Pilotul prezintă comandantului schița manevrei (traseu, adâncimi, poziția geamandurilor, număr/loc remorchere, tracțiune); copia semnată și ștampilată se arhivează 1 an. Comandantul rămâne responsabil de manevra navei, pilotul îl asistă.', ['Art. 128 alin. (4)', 'Art. 132 alin. (3)']);
      add('info', 'info', 'Începutul și sfârșitul manevrei', 'Manevra de sosire începe la urcarea pilotului și după acordul de efectuare; se încheie la asigurarea ultimei legături la cheu și eliberarea remorcherelor. Manevra de plecare se încheie la coborârea pilotului. Pe durata manevrei nu este permisă apropierea altor nave.', ['Art. 131', 'Art. 130 alin. (2)']);
    }
    if (disp.length > 0) {
      add('info', 'info', 'Remorchere', 'Remorcherele execută ordinele comandantului, direct sau prin pilot; părăsesc nava numai după acostare și legare în siguranță și cu acordul comandantului. Parâmele de remorcă sunt puse la dispoziție de navă sau de remorchere.', ['Art. 136 alin. (1)', 'Art. 137', 'Art. 139']);
    }

    return finish(inp, items, cerinte, lipsa);
  }

  /** Id-urile formalităților aplicabile configurației introduse (pentru interfață). */
  function adminAplicabile(raw) {
    const inp = normalize(raw);
    const nava = NAVE[inp.tipNava];
    if (!nava || !MANEVRE[inp.manevra]) return [];
    const loa = inp.loa > 0 ? inp.loa : null;
    const P = pilotaj(inp, nava, loa);
    const ctx = {
      pilotOb: P.ob,
      areRemorchere: inp.remorchere.length > 0 || (P.ob === true && inp.manevra !== 'tranzit'),
      tanc: !!nava.tanc,
    };
    return ADMIN_CHECKS.filter((c) => c.when(inp, ctx)).map((c) => c.id);
  }

  function pilotaj(inp, nava, loa) {
    const m = inp.manevra;
    if (nava.exceptPilot) {
      return { ob: false, motiv: `${nava.l.split(' (')[0]} face parte din categoriile exceptate de la pilotajul obligatoriu.`, art: ['Art. 127 alin. (2)'] };
    }
    if (nava.g === 'fluviala') {
      return { ob: false, motiv: 'Art. 123–124 vizează navele maritime și fluvio-maritime; pentru navele de navigație interioară se aplică Art. 20 alin. (2).', art: ['Art. 123', 'Art. 124', 'Art. 20 alin. (2)'] };
    }
    if (m === 'tragere') {
      if (loa === null || inp.distantaTragere === null) {
        return { ob: null, motiv: 'Introduceți LOA și distanța de deplasare la tragerea pe parâme: pilotajul este obligatoriu dacă distanța depășește jumătate din LOA.', art: ['Art. 124', 'Art. 127 alin. (3)'] };
      }
      if (inp.distantaTragere > loa / 2) {
        return { ob: true, motiv: `Tragere pe parâme pe ${fmt(inp.distantaTragere)} m > LOA/2 (${fmt(loa / 2)} m): este considerată manevră și se efectuează cu pilot la bord.`, art: ['Art. 124', 'Art. 127 alin. (3)'] };
      }
      return { ob: false, motiv: `Tragere pe parâme pe ${fmt(inp.distantaTragere)} m ≤ LOA/2 (${fmt(loa / 2)} m): pilotajul nu este obligatoriu; comandantul poate solicita asistența pilotului și a remorcherelor.`, art: ['Art. 124', 'Art. 127 alin. (3)', 'Art. 136 alin. (3)'] };
    }
    const motive = {
      sosire: 'Intrarea în port este manevră cu pilotaj obligatoriu.',
      sosire_pgm: 'Intrarea în port / sosirea la PGM este manevră cu pilotaj obligatoriu.',
      plecare: 'Ieșirea din port este manevră cu pilotaj obligatoriu.',
      plecare_pgm: 'Ieșirea din port / plecarea de la PGM este manevră cu pilotaj obligatoriu.',
      mutare: 'Manevrele între danele aceluiași port sunt cu pilotaj obligatoriu.',
      schimbare_linie: 'Manevră în interiorul portului – tratată ca manevră cu pilotaj obligatoriu (Art. 126 alin. (1) include schimbarea liniei de acostare în cazurile în care pilotajul este obligatoriu; Art. 124 nu o menționează expres – confirmați cu serviciul de pilotaj).',
      tranzit: 'Tranzitarea acvatoriilor portuare spre/dinspre șantierele navale sau canalele navigabile este cu pilotaj obligatoriu.',
      doc_santier: 'Intrarea/ieșirea în/din port sau la docurile șantierelor este cu pilotaj obligatoriu.',
    };
    return { ob: true, motiv: motive[m] || 'Pilotajul este obligatoriu.', art: ['Art. 124', 'Art. 127 alin. (1)'] };
  }

  function finish(inp, items, cerinte, lipsa) {
    const n = { ok: 0, fail: 0, warn: 0, todo: 0, info: 0 };
    items.forEach((i) => (n[i.status] = (n[i.status] || 0) + 1));
    let verdict;
    let titlu;
    let text;
    if (lipsa.length) {
      verdict = 'incomplet';
      titlu = 'DATE INCOMPLETE';
      text = 'Completați datele obligatorii pentru o verificare completă.';
    } else if (n.fail) {
      verdict = 'neconform';
      titlu = 'NECONFORM';
      text = `Manevra nu poate fi efectuată în configurația introdusă: ${n.fail} condiți${n.fail === 1 ? 'e neîndeplinită' : 'i neîndeplinite'}.`;
    } else if (n.warn) {
      verdict = 'conditionat';
      titlu = 'CONDIȚIONAT';
      text = `Nu s-au găsit încălcări, dar ${n.warn} punct${n.warn === 1 ? '' : 'e'} necesit${n.warn === 1 ? 'ă' : 'ă'} aprobare sau verificare suplimentară.`;
    } else {
      verdict = 'conform';
      titlu = 'CONFORM';
      text = 'Nu s-au găsit neconformități pe baza datelor introduse.' + (n.todo ? ` ${n.todo} puncte de formalități rămân de confirmat.` : '');
    }
    return { verdict, titlu, text, counts: n, items, cerinte, lipsa, categorii: CATEGORII, ordine: ORDINE_CATEGORII };
  }

  /* ------------------------------------------------------------------ */
  /* Raport text                                                         */
  /* ------------------------------------------------------------------ */

  const SIMBOL = { ok: '[OK]    ', fail: '[NEC]   ', warn: '[ATENȚ] ', todo: '[DE CONF]', info: '[INFO]  ' };

  function raport(raw, rez, dataTxt) {
    const inp = normalize(raw);
    const nava = NAVE[inp.tipNava];
    const L = [];
    L.push('VERIFICARE MANEVRĂ – REGULAMENT PORTUAR');
    L.push(SURSA);
    if (dataTxt) L.push('Data: ' + dataTxt);
    L.push('='.repeat(60));
    L.push(`Navă: ${nava ? nava.l : '–'}`);
    L.push(`LOA: ${fmt(inp.loa)} m | Pescaj: ${fmt(inp.pescaj)} m` + (inp.trn !== null ? ` | TRN: ${fmt(inp.trn)}` : '') + (inp.dwt !== null ? ` | tdw: ${fmt(inp.dwt)}` : ''));
    L.push(`Manevră: ${MANEVRE[inp.manevra] || '–'} | ${inp.noapte ? 'noapte' : 'zi'} | Zonă: ${ZONE[inp.zona]}`);
    L.push(`Dană: ${inp.danaText || '–'} | Vânt: ${inp.vant === null ? '–' : fmt(inp.vant) + ' Nd'}`);
    L.push(`Remorchere introduse: ${descrieDisponibil(inp.remorchere)}`);
    L.push('='.repeat(60));
    L.push(`REZULTAT: ${rez.titlu} – ${rez.text}`);
    if (rez.cerinte.pilotaj) L.push(`Pilotaj: ${rez.cerinte.pilotaj}`);
    if (rez.cerinte.remorcaj) L.push(`Remorcaj: ${rez.cerinte.remorcaj}`);
    L.push('');
    rez.ordine.forEach((cat) => {
      const it = rez.items.filter((i) => i.cat === cat);
      if (!it.length) return;
      L.push(rez.categorii[cat].toUpperCase());
      it.forEach((i) => {
        L.push(`${SIMBOL[i.status] || ''} ${i.titlu}`);
        if (i.mesaj && i.mesaj !== i.titlu) L.push('          ' + i.mesaj);
        if (i.art.length) L.push('          (' + i.art.join('; ') + ')');
      });
      L.push('');
    });
    L.push('Notă: instrument de sprijin pe baza textului regulamentului; nu înlocuiește regulamentul în vigoare,');
    L.push('indicațiile ANR/VTS/Căpităniei de Port, ale pilotului sau decizia comandantului.');
    return L.join('\n');
  }

  return {
    SURSA,
    ZONE,
    NAVE,
    MANEVRE,
    SITUATII_ART38,
    ADMIN_CHECKS,
    ARTICOLE,
    CATEGORII,
    ENTRY_EXIT,
    ARRIVAL,
    DEPARTURE,
    evaluate,
    adminAplicabile,
    normalize,
    raport,
    // exportate pentru teste
    _t: { tabelRemorcaj, acopera, beaufort, nrDana, descrieCerinta, num },
  };
});
