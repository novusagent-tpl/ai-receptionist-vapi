# TOOLS CONTRACT — Source of Truth

Contratti API di ogni tool. Questo file documenta input, output, error_code REALI del backend.
I prompt devono essere allineati 1:1 con questi contratti.

**Ultimo aggiornamento:** 2026-02-18

---

## Nota: Payload Vapi vs HTTP

Il backend restituisce due payload diversi:
- **HTTP/Postman**: risposta completa con tutti i campi (per debug e regression test)
- **Vapi**: risposta ridotta con solo i campi che l'AI deve leggere (message, day_label, time_human, ecc.)

I campi `slots`, `lunch_range`, `dinner_range`, `nearest_slots` (raw HH:MM) sono presenti **solo nella risposta HTTP**. Il payload Vapi contiene `nearest_slots_human` al posto di `nearest_slots`.

---

## 1. check_openings

**Endpoint:** POST `/api/check_openings`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | Es. "modena01", "roma" |
| `day` | string (YYYY-MM-DD) | ✅ | Data, non placeholder |
| `time` | string (HH:MM) | ❌ | Se assente, ritorna solo orari |
| `expected_weekday` | string | ❌ | Giorno settimana indicato dal cliente (es. "giovedì"). Se presente, il backend verifica che `day` corrisponda. Se mismatch → WEEKDAY_MISMATCH. |

**Output HTTP (ok):**

```json
{
  "ok": true,
  "restaurant_id": "roma",
  "day": "2026-02-19",
  "day_label": "giovedì 19 febbraio",
  "closed": false,
  "slots": ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"],
  "lunch_range": null,
  "dinner_range": ["19:00", "22:30"],
  "requested_time": "20:00",
  "time_human": "20",
  "available": true,
  "reason": null,
  "nearest_slots": [],
  "nearest_slots_human": null,
  "max_people": 8,
  "message": "Disponibile."
}
```

