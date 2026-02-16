# ROADMAP → SaaS Vendibile

Checklist completa per arrivare alla versione finale vendibile.
Da completare **prima** dei test Vapi e del lancio.

---

## FASE A — SOLIDIFICARE IL BACKEND (Priorità ALTA)

### A1. Prompt hardening "a tavolino"
**Obiettivo:** Eliminare bug logici nei prompt senza fare chiamate.

**Regole obbligatorie (verificare nei prompt):**

- [ ] Ordine tool obbligatorio: `check_openings` → `create_booking`
- [ ] Mai `create_booking` se `available=false`
- [ ] `people` richiesto prima di `create_booking` (nota: `check_openings` può funzionare anche senza people per dare info sugli orari, ma per prenotare serve sempre)
- [ ] Mapping errori completo:
  - `MAX_PEOPLE_EXCEEDED` → "Accettiamo massimo X persone"
  - `NO_TABLE_AVAILABLE` → "Non ci sono tavoli disponibili, propongo altro orario"
  - `CREATE_ERROR` → "Non riesco a completare, posso metterla in contatto col ristorante"
  - `DUPLICATE_BOOKING` → "Esiste già una prenotazione con questi dati"
  - `PROVIDER_UNAVAILABLE` → "Sistema temporaneamente non disponibile, handover"
- [ ] Handover: `is_open_now` prima di transfer
- [ ] Numero telefono: usare quello dettato se diverso da caller

**Divieti espliciti (devono essere nel prompt):**

- [ ] ❌ MAI anticipare conferme prima di `create_booking ok:true`
- [ ] ❌ MAI inventare disponibilità (solo `check_openings` è fonte di verità)
- [ ] ❌ MAI saltare `check_openings` prima di `create_booking`
- [ ] ❌ MAI assumere slot se cliente dice "va bene" senza specificare quale

**Output:** Prompt finali "frozen" (`System-Prompt-Receptionist_modena01.md`, `System-Prompt-ReceptionistV2.md`)

**Status:** ✅ Completato (2026-02-03)

---

### A2. Tools Contract (documentazione API)
**Obiettivo:** Zero ambiguità sui contratti delle API.

Creare `docs/TOOLS-CONTRACT.md` con:

- [ ] `check_openings` → input/output/errori
- [ ] `create_booking` → sempre ritorna `booking_id` (o errore)
- [ ] `modify_booking` → accetta booking_id, normalizza output
- [ ] `list_bookings` → mai prenotazioni passate/cancellate
- [ ] `cancel_booking` → idempotente (se già cancellata, ok)
- [ ] `faq` → `answer:null` = fallback "non ho questa informazione"
- [ ] `is_open_now` → usato per handover
- [ ] `resolve_relative_day` / `resolve_relative_time` → formato output

**Output:** `docs/TOOLS-CONTRACT.md`

**Status:** ✅ Completato (2026-02-03)

---

### A3. Logging production-grade
**Obiettivo:** Capire cosa succede in produzione.

Verificare/aggiungere in `src/logger.js`:

- [ ] `request_id` univoco per ogni chiamata
- [ ] `restaurant_id` (tenant) in ogni log
- [ ] `tool_name` + `payload` + `esito` per ogni tool call
- [ ] `error_code` standardizzati
- [ ] Timestamp ISO
- [ ] `conversation_id` (da Vapi)
- [ ] `call_id` (Twilio/Vapi)
- [ ] `backend_used` (sheets / resos / octotable)
- [ ] `prompt_version` (vedi A7)

**Output:** Logger aggiornato

**Status:** ✅ Completato (2026-02-03)

---

### A4. Error taxonomy & mapping definitivo
**Obiettivo:** Elenco chiuso di error_code, zero errori "raw" in produzione.

**Error codes ammessi:**

