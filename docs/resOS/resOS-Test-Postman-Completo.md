# Test Postman completi – API prenotazioni e regole (modena01)

Guida per verificare con Postman le API del backend e le regole implementate (orari KB, max_people, cutoff, durata, gestione errori). Adatta a **modena01** con backend resOS (o sheets/octotable).

**Base URL:** `http://localhost:3000` (o l’URL del tuo server).  
**Tutti gli endpoint sono POST.** Impostare **Body → raw → JSON** e **Content-Type: application/json**.

**Riferimento KB modena01:** martedì–giovedì lunch 12:30–14:30, dinner 19:00–22:30; venerdì/sabato dinner fino 23:30; lunedì e domenica chiusi. `max_people: 4`, `booking_cutoff_minutes: 30`, `avg_stay_minutes: 60`.

---

## 1. check_openings – Disponibilità e slot

Verifica che gli orari e gli slot derivino dalla KB e che le risposte siano coerenti.

### 1.1 Giorno aperto, con orario nello slot (disponibile)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-05",
  "time": "20:00"
}
```

**Cosa verifica:** Giovedì 5 feb 2026 è aperto (dinner 19:00–22:30). Le 20:00 sono uno slot valido.

**Esito atteso:** `ok: true`, `closed: false`, `available: true` (o `false` se capacity piena), `requested_time: "20:00"`, `slots` contiene orari del giorno, `lunch_range` e `dinner_range` valorizzati. Nessun `error_code`.

Esito: { "ok": true, "restaurant_id": "modena01", "day": "2026-02-05", "closed": false, "slots": [ "12:30", "13:00", "13:30", "14:00", "14:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": [ "12:30", "14:30" ], "dinner_range": [ "19:00", "22:30" ], "requested_time": "20:00", "available": true, "reason": null, "nearest_slots": [] }

---

### 1.2 Giorno chiuso (lunedì)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-02",
  "time": "20:00"
}
```

**Cosa verifica:** 9 feb 2026 è lunedì → giorno chiuso in KB.

**Esito atteso:** `ok: true`, `closed: true`, `slots: []` (o vuoti), nessuno slot prenotabile. Non deve esserci `available: true` per le 20:00.

Esito: { "ok": true, "restaurant_id": "modena01", "day": "2026-02-09", "closed": true, "slots": [], "lunch_range": null, "dinner_range": null, "requested_time": "20:00", "available": false, "reason": "not_in_openings", "nearest_slots": [] }
---

### 1.3 Orario fuori slot (tra due slot – not_in_openings)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-05",
  "time": "19:20"
}
```

**Cosa verifica:** Le 19:20 non sono uno slot (es. slot ogni 30 min: 19:00, 19:30). Il sistema deve segnare che il giorno è aperto ma non a quell’orario esatto e proporre slot vicini.

**Esito atteso:** `ok: true`, `closed: false`, `available: false`, `reason: "not_in_openings"` (o simile). `nearest_slots` dovrebbe contenere slot vicini (es. 19:00, 19:30). Così l’assistente può dire “non a quell’orario esatto, posso proporle le 19 o le 19 e 30”.

Esito: { "ok": true, "restaurant_id": "modena01", "day": "2026-02-05", "closed": false, "slots": [ "12:30", "13:00", "13:30", "14:00", "14:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": [ "12:30", "14:30" ], "dinner_range": [ "19:00", "22:30" ], "requested_time": "19:20", "available": false, "reason": "not_in_openings", "nearest_slots": [ "19:30", "19:00", "20:00" ] }
---

### 1.4 Solo giorno, senza orario (solo info fasce)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-05"
}
```

**Cosa verifica:** Chiamata senza `time` per avere solo le fasce del giorno.

**Esito atteso:** `ok: true`, `closed: false`, `lunch_range` e `dinner_range` presenti (es. `["12:30","14:30"]` e `["19:00","22:30"]`), `slots` popolato. `requested_time` assente o null.

