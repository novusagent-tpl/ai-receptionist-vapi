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

## Fase G — Espansione canali

### G1. WhatsApp Business chatbot
**Obiettivo:** Aggiungere un canale WhatsApp al sistema esistente, riutilizzando lo stesso backend e tools.

**Cosa serve:**
- [ ] Connettore WhatsApp Business API (Meta Cloud API o provider tipo Twilio/360dialog)
- [ ] Webhook per ricevere messaggi WhatsApp → inoltrare al backend come se fossero chiamate Vapi
- [ ] Adapter per formattare le risposte AI in testo (senza TTS)
- [ ] Gestione sessioni (conversation_id per ogni chat WhatsApp)
- [ ] Stesse regole di business (orari, capacità, FAQ) già presenti nel backend

**Vantaggi:** Backend e tools identici, nessuna duplicazione di logica. Solo un nuovo "connettore" di ingresso.

**Status:** [ ] Da fare (dopo lancio voce)

---

## Fase H — Miglioramenti backend pre-produzione

### H1. Label fasce orarie personalizzabili nel KB
**Obiettivo:** Rendere i label delle fasce orarie configurabili per ristorante (es. "colazione", "brunch", "apertura continua") invece di usare sempre "pranzo"/"cena" fissi.

**Problema attuale:** Il backend genera `message` con label fissi "pranzo" e "cena". Se un ristorante fa colazione 8-12, il message dice "pranzo dalle 8 alle 12" — sbagliato. Se è aperto in continuo 11-22, dice "cena dalle 11 alle 22" — fuorviante.

**Cosa serve:**
- [ ] Aggiungere campo `label` opzionale nel KB per ogni fascia (default: "pranzo"/"cena" se non specificato)
- [ ] Aggiornare `formatRangesText` e `findNextOpenDay` in `check_openings.js` per usare il label dal KB
- [ ] Aggiornare `time-utils.js` se necessario
- [ ] Nessuna modifica ai tool Vapi o al system prompt

**Esempio KB:**
```json
"monday": {
  "lunch": { "range": ["08:00", "12:00"], "label": "colazione" },
  "dinner": { "range": ["17:00", "23:00"], "label": "cena" }
}
```

**Priorità:** 🟠 MEDIA-ALTA (necessario per ristoranti reali con orari non standard)

**Status:** [ ] Da fare (dopo chiusura test Roma)

---

### H2. SMS template backend (non generati dall'AI)
**Obiettivo:** Spostare la generazione del testo SMS dal modello LLM al backend, con template fissi per ogni tipo di evento (creazione, modifica, cancellazione). Includere disclaimer sul numero mittente.

**Problema attuale:** L'AI compone il testo dell'SMS e lo passa a `send_sms`. Il testo può variare ogni volta, essere troppo lungo/corto, o contenere errori. Il cliente potrebbe confondere il numero Twilio con quello del ristorante.

**Cosa serve:**
- [ ] Template SMS fissi nel backend per: conferma prenotazione, modifica, cancellazione
- [ ] Il template include automaticamente i dati dalla prenotazione (giorno, ora, persone, nome, ristorante)
- [ ] Footer standard in ogni SMS: "Questo numero è solo per messaggi. Per contattare il ristorante: [telefono ristorante dalla KB]"
- [ ] Un unico numero Twilio mittente per tutti i ristoranti (costo ridotto)
- [ ] Il tool `send_sms` cambia: l'AI passa solo `restaurant_id`, `to`, `type` (confirm/modify/cancel) e `booking_id` — il backend compone il messaggio
- [ ] Oppure: l'SMS parte automaticamente dal backend dopo `create_booking`/`modify_booking`/`cancel_booking` senza che l'AI lo chiami (approccio più robusto)

**Esempio SMS:**
```
Prenotazione confermata!
📅 Giovedì 20 febbraio, ore 20:30
👥 3 persone - Marco
🍽️ Ristorante Roma

Per contattare il ristorante: +39 06 1234567
Questo numero è solo per messaggi automatici.
```

**Priorità:** 🟡 MEDIA (miglioramento UX, non bloccante per lancio)

