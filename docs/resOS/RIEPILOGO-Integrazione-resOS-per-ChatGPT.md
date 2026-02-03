# Riepilogo completo: integrazione resOS e tutto ciò che abbiamo fatto (per allineare ChatGPT)

Questo documento riassume **tutto** quello che abbiamo fatto dall’inizio dell’integrazione resOS fino a oggi: codice, regole, prompt, documentazione e test. Puoi condividerlo con ChatGPT così ha il contesto completo e rimane allineato.

---

## 1. Contesto e obiettivo

- **Prima:** prenotazioni gestite solo con Google Sheets + Google Calendar; Vapi chiamava il nostro backend, il backend scriveva/leggeva su Google.
- **Obiettivo:** usare **resOS** (gestionale prenotazioni) per uno o più ristoranti, mantenendo gli stessi tool Vapi (create_booking, list_bookings, modify_booking, cancel_booking).
- **Risultato:** il sistema sceglie **per ogni ristorante** il backend: **sheets** (Google), **octotable** o **resos**. Es.: modena01 = resOS, roma = sheets. Config in `src/config/ristoranti.json` (`reservations_backend`) e credenziali in `.env`.

---

## 2. Cosa abbiamo fatto in codice

### 2.1 Adapter resOS (`src/reservations-resos.js`)

- **Creato** un modulo che implementa le 5 funzioni del contratto prenotazioni: createReservation, listReservationsByPhone, listReservationsByDay, updateReservation, deleteReservation.
- **API resOS reale (validata con Postman):**
  - **Auth:** Basic Auth — Username = API key resOS, Password vuota. Niente Bearer token.
  - **Base URL:** `https://api.resos.com/v1`
  - **Endpoint:** `/bookings` — GET (lista con fromDateTime/toDateTime), POST (crea), PUT (update/cancel). DELETE non supportato; cancel = PUT con `{ "status": "canceled" }`.
  - **List by phone:** resOS non ha filtro per telefono; l’adapter fa GET per range di date e filtra in memoria su `guest.phone` e `restaurantId`.
- **Config:** `.env` → `RESOS_API_KEY` (obbligatorio), opz. `RESOS_BASE_URL`, `RESOS_DEFAULT_DURATION_MINUTES`. Per ristorante: `resos_restaurant_id` (ID stringa resOS, es. "JLAs2CviunNCSEfbt") in `ristoranti.json`.

**Modifiche successive in reservations-resos.js:**

- **Durata prenotazione:** non più solo da `.env`. Priorità: **KB** del ristorante (`avg_stay_minutes`) → se assente/non valido → `RESOS_DEFAULT_DURATION_MINUTES` da `.env` (default 120). Funzione `getDurationMinutes(restaurantId)` che usa `kb.getRestaurantInfo(restaurantId).avg_stay_minutes`.
- **List prenotazioni per telefono:** filtra le **prenotazioni passate** (stesso giorno con orario già passato escluse), così list_bookings restituisce solo prenotazioni future.
- **Errore resOS 422 "no suitable table found":** nel `catch` di createReservation, se il messaggio contiene "no suitable table" o "422", non restituiamo il messaggio tecnico. Restituiamo: `error_code: "NO_TABLE_AVAILABLE"`, `error_message: "Non ci sono più tavoli disponibili per quell'orario. Posso proporle un altro orario?"` — così la receptionist può rispondere in modo chiaro e proporre un altro orario.

### 2.2 Dispatcher prenotazioni (`src/reservations.js`)

- **Modificato:** per ogni richiesta il backend viene scelto **per ristorante**: legge `reservations_backend` da config (o `RESERVATIONS_BACKEND` da `.env`). Valori: "resos", "octotable", "sheets". I tool API non cambiano; cambia solo quale adapter viene chiamato.

### 2.3 API modify_booking (`src/api/modify_booking.js`)

- **Alias:** oltre a `new_day`, `new_time`, `new_people` sono accettati **day**, **time**, **people** (es. body con `"people": 3` per modificare il numero di persone).
- **Messaggio di validazione:** aggiornato per citare gli alias: "restaurant_id, booking_id e almeno uno tra new_day, new_time, new_people (o alias day, time, people) sono obbligatori".