Esito: { "ok": true, "restaurant_id": "modena01", "day": "2026-02-05", "closed": false, "slots": [ "12:30", "13:00", "13:30", "14:00", "14:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": [ "12:30", "14:30" ], "dinner_range": [ "19:00", "22:30" ], "requested_time": null, "available": null, "reason": null, "nearest_slots": null }
---

### 1.5 Validazione: manca restaurant_id o day

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "modena01"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, `error_message` che indica che `restaurant_id` e `day` sono obbligatori.

Ripetere senza `restaurant_id` (solo `day`) per verificare lo stesso tipo di errore.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e day sono obbligatori" }
---

## 2. create_booking – Creazione prenotazione

Usare un numero di telefono dedicato ai test (es. `+391233211234`) per non mischiare con prenotazioni reali.

### 2.1 Creazione corretta

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-06",
  "time": "20:00",
  "people": 2,
  "name": "Test Postman",
  "phone": "+391233211234"
}
```

**Cosa verifica:** Creazione con tutti i campi obbligatori; integrazione con il backend (resOS/sheets/octotable).

**Esito atteso:** `ok: true`, `booking_id` presente, `day`, `time`, `people`, `name`, `phone` coerenti. Con resOS la prenotazione compare nel gestionale (e la durata dovrebbe essere quella da KB `avg_stay_minutes` o da .env, es. 60 min).

**Nota:** Salva il `booking_id` per i test su modify e cancel (es. `QGCiM8xiHJzCSc6a4`).

Esito: { "ok": true, "booking_id": "ZdyNcRYYsvsrTZbuj", "day": "2026-02-06", "time": "20:00", "people": 2, "name": "Test Postman", "phone": "+391233211234", "notes": null, "event_id": null }

*Nota:* su resOS la prenotazione appare come "Richiesta"; per passarla ad "Accettata" il ristorante deve confermarla dal gestionale. È comportamento resOS, non del backend.
---

### 2.2 Max persone superato (regola KB)

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-06",
  "time": "20:30",
  "people": 5,
  "name": "Test Max People",
  "phone": "+391233211234"
}
```

**Cosa verifica:** In KB modena01 `max_people` è 4. La richiesta con 5 persone deve essere rifiutata dal nostro backend (prima ancora del gestionale).

**Esito atteso:** `ok: false`, `error_code: "MAX_PEOPLE_EXCEEDED"`, `error_message` tipo “Numero massimo persone per prenotazione: 4”. L’assistente userà questo messaggio per comunicare al cliente il limite.

Esito: { "ok": false, "error_code": "MAX_PEOPLE_EXCEEDED", "error_message": "Numero massimo persone per prenotazione: 4" }
---

### 2.3 Validazione: campi obbligatori mancanti

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "modena01",
  "day": "2026-02-06",
  "time": "20:00",
  "people": 2,
  "name": "Test"
}
```

**Cosa verifica:** Manca `phone` (obbligatorio).

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, `error_message` che indica che sono obbligatori restaurant_id, day, time, people (>0), name, phone.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id, day, time, people (>0), name, phone sono obbligatori" }
---

### 2.4 Data nel passato

**POST** `/api/create_booking`

Sostituire `day` con una data passata (es. `2026-01-01`).

```json
{
  "restaurant_id": "modena01",
  "day": "2026-01-01",
  "time": "20:00",
  "people": 2,
  "name": "Test Passato",
  "phone": "+391233211234"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio tipo “Non è possibile prenotare per una data nel passato”.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "Non è possibile prenotare per una data nel passato." }
---

### 2.5 Orario già passato (stesso giorno)
json:
{
  "restaurant_id": "modena01",
  "day": "2026-02-03",
  "time": "20:00",
  "people": 2,
  "name": "Test Passato Stesso Giorno",
  "phone": "+391233211234"
}

Solo se esegui il test “dopo” l’orario indicato: usare un `day` = oggi e un `time` già passato (es. se sono le 22:00, usare `"time": "12:00"` per il pranzo).

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio tipo “L’orario indicato è già passato”.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "L’orario indicato è già passato." }
---

