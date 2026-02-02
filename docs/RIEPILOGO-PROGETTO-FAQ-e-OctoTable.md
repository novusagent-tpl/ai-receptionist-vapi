# Riepilogo progetto – FAQ, OctoTable e stato attuale

Documento di sintesi di quanto fatto e deciso (per il team e per allineare altri assistenti, es. ChatGPT).

---

## 1. Contesto del progetto

- **Progetto:** AI receptionist (Vapi) per ristoranti: risponde al telefono, gestisce FAQ (menu, allergeni, orari, policy), prenotazioni (crea, lista, modifica, cancella).
- **Backend:** Node.js (Express), con moduli per FAQ (`/api/faq`), prenotazioni (create_booking, list_bookings, modify_booking, cancel_booking), apertura (is_open_now, check_openings), ecc.
- **Prenotazioni (storico):** inizialmente solo Google Sheets + Google Calendar; si è deciso di supportare anche OctoTable come backend alternativo.

---

## 2. Cosa abbiamo fatto – FAQ

### Backend (`src/api/faq.js`)
- **Matching:** aggiunto fuzzy matching deterministico (senza AI/LLM): normalizzazione testo, tokenizzazione, Jaccard, bonus per substring e parole chiave (`keywords` opzionali nelle entry FAQ). Soglia `FAQ_THRESHOLD = 0.6`.
- **Priorità:** prima match esatto (case-insensitive), poi fuzzy; se il punteggio migliore è sotto soglia → `answer: null` (non si inventa risposta).
- **Log:** arricchiti con `matched`, `score`, `matched_q` (solo in log, non nella risposta API). Risposta API invariata: `{ ok, answer, source }`.
- **Bug fix:** corretti JSON in `kb/roma.json` (virgole mancanti che causavano "KB non valida").

### System prompt (V2 e modena01)
- Regola: per domande su menu, allergeni, animali, torte, eventi, parcheggio, policy **si deve sempre chiamare il tool `faq`**.
- Se il tool `faq` restituisce `answer: null`: l’AI dice "Non ho questa informazione disponibile." e (se aperto) offre di mettere in contatto con il personale.
- Sezione TOOL CONTRACTS aggiornata per il tool `faq` in base a queste regole.

### Test e documentazione FAQ
- **`docs/FAQ-TEST-CASES.md`:** 5 test case (domanda → match atteso o null), istruzioni per eseguire i test e aggiungere FAQ.
- **`scripts/faq-api-test.js`:** script Node per testare l’endpoint `/api/faq` con i test case definiti.

---

## 3. Cosa abbiamo fatto – OctoTable

### Documentazione
- **`docs/OctoTable/OctoTable-API-Endpoints.md`:** Base URL (`https://api.octotable.com/v1`), auth OAuth 2.0 Client Credentials, endpoint Reservations (List GET, Create POST, Modify PATCH, Cancel DELETE), mappatura al nostro contratto (createReservation, listReservationsByPhone, listReservationsByDay, updateReservation, deleteReservation), configurazione (env, `octotable_restaurant_id` in config).
- **`docs/OctoTable/OctoTable-Ordine-Passi.md`:** Ruolo della doc ufficiale OctoTable (setup client/token/restaurant/rooms), rapporto con il file “OctoTable-Postman-Cosa-Inviare” (non più da fare), ordine passi: setup OctoTable → switch in reservations.js → (B) tool opzionale.
- **`docs/OctoTable/OctoTable-vs-Sheets-Spiegazione.md`:** Spiegazione: stessi tool e stesse route; cambia solo chi implementa le prenotazioni (Sheets/Calendar vs OctoTable). Nessun “tool per OctoTable” separato; il punto B (nuovi tool) non è obbligatorio per usare OctoTable.
- **`docs/OctoTable/OctoTable-Prossimi-Passi-e-Nuovo-Ristorante.md`:** Cosa manca per “finire” OctoTable (solo config e credenziali), quando acquistare DigiMenu, come aggiungere un nuovo ristorante (Sheets = come prima; OctoTable = `octotable_restaurant_id`, senza sheet/calendar per prenotazioni).
- **`docs/OctoTable/OctoTable-Ordine-Passi.md`** e altri file in `docs/OctoTable/` referenziano anche la doc ufficiale OctoTable (Create Clients, Create Token, Create restaurant, Create rooms, Manage reservations) che non è nel repo.