### 2.4 API create_booking (`src/api/create_booking.js`)

- **max_people:** controllato dalla **KB** del ristorante (`kb.getRestaurantInfo(restaurant_id).max_people`). Se `people` supera il massimo → `ok: false`, `error_code: "MAX_PEOPLE_EXCEEDED"`, `error_message: "Numero massimo persone per prenotazione: X"`. La receptionist deve comunicare questo messaggio al cliente.
- Le altre validazioni (campi obbligatori, data passata, orario passato, last-minute) restano invariate. Se create_booking chiama l’adapter (resOS) e l’adapter restituisce `ok: false` (es. NO_TABLE_AVAILABLE), la risposta viene restituita al client/Vapi così com’è.

---

## 3. check_openings: come funziona la disponibilità

- **Input:** `restaurant_id`, `day` (obbligatorio), `time` (opzionale). **People non è un input** di check_openings.
- **Logica:**  
  - Usa la **KB** del ristorante: orari (`openings`, `overrides`), `max_concurrent_bookings`, `avg_stay_minutes`, `booking_cutoff_minutes`.  
  - Per sapere quante prenotazioni ci sono già nel giorno, chiama **listReservationsByDay** (che con resOS interroga il **gestionale** e ottiene l’elenco prenotazioni di quel giorno).  
  - Il backend **conta** quante prenotazioni sono “attive” all’orario richiesto (usando `avg_stay_minutes`) e confronta con `max_concurrent_bookings`.  
  - Se conteggio < max_concurrent_bookings → `available: true`, altrimenti `available: false`, `reason: "full"`, e vengono restituiti `nearest_slots`.
- **Conclusione:** la disponibilità è calcolata **da noi** (KB + elenco prenotazioni dal gestionale). Il gestionale non viene interrogato con “hai un tavolo?”; usiamo i suoi dati (le prenotazioni) e le nostre regole (KB). Per evitare il 422 “no suitable table” da resOS, in KB va impostato **max_concurrent_bookings = numero reale di tavoli** (es. 5 tavoli → 5), così quando sono pieni check_openings restituisce già available=false e la receptionist non chiama create_booking.

---

## 4. Regole e comportamenti (documentati in resOS-Riepilogo-Completo.md)

- **Orari KB vs gestionale:** check_openings usa solo la KB (orari, slot, capacità). create_booking invia al gestionale; se il gestionale rifiuta (es. orari diversi), l’errore torna con error_message e la receptionist deve comunicarlo. Consigliato allineare orari KB e gestionale.
- **Durata:** per resOS in create usiamo prima `avg_stay_minutes` dalla KB, poi `RESOS_DEFAULT_DURATION_MINUTES` da `.env`.
- **list_bookings:** restituisce solo prenotazioni future (stesso giorno con orario già passato escluse); il filtro è nell’adapter (resOS).
- **Stato “richiesta” vs “accettata”:** dipende dal gestionale (resOS); il nostro backend invia la prenotazione; eventuali stati sono gestiti da resOS.
- **Regole comuni (cutoff, max_people):** si applicano a **tutti** i backend (Sheets, OctoTable, resOS); gestite nel nostro layer (create_booking, check_openings) e nella KB.
- **Google Sheets/Calendar vs resOS:** nessun conflitto; ogni ristorante ha un solo `reservations_backend`. Stesse regole per tutti.

---

## 5. System prompt (receptionist) – modifiche

**File toccati:** `docs/System-Prompt-Receptionist_modena01.md`, `docs/System-Prompt-ReceptionistV2.md` (Roma).

- **Flow PRENOTAZIONE:**  
  - Per verificare disponibilità bastano **day** e **time**; **people** non è richiesto da check_openings (va chiesto prima di create_booking).  
  - Se **available=false** non chiamare create_booking; usare unavailability_reason e proporre nearest_slots.  
  - **Prima di create_booking:** aver già chiamato check_openings(day, time) e ottenuto **available=true**; se available=false non chiamare create_booking.  
  - Step di conferma (create_booking) è il passo 6.

- **Tool check_openings:**  
  - Chiarito che **people** non è un input (disponibilità per slot; people serve solo per create_booking).