## 3. list_bookings – Elenco per telefono

### 3.1 Telefono con prenotazioni

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "modena01",
  "phone": "+391233211234"
}
```

**Cosa verifica:** Elenco prenotazioni future per quel telefono; con resOS il backend filtra le prenotazioni passate (stesso giorno con orario già passato escluse).

**Esito atteso:** `ok: true`, `results` array. Ogni elemento ha `booking_id`, `day`, `time`, `people`, `name`, `phone`. Solo prenotazioni future (o stesso giorno con orario ancora da venire).

#ora sono le 19:50 quindi ok: 

Esito: { "ok": true, "results": [ { "booking_id": "yE3bfpfzYxodgRiMB", "day": "2026-02-03", "time": "20:00", "people": 2, "name": "Test Passato Stesso Giorno", "phone": "+391233211234", "notes": null }, { "booking_id": "rtgLgBaqEiu8LaeJF", "day": "2026-02-03", "time": "21:00", "people": 2, "name": "Test Passato Stesso Giorno", "phone": "+391233211234", "notes": null }, { "booking_id": "ZdyNcRYYsvsrTZbuj", "day": "2026-02-06", "time": "20:00", "people": 2, "name": "Test Postman", "phone": "+391233211234", "notes": null } ] }
---

### 3.2 Telefono senza prenotazioni

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "modena01",
  "phone": "+399999999999"
}
```

**Esito atteso:** `ok: true`, `results: []` (o array vuoto). Nessun errore.

Esito: {"ok": true,"results": []}
---

### 3.3 Validazione: manca phone o restaurant_id

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "modena01"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e phone sono obbligatori.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e phone sono obbligatori" }
---

## 4. modify_booking – Modifica prenotazione

Usare un `booking_id` reale ottenuto da create_booking o list_bookings.

### 4.1 Modifica numero persone (alias `people`)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "modena01",
  "booking_id": "yE3bfpfzYxodgRiMB",
  "people": 3
}
```

Sostituire `QGCiM8xiHJzCSc6a4` con un `booking_id` valido.

**Cosa verifica:** Accettazione dell’alias `people` invece di `new_people`; modifica effettiva sul backend.

**Esito atteso:** `ok: true`, risposta con esito della modifica (o conferma). Se il backend restituisce dettagli (day, time, people), devono essere coerenti.

Esito: { "ok": true, "booking_id": "yE3bfpfzYxodgRiMB", "people": 3, "name": null, "phone": null, "notes": null }

Ossrrvazione: Una cosa che ho osseravto è che se cancello la prenotazione da resos e poi faccio sta cosa di modificarla il sistema la modifica con succeso anche se non c'è nessuna prenotazione, questo è un problema o non si può arrivare a questa cosa visto che il cliente deve dare il numero e poi il sistema cerca la prenotazione in base al numero ? non come qui che ha direttamente il booking_id
---

### 4.2 Modifica data e orario (alias `day` e `time`)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "modena01",
  "booking_id": "yE3bfpfzYxodgRiMB",
  "day": "2026-02-06",
  "time": "21:00"
}
```

Sostituire `booking_id` con uno valido. Verificare che il 6 feb 2026 sia aperto in KB (venerdì, dinner 19:00–23:30).

**Cosa verifica:** Alias `day` e `time`; modifica data e orario sul gestionale.

**Esito atteso:** `ok: true`. La prenotazione sul gestionale deve risultare spostata al nuovo giorno/orario.

Esito: { "ok": true, "booking_id": "yE3bfpfzYxodgRiMB", "day": "2026-02-06", "time": "21:00", "name": null, "phone": null, "notes": null }

---

### 4.3 Modifica con nomi “ufficiali” (new_day, new_time, new_people)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "modena01",
  "booking_id": "LuiSsqJuth2SSFWmM",
  "new_day": "2026-02-07",
  "new_time": "20:30",
  "new_people": 2
}
```

**Cosa verifica:** Formato con `new_*` funziona come gli alias.

**Esito atteso:** `ok: true`.

Esito: { "ok": true, "booking_id": "LuiSsqJuth2SSFWmM", "day": "2026-02-07", "time": "20:30", "people": 2, "name": null, "phone": null, "notes": null }

---

### 4.4 Validazione: nessuna modifica (manca booking_id o tutti i campi modifica)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "modena01",
  "booking_id": "LuiSsqJuth2SSFWmM"
}
```