| Code | Origine | Messaggio user-facing | Azione assistente |
|------|---------|----------------------|-------------------|
| `MAX_PEOPLE_EXCEEDED` | KB | "Accettiamo massimo X persone per prenotazione" | Chiedere se dividere |
| `NO_TABLE_AVAILABLE` | Provider | "Non ci sono tavoli disponibili per quell'orario" | Proporre altro slot |
| `DUPLICATE_BOOKING` | Backend | "Esiste già una prenotazione con questi dati" | Chiedere se modificare |
| `CREATE_ERROR` | Provider | "Non riesco a completare la prenotazione" | Proporre retry o handover |
| `UPDATE_ERROR` | Provider | "Non riesco a modificare la prenotazione" | Handover |
| `DELETE_ERROR` | Provider | "Non riesco a cancellare la prenotazione" | Handover |
| `BOOKING_NOT_FOUND` | Backend | "Non trovo questa prenotazione" | Chiedere altro riferimento |
| `VALIDATION_ERROR` | Backend | "Dati non validi" | Chiedere correzione |
| `PROVIDER_UNAVAILABLE` | Provider | "Sistema temporaneamente non disponibile" | Scuse + handover |
| `PROVIDER_ERROR` | Provider | "Errore tecnico" | Scuse + handover |

Checklist:
- [x] Tutti gli error_code nel backend mappano a questa lista (verificato in A2)
- [x] Nessun messaggio tecnico esposto all'utente (codici tecnici non nel prompt)
- [x] Ogni errore ha azione definita (documentato in TOOLS-CONTRACT.md)
- [ ] `PROVIDER_UNAVAILABLE` → da implementare nel backend in A6

**Output:** Tabella sopra documentata in `TOOLS-CONTRACT.md`

**Status:** ✅ Completato (2026-02-03) — tranne PROVIDER_UNAVAILABLE (→ A6)

---

### A5. Idempotenza create_booking
**Obiettivo:** Stesso phone + day + time + restaurant_id = no doppia prenotazione.

Comportamento richiesto:
- Se prenotazione identica esiste → ritorna `DUPLICATE_BOOKING`
- NON creare seconda prenotazione

Checklist:
- [x] Implementato in `reservations-resos.js` (check preventivo con `listReservationsByPhone`)
- [x] Implementato in `reservations-sheets.js` (stesso pattern: check prima di create)
- [x] Documentato in `TOOLS-CONTRACT.md`

**Status:** ✅ Completato (2026-02-06)

---

### A6. Provider health check & timeout
**Obiettivo:** Gestire down di resOS/Google senza bloccare l'assistente.

Checklist:
- [ ] Timeout configurato per chiamate API (es. 10s)
- [ ] Timeout → error_code `PROVIDER_UNAVAILABLE`
- [ ] Assistente: scuse + handover (se aperto) o "riprovi più tardi"
- [ ] Log dedicato per timeout/errori provider

**Output:** Timeout implementato, error handling aggiornato

**Status:** ✅ Completato (2026-02-06)

---

### A7a. Transfer tool per-tenant (TODO)
**Obiettivo:** Ogni ristorante deve avere il proprio tool di transfer su Vapi.

- [ ] Creare `transfer_call_tool_<restaurant_id>` per ogni ristorante su Vapi
- [ ] Aggiornare ogni system prompt con il nome tool corretto
- [ ] Attualmente `transfer_call_tool_roma` è usato anche per modena01 (solo test)
- [ ] **NON andare in produzione senza questo fix**

**Status:** [ ] Da fare (prima del primo cliente reale)

---

### A7. Prompt versioning
**Obiettivo:** Sapere con quale prompt è stata gestita ogni chiamata.

Checklist:
- [x] Versione nel filename o header del prompt (es. `v1.3`) → aggiunto `(v1.0)` nel titolo di entrambi i prompt
- [x] Loggare `prompt_version` a ogni chiamata (vedi A3) → aggiunto `prompt_version` in `ristoranti.json` + middleware logga con ogni request
- [x] Changelog minimo quando si modifica un prompt → tabella Changelog aggiunta in fondo a entrambi i prompt

**Output:** Prompt versionati, log aggiornato