**Output Vapi (ok) — campi ridotti:**

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-19",
  "day_label": "giovedì 19 febbraio",
  "closed": false,
  "requested_time": "20:00",
  "time_human": "20",
  "available": true,
  "reason": null,
  "nearest_slots_human": null,
  "max_people": 8,
  "message": "Disponibile."
}
```

**Campi output:**

| Campo | Tipo | Presente in | Quando/Note |
|-------|------|-------------|-------------|
| `closed` | boolean | HTTP + Vapi | Sempre. true = giorno chiuso |
| `day_label` | string | HTTP + Vapi | Sempre. Es. "giovedì 19 febbraio". L'AI deve usare SOLO questo per comunicare la data. |
| `message` | string | HTTP + Vapi | Sempre. Frase italiana pronta per il cliente. L'AI usa questo come base per la risposta. |
| `time_human` | string/null | HTTP + Vapi | Se time presente. Es. "20 e 30" per 20:30, "19" per 19:00. |
| `nearest_slots_human` | string[]/null | Vapi | Se available=false e ci sono alternative. Es. ["19", "19 e 30", "20"]. |
| `max_people` | number | HTTP + Vapi | Sempre. Max persone per prenotazione online dal KB. |
| `available` | boolean/null | HTTP + Vapi | null se time non fornito |
| `reason` | string/null | HTTP + Vapi | `closed` / `not_in_openings` / `cutoff` / `full` / null |
| `slots` | string[] | Solo HTTP | Lista slot di apertura |
| `lunch_range` | array/null | Solo HTTP | Fascia pranzo [HH:MM, HH:MM] |
| `dinner_range` | array/null | Solo HTTP | Fascia cena [HH:MM, HH:MM] |
| `nearest_slots` | string[] | Solo HTTP | Slot alternativi in formato HH:MM |

**Quando closed=true, campi aggiuntivi:**

| Campo | Tipo | Presente in | Note |
|-------|------|-------------|------|
| `next_open_day` | string | HTTP + Vapi | Prossimo giorno aperto (YYYY-MM-DD) |
| `next_open_day_label` | string | HTTP + Vapi | Es. "lunedì 24 febbraio" |
| `next_open_ranges` | object | HTTP + Vapi | Es. `{ "lunch": null, "dinner": "19 alle 22 e 30" }` |

Questi campi sono inclusi anche nel `message` (es. "Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì 24 febbraio con cena dalle 19 alle 22 e 30.").

**Output WEEKDAY_MISMATCH:**

```json
{
  "ok": false,
  "error_code": "WEEKDAY_MISMATCH",
  "message": "La data 2026-02-23 è lunedì 23 febbraio, non giovedì. Il prossimo giovedì è giovedì 19 febbraio.",
  "corrected_day": "2026-02-19",
  "corrected_day_label": "giovedì 19 febbraio"
}
```

L'AI deve richiamare check_openings silenziosamente con `corrected_day`. Non comunicare l'errore al cliente.

**Logica `message` per stato:**

| Stato | Esempio message |
|-------|----------------|
| `closed=true` | "Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì 24 febbraio con cena dalle 19 alle 22 e 30." |
| `available=true` | "Disponibile." |
| `reason=not_in_openings` | "Questo orario non è disponibile. Orari più vicini: 19, 19 e 30, 20." |
| `reason=cutoff` | "Questo orario è troppo vicino alla chiusura. Orari più vicini: 21 e 30, 22." |
| `reason=full` | "Nessun tavolo disponibile a quest'ora. Orari più vicini: 20 e 30, 21." |
| Solo day, no time | "Orari di apertura: cena dalle 19 alle 22 e 30." |

**Error codes:**

| Code | Quando |
|------|--------|
| `VALIDATION_ERROR` | restaurant_id o day mancanti, day non YYYY-MM-DD, time non HH:MM, day placeholder |
| `PAST_TIME` | Orario già passato (oggi) |
| `PAST_DATE` | Data già passata |
| `WEEKDAY_MISMATCH` | expected_weekday non corrisponde al giorno reale della data. Restituisce corrected_day e corrected_day_label. |
| `CONFIG_ERROR` | max_concurrent_bookings o avg_stay_minutes mancanti in KB |
| `CAPACITY_READ_ERROR` | Errore lettura prenotazioni del giorno (provider down) |
| `CHECK_OPENINGS_ERROR` | Catch-all errore imprevisto |

---

## 2. create_booking

**Endpoint:** POST `/api/create_booking`

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
  "day": "2026-02-19",
  "day_label": "giovedì 19 febbraio",
  "time": "20:00",
  "time_human": "20",
  "people": 4,
  "name": "Mario Rossi",
  "phone": "+393331234567",
  "message": "Prenotazione confermata per giovedì 19 febbraio alle 20, 4 persone a nome Mario Rossi."
}
```

**Campi output nuovi (v1.4+):**

| Campo | Tipo | Note |
|-------|------|------|
| `day_label` | string | Es. "giovedì 19 febbraio" |
| `time_human` | string | Es. "20 e 30" per 20:30, "20" per 20:00 |
| `message` | string | Frase di conferma italiana pronta. L'AI usa questo per confermare. |

**Per Sheets: verifica capacità server-side.** Prima di scrivere, il backend controlla:
- L'orario è dentro gli slot di apertura? Se no → `OUTSIDE_HOURS` con `nearest_slots_human`
- La capacità (max_concurrent_bookings) è piena? Se sì → `SLOT_FULL` con `nearest_slots_human`

Quando `SLOT_FULL` o `OUTSIDE_HOURS`, la risposta include `nearest_slots_human` (formato italiano parlato, es. ["19", "19 e 30"]) per proporre alternative senza HH:MM raw.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | Campi mancanti, formato non valido, data/orario passato |
| `MAX_PEOPLE_EXCEEDED` | API handler | people > KB.max_people |
| `DUPLICATE_BOOKING` | tutti i backend | Stesso phone + day + time già presente |
| `NO_TABLE_AVAILABLE` | reservations-resos | resOS 422 con "no suitable table" |
| `SLOT_FULL` | reservations-sheets | Capacità esaurita per Sheets. Include nearest_slots. |
| `OUTSIDE_HOURS` | reservations-sheets | Orario fuori dagli slot di apertura per Sheets. |
| `CREATE_ERROR` | tutti | Errore generico creazione |
| `PROVIDER_ERROR` | reservations-resos | Risposta ambigua o errore provider |
| `PROVIDER_UNAVAILABLE` | tutti | Timeout o errore connessione verso provider |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `CREATE_BOOKING_ERROR` | API handler | Catch-all errore imprevisto |