### Codice
- **`src/reservations-octotable.js`:** Adapter che espone le stesse 5 funzioni di `reservations.js` (createReservation, listReservationsByPhone, listReservationsByDay, updateReservation, deleteReservation) chiamando l’API OctoTable v1. Usa env: `OCTOTABLE_CLIENT_ID`, `OCTOTABLE_CLIENT_SECRET`, `OCTOTABLE_BASE_URL` (opz.). Per ristorante: `octotable_restaurant_id` in config (o fallback su `restaurantId`). Token OAuth cachato.
- **`src/reservations-sheets.js`:** Implementazione prenotazioni con Google Sheets + Google Calendar (logica spostata qui da `reservations.js`).
- **`src/reservations.js`:** Dispatcher **per ristorante**: per ogni chiamata si legge `reservations_backend` da `src/config/ristoranti.json` (per quel ristorante); se non impostato, si usa `RESERVATIONS_BACKEND` da `.env`. Valori: `resos` → reservations-resos.js, `octotable` → reservations-octotable.js, `sheets` (o assente) → reservations-sheets.js. Le credenziali restano in `.env`. Così un ristorante può usare resOS e un altro OctoTable o Google. Le route e i tool non sono stati modificati; chiamano sempre lo stesso modulo `reservations`.

### Decisioni prese su OctoTable
- **Piano:** Per usare le API basta **DigiMenu** (€15,20/mese, IVA esclusa). Il “Database clienti” (piano EVO) **non serve** per la nostra integrazione (create/list/modify/cancel prenotazioni).
- **Billing:** I campi di fatturazione (Business name, VAT, Address) sono obbligatorii; si usano i dati reali del ristorante/attività. È stata richiesta una call con OctoTable (tra 3 giorni) per chiarire anche: credenziali API, ID ristorante, eventuale sandbox/prova, documentazione ufficiale.
- **Test:** Senza sottoscrizione DigiMenu (o superiore) **non** si possono testare le chiamate reali alle API OctoTable. Il codice (adapter + switch) è pronto; il test end-to-end con OctoTable si farà dopo attivazione e configurazione credenziali + `octotable_restaurant_id`.

---

## 4. Cosa chiedere a OctoTable nella call

- Dove trovare **Client ID** e **Client Secret** dopo l’attivazione DigiMenu.
- Dove trovare / come ottenere l’**ID ristorante** (`restaurant_id`) per le API.
- Se esiste un **ambiente sandbox/test** o prova per le API.
- Se c’è possibilità di **prova gratuita** o di completare la fatturazione dopo una prima prova.
- Link ufficiale alla **documentazione API** e eventuale **collection Postman**.
- **Limiti** del piano DigiMenu (rate limit, numero prenotazioni, ecc.).

---

## 5. Stato attuale – Dove ci siamo fermati

- **FAQ:** Implementazione e test cases completati; system prompt aggiornati.
- **OctoTable:** Documentazione e codice (adapter + switch) completati. In attesa di: (1) call con OctoTable, (2) eventuale attivazione DigiMenu e inserimento dati di billing, (3) configurazione `.env` e `ristoranti.json` con credenziali e `octotable_restaurant_id`, (4) test end-to-end delle prenotazioni con OctoTable.
- **Nuovo ristorante:** Con Google Sheets/Calendar si aggiunge come prima (sheet_id, calendar_id, ecc.). Con OctoTable (dopo aver impostato `RESERVATIONS_BACKEND=octotable` e credenziali): si aggiunge voce in config con `octotable_restaurant_id` (e senza sheet/calendar per le prenotazioni).

### 5.1 Backend prenotazioni per ristorante (scelta per ristorante)

- In **`src/config/ristoranti.json`** ogni ristorante può avere il campo **`reservations_backend`**: `"resos"` | `"octotable"` | `"sheets"`.
- Se **non** è impostato per quel ristorante, si usa **`RESERVATIONS_BACKEND`** da `.env` (fallback globale).
- Le **credenziali** (RESOS_API_KEY, OCTOTABLE_CLIENT_ID/SECRET, Google) restano in **`.env`**; in config c’è solo *quale* backend usare per quel ristorante.
- Così si può avere un ristorante su resOS e un altro su OctoTable o Google nello stesso ambiente.

