# Verificator manevre – Regulament Portuar

Aplicație web (HTML + JavaScript, fără dependențe și fără server) care verifică dacă o manevră de navă respectă
**Regulamentul Portuar al porturilor maritime românești aflate în administrarea CN „Administrația Porturilor Maritime” SA Constanța, ediția 2025**.

Utilizatorul introduce tipul navei, LOA, pescajul, tipul manevrei (sosire, plecare, mutare etc.), dana, zi/noapte, vântul,
remorcherele disponibile ș.a., iar aplicația afișează, pentru fiecare regulă, dacă este îndeplinită, cu **articolul de regulament** citat.
Clic pe un articol citat deschide regulamentul (PDF) într-o fereastră nouă, direct la pagina articolului.

> **Instrument de sprijin.** Nu înlocuiește regulamentul în vigoare, indicațiile Autorității Navale Române / VTS / Căpităniei de Port,
> ale pilotului sau decizia comandantului. Verificați întotdeauna versiunea actuală a regulamentului.

## Pornire

- **Local:** deschideți `index.html` în browser, sau rulați `npm start` și accesați <http://localhost:8080>.
- **GitHub Pages:** urcați proiectul într-un depozit, apoi *Settings → Pages → Build and deployment → Source: GitHub Actions*.
  La fiecare push pe `main`, fluxul `.github/workflows/pages.yml` rulează testele și publică site-ul.

## Ce verifică

| Domeniu | Reguli (articole) |
|---|---|
| **Pilotaj** | obligatoriu la intrare/ieșire, tranzit, mutare (Art. 124, 127 alin. 1); categorii exceptate (Art. 127 alin. 2); tragere pe parâme > LOA/2 (Art. 124, 127 alin. 3); nave fluviale (Art. 20 alin. 2) |
| **Remorcaj** | tabelul pe LOA/pescaj (Art. 126 alin. 2); scutirea de un remorcher cu propulsoare transversale / tragere pe parâme și excepția mărfurilor periculoase (Art. 126 alin. 3, 4, 6); plecarea de la PGM (alin. 7); nave de pasageri (alin. 8); Midia/Mangalia în condiții nefavorabile (alin. 9); pescaj > 12,5 m (Art. 19 alin. 3); remorchere interzise (Art. 136 alin. 4) |
| **Program, vânt, vizibilitate** | noapte + pescaj > 16 m + danele 80/81/82 + tanc la dana 79; sosire noaptea la PGM; structuri agabaritice noaptea; docuri de șantier la vânt > 13 Nd (Art. 34 alin. 2); suspendare la vânt > 30 Nd (Constanța) / > 22 Nd (Midia, Mangalia) sau vizibilitate redusă; nave tehnice; aprobare excepțională la plecare (Art. 34 alin. 3–6) |
| **Dană și acostare** | depășirea limitelor danei (Art. 44), spațiu liber la extremități (Art. 129 alin. 2), dane fund de bazin (Art. 43), viteză la danele 77/78/89/90 (Art. 36), adâncime vs. pescaj (Art. 130) |
| **Formalități** | buletin de pilotaj și CCMN (Art. 40, 64), avizare și ETA (Art. 40, 42), permis de acostare / plecare (Art. 43, 47, 48), situații speciale de intrare (Art. 38), „gas free” (Art. 102), certificat bollard pull (Art. 135) ș.a. |
| **Operare (Art. 101)** | limite de vânt pe direcție (forța 4 / 6 / 5), împământare, „fire wire” la ≥ 20.000 tdw |

Rezultatul poate fi: **CONFORM**, **CONDIȚIONAT** (aprobări/verificări necesare), **NECONFORM** sau **DATE INCOMPLETE**.
Formalitățile necompletate apar ca „de confirmat” și nu fac manevra neconformă.

## Interpretări asumate

Unde textul regulamentului este ambiguu, motorul alege o lectură prudentă și o marchează în rezultat:

- **Art. 126 alin. 3** („scutite de utilizarea unui remorcher”): se scutește remorcherul cu cea mai mică tracțiune din cerință; la pescaj > 12,5 m rămâne obligatoriu cel puțin unul (Art. 19 alin. 3).
- **Art. 126 alin. 2 lit. a/b** (TRN < sau > 1000): TRN-ul nu schimbă cerința pentru LOA ≤ 120 m; pentru LOA > 120 m se aplică tabelul pe lungime.
- **Art. 44** („10 m sau cel mult 1/15 din LOA” la nave > 100 m): formularea e ambiguă; între cele două valori rezultatul este „atenție”, peste ambele „neconform”.
- **Schimbarea liniei de acostare**: Art. 124 nu o menționează expres; este tratată ca manevră cu pilotaj obligatoriu, conform Art. 126 alin. 1.
- **Art. 34 alin. 2 lit. a)** pentru *mutare*: interdicția vizează expres intrarea/ieșirea; pentru mutare se afișează doar atenționare.
- **Rezerva sub chilă** (Art. 130): regulamentul nu o cuantifică; aplicația calculează doar adâncimea minus pescajul și semnalează lipsa ei.
- Pentru **alte porturi/zone** decât Constanța, Midia și Mangalia, cerințele numerice nu pot fi verificate (avertisment).

## Structura proiectului

```
index.html            interfața
src/rules.js          motorul de reguli (browser + Node), fiecare regulă cu articolul citat
src/app.js            logica interfeței
src/styles.css        stiluri (temă luminoasă/întunecată, tipărire)
icons/                pictograma aplicației (SVG + PNG) și manifest.webmanifest (adăugare pe ecranul principal)
docs/regulament-portuar-2025.pdf   regulamentul (scan); articolele citate se deschid aici, într-o fereastră nouă, la pagina potrivită
tests/rules.test.js   teste automate (node:test)
.github/workflows/    CI (teste) și publicare pe GitHub Pages
```

## Teste

```bash
npm test
```

Testele acoperă pragurile din tabelul de remorcaj, limitele de vânt (inclusiv valorile de la limită), interdicțiile zi/noapte,
scutirile, formalitățile și condițiile din Art. 101. Cerința: Node.js ≥ 18, fără pachete externe.

## Actualizarea regulilor

Dacă înlocuiți PDF-ul din `docs/`, verificați și harta `REGULAMENT.pagini` din `src/rules.js` (articol → pagină).


Dacă regulamentul se modifică, editați `src/rules.js`: tabelul de remorcaj (`tabelRemorcaj`), pragurile de vânt (secțiunea
„Art. 34 alin. (3)”), listele de dane și formalitățile (`ADMIN_CHECKS`). Actualizați apoi testele corespunzătoare.

## Licență

MIT – vezi `LICENSE`.