---

## 3. list_bookings

**Endpoint:** POST `/api/list_bookings`

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
  "message": "Ho trovato 2 prenotazioni: giovedì 19 febbraio alle 20 e 30, sabato 21 febbraio alle 21.",
  "results": [
    {
      "booking_id": "abc123",
      "day": "2026-02-19",
      "day_label": "giovedì 19 febbraio",
      "time": "20:30",
      "time_human": "20 e 30",
      "people": 4,
      "name": "Mario Rossi",
      "phone": "+393331234567",
      "notes": null
    }
  ]
}
```

**Campi output nuovi (v1.3+):**

| Campo | Tipo | Note |
|-------|------|------|
| `message` | string (top-level) | Riepilogo italiano pronto. L'AI usa questo come base. |
| `day_label` | string (per prenotazione in `results`) | Es. "giovedì 19 febbraio" |
| `time_human` | string (per prenotazione in `results`) | Es. "20 e 30" |

**Nota:** L'array delle prenotazioni è nel campo `results` (non `bookings`).

**Note:**
- Restituisce SOLO prenotazioni future (day >= oggi). Backend filtra automaticamente.
- Per resOS: filtra prenotazioni con status "canceled" o "deleted". Solo "approved" vengono mostrate.
- L'AI deve usare `day_label` per riferirsi al giorno. MAI calcolare il giorno della settimana dalla data ISO.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o phone mancanti |
| `LIST_ERROR` | tutti | Errore durante query |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `LIST_BOOKINGS_ERROR` | API handler | Catch-all |

---

## 4. modify_booking

**Endpoint:** POST `/api/modify_booking`

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
  "day": "2026-02-21",
  "day_label": "sabato 21 febbraio",
  "time": "21:00",
  "time_human": "21",
  "people": 3,
  "name": "Mario Rossi",
  "phone": "+393331234567",
  "message": "Prenotazione modificata: sabato 21 febbraio alle 21."
}
```

**Campi output nuovi (v1.4+):**

| Campo | Tipo | Note |
|-------|------|------|
| `day_label` | string | Es. "sabato 21 febbraio" |
| `time_human` | string | Es. "21" |
| `message` | string | Conferma modifica italiana pronta. |

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | Campi obbligatori mancanti, new_people non positivo |
| `BOOKING_NOT_FOUND` | tutti | booking_id non trovato |
| `UPDATE_ERROR` | tutti | Errore durante modifica |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `MODIFY_BOOKING_ERROR` | API handler | Catch-all |

---

## 5. cancel_booking

**Endpoint:** POST `/api/cancel_booking`

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

**Note:** Per resOS, cancel = PUT con `status: "canceled"`. Per Sheets, elimina la riga. Per OctoTable, DELETE.

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o booking_id mancanti |
| `BOOKING_NOT_FOUND` | tutti | booking_id non trovato |
| `DELETE_ERROR` | tutti | Errore durante cancellazione |
| `RESOS_NOT_CONFIGURED` | reservations-resos | API key mancante |
| `CANCEL_BOOKING_ERROR` | API handler | Catch-all |

---

## 6. faq

**Endpoint:** POST `/api/faq`

**Nota:** Questo tool esiste nel backend ma NON è configurato su Vapi. Le FAQ vengono gestite dalla Knowledge Base nativa di Vapi.

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

**Error codes:**

| Code | Origine | Quando |
|------|---------|--------|
| `VALIDATION_ERROR` | API handler | restaurant_id o question mancanti |
| `FAQ_ERROR` | API handler | Catch-all |