Se non invii nessuno tra `new_day`, `new_time`, `new_people` (né alias `day`, `time`, `people`):

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che serve almeno uno tra new_day, new_time, new_people (o alias day, time, people).

Con **booking_id mancante** (solo restaurant_id e people):

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e booking_id sono obbligatori (e almeno un campo da modificare).

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id, booking_id e almeno uno tra new_day, new_time, new_people (o alias day, time, people) sono obbligatori" }
---

## 5. cancel_booking – Cancellazione

### 5.1 Cancellazione corretta

**POST** `/api/cancel_booking`

```json
{
  "restaurant_id": "modena01",
  "booking_id": "LuiSsqJuth2SSFWmM"
}
```

Sostituire `booking_id` con uno valido (puoi usare una prenotazione creata apposta per questo test).

**Cosa verifica:** Cancellazione sul backend (resOS: PUT con status canceled).

**Esito atteso:** `ok: true`, `canceled: true`, `booking_id` presente. La prenotazione non deve più comparire in list_bookings per quel telefono.

Esito: { "ok": true, "booking_id": "LuiSsqJuth2SSFWmM", "canceled": true }

---

### 5.2 Validazione: manca booking_id

**POST** `/api/cancel_booking`

```json
{
  "restaurant_id": "modena01"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e booking_id sono obbligatori.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e booking_id sono obbligatori" }
---

## 6. Flusso completo consigliato

Per una verifica in ordine senza conflitti:

1. **check_openings** (1.1) – giorno 2026-02-05, time 20:00 → disponibile.
2. **create_booking** (2.1) – crea prenotazione 2026-02-05 20:00, 2 persone, telefono test → salva `booking_id`.
3. **list_bookings** (3.1) – stesso telefono → la prenotazione compare in `results`.
4. **modify_booking** (4.1 o 4.2) – modifica persone o giorno/ora con il `booking_id` salvato.
5. **list_bookings** di nuovo – verifica che i dati siano aggiornati.
6. **cancel_booking** (5.1) – cancella con lo stesso `booking_id`.
7. **list_bookings** – `results` non deve più contenere quella prenotazione.

In più, in parallelo o dopo:

- **check_openings** giorno chiuso (1.2), orario fuori slot (1.3), validazione (1.5).
- **create_booking** max_people (2.2), validazione (2.3), data passata (2.4).
- **modify_booking** validazione (4.4).

---

## 7. Riepilogo regole verificate

| Regola / Comportamento              | Test che la verifica        |
|------------------------------------|-----------------------------|
| Orari e slot dalla KB              | 1.1, 1.2, 1.3, 1.4          |
| Giorno chiuso                      | 1.2                         |
| Orario fuori slot + nearest_slots  | 1.3                         |
| Max persone da KB                  | 2.2                         |
| Validazione campi create/list/modify/cancel | 1.5, 2.3, 3.3, 4.4, 5.2 |
| Data/orario passato                | 2.4, 2.5                    |
| Alias modify (day, time, people)   | 4.1, 4.2, 4.3               |
| list_bookings solo future          | 3.1 (backend filtra passate)|
| Messaggio MAX_PEOPLE_EXCEEDED      | 2.2 (per assistente)        |
| Durata prenotazione (KB / .env)    | 2.1 (resOS: duration da avg_stay_minutes) |

Dopo aver allineato gli orari di modena01 in KB con quelli su resOS, questi test confermano che il comportamento del backend e le risposte di errore sono quelli attesi per l’assistente e per il gestionale.







POSTMAN TEST ROMA GOOGLE SHEETS/CALENDAR

## 1. check_openings – Disponibilità e slot

Verifica che gli orari e gli slot derivino dalla KB e che le risposte siano coerenti.

### 1.1 Giorno aperto, con orario nello slot (disponibile)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-05",
  "time": "20:00"
}
```