---

## 6. File principali coinvolti

| Area        | File |
|------------|------|
| FAQ        | `src/api/faq.js`, `docs/FAQ-TEST-CASES.md`, `scripts/faq-api-test.js`, `kb/*.json`, system prompt in `docs/` |
| OctoTable  | `src/reservations-octotable.js`, `src/reservations-sheets.js`, `src/reservations.js`, `docs/OctoTable/*.md` |
| Config     | `src/config/ristoranti.json`, `.env` (OCTOTABLE_*, RESERVATIONS_BACKEND, Google, ecc.) |
| Prenotazioni (route) | `src/api/create_booking.js`, `list_bookings.js`, `modify_booking.js`, `cancel_booking.js` (invariati; usano `reservations`) |

---

## 7. Prossimi passi (quando si riprende)

1. Eseguire la call con OctoTable e raccogliere le risposte alle domande sopra.
2. Se si attiva DigiMenu: completare billing, ottenere Client ID/Secret e ID ristorante, configurare `.env` e `ristoranti.json`, riavviare il server e testare una prenotazione (crea + lista/modifica/cancella).
3. Se serve: aggiungere un breve “troubleshooting” in `docs/OctoTable/` in base agli errori riscontrati nei primi test.

---

## 8. Se si integra un altro gestionale (diverso da OctoTable)

- **Cosa fare:** creare un **nuovo file adapter** (es. `src/reservations-resos.js`) che espone le stesse 5 funzioni: `createReservation`, `listReservationsByPhone`, `listReservationsByDay`, `updateReservation`, `deleteReservation`, chiamando le API del nuovo gestionale.
- **Poi:** aggiornare **solo `reservations.js`** aggiungendo il nuovo adapter e il valore in `getImpl()` (es. `resos` → `reservations-resos.js`). La scelta è **per ristorante** tramite `reservations_backend` in `ristoranti.json` (vedi § 5.1).
- **Tool:** **non** servono nuovi tool. I tool esistenti in `src/api/` restano invariati; il dispatcher in `reservations.js` sceglie quale implementazione usare in base a `reservations_backend` (config) o `RESERVATIONS_BACKEND` (.env) e credenziali.

---

## 9. Gestionali con API (consigli per sviluppatori)

Alcuni gestionali che espongono API per prenotazioni (utili da valutare se cerchi alternative a OctoTable o più libertà per sviluppatori):

| Gestionale | Note | API / Doc |
|------------|------|-----------|
| **resOS** (resos.com) | API REST documentata (Postman), pensata per integrazioni; crea/lista/modifica/cancella prenotazioni. Prodotto nordico; pricing e supporto IT da verificare. | Doc e Postman disponibili. |
| **OpenTable** (opentable.com) | API per partner: Sync, Booking, CRM; sandbox per test. Modello a rete/commissioni; adatto se il ristorante vuole essere su OpenTable. | docs.opentable.com, API Sandbox. |
| **Quandoo** (quandoo.com) | API pubblica: disponibilità, crea/modifica prenotazioni (PUT/PATCH), ambienti di test. Modello a rete. | docs.quandoo.com. |
| **TableConnect** (tableconnect.io) | API semplice: Bearer token, endpoint per reservations, restaurants. | tableconnect.io/api-docs. |
| **SevenRooms** (sevenrooms.com) | API per reservation management, multi-venue; orientato a operatori più grandi. | api-docs.sevenrooms.com (con account). |
| **OctoTable** (octotable.com) | Già integrato nel progetto; DigiMenu per API. Italiano. | Doc Postman pubblica; API in PREVIEW. |

Per “più facile e più libero”: **resOS** e **Quandoo** sono spesso citati per doc e integrazioni; **OpenTable** ha sandbox e doc chiara ma modello a rete. Conviene sempre verificare: endpoint lista per telefono/giorno, crea/modifica/cancella, autenticazione, pricing e vincoli contrattuali.

---

## 10. Cosa fare quando passi in una nuova chat (per essere allineati al 100%)