**Status:** [x] Completato (2026-02-06)

---

### A8. Regression tests API (senza voce)
**Obiettivo:** Suite di test automatici che chiamano gli endpoint tools con casi noti, per non rompere resOS/Sheets quando si tocca backend/prompt.

Creato `scripts/regression-tests.js`:

- [x] `check_openings` → giorno aperto, giorno chiuso, orario in slot, orario fuori slot, override (Natale), validazione (manca restaurant_id, manca day, formato errato day/time)
- [x] `create_booking` → validazione (manca restaurant_id, manca day, manca phone, MAX_PEOPLE_EXCEEDED)
- [x] `list_bookings` → validazione (manca restaurant_id, manca phone)
- [x] `modify_booking` → validazione (manca restaurant_id, manca booking_id)
- [x] `cancel_booking` → validazione (manca restaurant_id, manca booking_id)
- [x] `faq` → match esatto, match fuzzy, nessun match, validazione
- [x] `is_open_now` → modena01, roma, manca restaurant_id
- [x] `resolve_relative_day` → domani, oggi, dopodomani, sabato, tra 3 giorni, non riconosciuto, manca text
- [x] `resolve_relative_time` → tra mezz'ora, tra 2 ore, tra 30 minuti, orario vago, non relativo, manca text

Eseguibile con `npm test` o `node scripts/regression-tests.js [BASE_URL]` prima di ogni deploy.

**Output:** Script test + report pass/fail con colori

**Come testare:**
1. Avvia il server in locale: `npm run dev`
2. In un altro terminale: `npm test` (oppure `node scripts/regression-tests.js`)
3. Per testare su Render: `node scripts/regression-tests.js https://tuo-deploy.onrender.com`
4. Verde = PASS, Rosso = FAIL. Se tutto verde → puoi fare deploy tranquillo.