**Cosa verifica:** Giovedì 5 feb 2026 è aperto (dinner 19:00–22:30). Le 20:00 sono uno slot valido.

**Esito atteso:** `ok: true`, `closed: false`, `available: true` (o `false` se capacity piena), `requested_time: "20:00"`, `slots` contiene orari del giorno, `lunch_range` e `dinner_range` valorizzati. Nessun `error_code`.

Esito: { "ok": true, "restaurant_id": "roma", "day": "2026-02-05", "closed": false, "slots": [ "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": null, "dinner_range": [ "19:00", "22:30" ], "requested_time": "20:00", "available": true, "reason": null, "nearest_slots": [] }

---

### 1.2 Giorno chiuso (domenica)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-08",
  "time": "20:00"
}
```

**Cosa verifica:** 8 feb 2026 è domenica → giorno chiuso in KB roma.

**Esito atteso:** `ok: true`, `closed: true`, `slots: []` (o vuoti), nessuno slot prenotabile. Non deve esserci `available: true` per le 20:00.

Esito: { "ok": true, "restaurant_id": "roma", "day": "2026-02-08", "closed": true, "slots": [], "lunch_range": null, "dinner_range": null, "requested_time": "20:00", "available": false, "reason": "not_in_openings", "nearest_slots": [] }
---

### 1.3 Orario fuori slot (tra due slot – not_in_openings)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-05",
  "time": "19:20"
}
```

**Cosa verifica:** Le 19:20 non sono uno slot (es. slot ogni 30 min: 19:00, 19:30). Il sistema deve segnare che il giorno è aperto ma non a quell’orario esatto e proporre slot vicini.

**Esito atteso:** `ok: true`, `closed: false`, `available: false`, `reason: "not_in_openings"` (o simile). `nearest_slots` dovrebbe contenere slot vicini (es. 19:00, 19:30). Così l’assistente può dire “non a quell’orario esatto, posso proporle le 19 o le 19 e 30”.

Esito: { "ok": true, "restaurant_id": "roma", "day": "2026-02-05", "closed": false, "slots": [ "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": null, "dinner_range": [ "19:00", "22:30" ], "requested_time": "19:20", "available": false, "reason": "not_in_openings", "nearest_slots": [ "19:30", "19:00", "20:00" ] }
---

### 1.4 Solo giorno, senza orario (solo info fasce)

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-05"
}
```

**Cosa verifica:** Chiamata senza `time` per avere solo le fasce del giorno.

**Esito atteso:** `ok: true`, `closed: false`, `lunch_range` e `dinner_range` presenti (es. `["12:30","14:30"]` e `["19:00","22:30"]`), `slots` popolato. `requested_time` assente o null.

Esito: { "ok": true, "restaurant_id": "roma", "day": "2026-02-05", "closed": false, "slots": [ "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30" ], "lunch_range": null, "dinner_range": [ "19:00", "22:30" ], "requested_time": null, "available": null, "reason": null, "nearest_slots": null }
---

### 1.5 Validazione: manca restaurant_id o day

**POST** `/api/check_openings`

```json
{
  "restaurant_id": "roma"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, `error_message` che indica che `restaurant_id` e `day` sono obbligatori.

Ripetere senza `restaurant_id` (solo `day`) per verificare lo stesso tipo di errore.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e day sono obbligatori" }
---

## 2. create_booking – Creazione prenotazione

Usare un numero di telefono dedicato ai test (es. `+391233211234`) per non mischiare con prenotazioni reali.

### 2.1 Creazione corretta

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-06",
  "time": "20:00",
  "people": 2,
  "name": "Test Postman",
  "phone": "+391233211234"
}
```

**Cosa verifica:** Creazione con tutti i campi obbligatori; integrazione con il backend (resOS/sheets/octotable).

**Esito atteso:** `ok: true`, `booking_id` presente, `day`, `time`, `people`, `name`, `phone` coerenti. Con resOS la prenotazione compare nel gestionale (e la durata dovrebbe essere quella da KB `avg_stay_minutes` o da .env, es. 60 min).

**Nota:** Salva il `booking_id` per i test su modify e cancel (es. `430f2909-93bd-4066-9be2-504fe4cea4a5')