- **Tool create_booking:**  
  - Prerequisito: aver chiamato check_openings(day, time) prima e aver ottenuto available=true.  
  - Se **ok:false:**  
    - Se **error_code** è **NO_TABLE_AVAILABLE** (o messaggio contiene "non ci sono più tavoli" / "no suitable table"): dire che non c’è più posto per quell’orario e proporre un altro orario (es. “Non abbiamo più tavoli per quell’orario. Posso controllare le 19:30 o le 21?”); se il cliente sceglie un orario, chiamare check_openings(day, nuovo_time) e poi eventualmente create_booking.  
    - Per altri errori (MAX_PEOPLE_EXCEEDED, VALIDATION_ERROR, CREATE_ERROR): usare il messaggio restituito dal tool.

- **Tool modify_booking:**  
  - Se ok:false, comunicare al cliente il motivo usando error_message (BOOKING_NOT_FOUND, VALIDATION_ERROR, UPDATE_ERROR, ecc.).

In sintesi: **disponibilità** = check_openings(day, time), senza people; **sempre** check_openings prima di create_booking; **no** create_booking se available=false; in caso di NO_TABLE_AVAILABLE, comunicare e proporre altro orario (e eventualmente richiamare check_openings).

---

## 6. Documentazione creata/aggiornata

- **docs/resOS/resOS-Riepilogo-Completo.md:** riepilogo integrazione, passi da fare (.env, ristoranti.json), API reale, sezione “Domande frequenti” (orari KB vs gestionale, durata, list passate, status, regole comuni, Sheets vs resOS, modify_booking Postman, **controllo disponibilità e NO_TABLE_AVAILABLE**).
- **docs/resOS/resOS-API-Reale.md:** dettaglio API resOS (auth, endpoint, campi).
- **docs/resOS/resOS-Test-Postman-Completo.md:** guida test Postman per verificare check_openings, create_booking (incluso max_people, validazione, data passata), list_bookings, modify_booking (alias e validazione), cancel_booking; flusso consigliato e tabella regole verificate. Riferimento modena01 (resOS); stessi test possono essere eseguiti per **roma** con backend Google Sheets/Calendar per confrontare il comportamento.
- **docs/resOS/archive/:** documentazione obsoleta (API ipotizzata con login email/password) archiviata con README.

---

## 7. Test e prossimi passi

- **Modena01 (resOS):** l’utente ha completato tutti i test della **sezione 1** (check_openings) del file resOS-Test-Postman-Completo.md. Restano da eseguire le sezioni 2–5 (create_booking, list_bookings, modify_booking, cancel_booking) e il flusso completo per assicurarsi che tutto funzioni come previsto.
- **Roma (Google Sheets/Calendar):** si vogliono eseguire **gli stessi test** (o equivalenti) anche per roma, per verificare che il comportamento (disponibilità, errori, alias modify, ecc.) sia coerente con modena01, con l’unica differenza del backend (Sheets invece di resOS).
- **Allineamento:** questo riepilogo serve a ChatGPT (e a chi lavora sul progetto) per avere tutto il contesto dall’inizio integrazione resOS fino a ora: adapter, API reale, regole, prompt, doc e test, così da rimanere allineato e poter continuare (test, Roma, eventuali correzioni) in modo coerente.

---

## 8. Riferimenti rapidi

| Cosa | Dove |
|-----|------|
| Config backend per ristorante | `src/config/ristoranti.json` → `reservations_backend`, `resos_restaurant_id` |
| Credenziali resOS | `.env` → `RESOS_API_KEY`, opz. `RESOS_BASE_URL`, `RESOS_DEFAULT_DURATION_MINUTES` |
| KB ristorante (orari, max_people, capacità) | `kb/<restaurant_id>.json` (es. `kb/modena01.json`) |
| Adapter resOS | `src/reservations-resos.js` |
| Dispatcher | `src/reservations.js` |
| Test Postman | `docs/resOS/resOS-Test-Postman-Completo.md` |
| Riepilogo utente e FAQ | `docs/resOS/resOS-Riepilogo-Completo.md` |
| Prompt modena01 / Roma | `docs/System-Prompt-Receptionist_modena01.md`, `docs/System-Prompt-ReceptionistV2.md` |