### Cosa scrivere al primo messaggio

Copia e incolla (o adatta) questo testo:

```
Sto lavorando al progetto AI receptionist per ristoranti (Vapi + backend Node.js). 
Per avere il contesto completo ti allego / ti indico il file di riepilogo del progetto: 
docs/RIEPILOGO-PROGETTO-FAQ-e-OctoTable.md

Leggi quel file: contiene tutto quello che abbiamo fatto (FAQ, OctoTable), cosa abbiamo deciso, 
dove ci siamo fermati, i file coinvolti e cosa manca da fare. 
Da lì possiamo riprendere o lavorare su un altro argomento (es. altro gestionale, OctoTable config, ecc.).
```

### Quale file allegare / indicare

- **Obbligatorio:** `docs/RIEPILOGO-PROGETTO-FAQ-e-OctoTable.md`  
  È il file principale: contesto, FAQ, OctoTable, stato attuale, istruzioni per nuova chat e checklist OctoTable.

- **Se parli di OctoTable** (config, test, errori): puoi anche indicare o allegare  
  `docs/OctoTable/OctoTable-API-Endpoints.md`  
  e/o  
  `docs/OctoTable/OctoTable-Prossimi-Passi-e-Nuovo-Ristorante.md`  
  per dettagli su endpoint e configurazione.

- **Se parli di un altro gestionale:** il riepilogo (sez. 8 e 9) spiega già il pattern (nuovo adapter + switch in reservations.js) e alcuni nomi da valutare.

Non serve allegare tutto il codice: chi risponde può leggere i file dal progetto quando serve. L’importante è che il **primo messaggio** referenzi il riepilogo così il contesto è chiaro.

---

## 11. Cosa manca da fare per integrare e testare OctoTable (se il team OctoTable dà il permesso)

Checklist di ciò che resta da fare **dopo** che OctoTable conferma che possiamo usare le API per il nostro caso (AI che crea/lista/modifica/cancella prenotazioni):

| # | Cosa fare | Note |
|---|-----------|------|
| 1 | **Attivare DigiMenu** (o piano con API) | Se non già fatto; completare billing (Business name, VAT, Address) dove richiesto. |
| 2 | **Ottenere credenziali API** | **Client ID** e **Client Secret** (dalla doc OctoTable: Create Client, o dal pannello / dal supporto). |
| 3 | **Ottenere ID ristorante** | **restaurant_id** (ID del ristorante su OctoTable) da usare nelle chiamate API (Create your restaurant / pannello). |
| 4 | **Configurare `.env`** | Aggiungere: `RESERVATIONS_BACKEND=octotable`, `OCTOTABLE_CLIENT_ID=...`, `OCTOTABLE_CLIENT_SECRET=...`. Opzionale: `OCTOTABLE_BASE_URL=https://api.octotable.com/v1`. |
| 5 | **Configurare `src/config/ristoranti.json`** | Per il ristorante che usa OctoTable: aggiungere `octotable_restaurant_id` con l’ID ottenuto al punto 3 (se diverso dalla chiave usata nel nostro sistema, es. `modena01`). |
| 6 | **Riavviare il server** | Per caricare le nuove variabili d’ambiente. |
| 7 | **Test crea prenotazione** | Chiamare l’endpoint create_booking (o il tool) con restaurant_id, day, time, people, name, phone, notes; verificare che la prenotazione compaia su OctoTable. |
| 8 | **Test lista per telefono** | Chiamare list_bookings con restaurant_id e phone; verificare che restituisca la prenotazione creata. |
| 9 | **Test modifica e cancellazione** | Chiamare modify_booking e cancel_booking con il booking_id restituito; verificare su OctoTable che la prenotazione si aggiorni / venga cancellata. |
| 10 | **Eventuale troubleshooting** | Se qualcosa fallisce (token, 404, campi mancanti): verificare log, doc OctoTable e formato richiesto (date, time, restaurant_id); eventualmente documentare in `docs/OctoTable/` per la prossima volta. |

Il **codice** (adapter + switch in `reservations.js`) è già pronto; non serve modificarlo per la prima integrazione, salvo correzioni in base a errori riscontrati nei test.

Fine riepilogo.