---

## 7. is_open_now

**Endpoint:** POST `/api/is_open_now`

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

**Endpoint:** POST `/api/resolve_relative_day`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `text` | string | ✅ | Es. "domani", "sabato", "tra 3 giorni" |

**Output (ok):**

```json
{
  "ok": true,
  "date": "2026-02-19",
  "day_label": "giovedì 19 febbraio",
  "ambiguous": false
}
```

**Campi output nuovi (v1.3+):**

| Campo | Tipo | Note |
|-------|------|------|
| `day_label` | string | Es. "giovedì 19 febbraio". L'AI deve usare SEMPRE questo per comunicare la data. |

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

**Endpoint:** POST `/api/resolve_relative_time`

**Input:**

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| `restaurant_id` | string | ✅ | |
| `text` | string | ✅ | Es. "tra mezz'ora", "fra 2 ore", "21", "20 e 30" |

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

Relative (uso primario):
- "tra/fra mezz'ora", "tra/fra mezzora"
- "tra/fra un'ora"
- "tra/fra X minuti"
- "tra/fra X ore"
- "tra/fra X ore e mezza"
- "tra/fra X ore e Y minuti"

Assolute (fallback — se l'AI le passa, il backend le gestisce):
- "21", "20" → HH:00
- "20:30", "19:00" → HH:MM
- "20 e 30", "19 e 45" → HH:MM
- "20 e mezza", "19 e mezzo" → HH:30
- "20 e un quarto" → HH:15

**Nota per il prompt:** L'AI NON dovrebbe chiamare resolve_relative_time per orari assoluti — dovrebbe normalizzare a HH:MM direttamente. Il fallback esiste come safety net.

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
| `MAX_PEOPLE_EXCEEDED` | create_booking | "Per le prenotazioni online il massimo è X persone" | Offrire handover |
| `NO_TABLE_AVAILABLE` | create_booking | "Non ci sono tavoli per quell'orario" | Proporre altro slot |
| `SLOT_FULL` | create_booking (Sheets) | "Capacità esaurita a quest'ora" | Proporre nearest_slots_human |
| `OUTSIDE_HOURS` | create_booking (Sheets) | "Orario fuori dagli orari di apertura" | Proporre nearest_slots_human |
| `DUPLICATE_BOOKING` | create_booking | "Risulta già una prenotazione con questi dati" | Chiedere se modificare |
| `CREATE_ERROR` | create_booking | "Non riesco a completare la prenotazione" | Proporre retry o handover |
| `PROVIDER_ERROR` | create_booking | "Errore tecnico" | Handover se aperto |
| `PROVIDER_UNAVAILABLE` | create_booking | "Sistema prenotazione non raggiungibile" | Handover se aperto |
| `BOOKING_NOT_FOUND` | modify/cancel | "Non trovo quella prenotazione" | Chiedere altro riferimento |
| `UPDATE_ERROR` | modify_booking | "Non riesco a modificare la prenotazione" | Handover |
| `DELETE_ERROR` | cancel_booking | "Non riesco a cancellare la prenotazione" | Handover |
| `PAST_TIME` | check_openings | "L'orario indicato è già passato" | Chiedere altro orario |
| `PAST_DATE` | check_openings | "La data indicata è già passata" | Chiedere altra data |
| `WEEKDAY_MISMATCH` | check_openings | (non comunicare al cliente) | Richiamare con corrected_day |
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

---

## CONTRATTO IDEMPOTENZA

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

## CONTRATTO FILTRO PRENOTAZIONI (list_bookings)

| Backend | Comportamento |
|---------|---------------|
| resOS | Filtra prenotazioni con status "canceled" o "deleted". Solo "approved" vengono mostrate. |
| Sheets | Mostra tutte le prenotazioni presenti nel foglio (nessun campo status). |
| OctoTable | Da verificare |

---

*Questo file è la source of truth per i contratti API. I prompt DEVONO essere allineati con questo file.*