**Status:** [ ] Da fare

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
| G1 | WhatsApp Business chatbot | 🟡 MEDIA | D2, lancio voce | [ ] |
| H1 | Label fasce orarie personalizzabili | 🟠 MEDIA-ALTA | D2 | [ ] |
| H2 | SMS template backend + disclaimer numero | 🟡 MEDIA | - | [ ] |

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
- H1 - Label fasce orarie personalizzabili (per ristoranti con colazione, brunch, apertura continua)
- B4 - GDPR / Privacy
- B5 - Security review finale
- B6 - Rate limiting (prima di demo pubblica)
- F1 - Form web personale (per ristoranti su Sheets/Calendar)

**STEP 5 — Go-to-market:**
- E1 - Sito web
- E2 - Demo pubblica
- E3 - Primo cliente

**STEP 6 — Espansione canali (dopo lancio voce):**
- G1 - WhatsApp Business chatbot (stesso backend/tools, nuovo connettore)

---

## PACCHETTI COMMERCIALI E AUTOMAZIONI PREMIUM

### Struttura a 3 livelli

**BASE — "Segretaria" (~69/mese, 100 min inclusi, extra 0,20/min)**

L'AI risponde al telefono, gestisce FAQ e trasferisce allo staff per le prenotazioni.

- AI risponde 24/7
- FAQ (orari, indirizzo, menu, parcheggio, allergie, eventi)
- Trasferimento chiamata allo staff
- NO gestione prenotazioni (trasferisce)
- NO SMS conferma
- Target: ristorante che vuole non perdere chiamate ma gestisce le prenotazioni internamente

**PRO — "Receptionist" (~149/mese, 250 min inclusi, extra 0,18/min)**

L'AI gestisce tutto: prenotazioni, modifiche, cancellazioni, FAQ. Lo staff non risponde al telefono.

- Tutto BASE +
- Crea/modifica/cancella prenotazioni
- Verifica disponibilita in tempo reale
- SMS conferma prenotazione
- Collegamento al gestionale (resOS, OctoTable, Google Sheets)
- Report mensile (chiamate, prenotazioni, orari di punta, tasso conversione)
- Target: ristorante che vuole automatizzare completamente la gestione telefonica

**PREMIUM — "Direttore di Sala AI" (~249/mese, 500 min inclusi, extra 0,15/min)**

Tutto PRO + automazioni avanzate per ridurre no-show, ottenere recensioni e raggiungere piu clienti.

- Tutto PRO +
- Promemoria prenotazione automatico (anti no-show)
- Richiesta recensione automatica post-visita
- Canale WhatsApp (prenotazione via chat)
- Multilingua (italiano + inglese per turisti)
- Target: ristorante con alto volume, clientela turistica, o problema no-show

### Note sui prezzi

- I minuti inclusi coprono le chiamate AI (Vapi LLM + TTS + transcriber + Twilio telefonia)
- Il costo reale per minuto e circa 0,13-0,17 EUR
- Il gestionale (resOS, OctoTable) non e incluso — il ristorante usa il suo o Google Sheets (gratis)
- Il risparmio per il ristorante: una persona al telefono costa 1.200-1.500 EUR/mese (part-time)

---

## Fase I — Automazioni Premium

### I1. Promemoria prenotazione automatico (anti no-show)

**Obiettivo:** 24 ore prima della prenotazione, mandare SMS (o WhatsApp) al cliente per ricordargli la prenotazione e dargli la possibilita di confermare o cancellare.

**Perche serve:** I no-show costano ai ristoranti migliaia di euro/anno. Ridurli del 30-40% con un semplice promemoria giustifica da solo il costo del pacchetto Premium.

**Messaggio tipo:**
```
Promemoria: domani, giovedi 20 febbraio, ore 20:30
4 persone - nome Marco
Ristorante Roma

Per cancellare o modificare, chiami il [numero ristorante].
```

