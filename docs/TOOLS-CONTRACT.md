# TOOLS CONTRACT — Source of Truth

Contratti API di ogni tool. Questo file documenta input, output, error_code REALI del backend.
I prompt devono essere allineati 1:1 con questi contratti.

**Ultimo aggiornamento:** 2026-02-03

---

## 1. check_openings

**Endpoint:** POST `/check-openings`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | Es. "modena01", "roma" |
| `day` | string (YYYY-MM-DD) | ✅ | Data, non placeholder |
| `time` | string (HH:MM) | ❌ | Se assente, ritorna solo orari |

**Output (ok):**

```json
{
  "ok": true,
  "restaurant_id": "modena01",
  "day": "2026-02-10",
  "closed": false,
  "slots": ["19:00", "19:30", "20:00", ...],
  "lunch_range": "12:30-14:30",
  "dinner_range": "19:00-22:30",
  "requested_time": "20:00",
  "available": true,
  "reason": null,
  "nearest_slots": []
}
```

**Campi output:**

| Campo | Tipo | Quando |
|-------|------|--------|
| `closed` | boolean | Sempre. true = giorno chiuso |
| `slots` | string[] | Lista slot prenotabili |
| `lunch_range` | string/null | Fascia pranzo "HH:MM-HH:MM" |
| `dinner_range` | string/null | Fascia cena "HH:MM-HH:MM" |
| `available` | boolean/null | null se time non fornito |
| `reason` | string/null | `not_in_openings` / `cutoff` / `full` / null |
| `nearest_slots` | string[]/null | Max 3 slot alternativi (se available=false) |

**Error codes:**

| Code | Quando |
|------|--------|
| `VALIDATION_ERROR` | restaurant_id o day mancanti, day non YYYY-MM-DD, time non HH:MM, day placeholder |
| `PAST_TIME` | Orario già passato (oggi) |
| `CONFIG_ERROR` | max_concurrent_bookings o avg_stay_minutes mancanti in KB |
| `CAPACITY_READ_ERROR` | Errore lettura prenotazioni del giorno (provider down) |
| `CHECK_OPENINGS_ERROR` | Catch-all errore imprevisto |

---

## 2. create_booking

**Endpoint:** POST `/create-booking`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `day` | string (YYYY-MM-DD) | ✅ | |
| `time` | string (HH:MM) | ✅ | |
| `people` | number | ✅ | > 0 |
| `name` | string | ✅ | |
| `phone` | string | ✅ | E.164 |
| `notes` | string | ❌ | |

**Output (ok):**

```json
{
  "ok": true,
  "booking_id": "abc123",
  "day": "2026-02-10",
  "time": "20:00",
  "people": 4,
  "name": "Mario Rossi",
  "phone": "+393331234567"
}
```

**Error codes (dal backend REALE):**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | Campi mancanti, formato non valido, data/orario passato, last-minute < 10 min |
| `MAX_PEOPLE_EXCEEDED` | API handler | people > KB.max_people |
| `DUPLICATE_BOOKING` | reservations-resos | Stesso phone + day + time già presente (check preventivo) |
| `NO_TABLE_AVAILABLE` | reservations-resos | resOS 422 con "no suitable table" |
| `CREATE_ERROR` | reservations-resos / sheets | Errore generico creazione (resOS 422 diverso, Sheets errore) |
| `PROVIDER_ERROR` | reservations-resos | Risposta ambigua (booking_id non estratto), o fallback non deterministico |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `CREATE_BOOKING_ERROR` | API handler | Catch-all errore imprevisto |

**NOTA:** `PROVIDER_UNAVAILABLE` NON esiste attualmente nel backend. Il prompt lo menziona ma il codice usa solo `PROVIDER_ERROR`. Opzioni:
1. Aggiungere `PROVIDER_UNAVAILABLE` nel backend (per timeout/connessione)
2. Oppure mappare tutto su `PROVIDER_ERROR` nel prompt

**Decisione: → da implementare in A6 (Provider health check)**

---

## 3. list_bookings

**Endpoint:** POST `/list-bookings`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `phone` | string | ✅ | E.164 |

**Output (ok):**

```json
{
  "ok": true,
  "count": 2,
  "bookings": [
    {
      "booking_id": "abc123",
      "day": "2026-02-10",
      "time": "20:00",
      "people": 4,
      "name": "Mario Rossi",
      "phone": "+393331234567",
      "notes": null
    }
  ]
}
```

**Note:** Restituisce SOLO prenotazioni future (day >= oggi). Backend filtra automaticamente.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o phone mancanti |
| `LIST_ERROR` | reservations-resos / sheets | Errore durante query |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `LIST_BOOKINGS_ERROR` | API handler | Catch-all |