Esito: { "ok": true, "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "day": "2026-02-06", "time": "20:00", "people": 2, "name": "Test Postman", "phone": "+391233211234", "notes": null, "event_id": "psuomtbtod3fsdd03it0eofa4k" }

---

### 2.2 Max persone superato (regola KB) nel Kb/roma il max è 8 

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-06",
  "time": "20:30",
  "people":9,
  "name": "Test Max People",
  "phone": "+391233211234"
}
```

**Cosa verifica:** In KB roma `max_people` è 8. La richiesta con 9 persone deve essere rifiutata dal nostro backend (prima ancora del gestionale).

**Esito atteso:** `ok: false`, `error_code: "MAX_PEOPLE_EXCEEDED"`, `error_message` tipo “Numero massimo persone per prenotazione: 8”. L’assistente userà questo messaggio per comunicare al cliente il limite.

Esito: { "ok": false, "error_code": "MAX_PEOPLE_EXCEEDED", "error_message": "Numero massimo persone per prenotazione: 8" }
---

### 2.3 Validazione: campi obbligatori mancanti

**POST** `/api/create_booking`

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-06",
  "time": "20:00",
  "people": 2,
  "name": "Test"
}
```

**Cosa verifica:** Manca `phone` (obbligatorio).

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, `error_message` che indica che sono obbligatori restaurant_id, day, time, people (>0), name, phone.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id, day, time, people (>0), name, phone sono obbligatori" }
---

### 2.4 Data nel passato

**POST** `/api/create_booking`

Sostituire `day` con una data passata (es. `2026-01-01`).

```json
{
  "restaurant_id": "roma",
  "day": "2026-01-01",
  "time": "20:00",
  "people": 2,
  "name": "Test Passato",
  "phone": "+391233211234"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio tipo “Non è possibile prenotare per una data nel passato”.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "Non è possibile prenotare per una data nel passato." }
---

### 2.5 Orario già passato (stesso giorno)

```json
{
  "restaurant_id": "roma",
  "day": "2026-02-04",
  "time": "17:00",
  "people": 2,
  "name": "Test Passato Stesso Giorno",
  "phone": "+391233211234"
}
```

Solo se esegui il test “dopo” l’orario indicato: usare un `day` = oggi e un `time` già passato (es. se sono le 22:00, usare `"time": "12:00"` per il pranzo).

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio tipo “L’orario indicato è già passato”.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "L’orario indicato è già passato." }
---

## 3. list_bookings – Elenco per telefono

### 3.1 Telefono con prenotazioni

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "roma",
  "phone": "+391233211234"
}
```

**Cosa verifica:** Elenco prenotazioni future per quel telefono; con resOS il backend filtra le prenotazioni passate (stesso giorno con orario già passato escluse).

**Esito atteso:** `ok: true`, `results` array. Ogni elemento ha `booking_id`, `day`, `time`, `people`, `name`, `phone`. Solo prenotazioni future (o stesso giorno con orario ancora da venire).

#ora sono le 19:50 quindi ok: 