**Implementazione:**
- [ ] Endpoint `/cron/reminders` nel backend attuale (stesso progetto Node.js)
- [ ] Il cron legge le prenotazioni del giorno dopo da tutti i gestionali (Sheets, resOS, OctoTable)
- [ ] Per ogni prenotazione, manda SMS via Twilio (o WhatsApp se Premium)
- [ ] Cron esterno (es. cron-job.org gratuito) chiama l'endpoint ogni 30 minuti
- [ ] Flag `reminder_sent` per non mandare duplicati
- [ ] Template SMS fisso (non generato dall'AI)
- [ ] Configurabile per ristorante: on/off, quante ore prima (default 24h)
- [ ] Log: `reminder_sent`, `reminder_failed` con restaurant_id e booking_id

**Non passa da Vapi** — e puro backend (lettura prenotazioni + invio Twilio).

**Priorita:** MEDIA (feature Premium, non bloccante per lancio BASE/PRO)

**Status:** [ ] Da fare

---

### I2. Richiesta recensione automatica post-visita

**Obiettivo:** 2-3 ore dopo l'orario della prenotazione, mandare SMS (o WhatsApp) al cliente con link diretto alla pagina recensioni Google del ristorante.

**Perche serve:** Le recensioni Google sono fondamentali per i ristoranti. Chiedere al momento giusto (subito dopo la cena) aumenta il tasso di risposta. I ristoranti lo farebbero manualmente ma non hanno tempo.

**Messaggio tipo:**
```
Grazie per aver cenato da Ristorante Roma!
Se le e piaciuta l'esperienza, ci farebbe piacere una recensione:
[link Google Reviews]

A presto!
```

**Implementazione:**
- [ ] Endpoint `/cron/reviews` nel backend attuale
- [ ] Il cron legge le prenotazioni di oggi il cui orario e passato da almeno 2-3 ore
- [ ] Per ogni prenotazione, manda SMS con link recensione
- [ ] Link Google Reviews configurabile per ristorante nella KB (`google_reviews_url`)
- [ ] Flag `review_request_sent` per non mandare duplicati
- [ ] Template SMS fisso
- [ ] Configurabile per ristorante: on/off, ore di ritardo (default 3h)
- [ ] Non mandare se la prenotazione e stata cancellata
- [ ] Log: `review_request_sent`, `review_request_failed`

**Non passa da Vapi** — e puro backend.

**Priorita:** MEDIA (feature Premium)

**Status:** [ ] Da fare

---

### I3. Report mensile (PRO + Premium)

**Obiettivo:** Generare un report mensile con statistiche sulle chiamate e prenotazioni per ogni ristorante.

**Metriche nel report:**
- Chiamate totali / media giornaliera
- Prenotazioni create / modificate / cancellate
- Orari di punta (quali ore ricevono piu chiamate)
- Tasso di conversione (chiamate -> prenotazioni)
- Motivi di rifiuto piu frequenti (SLOT_FULL, OUTSIDE_HOURS, MAX_PEOPLE_EXCEEDED)
- No-show (se tracciati)
- Confronto con mese precedente

**Implementazione:**
- [ ] Endpoint `/api/report` o `/cron/monthly-report` nel backend
- [ ] Aggregazione dati dai log strutturati (gia presenti: success, rejected, error con restaurant_id)
- [ ] Output: JSON (per dashboard) o PDF/email (per il ristorante)
- [ ] Cron mensile (1 del mese) o on-demand via API
- [ ] Disponibile per PRO e Premium

**Priorita:** MEDIA

**Status:** [ ] Da fare

---

### Architettura automazioni

Tutte le automazioni (I1, I2, I3) vivono nello stesso backend Node.js su Render.
Non passano da Vapi. Sono job schedulati attivati da un cron esterno.

```
Cron esterno (cron-job.org)
  |
  |-- ogni 30 min --> GET /cron/reminders  (I1)
  |-- ogni 30 min --> GET /cron/reviews    (I2)
  |-- 1 del mese --> GET /cron/report      (I3)
  |
  v
Backend Node.js (Render)
  |
  |-- Legge prenotazioni da Sheets/resOS/OctoTable
  |-- Manda SMS via Twilio
  |-- Manda WhatsApp via Twilio/Meta API (se Premium)
  |-- Genera report da log strutturati
```

WhatsApp in entrata (G1) e un discorso separato: richiede un webhook che riceve messaggi
e li elabora con lo stesso backend/tools delle chiamate Vapi.

---

## RIEPILOGO PACCHETTI vs FEATURE

| Feature | BASE | PRO | PREMIUM | Fase |
|---------|------|-----|---------|------|
| AI risponde 24/7 | Si | Si | Si | Fatto |
| FAQ | Si | Si | Si | Fatto |
| Trasferimento staff | Si | Si | Si | Fatto |
| Gestione prenotazioni | - | Si | Si | Fatto |
| SMS conferma | - | Si | Si | H2 |
| Report mensile | - | Si | Si | I3 |
| Promemoria anti no-show | - | - | Si | I1 |
| Richiesta recensione | - | - | Si | I2 |
| Canale WhatsApp | - | - | Si | G1 |
| Multilingua | - | - | Si | Config voce/prompt |

---

## CONTROLLO OPERATIVO E SICUREZZA (7 PUNTI)

Questa sezione riassume i 7 controlli chiave per gestire il servizio in modo affidabile nei ristoranti reali.

### S1. Conferma prenotazione solo con `ok:true` + `booking_id`
- **Stato attuale:** [~] Parzialmente fatto
- **Gia presente:** backend ritorna `ok` e `booking_id` quando la creazione va a buon fine
- **Manca per 100%:** enforcement lato prompt e checklist operativa che vieta conferme vocali senza esito tool positivo
- **Target completamento:** prima del rollout su piu ristoranti

### S2. Messaggio al cliente basato su `message` backend
- **Stato attuale:** [~] Parzialmente fatto
- **Gia presente:** regole prompt `REGOLA MESSAGE` e `REGOLA TIME_HUMAN`
- **Manca per 100%:** monitor dei casi in cui il modello riformula comunque il testo
- **Target completamento:** continuo (monitoraggio settimanale)

### S3. Riconciliazione automatica tool success vs record reale
- **Stato attuale:** [ ] Non fatto
- **Gia presente:** log strutturati e ID prenotazione
- **Manca per 100%:** job automatico che verifica mismatch tra log e stato reale su gestionale/Sheets
- **Target completamento:** alta priorita (prima di scalare oltre il primo pilota)

### S4. Alert automatici su anomalie
- **Stato attuale:** [ ] Non fatto
- **Gia presente:** metriche e log backend
- **Manca per 100%:** notifiche automatiche (Telegram/Email) su error rate alto, mismatch, provider failure
- **Target completamento:** alta priorita (dopo primo pilota, prima di vendita multipla)

### S5. Dashboard operativa semplice (non tecnica)
- **Stato attuale:** [~] Parzialmente fatto
- **Gia presente:** dati nei log e in `/metrics`
- **Manca per 100%:** vista giornaliera semplice con KPI minimi (chiamate, create, errori, handover)
- **Target completamento:** media priorita (fase PRO/Premium)

### S6. Fallback umano sempre disponibile
- **Stato attuale:** [x] Fatto
- **Gia presente:** transfer call tool + flussi handover
- **Manca per 100%:** verifica onboarding per ogni nuovo ristorante (numero corretto + test trasferimento)
- **Target completamento:** mantenimento continuo

### S7. Rollout progressivo (pilot-first)
- **Stato attuale:** [x] Definito come strategia
- **Gia presente:** approccio pilota e test incrementali
- **Gia presente (infrastruttura):** `release_channel` per tenant (`stable/canary`) + helper backend + log `release_channel`
- **Scelta operativa attuale:** canary via service separato Render (`backend-canary`) con switch URL tool su 1-2 tenant
- **Manca per 100%:** usare regolarmente il canary ad ogni release + eventuale collegamento feature-flag reale a `release_channel`
- **Target completamento:** prima dell'espansione commerciale

### Stato sintetico
- **Fatti:** S6, S7 (strategia)
- **Parziali:** S1, S2, S5
- **Da fare:** S3, S4

### Processo release sicure (obbligatorio da ora)
- [x] Strategia pilot-first (1 ristorante canary)
- [x] Workflow staging -> produzione -> canary -> promozione globale
- [x] Procedura rollback backend + prompt
- [ ] Alert automatici hourly su errori/mismatch (S4)
- [ ] Riconciliazione automatica booking/log (S3)

Documenti operativi:
- `docs/GO-LIVE-RUNBOOK.md`
- `docs/STAGING-GUIDE.md`

---

*Ultimo aggiornamento: 2026-02-19*
