# resOS – Riepilogo completo: cosa abbiamo fatto e cosa manca

Questo documento spiega **in modo semplice e in ordine** tutto quello che abbiamo fatto per integrare resOS, quali file abbiamo toccato, e **cosa devi fare tu adesso** per finire e usare resOS come facevi con Google.

---

## 1. Cosa volevamo ottenere

**Prima:** le prenotazioni (crea, lista per telefono, lista per giorno, modifica, cancella) andavano su **Google Sheets + Google Calendar**. Vapi chiamava il nostro backend, il backend scriveva/leggeva da Google.

**Obiettivo:** poter usare **resOS** (un altro gestionale prenotazioni) invece di Google per uno o più ristoranti. Stesse operazioni (crea, lista, modifica, cancella), stesso flusso con Vapi, ma i dati vanno su resOS invece che su Google.

**Risultato:** il sistema ora può scegliere **per ogni ristorante** se usare Google Sheets, OctoTable o resOS. Per “modena01” abbiamo impostato resOS; per “roma” Google. Tu decidi in config.

---

## 2. Cosa abbiamo fatto (in ordine)

### 2.1 Creato l’adapter resOS (`src/reservations-resos.js`)

- **Cos’è:** un modulo che fa le stesse 5 cose che faceva il modulo prenotazioni con Google, ma parlando con l’**API resOS** invece che con Google.
- **Cosa fa:** quando il sistema deve creare/vedere/modificare/cancellare una prenotazione per un ristorante che usa resOS, chiama questo file. Lui:
  1. Fa il **login** a resOS (email + password che metti in `.env`) e ottiene un **token**.
  2. Usa quel token per chiamare l’API resOS (lista ristoranti/tavoli, lista prenotazioni, crea, modifica, cancella).
- **Dettaglio tecnico:** all’inizio avevamo ipotizzato un’API con “chiave API in Base64”; dalla documentazione che hai condiviso abbiamo visto che resOS usa **login email/password** e **Bearer token**, e path tipo `/api/user/login`, `/api/restaurants`, `/api/restaurants/{id}/reservations`, ecc. Abbiamo aggiornato l’adapter per usare esattamente questi endpoint e i nomi dei campi (es. `phone_number`, `guest_count`, `special_request`).

### 2.2 Modificato il “dispatcher” prenotazioni (`src/reservations.js`)

- **Prima:** il backend prenotazioni era unico per tutta l’app: o tutti i ristoranti usavano Google, o tutti OctoTable, in base a una variabile in `.env`.
- **Dopo:** per **ogni singola richiesta** (es. “crea prenotazione per modena01”) il sistema guarda in **config** quale “motore” usare per quel ristorante:
  - se in config c’è `reservations_backend: "resos"` (e in `.env` ci sono email/password resOS) → usa `reservations-resos.js`;
  - se c’è `"octotable"` (e credenziali OctoTable) → usa OctoTable;
  - altrimenti → usa Google Sheets/Calendar.
- **Risultato:** puoi avere un ristorante su resOS e un altro su Google nello stesso progetto. I tool Vapi (create_booking, list_bookings, modify_booking, cancel_booking) **non sono stati modificati**: continuano a chiamare lo stesso modulo `reservations`; è il modulo `reservations` che decide quale adapter usare in base al ristorante.

### 2.3 Aggiunto in config il “motore” per ogni ristorante (`src/config/ristoranti.json`)

- **Cosa abbiamo aggiunto:** per ogni ristorante un campo **`reservations_backend`**:
  - **roma** → `"sheets"` (continua a usare Google);
  - **modena01** → `"resos"` (usa resOS).
- **Cosa manca ancora in quel file (per resOS):** per il ristorante che usa resOS servono anche:
  - **`resos_restaurant_id`**: il **numero id** del ristorante su resOS (lo trovi in Postman con GET `/api/restaurants`).
  - **`resos_table_id`** (opzionale): il **numero id** di un tavolo (lo trovi con GET `/api/restaurants/{id}/tables`). Se non lo metti, il codice usa `1`.

### 2.4 Documentazione e script

