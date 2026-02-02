# OctoTable API – Endpoint e mappatura

**Riferimento:** screenshot documentazione Postman + [Octotable APIs (Public API)](https://documenter.getpostman.com/view/50380496/2sB3dK1YWg).

---

## 1. Sottoscrizione necessaria

Per usare l’API OctoTable in produzione serve un piano che includa **“Collegamenti esterni (API)”**:

| Piano   | Prezzo (IVA esclusa) | API |
|---------|------------------------|-----|
| FREE    | € 0 / mese            | ❌ No |
| **DIGIMENU** | € 15,20 / mese      | ✅ Sì |
| PREMIUM | € 23,20 / mese        | ✅ Sì |
| EVO     | € 39,20 / mese        | ✅ Sì |

**In pratica:** serve almeno **DIGIMENU** (o superiore). Senza sottoscrizione le chiamate API non sono disponibili.

La **doc** e l’**adapter** nel progetto si possono scrivere e tenere pronti anche prima di attivare il piano; l’attivazione serve quando vuoi configurare le credenziali e andare in produzione.

---

## 2. Base URL e autenticazione

- **Base URL:** `https://api.octotable.com/v1`
- **Stato API:** PREVIEW (possibili modifiche future).

### OAuth 2.0 Client Credentials

1. Ottieni **Client ID** e **Client Secret** dal pannello OctoTable (dopo aver attivato un piano con API).
2. **Token:**  
   `POST https://api.octotable.com/v1/oauth/token`  
   Body (JSON): `grant_type=client_credentials`, `client_id`, `client_secret`.
3. Nelle chiamate successive usa l’`access_token` nell’header:  
   `Authorization: Bearer <access_token>`.

L’adapter può cachare il token e rinnovarlo quando scade (es. 401).

---

## 3. Endpoint Reservations

| Operazione | Metodo | Endpoint | Note |
|------------|--------|----------|------|
| List       | GET    | `/reservations` | Query: `restaurantId` (obbl.), `start_date`, `end_date`, `client_phone`, `offset`, `limit` |
| Create     | POST   | `/reservations` | Body JSON (vedi sotto) |
| Modify     | PATCH  | `/reservations/{reservation_id}` | Campi modificabili come in Create |
| Cancel     | DELETE | `/reservations/{reservation_id}` | Nessun body |

### List (GET /reservations)

- **Query params:**
  - `restaurantId` (stringa) – **obbligatorio**
  - `start_date` (YYYY-MM-DD) – opzionale
  - `end_date` (YYYY-MM-DD) – opzionale
  - `client_phone` (stringa) – opzionale
  - `offset`, `limit` – paginazione

- **Uso nel nostro backend:**
  - **Lista per giorno:** `restaurantId` + `start_date` = `end_date` = giorno richiesto (es. `dayISO`).
  - **Lista per telefono:** `restaurantId` + `client_phone` = numero normalizzato.

### Create (POST /reservations)

- **Body (JSON):**
  - `restaurant_id` (stringa) – **obbligatorio**
  - `date` (YYYY-MM-DD) – **obbligatorio**
  - `time` (HH:MM:SS o HH:MM) – **obbligatorio**
  - `people` (numero) – **obbligatorio**
  - `first_name`, `last_name` (stringhe) – opzionali ma utili; si può mandare il nome unico in `first_name`
  - `email`, `phone` (stringhe) – opzionali
  - `notes` (stringa) – opzionale
  - `room_id`, `table_id` (stringhe) – opzionali
  - `client_id` (stringa) – opzionale (cliente esistente)

- **Mappatura dal nostro contratto:**  
  `day` → `date`, `time` → `time`, `people` → `people`, `name` → `first_name` (e opz. `last_name`), `phone` → `phone`, `notes` → `notes`.

### Modify (PATCH /reservations/{reservation_id})

- Stessi campi modificabili (es. `date`, `time`, `people`, `notes`).  
- **Mappatura:** `new_day` → `date`, `new_time` → `time`, `new_people` → `people`.

### Cancel (DELETE /reservations/{reservation_id})

- Nessun body.  
- **Mappatura:** nostro `booking_id` = OctoTable `reservation_id`.

---

## 4. Contratto nostro ↔ OctoTable

| Noi (reservations.js / tool) | OctoTable |
|------------------------------|-----------|
| `createReservation({ restaurantId, day, time, people, name, phone, notes })` | POST `/reservations` con `restaurant_id`, `date`, `time`, `people`, `first_name`/`last_name`, `phone`, `notes` |
| `listReservationsByPhone(restaurantId, phone)` | GET `/reservations?restaurantId=...&client_phone=...` |
| `listReservationsByDay(restaurantId, dayISO)` | GET `/reservations?restaurantId=...&start_date=dayISO&end_date=dayISO` |
| `updateReservation(restaurantId, bookingId, { new_day, new_time, new_people })` | PATCH `/reservations/{bookingId}` con `date`, `time`, `people` |
| `deleteReservation(restaurantId, bookingId)` | DELETE `/reservations/{bookingId}` |

L’adapter `reservations-octotable.js` espone le stesse funzioni e firme sopra, chiamando questi endpoint.

---

## 5. Configurazione ristorante

Per ogni `restaurantId` che usa OctoTable, in `src/config/ristoranti.json` (o equivalente) si può aggiungere:

- **`octotable_restaurant_id`** (stringa): ID ristorante in OctoTable, usato come `restaurantId` / `restaurant_id` nelle chiamate API.  
  Se assente, l’adapter può usare `restaurantId` così com’è.

Variabili d’ambiente consigliate per l’adapter:

- `OCTOTABLE_BASE_URL` – default `https://api.octotable.com/v1`
- `OCTOTABLE_CLIENT_ID`
- `OCTOTABLE_CLIENT_SECRET`

---

## 6. Ordine dei passi (riepilogo)

1. **Ora:** doc (questo file) + adapter `reservations-octotable.js` – nessun tool nuovo, nessun cambio alle route esistenti.
2. **Quando attivi OctoTable:** sottoscrivi almeno DIGIMENU, ottieni Client ID/Secret, configura `octotable_restaurant_id` e env; poi si può commutare il backend da Google Sheets/Calendar a OctoTable (es. `reservations.js` che usa l’adapter se configurato).
3. **Dopo:** eventuali nuovi tool Vapi o modifiche ai tool esistenti (stesso contratto API, solo backend diverso).