---

## 4. modify_booking

**Endpoint:** POST `/modify-booking`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `booking_id` | string | ✅ | Da list_bookings |
| `new_day` | string (YYYY-MM-DD) | ❌ | Alias: `day` |
| `new_time` | string (HH:MM) | ❌ | Alias: `time` |
| `new_people` | number | ❌ | Alias: `people` |

**Almeno uno** tra new_day, new_time, new_people è obbligatorio.

**Output (ok):**

```json
{
  "ok": true,
  "booking_id": "abc123",
  "day": "2026-02-11",
  "time": "21:00",
  "people": 3,
  "name": "Mario Rossi",
  "phone": "+393331234567",
  "notes": null
}
```

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | Campi obbligatori mancanti, new_people non positivo |
| `BOOKING_NOT_FOUND` | reservations-resos / sheets | booking_id non trovato |
| `UPDATE_ERROR` | reservations-resos / sheets | Errore durante modifica (resOS rifiuta, Sheets errore) |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `MODIFY_BOOKING_ERROR` | API handler | Catch-all |

---

## 5. cancel_booking

**Endpoint:** POST `/cancel-booking`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `booking_id` | string | ✅ | Da list_bookings |

**Output (ok):**

```json
{
  "ok": true,
  "booking_id": "abc123",
  "message": "Prenotazione cancellata."
}
```

**Note:** Per resOS, cancel = PUT con `status: "canceled"`. Per Sheets, elimina la riga.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o booking_id mancanti |
| `BOOKING_NOT_FOUND` | reservations-resos / sheets | booking_id non trovato |
| `DELETE_ERROR` | reservations-resos / sheets | Errore durante cancellazione |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `CANCEL_BOOKING_ERROR` | API handler | Catch-all |

---

## 6. faq

**Endpoint:** POST `/faq`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `question` | string | ✅ | Domanda del cliente |

**Output (ok):**

```json
{
  "ok": true,
  "answer": "Sì, abbiamo parcheggio privato.",
  "source": "kb"
}
```

**Se nessun match (threshold < 0.6):**

```json
{
  "ok": true,
  "answer": null,
  "source": null
}
```

**Note:** `answer: null` = nessuna FAQ corrisponde. Il prompt deve dire "Non ho questa informazione disponibile" e NON inventare.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o question mancanti |
| `FAQ_ERROR` | API handler | Catch-all |

---

## 7. is_open_now

**Endpoint:** POST `/is-open-now`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |

**Output (ok):**

```json
{
  "ok": true,
  "open_now": true,
  "next_opening_time": null
}
```

Se chiuso:

```json
{
  "ok": true,
  "open_now": false,
  "next_opening_time": "19:00"
}
```

**Note:** `next_opening_time` = prossima apertura OGGI (null se nessuna o se già aperto). Usato per handover: open_now=true → transfer ok; open_now=false → no transfer.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id mancante |
| `RESTAURANT_NOT_FOUND` | API handler | restaurant_id non in KB |
| `INTERNAL_ERROR` | API handler | Errore imprevisto |

---

## 8. resolve_relative_day

**Endpoint:** POST `/resolve-relative-day`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `text` | string | ✅ | Es. "domani", "sabato", "tra 3 giorni" |

**Output (ok):**

```json
{
  "ok": true,
  "date": "2026-02-04",
  "ambiguous": false
}
```

**Espressioni supportate:**
- "oggi", "domani", "dopodomani"
- "tra/fra X giorni" (numero o parola italiana)
- "tra/fra una settimana"
- Weekday: "lunedì", "martedì", ..., "domenica" (+ "prossimo/a")

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o text mancanti |
| `UNSUPPORTED_RELATIVE_DAY` | Parser | Espressione non riconosciuta |

---

## 9. resolve_relative_time

**Endpoint:** POST `/resolve-relative-time`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `text` | string | ✅ | Es. "tra mezz'ora", "fra 2 ore" |

**Output (ok):**

```json
{
  "ok": true,
  "time": "20:30",
  "day_offset": 0,
  "ambiguous": false
}
```

**Note:** `day_offset` = 0 (stesso giorno) o 1 (giorno dopo, es. "tra un'ora" a 23:30 → 00:30 con day_offset=1).

**Espressioni supportate:**
- "tra/fra mezz'ora"
- "tra/fra un'ora"
- "tra/fra X minuti"
- "tra/fra X ore"
- "tra/fra X ore e mezza"
- "tra/fra X ore e Y minuti"

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o text mancanti |
| `VAGUE_TIME` | Parser | "verso", "più tardi", "tra un po'" |
| `UNSUPPORTED_RELATIVE_TIME` | Parser | Espressione non riconosciuta |

