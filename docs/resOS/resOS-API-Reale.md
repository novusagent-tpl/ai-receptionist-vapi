# resOS API – Configurazione reale (validata con Postman)

Configurazione **effettivamente usata** dopo i test in Postman. I tool API (`create_booking`, `list_bookings`, `modify_booking`, `cancel_booking`) **non** sono stati modificati; cambia solo l’adapter prenotazioni.

---

## Checklist "OK per procedere" (implementata nel codice)

| # | Requisito | Dove | Stato |
|---|-----------|------|--------|
| 1 | `src/reservations.js` seleziona backend con precedenza: **tenantConfig.reservations_backend** → fallback **env RESERVATIONS_BACKEND** → fallback **sheets** | `getReservationsBackend(restaurantId)`: `cfg.reservations_backend \|\| process.env.RESERVATIONS_BACKEND \|\| 'sheets'` | OK |
| 2 | `src/reservations-resos.js` usa **tenantConfig.resos_restaurant_id** per le chiamate resOS (non assumere che l'id interno coincida) | `getResOSRestaurantId(restaurantId)` legge `cfg.resos_restaurant_id` e lo usa in create/list | OK |
| 3 | Cancel = **PUT /bookings/{id}** con body **{ status: "canceled" }** (niente DELETE) | `deleteReservation()` → `api('PUT', '/bookings/{id}', { status: 'canceled' })` | OK |
| 4 | List-by-phone = **fallback**: list per range (es. oggi→+60gg) + **filtro** su **guest.phone** (e restaurantId) | `listReservationsByPhone()` → GET /bookings?fromDateTime&toDateTime, poi filtro su guest.phone e restaurantId | OK |

---

## Auth

- **Tipo:** Basic Auth  
  - **Username:** API KEY resOS (la chiave che generi dal pannello resOS)  
  - **Password:** vuota  
- **Base URL:** `https://api.resos.com/v1`  
- Nessun header custom oltre a `Content-Type: application/json` per POST/PUT.

---

## Env (`.env`)

| Variabile | Obbligatorio | Default | Descrizione |
|-----------|--------------|---------|-------------|
| `RESERVATIONS_BACKEND` | Sì (per usare resOS) | — | `resos` per attivare l’adapter resOS. |
| `RESOS_API_KEY` | Sì | — | API key resOS (Basic Auth username). |
| `RESOS_BASE_URL` | No | `https://api.resos.com/v1` | Base URL API. |
| `RESOS_DEFAULT_DURATION_MINUTES` | No | `120` | Durata prenotazione in minuti (per create). |

---

## Config ristorante (`src/config/ristoranti.json`)

Per ogni ristorante che usa resOS:

- **`reservations_backend`:** `"resos"`  
- **`resos_restaurant_id`:** restaurantId resOS (es. `"JLAs2CviunNCSEfbt"`).  
  Se non presente, l’adapter usa il nostro `restaurantId` (chiave del blocco).

---

## Endpoint e mapping

| Operazione nostra | Metodo resOS | Endpoint / body |
|-------------------|--------------|------------------|
| **createReservation** | POST | `/bookings` — Body (whitelist): `restaurantId`, `date` (YYYY-MM-DD), `time` (HH:MM), `people`, `duration`, `source: "phone"`, `guest: { name, phone, email: "" }`. |
| **listReservationsByDay** | GET | `/bookings?fromDateTime=...&toDateTime=...` — Filtro lato nostro su `restaurantId` e data. |
| **listReservationsByPhone** | GET | `/bookings?fromDateTime=...&toDateTime=...` (range es. oggi → +60gg) — Filtro lato nostro su `guest.phone` e `restaurantId` (resOS non filtra per phone). |
| **updateReservation** | PUT | `/bookings/{id}` — Body parziale: `people` / `date` / `time` (PATCH non supportato, 405). |
| **deleteReservation** | PUT | `/bookings/{id}` — Body: `{ "status": "canceled" }` (DELETE non supportato, 400). |

- **List by phone:** il parametro `phone` in query non filtra; l’adapter fa list per range e filtra in memoria su `booking.guest.phone` e `restaurantId`.  
- **Create:** solo i campi in whitelist (evitare pass-through; campi extra possono dare 422 unknown key).  
- **Cancel:** non si imposta `canceledAt`; si invia `status: "canceled"` e resOS imposta `canceledAt` automaticamente.

---

## Riepilogo veloce

1. **.env:** `RESERVATIONS_BACKEND=resos`, `RESOS_API_KEY=...`, opz. `RESOS_BASE_URL`, `RESOS_DEFAULT_DURATION_MINUTES`.  
2. **ristoranti.json:** per il ristorante resOS: `reservations_backend: "resos"`, `resos_restaurant_id: "JLAs2CviunNCSEfbt"` (o il tuo id).  
3. **Tools API:** invariati; il dispatcher in `src/reservations.js` seleziona l’adapter in base a `RESERVATIONS_BACKEND` e `reservations_backend` per ristorante.