- **Documentazione:** abbiamo creato/aggiornato dei file in `docs/resOS/` per spiegare l’API resOS, come usare Postman, e cosa fare per attivare resOS (vedi lista sotto).
- **Script di verifica:** `scripts/check-reservations-backend.js` — se lo lanci dalla root del progetto (`node scripts/check-reservations-backend.js`) ti dice quale “motore” usa ogni ristorante (sheets / resos / octotable) e prova a chiamare “lista prenotazioni per giorno” per ciascuno. Serve per controllare che il dispatcher e resOS siano configurati bene.

---

## 3. Elenco file toccati (cosa è stato creato o modificato)

| File | Cosa è successo |
|------|------------------|
| **`src/reservations-resos.js`** | **Creato.** È l’adapter che parla con l’API resOS (login, crea/lista/modifica/cancella prenotazioni). Usa `RESOS_EMAIL`, `RESOS_PASSWORD` e opzionale `RESOS_BASE_URL` da `.env`; per il ristorante legge `resos_restaurant_id` e opzionale `resos_table_id` da `ristoranti.json`. |
| **`src/reservations.js`** | **Modificato.** Non sceglie più un solo backend per tutta l’app; per ogni richiesta legge da `ristoranti.json` il `reservations_backend` del ristorante e usa l’adapter giusto (sheets, octotable o resos). Se non c’è `reservations_backend`, usa la variabile `RESERVATIONS_BACKEND` da `.env`. |
| **`src/config/ristoranti.json`** | **Modificato.** Aggiunto per ogni ristorante il campo `reservations_backend` (roma → `"sheets"`, modena01 → `"resos"`). Per far funzionare resOS su modena01 **mancano ancora** `resos_restaurant_id` e (opzionale) `resos_table_id` — li aggiungi tu con i numeri presi da Postman. |
| **`docs/resOS/resOS-API-Adapter.md`** | Creato/aggiornato. Descrive l’API resOS (login, endpoint, campi) e come si configura il progetto (env, config). |
| **`docs/resOS/resOS-Postman-Guida.md`** | Creato. Guida tecnica ai passi in Postman (login, lista ristoranti/tavoli, lista/crea/modifica/cancella prenotazioni). |
| **`docs/resOS/resOS-Guida-Semplice.md`** | Creato. Guida passo-passo in linguaggio semplice: cosa fare in Postman e cosa mettere in `.env` e `ristoranti.json`. |
| **`docs/resOS/resOS-Cosa-Fare-per-Attivare.md`** | Creato/aggiornato. Checklist: cosa è già fatto, cosa devi fare tu, cosa può andare storto. |
| **`docs/RIEPILOGO-PROGETTO-FAQ-e-OctoTable.md`** | Aggiornato. Aggiunta la parte sul “backend prenotazioni per ristorante” e il riferimento a resOS. |
| **`scripts/check-reservations-backend.js`** | Creato. Script che mostra quale backend usa ogni ristorante e prova una chiamata “lista per giorno” per ciascuno. |

**Nessun altro file del progetto è stato modificato.** I tool in `src/api/` (create_booking, list_bookings, modify_booking, cancel_booking) e tutto il resto (Vapi, FAQ, ecc.) funzionano come prima; cambia solo “chi” gestisce le prenotazioni per quel ristorante (Google o resOS).

---

## 4. API resOS reale (validata con Postman)

L’API resOS usata in produzione è **diversa** da quella “login email/password” descritta in alcune guide:

- **Auth:** Basic Auth — **Username** = API key resOS, **Password** = vuota. Nessun Bearer token.
- **Base URL:** `https://api.resos.com/v1`.
- **Endpoint:** `/bookings` (GET lista con `fromDateTime`/`toDateTime`, POST create, PUT update/cancel). PATCH e DELETE non supportati; cancel = PUT con `{ "status": "canceled" }`.
- **List by phone:** non c’è filtro nativo per telefono; l’adapter fa list per range (es. oggi → +60gg) e filtra in memoria su `guest.phone` e `restaurantId`.

Dettaglio completo: **`docs/resOS/resOS-API-Reale.md`**.

---

## 5. Cosa devi fare adesso (passi concreti)

### Passo 1 – Nel progetto: file `.env`

L’API resOS usa **Basic Auth** (API key come username, password vuota). Nessun login email/password.

Apri il file **`.env`** nella root del progetto. Assicurati che ci siano:

```env
RESERVATIONS_BACKEND=resos
RESOS_API_KEY=la_tua_api_key_resos
```

Opzionale:
- **`RESOS_BASE_URL`** — default `https://api.resos.com/v1` (se diverso, impostalo).
- **`RESOS_DEFAULT_DURATION_MINUTES`** — default `120` (durata prenotazione in minuti per la create).

### Passo 2 – Nel progetto: file `src/config/ristoranti.json`

Apri **`src/config/ristoranti.json`**. Per il ristorante che usa resOS (es. **modena01**) aggiungi:

- **`reservations_backend`:** `"resos"`.
- **`resos_restaurant_id`:** il **restaurantId** resOS (es. stringa tipo `"JLAs2CviunNCSEfbt"` — quello che usi in Postman come REST_ID).

Esempio:

```json
"modena01": {
  "name": "Da Michele",
  "kb_path": "kb/modena01.json",
  "sheet_id": "...",
  "calendar_id": "...",
  "timezone": "Europe/Rome",
  "sms_number": "+39...",
  "max_people": 4,
  "reservations_backend": "resos",
  "resos_restaurant_id": "JLAs2CviunNCSEfbt"
}
```

(Sostituisci `JLAs2CviunNCSEfbt` con il tuo restaurantId resOS.)

Salva il file.

### Passo 3 – Riavviare il server e testare

1. Ferma il server Node (se è in esecuzione).
2. Riavvialo (come lo avvii di solito, es. `node server-vapi.js` o `npm start`).
3. Prova dalla tua app o da Vapi a:
   - **creare** una prenotazione per il ristorante che usa resOS (es. modena01);
   - **vedere** le prenotazioni per telefono o per giorno;
   - **modificare** o **cancellare** una prenotazione.

Controlla i log del server: se qualcosa non va, l’errore di solito indica se il problema è login, URL, id ristorante/tavolo o formato dati.

---

## 6. Cosa significa “aver implementato resOS”

**Implementato** vuol dire:

- Il **codice** per parlare con resOS c’è (`reservations-resos.js`).
- Il **dispatcher** sa quando usare resOS per un ristorante (`reservations.js` + `reservations_backend` in config).
- La **configurazione** è completa: `.env` con email/password resOS, e in `ristoranti.json` per quel ristorante `reservations_backend: "resos"`, `resos_restaurant_id` e (opzionale) `resos_table_id`.

**Funziona tutto** quando:

- Da Vapi (o dalla tua app) riesci a **creare**, **vedere**, **modificare** e **cancellare** prenotazioni per il ristorante configurato con resOS, e le stesse prenotazioni compaiono (e si aggiornano) nel pannello resOS, come facevano su Google Sheets/Calendar.

Quindi: stesse operazioni che facevi con Google, stesso flusso con Vapi; solo il “dove” sono salvate le prenotazioni cambia (resOS invece di Google).

---

## 7. Riepilogo in 3 punti

1. **Cosa abbiamo fatto:** creato l’adapter resOS, fatto scegliere al sistema per-ristorante tra Google / OctoTable / resOS, aggiunto in config `reservations_backend` e documentazione + script di verifica. I file toccati sono quelli elencati sopra; il resto del progetto (tool Vapi, FAQ, ecc.) non è stato modificato.
2. **Cosa hai già fatto:** trovato l’URL base e fatto il login in Postman (200 OK). Ti mancano solo i due numeri (id ristorante, id tavolo) e la config nel progetto.
3. **Cosa devi fare ora:** in `.env` metti `RESERVATIONS_BACKEND=resos` e `RESOS_API_KEY=...` (la tua API key resOS); in `ristoranti.json` per il ristorante che usa resOS aggiungi `reservations_backend: "resos"` e `resos_restaurant_id` (il restaurantId resOS, es. `"JLAs2CviunNCSEfbt"`). Poi riavvii il server e provi crea/lista/modifica/cancella. Quando tutto funziona, resOS è implementato e fa tutto quello che facevi con Google + Vapi.

Se un passaggio non torna (es. GET restaurants dà errore, o il server restituisce un messaggio strano), scrivi quale passo e che messaggio vedi (in Postman o nei log) e si può andare avanti da lì.