---

## RIEPILOGO ERROR CODES — TUTTI I CODICI CHE IL BACKEND PUÒ RESTITUIRE

### Error codes che il PROMPT deve gestire (user-facing)

| Code | Tool | Messaggio user-facing | Azione |
|------|------|-----------------------|--------|
| `VALIDATION_ERROR` | tutti | "Mi manca un dato" / specifico | Chiedere dato mancante |
| `MAX_PEOPLE_EXCEEDED` | create_booking | "Massimo X persone per prenotazione" | Proporre di dividere |
| `NO_TABLE_AVAILABLE` | create_booking | "Non ci sono tavoli per quell'orario" | Proporre altro slot |
| `DUPLICATE_BOOKING` | create_booking | "Risulta già una prenotazione con questi dati" | Chiedere se modificare |
| `CREATE_ERROR` | create_booking | "Non riesco a completare la prenotazione" | Proporre retry o handover |
| `PROVIDER_ERROR` | create_booking | "Errore tecnico" | Handover se aperto |
| `BOOKING_NOT_FOUND` | modify/cancel | "Non trovo quella prenotazione" | Chiedere altro riferimento |
| `UPDATE_ERROR` | modify_booking | "Non riesco a modificare la prenotazione" | Handover |
| `DELETE_ERROR` | cancel_booking | "Non riesco a cancellare la prenotazione" | Handover |
| `PAST_TIME` | check_openings | "L'orario indicato è già passato" | Chiedere altro orario |
| `UNSUPPORTED_RELATIVE_DAY` | resolve_relative_day | "Non riesco a capire il giorno" | Chiedere data esplicita |
| `UNSUPPORTED_RELATIVE_TIME` | resolve_relative_time | "Non riesco a capire l'orario" | Chiedere orario esatto |
| `VAGUE_TIME` | resolve_relative_time | "Mi indica un orario esatto?" | Chiedere HH:MM |

### Error codes tecnici (NON user-facing, solo log)

| Code | Tool | Significato |
|------|------|-------------|
| `CONFIG_ERROR` | check_openings | Parametri capacity mancanti in KB |
| `CAPACITY_READ_ERROR` | check_openings | Provider non raggiungibile per conteggio prenotazioni |
| `RESOS_NOT_CONFIGURED` | create/list/modify/cancel | API key resOS mancante |
| `SHEET_NOT_FOUND` | modify/cancel (sheets) | Sheet non trovato |
| `RESTAURANT_NOT_FOUND` | is_open_now | restaurant_id non in KB |
| `LIST_ERROR` | list_bookings | Errore query provider |
| `LIST_BY_DAY_ERROR` | check_openings | Errore lettura prenotazioni giorno |
| `CHECK_OPENINGS_ERROR` | check_openings | Catch-all |
| `CREATE_BOOKING_ERROR` | create_booking | Catch-all |
| `LIST_BOOKINGS_ERROR` | list_bookings | Catch-all |
| `MODIFY_BOOKING_ERROR` | modify_booking | Catch-all |
| `CANCEL_BOOKING_ERROR` | cancel_booking | Catch-all |
| `FAQ_ERROR` | faq | Catch-all |
| `INTERNAL_ERROR` | is_open_now | Catch-all |

### Error codes nel PROMPT ma NON nel backend

| Code | Status | Azione |
|------|--------|--------|
| `PROVIDER_UNAVAILABLE` | ✅ Implementato in A6 | Timeout (15s resOS) o errore rete → "Sistema non raggiungibile" |

---

## CONTRATTO IDEMPOTENZA (A5)

| Backend | Comportamento | Status |
|---------|---------------|--------|
| resOS | Check preventivo `listReservationsByPhone` prima di `createReservation`. Se stesso phone+day+time → `DUPLICATE_BOOKING` | ✅ Implementato |
| Sheets | Check preventivo `listReservationsByPhone` prima di `createReservation`. Se stesso phone+day+time → `DUPLICATE_BOOKING` | ✅ Implementato |
| OctoTable | Da verificare | ❌ Non verificato |

---

## CONTRATTO CANCEL IDEMPOTENZA

| Backend | Comportamento |
|---------|---------------|
| resOS | PUT status="canceled". Se già canceled → `BOOKING_NOT_FOUND` (non idempotente) |
| Sheets | Elimina riga. Se già eliminata → `BOOKING_NOT_FOUND` (non idempotente) |

**Nota:** cancel_booking NON è idempotente. Se booking_id già cancellato → errore.

---

*Questo file è la source of truth per i contratti API. I prompt DEVONO essere allineati con questo file.*