Esito: { "ok": true, "results": [ { "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "day": "2026-02-06", "time": "20:00", "people": 2, "name": "Test Postman", "phone": "+391233211234", "notes": null }, { "booking_id": "465953fa-d71d-49b4-88f4-9eea20a4b18f", "day": "2026-02-06", "time": "20:30", "people": 8, "name": "Test Max People", "phone": "+391233211234", "notes": null } ] }
---

### 3.2 Telefono senza prenotazioni

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "roma",
  "phone": "+399999999999"
}
```

**Esito atteso:** `ok: true`, `results: []` (o array vuoto). Nessun errore.

Esito: {"ok": true,"results": []}
---

### 3.3 Validazione: manca phone o restaurant_id

**POST** `/api/list_bookings`

```json
{
  "restaurant_id": "roma"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e phone sono obbligatori.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e phone sono obbligatori" }
---

## 4. modify_booking – Modifica prenotazione

Usare un `booking_id` reale ottenuto da create_booking o list_bookings.

### 4.1 Modifica numero persone (alias `people`)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "roma",
  "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5",
  "people": 3
}
```

Sostituire `QGCiM8xiHJzCSc6a4...` con un `booking_id` valido.

**Cosa verifica:** Accettazione dell’alias `people` invece di `new_people`; modifica effettiva sul backend.

**Esito atteso:** `ok: true`, risposta con esito della modifica (o conferma). Se il backend restituisce dettagli (day, time, people), devono essere coerenti.

Esito: { "ok": true, "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "day": "2026-02-06", "time": "20:00", "people": 3, "name": "Test Postman", "phone": "+391233211234", "notes": "" }

---

### 4.2 Modifica data e orario (alias `day` e `time`)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "roma",
  "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5",
  "day": "2026-02-06",
  "time": "21:00"
}
```

Sostituire `booking_id` con uno valido. Verificare che il 6 feb 2026 sia aperto in KB (venerdì, dinner 19:00–23:30).

**Cosa verifica:** Alias `day` e `time`; modifica data e orario sul gestionale.

**Esito atteso:** `ok: true`. La prenotazione sul gestionale deve risultare spostata al nuovo giorno/orario.

Esito: { "ok": true, "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "day": "2026-02-06", "time": "21:00", "people": "3", "name": "Test Postman", "phone": "+391233211234", "notes": "" }

---

### 4.3 Modifica con nomi “ufficiali” (new_day, new_time, new_people)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "roma",
  "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5",
  "new_day": "2026-02-07",
  "new_time": "20:30",
  "new_people": 2
}
```

**Cosa verifica:** Formato con `new_*` funziona come gli alias.

**Esito atteso:** `ok: true`.

Esito: { "ok": true, "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "day": "2026-02-07", "time": "20:30", "people": 2, "name": "Test Postman", "phone": "+391233211234", "notes": "" }

---

### 4.4 Validazione: nessuna modifica (manca booking_id o tutti i campi modifica)

**POST** `/api/modify_booking`

```json
{
  "restaurant_id": "roma",
  "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5"
}
```

Se non invii nessuno tra `new_day`, `new_time`, `new_people` (né alias `day`, `time`, `people`):

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che serve almeno uno tra new_day, new_time, new_people (o alias day, time, people).

Con **booking_id mancante** (solo restaurant_id e people):

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e booking_id sono obbligatori (e almeno un campo da modificare).

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id, booking_id e almeno uno tra new_day, new_time, new_people (o alias day, time, people) sono obbligatori" }
---

## 5. cancel_booking – Cancellazione

### 5.1 Cancellazione corretta

**POST** `/api/cancel_booking`

```json
{
  "restaurant_id": "roma",
  "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5"
}
```

Sostituire `booking_id` con uno valido (puoi usare una prenotazione creata apposta per questo test).

**Cosa verifica:** Cancellazione sul backend (resOS: PUT con status canceled).

**Esito atteso:** `ok: true`, `canceled: true`, `booking_id` presente. La prenotazione non deve più comparire in list_bookings per quel telefono.

Esito: { "ok": true, "booking_id": "430f2909-93bd-4066-9be2-504fe4cea4a5", "canceled": true }

---

### 5.2 Validazione: manca booking_id

**POST** `/api/cancel_booking`

```json
{
  "restaurant_id": "roma"
}
```

**Esito atteso:** `ok: false`, `error_code: "VALIDATION_ERROR"`, messaggio che indica che restaurant_id e booking_id sono obbligatori.

Esito: { "ok": false, "error_code": "VALIDATION_ERROR", "error_message": "restaurant_id e booking_id sono obbligatori" }
---