**Nuovo gestionale/ristorante:** I test esistenti non vanno toccati. Basta aggiungere nuovi test nello stesso file per il nuovo `restaurant_id` (copiare i test esistenti e cambiare l'ID).

**In breve:** Questo script serve a verificare in 10 secondi che tutto il backend funzioni prima di ogni deploy, così non si va online con bug.

**Status:** [x] Completato (2026-02-09)

---

### A9. Monitoring & alerting (oltre il logging)
**Obiettivo:** Logging ≠ osservabilità. Serve sapere in tempo reale se qualcosa va storto.

Creato `src/metrics.js` + endpoint `GET /metrics` + middleware di tracking:

Metriche tracciate:
- [x] Error rate per ristorante (% chiamate con errore)
- [x] Latency media per tool call
- [x] Provider failures (resOS/Google down) — con conteggio ultimi 5 min
- [x] Handover count (proxy via is_open_now)
- [x] Tasso prenotazioni riuscite vs tentate (booking_success_rate_percent)

Alerting (log automatici):
- [x] ALERT_HIGH_ERROR_RATE → se error rate > 25% (dopo minimo 10 richieste)
- [x] ALERT_PROVIDER_DOWN → se >=3 provider failure in 5 minuti

**Come usare:** Visita `https://tuo-deploy.onrender.com/metrics` per vedere tutte le metriche in JSON (globali, per ristorante, per tool).

**In breve:** Endpoint che mostra in tempo reale quante richieste ci sono, quanti errori, quanto è veloce ogni tool, e se un provider è giù. Alert automatici nei log.

**Output:** `src/metrics.js` + endpoint `/metrics` + alert nei log

**Status:** [x] Completato (2026-02-09)

---

## FASE B — PREPARARE IL PRODOTTO (Priorità MEDIA-ALTA)

### B1. Onboarding ristorante standardizzato
**Obiettivo:** Processo ripetibile per aggiungere nuovi ristoranti.

Creare `docs/ONBOARDING-RESTAURANT.md` con:

**Dati richiesti dal ristorante:**
- [ ] Nome, indirizzo, telefono
- [ ] Orari apertura (pranzo/cena per ogni giorno)
- [ ] Giorni chiusura
- [ ] Capacità massima per fascia
- [ ] Max persone per prenotazione
- [ ] FAQ (parcheggio, allergeni, animali, ecc.)
- [ ] Backend scelto (resOS / OctoTable / Sheets)
- [ ] Credenziali API (se resOS/OctoTable)

**Informazioni operative:**
- [ ] Differenza Sheets vs gestionale professionale
- [ ] Tempi setup realistici (30-60 min)
- [ ] Checklist operativa per setup tecnico

**Cose che il ristorante deve accettare (contratto implicito):**
- [ ] Limiti dell'AI (non gestisce richieste complesse fuori scope)
- [ ] Cosa succede in caso di errore (handover o messaggio)
- [ ] Gestione "richiesta" vs "accettata" (resOS: status approved)
- [ ] L'AI non può garantire 100% accuratezza
- [ ] Ristorante deve tenere aggiornati orari/capacità

**Output:** `onboarding/ONBOARDING-RESTAURANT.md` + `onboarding/CHECKLIST.md`

**Status:** [x] Completato (2026-02-09) — guida completa con supporto resOS/OctoTable/Sheets, Knowledge Base Vapi, prompt versioning, regression test, tempi stimati, cosa dire al ristorante.

---

### B2. Multi-tenant hardening
**Obiettivo:** Nessun leak di dati tra ristoranti.

Verifica completata:

- [x] Ogni chiamata API usa `restaurant_id` dal request, nessun ID hardcoded
- [x] KB caricata per tenant (`kb/<restaurant_id>.json`), non condivisa
- [x] Config per tenant (`ristoranti.json` → entry separate)
- [x] Dispatcher seleziona backend corretto per ogni restaurant_id
- [x] Sheets: `sheet_id` e `calendar_id` diversi per ristorante
- [x] resOS: filtra per `resos_restaurant_id` specifico
- [x] Metriche e log separati per restaurant_id
- [x] Test cross-tenant aggiunto in regression tests (modena01 vs roma vs ID fake)

**Credenziali per-tenant (risolto):** resOS e OctoTable ora supportano API key/credentials per-ristorante. In `ristoranti.json` si specifica il nome della variabile `.env` (es. `"resos_api_key_env": "RESOS_API_KEY_MODENA01"`), e in `.env` si mette la chiave reale. Fallback automatico alla chiave globale se non configurato.

**Output:** Codice verificato + test cross-tenant in `regression-tests.js`

**Status:** [x] Completato (2026-02-09)

---

### B3. Pricing & pacchetti (bozza)
**Obiettivo:** Definire architettura pricing (non marketing).

Bozza:

| Piano | Backend | Prezzo indicativo | Note |
|-------|---------|-------------------|------|
| Starter | Google Sheets/Calendar | €X/mese | Setup semplice |
| Pro | resOS / OctoTable | €Y/mese | Gestionale professionale |
| Enterprise | Pro + handover umano | €Z/mese | SLA garantito |

Da definire:
- [ ] Costi Vapi/Twilio per chiamata
- [ ] Margine sostenibile
- [ ] Limiti per piano (chiamate/mese?)

**Output:** `docs/PRICING.md` — struttura completa con costi operativi, 3 piani (Base/Pro/Custom), 3 modelli pricing (fisso/fisso+variabile/pay-per-use), calcolo margine, checklist decisioni pre-lancio.

**Status:** [x] Struttura completata (2026-02-09) — prezzi finali da decidere dopo test reali e analisi costi Vapi/Twilio

---

### B4. GDPR / Privacy & data retention
**Obiettivo:** Conformità EU obbligatoria prima di vendere. Telefono + nome = dati personali.

Checklist:
- [x] Definire cosa si logga (telefono, nome, contenuto chiamata?) → definito in `docs/GDPR-PRIVACY.md`
- [x] Definire retention (quanto si conservano i dati: 30gg? 90gg?) → tabella retention in GDPR-PRIVACY.md
- [x] Procedura cancellazione dati su richiesta (diritto all'oblio) → procedura documentata
- [ ] Privacy policy per il sito web → da fare prima del lancio
- [ ] Informativa per ristoratore (DPA - Data Processing Agreement base) → da fare prima del lancio
- [x] Nessun dato personale in log di debug in chiaro (mascherare telefono: +39XXX...567) → implementato in `src/logger.js`

**Implementazione tecnica:**
- `src/logger.js`: aggiunta funzione `maskPhone()` (+39XXX...567) e `maskName()` (M***) con auto-sanitize
- Tutte le API usano il logger strutturato (zero `console.log` diretti con dati personali)
- Documento completo: `docs/GDPR-PRIVACY.md` (dati trattati, ruoli GDPR, retention, diritti utente)

**TODO pre-lancio:** Privacy policy sito web + DPA base per ristoratori + verificare retention Vapi/Twilio

**Output:** Policy definita, implementazione mascheramento log

**Status:** [x] Completato (parte tecnica) — Privacy policy e DPA da completare prima del lancio

---

### B5. Security / Secrets & hardening deploy
**Obiettivo:** Nessun segreto esposto, deploy sicuro.

Checklist:
- [x] Nessun segreto in log/payload (API key, password) → verificato: logger maschera dati, nessuna chiave nei log
- [x] Chiavi API in variabili ambiente, mai hardcoded → fatto in B2 (per-tenant env vars)
- [x] Piano rotazione chiavi (Google/resOS/Twilio) → documentato in `docs/GDPR-PRIVACY.md` sez. 8
- [x] CORS configurato correttamente → aggiunto `cors` con origini configurabili via `CORS_ALLOWED_ORIGINS`
- [x] Headers di sicurezza (helmet o equivalente) → aggiunto `helmet` (X-Frame-Options, CSP, HSTS, ecc.)
- [x] Endpoint `/debug/*` bloccati in produzione → restituiscono 404 quando `NODE_ENV=production`
- [x] `.env` in `.gitignore` → confermato

**Implementazione:**
- `src/server-vapi.js`: aggiunto `helmet()`, `cors()`, blocco `/debug` in produzione
- `docs/GDPR-PRIVACY.md`: aggiunta sezione rotazione chiavi con procedura e frequenze
- Pacchetti: `helmet`, `cors` installati

**Output:** Security review completata

**Status:** [x] Completato

---

### B6. Rate limiting & abuse protection
**Obiettivo:** Protezione da abuso, specialmente con numero demo pubblico.

Checklist:
- [x] Rate limit per tenant (max chiamate/minuto) → default 60 req/min per restaurant_id
- [x] Rate limit per numero chiamante (anti-spam) → default 30 req/min per IP
- [x] Soglia alert per uso anomalo → log warning quando limite superato
- [x] Blocco automatico se superata soglia → risposta 429 "Troppe richieste"

**Implementazione:**
- `src/rate-limiter.js`: modulo in-memory con 2 livelli (tenant + caller IP)
- Configurabile via env vars: `RATE_LIMIT_PER_TENANT`, `RATE_LIMIT_PER_CALLER`, `RATE_LIMIT_WINDOW_MS`
- Risposta 429 con messaggio chiaro se superato il limite
- Snapshot visibile in `/metrics` (sezione `rate_limiting`)
- Pulizia automatica bucket scaduti ogni 5 minuti

**Default:** 60 req/min per ristorante, 30 req/min per IP, finestra 1 minuto

**Output:** Rate limiter implementato

**Status:** [x] Completato

---

### B7. Staging environment
**Obiettivo:** Non fare esperimenti su produzione.

Checklist:
- [x] Tenant fittizio per test (es. `demo01`) → creato in `ristoranti.json` + `kb/demo01.json`
- [x] Config isolata (non tocca dati reali) → backend sheets senza sheet_id reale
- [x] Env separati (dev / staging / prod) → documentati in `docs/STAGING-GUIDE.md`
- [x] Deploy su staging prima di prod → guida per secondo servizio Render (opzionale)

**Implementazione:**
- `demo01` in `ristoranti.json`: tenant fittizio con KB di esempio
- `kb/demo01.json`: orari, FAQ di test
- `docs/STAGING-GUIDE.md`: guida completa ai 3 ambienti + come usare demo01

**Output:** Ambiente staging configurato, posso fare test senza toccare gli altri ristoranti che sono attivi

**Status:** [x] Completato

---

### B8. Kill switch per ristorante
**Obiettivo:** Poter spegnere rapidamente un tenant in produzione.

Implementare:
- [x] Flag `enabled: true/false` in config ristorante (`ristoranti.json`) → aggiunto a tutti i tenant
- [x] Se `enabled: false`:
  - Nessun tool chiamato → middleware blocca tutte le `/api/` per quel restaurant_id
  - Risposta educata: "Il servizio prenotazioni è temporaneamente sospeso"
  - Log warning `restaurant_disabled` per monitoraggio
- [x] Possibilità di disabilitare da config senza deploy → cambiare `enabled` in `ristoranti.json` + push

**Implementazione:**
- `ristoranti.json`: campo `enabled: true/false` per ogni tenant (default true se assente)
- `src/config/restaurants.js`: funzione `isRestaurantEnabled()`
- `src/server-vapi.js`: middleware kill switch che blocca le API se `enabled: false`

**Come spegnere un ristorante:**
1. In `ristoranti.json` cambia `"enabled": true` → `"enabled": false`
2. Push su GitHub → Render si aggiorna
3. Il ristorante riceve "servizio temporaneamente sospeso" per ogni chiamata

**Output:** Flag implementato, comportamento definito

**Status:** [x] Completato

---

## FASE C — DOCUMENTAZIONE (Priorità MEDIA)

### C1. README vendibile
**Obiettivo:** Documento chiaro per te, partner, clienti.

Contenuto:

- [ ] Cosa fa il sistema (1 paragrafo)
- [ ] Cosa NON fa (limiti dichiarati)
- [ ] Flussi supportati (prenotazione, modifica, cancella, FAQ, orari, handover)
- [ ] Backend supportati (resOS, OctoTable, Sheets)
- [ ] Requisiti per il ristorante

**Output:** `README.md` aggiornato o `docs/OVERVIEW.md`

**Status:** [ ] Da fare

---

### C2. FAQ interne (supporto)
**Obiettivo:** Risposte pronte per problemi comuni.

Esempi:

- [ ] "Il ristorante dice che è chiuso ma l'AI dice aperto" → verificare KB orari
- [ ] "Non prende prenotazioni da 10 persone" → verificare `max_people` in KB
- [ ] "Lo stato è 'richiesta' invece di 'accettata'" → verificare `status: approved` in resOS
- [ ] "Booking_id non ritorna" → verificare fallback in `reservations-resos.js`
- [ ] "Prenotazione duplicata" → spiegare check preventivo

**Output:** `docs/FAQ-SUPPORTO.md`

**Status:** [ ] Da fare

---

## FASE D — TEST VOCALI (Priorità: quando possibile)

### D1. Script chiamate
**Obiettivo:** Test strutturati, zero improvvisazione.

**Status:** ✅ GIÀ FATTO → `docs/Test_Attivazione/test_vapi_chiamate.md`

Contiene:
- Prenotazione (A1-A4)
- Casi particolari (B1-B6)
- Lista/Modifica/Cancella (C, D, E)
- FAQ (F1-F4)
- Orari (G1-G3)
- Edge cases (H1-H4)
- **Handover (J1-J3)** ← aggiunto oggi
- **Telefono (K1-K3)** ← aggiunto oggi
- **Goodbye/Conferma (L1-L3)** ← aggiunto oggi
- **Provider error (M1-M3)** ← aggiunto oggi
- Roma subset (I1-I2)

---

### D2. Eseguire test Vapi
**Obiettivo:** Verificare comportamento reale.

- [ ] Test modena01 (tutti A-M) — test principale, verifica tutta la logica del prompt
- [ ] Test octodemo (OT1-OT5) — subset CRUD per verificare OctoTable via voce
- [ ] Test roma (subset I + selezione A1, C1, D1, E1) — subset CRUD per Sheets
- [ ] Annotare esiti in `test_vapi_chiamate.md`
- [ ] Fix bug emersi
- [ ] Re-test se necessario

**Ordine:** modena01 completo → octodemo CRUD → roma CRUD. I test B, F, G, H, J, K, L verificano la logica del prompt (identica per tutti) — basta testarli su modena01.

**Status:** [ ] In corso

---

## FASE E — GO-TO-MARKET (Priorità: dopo test)

### E1. Sito web / Landing page
**Obiettivo:** Lead generation.

- [ ] Struttura pagina (hero, come funziona, benefici, demo, CTA)
- [ ] Copy
- [ ] Design
- [ ] Deploy

**Status:** [ ] Da fare in chat separata (contesto: `docs/SITO-CONTEXT.md`)

---

### E2. Demo pubblica
**Obiettivo:** Prospect possono provare l'assistente.

- [ ] Numero Vapi dedicato per demo
- [ ] Ristorante fittizio o modena01 (se ok col cliente)
- [ ] Istruzioni sul sito

**Status:** [ ] Da fare

---

### E3. Primo cliente reale
**Obiettivo:** Validazione in produzione.

- [ ] Identificare ristorante (modena01? altro?)
- [ ] Setup completo
- [ ] Monitoraggio chiamate
- [ ] Feedback e iterazione

**Status:** [ ] Da fare

---

## FASE F — PANNELLO PERSONALE + SYNC SHEETS/CALENDAR (Priorità: pre-lancio per ristoranti su Sheets)

### F1. Form web per il personale
**Obiettivo:** Il personale del ristorante registra prenotazioni manuali (handover, walk-in, telefono) passando dal nostro backend, cosi Sheets e Calendar restano sincronizzati e il sistema vede tutto.

- [ ] Pagina web semplice (mobile-friendly, nessun framework pesante)
- [ ] Campi: giorno, ora, persone, nome, telefono, note
- [ ] Chiama lo stesso endpoint `create_booking` del backend → stessa validazione (capacita, orari, cutoff)
- [ ] Link privato con token per ogni ristorante (nessun login complesso)
- [ ] Possibilita di vedere/cancellare/modificare prenotazioni esistenti

**Perche serve:** Senza questo, il personale scrive su carta o direttamente su Calendar → il sistema non vede la prenotazione → rischio overbooking.

**Status:** [ ] Da fare

---

### F2. Rischi noti Sheets/Calendar da monitorare
**Obiettivo:** Documentare i rischi conosciuti e le soluzioni future.

| Rischio | Impatto | Soluzione | Priorita |
|---------|---------|-----------|----------|
| Prenotazione manuale su Calendar (non su Sheets) | Sistema non la vede → overbooking | F1 (form web) | Alta (pre-lancio) |
| Cancellazione da Calendar senza toglierla da Sheets | Tavolo risulta occupato per nulla | F1 (gestione completa dal form) | Alta (pre-lancio) |
| Cancellazione da Sheets senza toglierla da Calendar | Ristoratore vede evento fantasma | F1 (gestione completa dal form) | Media |
| Race condition (2 booking contemporanei, ultimo tavolo) | Doppia prenotazione (quasi impossibile con volumi ristorante) | Lock o check-and-write atomico | Bassa |
| Limiti API Google Sheets (300 req/min) | Problema solo con 50+ ristoranti su Sheets | Migrazione a PostgreSQL per alto volume | Bassa (futura) |
| Nessuna notifica al ristoratore | Non sa in tempo reale di nuove prenotazioni | Webhook/email/SMS dopo create_booking | Media |

**Status:** [ ] Documentato, da risolvere progressivamente

---

## COSA NON FARE ORA

- ❌ Non toccare backend "per provare" senza motivo
- ❌ Non aggiungere feature nuove
- ❌ Non cambiare schema tool
- ❌ Non "ottimizzare UX" senza dati reali

---

## RIEPILOGO PRIORITÀ

| Fase | Task | Priorità | Dipende da | Status |
|------|------|----------|------------|--------|
| A1 | Prompt hardening | 🔴 ALTA | - | [ ] |
| A2 | Tools contract | 🔴 ALTA | - | [ ] |
| A3 | Logging | 🔴 ALTA | - | [ ] |
| A4 | Error taxonomy | 🔴 ALTA | - | [ ] |
| A5 | Idempotenza | 🔴 ALTA | - | ✅ resOS, [ ] Sheets |
| A6 | Provider health | 🔴 ALTA | - | [ ] |
| A7 | Prompt versioning | 🟠 MEDIA | - | [ ] |
| A8 | Regression tests API | 🔴 ALTA | A2, A4 | [ ] |
| A9 | Monitoring & alerting | 🟠 MEDIA | A3 | [ ] |
| B1 | Onboarding doc | 🟠 MEDIA-ALTA | - | [ ] |
| B2 | Multi-tenant check | 🟠 MEDIA-ALTA | - | [ ] |
| B3 | Pricing | 🟡 MEDIA | - | [ ] |
| B4 | GDPR / Privacy | 🟠 MEDIA-ALTA | - | [ ] |
| B5 | Security / Secrets | 🟠 MEDIA-ALTA | - | [ ] |
| B6 | Rate limiting | 🟠 MEDIA | - | [ ] |
| B7 | Staging environment | 🟡 MEDIA | - | [ ] |
| B8 | Kill switch | 🟠 MEDIA-ALTA | - | [ ] |
| C1 | README | 🟡 MEDIA | - | [ ] |
| C2 | FAQ supporto | 🟡 MEDIA | - | [ ] |
| D1 | Script test | - | - | ✅ FATTO |
| D2 | Test Vapi | 🔴 ALTA | A1-A6 | [ ] In attesa |
| E1 | Sito web | 🟡 MEDIA | - | [ ] |
| E2 | Demo pubblica | 🟡 MEDIA | D2, B6 | [ ] |
| E3 | Primo cliente | 🔴 ALTA | D2, B4, B5 | [ ] |
| F1 | Form web personale | 🟠 MEDIA-ALTA | - | [ ] |
| F2 | Rischi Sheets/Calendar | 🟡 MEDIA | F1 | [ ] Documentato |

**Legenda:** 🔴 Bloccante per test/lancio | 🟠 Importante pre-lancio | 🟡 Può aspettare

---

## ORDINE DI ESECUZIONE CONSIGLIATO

**STEP 1 — Prima dei test Vapi (obbligatorio):**
1. A1 - Prompt hardening
2. A4 - Error taxonomy
3. A2 - Tools contract
4. A3 - Logging
5. A5 - Idempotenza (verificare Sheets)
6. A6 - Provider health
7. A8 - Regression tests API

**STEP 2 — Parallelamente (non bloccante per test, ma per lancio):**
- A7 - Prompt versioning
- A9 - Monitoring & alerting
- B1 - Onboarding doc
- B2 - Multi-tenant check
- B5 - Security / Secrets
- B8 - Kill switch
- C1/C2 - Documentazione

**STEP 3 — Test Vapi:**
- D2 - Eseguire test vocali (richiede STEP 1 completato)

**STEP 4 — Prima di vendere (obbligatorio):**
- B4 - GDPR / Privacy
- B5 - Security review finale
- B6 - Rate limiting (prima di demo pubblica)
- F1 - Form web personale (per ristoranti su Sheets/Calendar)

**STEP 5 — Go-to-market:**
- E1 - Sito web
- E2 - Demo pubblica
- E3 - Primo cliente

---

*Ultimo aggiornamento: 2026-02-03*
